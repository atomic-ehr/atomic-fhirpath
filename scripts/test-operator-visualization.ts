import { parse } from '../src';
import { TokenType } from '../src/types';

// Test expressions with various operators
const testExpressions = [
  'a + b',
  'a - b',
  'a * b',
  'a / b',
  'a div b',
  'a mod b',
  'a = b',
  'a != b',
  'a < b',
  'a > b',
  'a <= b',
  'a >= b',
  'a and b',
  'a or b',
  'a xor b',
  'a implies b',
  'not a',
  'a in b',
  'a contains b',
  'a | b',
  'a.b',
  'a is Type',
  'a as Type'
];

console.log('Testing operator visualization:\n');

testExpressions.forEach(expr => {
  try {
    const ast = parse(expr);
    
    // Find the operator node
    let opNode: any = ast;
    if (ast.kind === 'binary' || ast.kind === 'unary') {
      console.log(`Expression: "${expr}"`);
      console.log(`  Operator code: ${ast.op}`);
      console.log(`  Operator name: ${TokenType[ast.op]}`);
      console.log('');
    } else if (ast.kind === 'dot') {
      console.log(`Expression: "${expr}"`);
      console.log(`  Dot operator`);
      console.log('');
    } else if (ast.kind === 'is' || ast.kind === 'as') {
      console.log(`Expression: "${expr}"`);
      console.log(`  ${ast.kind} operator: ${ast.targetType}`);
      console.log('');
    }
  } catch (error) {
    console.error(`Failed to parse "${expr}":`, error);
  }
});

// Also show the TokenType enum values for reference
console.log('\nTokenType enum values for operators:');
console.log('DOT =', TokenType.DOT);
console.log('PLUS =', TokenType.PLUS);
console.log('MINUS =', TokenType.MINUS);
console.log('MULTIPLY =', TokenType.MULTIPLY);
console.log('DIVIDE =', TokenType.DIVIDE);
console.log('MOD =', TokenType.MOD);
console.log('DIV =', TokenType.DIV);
console.log('EQUALS =', TokenType.EQUALS);
console.log('NOT_EQUALS =', TokenType.NOT_EQUALS);
console.log('LESS_THAN =', TokenType.LESS_THAN);
console.log('GREATER_THAN =', TokenType.GREATER_THAN);
console.log('LESS_EQUALS =', TokenType.LESS_EQUALS);
console.log('GREATER_EQUALS =', TokenType.GREATER_EQUALS);
console.log('AND =', TokenType.AND);
console.log('OR =', TokenType.OR);
console.log('IMPLIES =', TokenType.IMPLIES);
console.log('XOR =', TokenType.XOR);
console.log('NOT =', TokenType.NOT);
console.log('IN =', TokenType.IN);
console.log('CONTAINS =', TokenType.CONTAINS);
console.log('PIPE =', TokenType.PIPE);
console.log('AS_TYPE =', TokenType.AS_TYPE);
console.log('IS_TYPE =', TokenType.IS_TYPE);
console.log('AMPERSAND =', TokenType.AMPERSAND);