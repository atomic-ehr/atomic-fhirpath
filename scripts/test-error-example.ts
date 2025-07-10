#!/usr/bin/env bun
import { parse } from '../src';

console.log('=== FHIRPath Parser Error Formatting ===\n');

try {
  parse('Patient.name.where(use = "official"');
} catch (error: any) {
  console.log('When you catch an error, you get a beautifully formatted message:\n');
  console.log(error.message);
  
  console.log('\n\nYou can still access the original message if needed:');
  console.log('error.originalMessage:', error.originalMessage);
  
  console.log('\nAnd the position information:');
  console.log('Line:', error.line);
  console.log('Column:', error.column);
}

console.log('\n\n=== Simple Usage ===\n');
console.log('try {');
console.log('  parse("Patient.name(");');
console.log('} catch (error) {');
console.log('  console.log(error.message); // Shows formatted error with position');
console.log('}');