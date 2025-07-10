// Example usage of the FHIRPath parser
import { parse, astToString } from '../src';

// Simple examples
console.log('Parsing simple expressions:');
console.log('1 + 2 =>', astToString(parse('1 + 2')));
console.log('Patient.name =>', astToString(parse('Patient.name')));
console.log('items[0] =>', astToString(parse('items[0]')));

// Complex example
const complexExpr = "Patient.name.given + ' ' + Patient.name.family";
console.log('\nComplex expression:');
console.log(complexExpr);
console.log('=>', astToString(parse(complexExpr)));

// Performance test
console.log('\nPerformance test:');
const iterations = 10000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  parse('Patient.name.given[0]');
}

const elapsed = performance.now() - start;
console.log(`Parsed ${iterations} expressions in ${elapsed.toFixed(2)}ms`);
console.log(`Average: ${(elapsed / iterations * 1000).toFixed(2)}μs per parse`);