import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse, astToString } from '../src';
import type { ASTNode } from '../src/types';
import { TokenType } from '../src/types';

interface Constraint {
  structureDefinitionId: string;
  structureDefinitionUrl: string;
  structureDefinitionName: string;
  elementPath: string;
  constraintKey: string;
  severity: string;
  human: string;
  expression: string;
}

interface ConstraintData {
  stats: {
    totalStructureDefinitions: number;
    structureDefinitionsWithConstraints: number;
    totalConstraints: number;
    totalUniqueExpressions: number;
    constraintsBySeverity: Record<string, number>;
  };
  constraints: Constraint[];
  uniqueExpressions: string[];
}

// Function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Generate HTML tree visualization with position data
function generateHTMLTree(node: ASTNode, exprId: number): string {
  const nodeJson = JSON.stringify(node, null, 2);
  const posData = `data-start="${node.start}" data-end="${node.end}" data-expr-id="${exprId}" data-ast='${escapeHtml(nodeJson)}'`;
  const handlers = `onmouseover="highlightExpression(${exprId}, ${node.start}, ${node.end}, event)" onmouseout="clearHighlight(${exprId}, event)" onclick="showAstJson(this, event)"`;
  const reconstructed = astToString(node);
  
  switch (node.kind) {
    case 'literal':
      return `<div class="ast-node ast-literal" ${posData} ${handlers}>
          <span class="ast-node-kind">literal</span>
          <span class="ast-node-type">${node.dataType}</span>
          <span class="ast-node-value">${escapeHtml(JSON.stringify(node.value))}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
        </div>`;
      
    case 'identifier':
      return `<div class="ast-node ast-identifier" ${posData} ${handlers}>
          <span class="ast-node-kind">id</span>
          <span class="ast-node-value">${escapeHtml(node.name)}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
        </div>`;
      
    case 'binary':
      return `<div class="ast-node ast-binary" ${posData} ${handlers}>
          <span class="ast-node-kind">binary</span>
          <span class="ast-node-operator">${escapeHtml(getOperatorSymbol(node.op))}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.left, exprId)}
            ${generateHTMLTree(node.right, exprId)}
          </div>
        </div>`;
      
    case 'unary':
      return `<div class="ast-node ast-unary" ${posData} ${handlers}>
          <span class="ast-node-kind">unary</span>
          <span class="ast-node-operator">${escapeHtml(getOperatorSymbol(node.op))}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.operand, exprId)}
          </div>
        </div>`;
      
    case 'function':
      return `<div class="ast-node ast-function" ${posData} ${handlers}>
          <span class="ast-node-kind">fn</span>
          <span class="ast-node-value">${escapeHtml(node.name)}()</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          ${node.args.length > 0 ? `
          <div class="ast-node-children">
            ${node.args.map(arg => generateHTMLTree(arg, exprId)).join('')}
          </div>` : ''}
        </div>`;
      
    case 'indexer':
      return `<div class="ast-node ast-indexer" ${posData} ${handlers}>
          <span class="ast-node-kind">index</span>
          <span class="ast-node-operator">[]</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.expr, exprId)}
            ${generateHTMLTree(node.index, exprId)}
          </div>
        </div>`;
      
    case 'dot':
      return `<div class="ast-node ast-dot" ${posData} ${handlers}>
          <span class="ast-node-kind">dot</span>
          <span class="ast-node-operator">.</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.left, exprId)}
            ${generateHTMLTree(node.right, exprId)}
          </div>
        </div>`;
      
    case 'as':
      return `<div class="ast-node ast-as" ${posData} ${handlers}>
          <span class="ast-node-kind">as</span>
          <span class="ast-node-operator">as ${escapeHtml(node.targetType)}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.expression, exprId)}
          </div>
        </div>`;
      
    case 'is':
      return `<div class="ast-node ast-is" ${posData} ${handlers}>
          <span class="ast-node-kind">is</span>
          <span class="ast-node-operator">is ${escapeHtml(node.targetType)}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
          <div class="ast-node-children">
            ${generateHTMLTree(node.expression, exprId)}
          </div>
        </div>`;
      
    case 'variable':
      return `<div class="ast-node ast-variable" ${posData} ${handlers}>
          <span class="ast-node-kind">var</span>
          <span class="ast-node-value">$${escapeHtml(node.name)}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
        </div>`;
      
    case 'envVariable':
      return `<div class="ast-node ast-env-variable" ${posData} ${handlers}>
          <span class="ast-node-kind">env</span>
          <span class="ast-node-value">%${escapeHtml(node.name)}</span>
          <span class="ast-node-expr">→ ${escapeHtml(reconstructed)}</span>
        </div>`;
  }
}

