import type { ASTNode } from './types';
import { TokenType } from './types';

/**
 * Pretty print an AST node to a formatted string in Lisp style
 * 
 * @param node The AST node to print
 * @param indent The current indentation level (for internal use)
 * @returns A formatted string representation of the AST in Lisp style
 */
export function prettyPrint(node: ASTNode, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  
  switch (node.kind) {
    case 'literal':
      return `(${node.kind}:${JSON.stringify(node.value)})`;
    
    case 'identifier':
      return `(${node.kind}:${node.name})`;
    
    case 'binary':
      return `(${node.kind}:${getOperatorName(node.op)}\n` +
             `${spaces}  ${prettyPrint(node.left, indent + 1)}\n` +
             `${spaces}  ${prettyPrint(node.right, indent + 1)})`;
    
    case 'unary':
      return `(${node.kind}:${getOperatorName(node.op)}\n` +
             `${spaces}  ${prettyPrint(node.operand, indent + 1)})`;
    
    case 'function':
      if (node.args.length === 0) {
        return `(${node.kind}:${node.name})`;
      }
      const args = node.args.map(arg => 
        `${spaces}  ${prettyPrint(arg, indent + 1)}`
      ).join('\n');
      return `(${node.kind}:${node.name}\n${args})`;
    
    case 'indexer':
      return `(${node.kind}\n` +
             `${spaces}  ${prettyPrint(node.expr, indent + 1)}\n` +
             `${spaces}  ${prettyPrint(node.index, indent + 1)})`;
    
    case 'dot':
      return `(${node.kind}\n` +
             `${spaces}  ${prettyPrint(node.left, indent + 1)}\n` +
             `${spaces}  ${prettyPrint(node.right, indent + 1)})`;
    
    case 'as':
      return `(${node.kind}\n` +
             `${spaces}  ${prettyPrint(node.expression, indent + 1)}\n` +
             `${spaces}  ${node.targetType})`;
    
    case 'is':
      return `(${node.kind}\n` +
             `${spaces}  ${prettyPrint(node.expression, indent + 1)}\n` +
             `${spaces}  ${node.targetType})`;
    
    case 'variable':
      return `(${node.kind}:$${node.name})`;
    
    case 'envVariable':
      return `(${node.kind}:%${node.name})`;
    
    default:
      return `(${(node as any).kind || 'unknown'} ${JSON.stringify(node)})`;
  }
}

/**
 * Get a human-readable name for an operator token
 */
function getOperatorName(op: TokenType): string {
  switch (op) {
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
    case TokenType.AMPERSAND: return '&';
    case TokenType.IN: return 'in';
    case TokenType.CONTAINS: return 'contains';
    case TokenType.EMPTY: return 'empty';
    default: return `TokenType(${op})`;
  }
}

/**
 * Pretty print an AST node to console in Lisp style
 * Convenience function for debugging
 */
export function printAST(node: ASTNode): void {
  console.log(prettyPrint(node));
} 