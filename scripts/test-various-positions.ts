#!/usr/bin/env bun
import { parse } from '../src';

const testCases = [
  'Patient.name(',      // Error at '('
  'Patient..name',      // Error at second '.'
  '(',                  // Error at start
  'Patient.123',        // Error at '1'
  'Patient + +',        // Error at second '+'
];

for (const expr of testCases) {
  console.log(`\nExpression: "${expr}"`);
  console.log('0123456789012345678901234567890');
  try {
    parse(expr);
  } catch (error: any) {
    console.log(`Error at column ${error.column} (char: '${expr[error.column - 1]}')`);
    console.log('\n' + error.message);
  }
}