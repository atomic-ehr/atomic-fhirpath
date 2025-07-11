import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse } from '../src';
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
  categories: Record<string, string[]>;
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
  return text.replace(/[&<>"']/g, (char) => map[char]!);
}

// Function to generate a tree visualization of the AST
function generateASTTree(node: ASTNode, indent: string = ''): string {
  const lines: string[] = [];
  
  switch (node.kind) {
    case 'literal':
      lines.push(`${indent}├─ Literal (${node.dataType}): ${JSON.stringify(node.value)}`);
      break;
      
    case 'identifier':
      lines.push(`${indent}├─ Identifier: ${node.name}`);
      break;
      
    case 'binary':
      lines.push(`${indent}├─ Binary: ${getOperatorName(node.op)}`);
      lines.push(generateASTTree(node.left, indent + '│  '));
      lines.push(generateASTTree(node.right, indent + '   '));
      break;
      
    case 'unary':
      lines.push(`${indent}├─ Unary: ${getOperatorName(node.op)}`);
      lines.push(generateASTTree(node.operand, indent + '   '));
      break;
      
    case 'function':
      lines.push(`${indent}├─ Function: ${node.name}()`);
      if (node.args.length > 0) {
        lines.push(`${indent}│  └─ Arguments:`);
        node.args.forEach((arg, i) => {
          const isLast = i === node.args.length - 1;
          lines.push(generateASTTree(arg, indent + (isLast ? '     ' : '│    ')));
        });
      }
      break;
      
    case 'indexer':
      lines.push(`${indent}├─ Indexer []`);
      lines.push(`${indent}│  ├─ Expression:`);
      lines.push(generateASTTree(node.expr, indent + '│  │  '));
      lines.push(`${indent}│  └─ Index:`);
      lines.push(generateASTTree(node.index, indent + '     '));
      break;
      
    case 'dot':
      lines.push(`${indent}├─ Dot (.)`);
      lines.push(`${indent}│  ├─ Left:`);
      lines.push(generateASTTree(node.left, indent + '│  │  '));
      lines.push(`${indent}│  └─ Right:`);
      lines.push(generateASTTree(node.right, indent + '     '));
      break;
      
    case 'as':
      lines.push(`${indent}├─ As: ${node.targetType}`);
      lines.push(generateASTTree(node.expression, indent + '   '));
      break;
      
    case 'is':
      lines.push(`${indent}├─ Is: ${node.targetType}`);
      lines.push(generateASTTree(node.expression, indent + '   '));
      break;
      
    case 'variable':
      lines.push(`${indent}├─ Variable: $${node.name}`);
      break;
      
    case 'envVariable':
      lines.push(`${indent}├─ Environment Variable: %${node.name}`);
      break;
  }
  
  return lines.join('\n');
}

// Helper to get operator name with full mapping
function getOperatorName(op: TokenType): string {
  // Complete mapping of TokenType enum values to operator symbols
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

// Generate severity badge
function getSeverityBadge(severity: string): string {
  const color = severity === 'error' ? '#e74c3c' : '#f39c12';
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  return `<span class="badge" style="background-color: ${color}">${label}</span>`;
}

// Main function
function generateHTML() {
  // Read constraint expressions
  const data: ConstraintData = JSON.parse(
    readFileSync(join(__dirname, '../test/constraint-expressions.json'), 'utf-8')
  );
  
  // Group constraints by resource type
  const constraintsByResource: Record<string, Constraint[]> = {};
  
  data.constraints.forEach((constraint) => {
    const resourceType = constraint.structureDefinitionName;
    if (!constraintsByResource[resourceType]) {
      constraintsByResource[resourceType] = [];
    }
    constraintsByResource[resourceType].push(constraint);
  });
  
  // Generate HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FHIR Constraint Expressions - AST Visualization</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        
        .stats {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        
        .stat-card {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #3498db;
            font-size: 2em;
        }
        
        .stat-card p {
            margin: 0;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        details {
            background-color: #fff;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        summary {
            padding: 15px 20px;
            cursor: pointer;
            font-weight: 500;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        summary:hover {
            background-color: #e9ecef;
        }
        
        details[open] summary {
            background-color: #e3f2fd;
            border-bottom: 2px solid #3498db;
        }
        
        .expression-content {
            padding: 20px;
        }
        
        .expression-text {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            margin-bottom: 20px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #7f8c8d;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metadata-value {
            color: #2c3e50;
            margin-top: 3px;
        }
        
        .ast-section {
            margin-top: 20px;
        }
        
        .ast-tree {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            overflow-x: auto;
            white-space: pre;
            line-height: 1.4;
        }
        
        .error {
            background-color: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #c33;
            margin-top: 10px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.85em;
            font-weight: 500;
            margin-left: 10px;
        }
        
        .severity-error {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .severity-warning {
            color: #f39c12;
            font-weight: 600;
        }
        
        .human-description {
            background-color: #e8f5e9;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-style: italic;
            color: #2e7d32;
        }
        
        .category-section {
            margin-bottom: 40px;
        }
        
        .category-header {
            background-color: #34495e;
            color: white;
            padding: 10px 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
        }
        
        .expression-count {
            font-size: 0.9em;
            color: #95a5a6;
            font-weight: normal;
        }
        
        .search-box {
            width: 100%;
            padding: 12px 20px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            box-sizing: border-box;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #3498db;
        }
        
        .no-results {
            text-align: center;
            color: #7f8c8d;
            padding: 40px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>FHIR Constraint Expressions - AST Visualization</h1>
    
    <div class="stats">
        <h2>Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${data.stats.totalConstraints}</h3>
                <p>Total Constraints</p>
            </div>
            <div class="stat-card">
                <h3>${data.stats.totalUniqueExpressions}</h3>
                <p>Unique Expressions</p>
            </div>
            <div class="stat-card">
                <h3>${data.stats.structureDefinitionsWithConstraints}</h3>
                <p>Resource Types</p>
            </div>
            <div class="stat-card">
                <h3>${data.stats.constraintsBySeverity.error || 0}</h3>
                <p>Error Constraints</p>
            </div>
        </div>
    </div>
    
    <input type="text" class="search-box" id="searchBox" placeholder="Search expressions, resource types, or paths...">
    
    <div id="expressionsContainer">`;
  
  // Generate content for each resource type
  const sortedResources = Object.keys(constraintsByResource).sort();
  
  sortedResources.forEach((resourceType) => {
    const constraints = constraintsByResource[resourceType];
    html += `
    <div class="category-section">
        <h2 class="category-header">
            ${resourceType}
            <span class="expression-count">(${constraints!.length} constraints)</span>
        </h2>`;
    
    constraints!.forEach((expr, index) => {
      let astTree = '';
      let parseError = '';
      
      try {
        const ast = parse(expr.expression);
        astTree = generateASTTree(ast);
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
      }
      
      const severityClass = expr.severity === 'error' ? 'severity-error' : 'severity-warning';
      
      html += `
        <details class="expression-item" data-search="${escapeHtml(expr.expression.toLowerCase())} ${expr.structureDefinitionName.toLowerCase()} ${expr.elementPath.toLowerCase()}">
            <summary>
                <span>${expr.structureDefinitionName}.${expr.elementPath} - ${expr.constraintKey}</span>
                ${getSeverityBadge(expr.severity)}
            </summary>
            <div class="expression-content">
                ${expr.human ? `<div class="human-description">${escapeHtml(expr.human)}</div>` : ''}
                
                <div class="metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Resource Type</span>
                        <span class="metadata-value">${expr.structureDefinitionName}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Path</span>
                        <span class="metadata-value">${expr.elementPath}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Key</span>
                        <span class="metadata-value">${expr.constraintKey}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Severity</span>
                        <span class="metadata-value ${severityClass}">${expr.severity}</span>
                    </div>
                </div>
                
                <div class="expression-text">${escapeHtml(expr.expression)}</div>
                
                <div class="ast-section">
                    <h3>Abstract Syntax Tree</h3>
                    ${parseError 
                      ? `<div class="error">Parse Error: ${escapeHtml(parseError)}</div>`
                      : `<div class="ast-tree">${escapeHtml(astTree)}</div>`
                    }
                </div>
            </div>
        </details>`;
    });
    
    html += `</div>`;
  });
  
  html += `
    </div>
    
    <div id="noResults" class="no-results" style="display: none;">
        No expressions found matching your search.
    </div>
    
    <script>
        // Search functionality
        const searchBox = document.getElementById('searchBox');
        const expressionsContainer = document.getElementById('expressionsContainer');
        const noResults = document.getElementById('noResults');
        const allExpressions = document.querySelectorAll('.expression-item');
        
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            let hasResults = false;
            
            allExpressions.forEach(expr => {
                const searchData = expr.getAttribute('data-search');
                if (searchData.includes(searchTerm)) {
                    expr.style.display = 'block';
                    hasResults = true;
                } else {
                    expr.style.display = 'none';
                }
            });
            
            if (hasResults) {
                expressionsContainer.style.display = 'block';
                noResults.style.display = 'none';
            } else {
                expressionsContainer.style.display = 'none';
                noResults.style.display = 'block';
            }
        });
        
        // Expand/collapse all functionality
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                const allDetails = document.querySelectorAll('details');
                const allOpen = Array.from(allDetails).every(d => d.open);
                allDetails.forEach(d => d.open = !allOpen);
            }
        });
    </script>
</body>
</html>`;
  
  // Create tmp directory if it doesn't exist
  try {
    mkdirSync(join(__dirname, '../tmp'), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Write HTML file
  const outputPath = join(__dirname, '../tmp/constraint-expressions.html');
  writeFileSync(outputPath, html);
  
  console.log(`✅ Generated HTML visualization at: ${outputPath}`);
  console.log(`📊 Total constraints: ${data.stats.totalConstraints}`);
  console.log(`🔍 Unique expressions: ${data.stats.totalUniqueExpressions}`);
  console.log(`⚠️ Warning constraints: ${data.stats.constraintsBySeverity.warning || 0}`);
  console.log(`📄 Resource types: ${data.stats.structureDefinitionsWithConstraints}`);
}

// Run the script
generateHTML();