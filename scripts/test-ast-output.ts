import { parse, astToString } from '../src';

// Test expressions to verify operator display
const testExpressions = [
  'a + b',
  'a and b',
  'a = b',
  'a implies b',
  'not a',
  'a.b.c',
  'a | b',
  'value as Quantity'
];

console.log('Testing AST string representation:\n');

testExpressions.forEach(expr => {
  try {
    const ast = parse(expr);
    const reconstructed = astToString(ast);
    console.log(`Original:      ${expr}`);
    console.log(`Reconstructed: ${reconstructed}`);
    console.log('');
  } catch (error) {
    console.error(`Failed on "${expr}":`, error);
  }
});