#!/usr/bin/env bun
import { parse } from '../src';

// Test the caret position
try {
  parse('Patient.name(');
} catch (error: any) {
  console.log('Error details:');
  console.log('Column:', error.column);
  console.log('Position:', error.position);
  console.log('\nError output:');
  console.log(error.message);
  
  // Let's count the actual position
  const expr = 'Patient.name(';
  console.log('\nExpression analysis:');
  console.log('Expression:', expr);
  console.log('Length:', expr.length);
  console.log('Error at column:', error.column);
  console.log('Character at column', error.column + ':', expr[error.column - 1]);
}