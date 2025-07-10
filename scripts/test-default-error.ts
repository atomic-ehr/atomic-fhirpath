#!/usr/bin/env bun
import { parse } from '../src';

// Test that errors are formatted by default
console.log('Testing default error formatting:\n');

try {
  parse('Patient.name.where(use = "official"');
} catch (error: any) {
  console.log('Error message now includes formatting:');
  console.log(error.message);
  console.log('\nOriginal message:', error.originalMessage);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test another error
try {
  parse('Patient..name');
} catch (error: any) {
  console.log('Direct error output shows formatted message:');
  console.log(error.message);
}