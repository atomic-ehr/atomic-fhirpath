#!/usr/bin/env bun
import { parse } from '../src';

// Test error positions
const testCases = [
  'Patient.name(',
  'Patient..name', 
  '(',
  'Patient + +',
  'Patient.123',
];

for (const expr of testCases) {
  console.log(`\nTesting: "${expr}"`);
  try {
    parse(expr);
  } catch (error: any) {
    console.log(`Error at line ${error.line}, column ${error.column}`);
    console.log('Formatted:');
    console.log(error.formattedMessage || error.message);
  }
}