function getOperatorSymbol(op: TokenType): string {
  // Map TokenType enum values to human-readable operator symbols
  switch (op) {
    case TokenType.DOT: return '.';
    case TokenType.PLUS: return '+';
    case TokenType.MINUS: return '-';
    case TokenType.MULTIPLY: return '*';
    case TokenType.DIVIDE: return '/';
    case TokenType.MOD: return 'mod';
    case TokenType.DIV: return 'div';
    case TokenType.EQUALS: return '=';
    case TokenType.NOT_EQUALS: return '!=';
    case TokenType.LESS_THAN: return '<';
    case TokenType.GREATER_THAN: return '>';
    case TokenType.LESS_EQUALS: return '<=';
    case TokenType.GREATER_EQUALS: return '>=';
    case TokenType.AND: return 'and';
    case TokenType.OR: return 'or';
    case TokenType.IMPLIES: return 'implies';
    case TokenType.XOR: return 'xor';
    case TokenType.PIPE: return '|';
    case TokenType.NOT: return 'not';
    case TokenType.IN: return 'in';
    case TokenType.CONTAINS: return 'contains';
    case TokenType.AS_TYPE: return 'as';
    case TokenType.IS_TYPE: return 'is';
    case TokenType.AMPERSAND: return '&';
    default: return `Unknown(${op})`;
  }
}

