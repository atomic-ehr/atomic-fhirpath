#!/usr/bin/env bun
/**
 * Demo of enhanced error reporting with expression visualization
 */

import { parse } from '../src';

console.log('FHIRPath Parser - Enhanced Error Reporting Demo\n');
console.log('='.repeat(50) + '\n');

// Examples of common errors
const errorExamples = [
  {
    title: '1. Missing closing parenthesis',
    expr: 'Patient.name.where(use = "official"'
  },
  {
    title: '2. Double dot operator',
    expr: 'Observation..value'
  },
  {
    title: '3. Unterminated string',
    expr: 'Patient.name = "John Doe'
  },
  {
    title: '4. Invalid character after dot',
    expr: 'Patient.123'
  },
  {
    title: '5. Empty expression in parentheses',
    expr: 'name.given + ()'
  },
  {
    title: '6. Multiline expression with error',
    expr: `Patient.name
      .where(use = "official")
      .given.first(
      .family`
  }
];

for (const { title, expr } of errorExamples) {
  console.log(title);
  console.log('-'.repeat(title.length));
  
  try {
    parse(expr);
    console.log('✓ Parsed successfully (unexpected!)');
  } catch (error: any) {
    // The error message now contains the formatted output by default
    console.log(error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

console.log('The parser now provides:');
console.log('• Clear error messages explaining what went wrong');
console.log('• Visual indication of the error position with ^');
console.log('• Line and column numbers for precise location');
console.log('• Context showing surrounding lines for multiline expressions');