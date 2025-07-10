#!/usr/bin/env bun
import { parse } from '../src';

// Check the actual error position for 'Patient + '
try {
  parse('Patient + ');
} catch (error: any) {
  console.log('Expression: "Patient + "');
  console.log('Error column:', error.column);
  console.log('Formatted:');
  console.log(error.formattedMessage);
}