// Main function
function generateHTML() {
  // Read constraint data
  const data: ConstraintData = JSON.parse(
    readFileSync(join(__dirname, '../test/constraint-expressions.json'), 'utf-8')
  );
  
  // Get unique expressions and find example usage for each
  const expressionExamples: Map<string, Constraint[]> = new Map();
  
  data.constraints.forEach(constraint => {
    if (!expressionExamples.has(constraint.expression)) {
      expressionExamples.set(constraint.expression, []);
    }
    expressionExamples.get(constraint.expression)!.push(constraint);
  });
  
  // Sort expressions by length and complexity
  const sortedExpressions = Array.from(expressionExamples.keys()).sort((a, b) => {
    // First by length
    if (a.length !== b.length) return a.length - b.length;
    // Then alphabetically
    return a.localeCompare(b);
  });
  
  // Calculate expression complexity metrics
  const complexityMetrics = new Map<string, {
    hasImplies: boolean;
    hasDefineVariable: boolean;
    hasEnvironmentVars: boolean;
    hasFunctionCalls: boolean;
    depth: number;
  }>();
  
  sortedExpressions.forEach(expr => {
    try {
      const ast = parse(expr);
      const metrics = {
        hasImplies: expr.includes('implies'),
        hasDefineVariable: expr.includes('defineVariable'),
        hasEnvironmentVars: expr.includes('%'),
        hasFunctionCalls: expr.includes('('),
        depth: 0 // Could be calculated from AST depth
      };
      complexityMetrics.set(expr, metrics);
    } catch (e) {
      // Skip if parse fails
    }
  });
  
  // Generate HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FHIR Unique Constraint Expressions - AST Visualization</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        
        .stat {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: 600;
            color: #0ea5e9;
            display: block;
            margin-bottom: 4px;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.875em;
            font-weight: 500;
        }
        
        .search-box {
            width: 100%;
            padding: 14px 20px;
            font-size: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 24px;
            box-sizing: border-box;
            background-color: #fff;
            transition: all 0.2s ease;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #0ea5e9;
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        
        .expression-card {
            background-color: #fff;
            margin-bottom: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            transition: all 0.2s ease;
        }
        
        .expression-card:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .expression-header {
            padding: 16px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }
        
        .expression-header:hover {
            background-color: #f9fafb;
        }
        
        .expression-text {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
            font-size: 14px;
            color: #1a1a1a;
            word-break: break-word;
            flex: 1;
        }
        
        .expression-meta {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }
        
        .usage-count {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.875em;
            font-weight: 500;
        }
        
        .complexity-badges {
            display: flex;
            gap: 6px;
        }
        
        .complexity-badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-implies {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .badge-env-var {
            background-color: #ddd6fe;
            color: #5b21b6;
        }
        
        .badge-define-var {
            background-color: #fce7f3;
            color: #9d174d;
        }
        
        .expression-body {
            display: none;
            padding: 20px;
        }
        
        .expression-card.expanded .expression-body {
            display: block;
        }
        
        .expression-card.expanded .expression-header {
            background-color: #f0f9ff;
            border-bottom: 2px solid #0ea5e9;
        }
        
        .ast-reconstructed {
            background-color: #e8f5e9;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-family: monospace;
            font-size: 13px;
            color: #2e7d32;
        }
        
        .ast-tree {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
        }
        
        .ast-node {
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin: 2px;
            display: inline-block;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .ast-node:hover {
            background-color: #f0f9ff;
            border-color: #0ea5e9;
            z-index: 10;
        }
        
        .ast-node.highlighted {
            background-color: #fef3c7;
            border-color: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
        }
        
        .ast-node-type {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-right: 4px;
        }
        
        .ast-node-value {
            font-family: 'SF Mono', monospace;
            font-size: 11px;
            color: #1e293b;
            font-weight: 500;
        }
        
        .ast-node-operator {
            font-family: 'SF Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
        }
        
        .ast-node-expr {
            font-family: 'SF Mono', monospace;
            font-size: 10px;
            color: #64748b;
            margin-left: 8px;
            opacity: 0.8;
        }
        
        .ast-node-kind {
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 8px;
            font-weight: 600;
            text-transform: uppercase;
            color: #94a3b8;
            opacity: 0.6;
            letter-spacing: 0.5px;
        }
        
        .ast-node-children {
            margin-top: 8px;
            margin-left: 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            position: relative;
        }
        
        .ast-node-children::before {
            content: '';
            position: absolute;
            left: -12px;
            top: -6px;
            bottom: 50%;
            width: 1px;
            background-color: #e2e8f0;
        }
        
        /* All nodes use the same gray color scheme */
        .ast-node {
            background-color: #f8fafc !important;
            border-color: #e2e8f0 !important;
        }
        
        .ast-node:hover {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
        }
        
        .expression-highlight {
            background-color: #fef3c7;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: 600;
        }
        
        .ast-json-popup {
            position: fixed;
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            max-width: 600px;
            max-height: 80vh;
            overflow: auto;
            z-index: 1000;
            font-family: 'SF Mono', monospace;
            font-size: 12px;
            display: none;
        }
        
        .ast-json-popup pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .ast-json-popup-close {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #475569;
            color: #e2e8f0;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .ast-json-popup-close:hover {
            background: #64748b;
        }
        
        .usage-examples {
            margin-top: 15px;
        }
        
        .usage-example {
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-left: 3px solid #3498db;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .resource-name {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .constraint-key {
            color: #7f8c8d;
            font-size: 0.85em;
        }
        
        .error {
            background-color: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #c33;
        }
        
        .length-indicator {
            font-size: 0.85em;
            color: #7f8c8d;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <h1>FHIR Constraint Expressions</h1>
    <p style="color: #6b7280; font-size: 1.1em; margin-top: -10px; margin-bottom: 30px;">
        Unique FHIRPath expressions used in FHIR R5 constraints, sorted by complexity
    </p>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${data.stats.totalUniqueExpressions}</div>
            <div class="stat-label">Unique Expressions</div>
        </div>
        <div class="stat">
            <div class="stat-value">${data.stats.totalConstraints}</div>
            <div class="stat-label">Total Usage</div>
        </div>
        <div class="stat">
            <div class="stat-value">${data.stats.structureDefinitionsWithConstraints}</div>
            <div class="stat-label">Resource Types</div>
        </div>
        <div class="stat">
            <div class="stat-value">${Math.round(data.stats.totalConstraints / data.stats.totalUniqueExpressions)}</div>
            <div class="stat-label">Avg Reuse</div>
        </div>
    </div>
    
    <input type="text" class="search-box" id="searchBox" placeholder="Search expressions...">
    
    <div id="expressionsContainer">`;
  
  // Generate cards for each unique expression
  sortedExpressions.forEach((expression, index) => {
    const examples = expressionExamples.get(expression)!;
    let astTree = '';
    let parseError = '';
    
    try {
      const ast = parse(expression);
      astTree = generateHTMLTree(ast, index);
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
    
    const metrics = complexityMetrics.get(expression);
    const complexityBadges: string[] = [];
    
    if (metrics) {
      if (metrics.hasImplies) complexityBadges.push('<span class="complexity-badge badge-implies">implies</span>');
      if (metrics.hasEnvironmentVars) complexityBadges.push('<span class="complexity-badge badge-env-var">env var</span>');
      if (metrics.hasDefineVariable) complexityBadges.push('<span class="complexity-badge badge-define-var">define var</span>');
    }
    
    html += `
    <div class="expression-card" data-search="${escapeHtml(expression.toLowerCase())}">
        <div class="expression-header" onclick="toggleExpression(${index})">
            <div class="expression-text" id="expr-text-${index}">${escapeHtml(expression)}</div>
            <div class="expression-meta">
                <div class="complexity-badges">
                    ${complexityBadges.join('')}
                </div>
                <span class="usage-count">${examples.length}×</span>
                <span class="length-indicator" style="color: #6b7280; font-size: 0.875em;">${expression.length} chars</span>
            </div>
        </div>
        <div class="expression-body">`;
    
    if (parseError) {
      html += `<div class="error">Parse Error: ${escapeHtml(parseError)}</div>`;
    } else {
      html += `<div class="ast-tree">${astTree}</div>`;
    }
    
    // Show usage examples
    html += `<div class="usage-examples" style="margin-top: 20px;">`;
    
    const maxExamples = 3;
    examples.slice(0, maxExamples).forEach(example => {
      html += `
                <div class="usage-example">
                    <strong>${example.structureDefinitionName}</strong> • ${example.elementPath} 
                    <span style="color: #6b7280;">(${example.constraintKey})</span>
                </div>`;
    });
    
    if (examples.length > maxExamples) {
      html += `
                <div class="usage-example" style="color: #6b7280; font-style: italic;">
                    ... and ${examples.length - maxExamples} more resources
                </div>`;
    }
    
    html += `
            </div>
        </div>
    </div>`;
  });
  
  html += `
    </div>
    
    <div id="astJsonPopup" class="ast-json-popup">
        <button class="ast-json-popup-close" onclick="closeAstPopup()">×</button>
        <pre id="astJsonContent"></pre>
    </div>
    
    <script>
        function toggleExpression(index) {
            const cards = document.querySelectorAll('.expression-card');
            cards[index].classList.toggle('expanded');
        }
        
        function highlightExpression(exprId, start, end, event) {
            if (event) {
                event.stopPropagation();
            }
            
            // Remove previous highlights
            document.querySelectorAll('.ast-node').forEach(node => {
                node.classList.remove('highlighted');
            });
            document.querySelectorAll('.expression-highlight').forEach(span => {
                const parent = span.parentNode;
                parent.replaceChild(document.createTextNode(span.textContent), span);
                parent.normalize();
            });
            
            // Highlight the hovered node
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('highlighted');
            }
            
            // Highlight the expression text
            const exprTextEl = document.getElementById('expr-text-' + exprId);
            if (exprTextEl && !exprTextEl.dataset.originalText) {
                exprTextEl.dataset.originalText = exprTextEl.textContent;
            }
            
            if (exprTextEl) {
                const exprText = exprTextEl.dataset.originalText || exprTextEl.textContent;
                const before = exprText.substring(0, start);
                const highlighted = exprText.substring(start, end);
                const after = exprText.substring(end);
                
                exprTextEl.innerHTML = escapeHtml(before) + 
                    '<span class="expression-highlight">' + escapeHtml(highlighted) + '</span>' + 
                    escapeHtml(after);
            }
        }
        
        function clearHighlight(exprId, event) {
            if (event) {
                event.stopPropagation();
            }
            
            // Remove highlight from nodes
            document.querySelectorAll('.ast-node').forEach(node => {
                node.classList.remove('highlighted');
            });
            
            // Restore original expression text
            const exprTextEl = document.getElementById('expr-text-' + exprId);
            if (exprTextEl && exprTextEl.dataset.originalText) {
                exprTextEl.textContent = exprTextEl.dataset.originalText;
            }
        }
        
        function showAstJson(element, event) {
            event.stopPropagation();
            
            const astData = element.getAttribute('data-ast');
            const astJson = JSON.parse(astData.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
            
            const popup = document.getElementById('astJsonPopup');
            const content = document.getElementById('astJsonContent');
            
            // Format JSON with syntax highlighting
            const formatted = JSON.stringify(astJson, null, 2);
            const highlighted = formatted
                .replace(/("kind":\s*"[^"]+")/, '<span style="color: #7dd3fc;">$1</span>')
                .replace(/("start"|"end"):\s*(\d+)/g, '<span style="color: #cbd5e1;">$1: <span style="color: #fbbf24;">$2</span></span>')
                .replace(/("name"|"value"|"targetType"):\s*("[^"]*")/g, '<span style="color: #cbd5e1;">$1: <span style="color: #86efac;">$2</span></span>')
                .replace(/("dataType"):\s*("[^"]*")/g, '<span style="color: #cbd5e1;">$1: <span style="color: #c084fc;">$2</span></span>')
                .replace(/("op"):\s*(\d+)/g, '<span style="color: #cbd5e1;">$1: <span style="color: #f87171;">$2</span></span>');
            
            content.innerHTML = highlighted;
            
            // Position popup near the clicked element
            const rect = element.getBoundingClientRect();
            popup.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 620) + 'px';
            popup.style.top = (rect.bottom + window.scrollY + 5) + 'px';
            popup.style.display = 'block';
        }
        
        function closeAstPopup() {
            document.getElementById('astJsonPopup').style.display = 'none';
        }
        
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return text.replace(/[&<>"']/g, (char) => map[char]);
        }
        
        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('astJsonPopup');
            if (popup.style.display === 'block' && !popup.contains(e.target)) {
                closeAstPopup();
            }
        });
        
        // Search functionality
        const searchBox = document.getElementById('searchBox');
        const cards = document.querySelectorAll('.expression-card');
        
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            cards.forEach(card => {
                const searchData = card.getAttribute('data-search');
                if (searchData.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+O to toggle all
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                const allExpanded = Array.from(cards).every(c => c.classList.contains('expanded'));
                cards.forEach(card => {
                    if (allExpanded) {
                        card.classList.remove('expanded');
                    } else {
                        card.classList.add('expanded');
                    }
                });
            }
            
            // Escape to collapse all
            if (e.key === 'Escape') {
                cards.forEach(card => card.classList.remove('expanded'));
            }
        });
    </script>
</body>
</html>`;
  
  // Create tmp directory if needed
  mkdirSync(join(__dirname, '../tmp'), { recursive: true });
  
  // Write HTML file
  const outputPath = join(__dirname, '../tmp/unique-expressions.html');
  writeFileSync(outputPath, html);
  
  console.log(`\n✅ Generated HTML visualization at: ${outputPath}`);
  console.log(`\n📊 Statistics:`);
  console.log(`   • Unique expressions: ${data.stats.totalUniqueExpressions}`);
  console.log(`   • Total constraints: ${data.stats.totalConstraints}`);
  console.log(`   • Average reuse: ${Math.round(data.stats.totalConstraints / data.stats.totalUniqueExpressions)}×`);
  console.log(`   • File size: ${(html.length / 1024 / 1024).toFixed(2)}MB`);
  console.log(`\n🌐 Open in browser: file://${outputPath}`);
}

// Run the script
generateHTML();