#!/usr/bin/env bun
import { parse, prettyPrint, printAST } from '../src/index';

console.log('=== FHIRPath AST Pretty Print Demo ===\n');

// Example expressions to demonstrate the pretty printer
const examples = [
  '42',
  'Patient',
  'Patient.name',
  'Patient.name.given[0]',
  'Patient.name.where(use = "official")',
  'exists()',
  'where(active = true)',
  'a + b * c',
  'not empty',
  '$this',
  '%resource',
  'Patient.name.given.first()',
  'Patient.name.where(use = "official").given[0]',
  'Patient.telecom.where(system = "email").value',
  'Patient.name.select(family + ", " + given.join(" "))',
  'Patient.contact.where(relationship.coding.where(system = "http://terminology.hl7.org/CodeSystem/v2-0131" and code = "N"))',
];

examples.forEach((expression, index) => {
  console.log(`\n${index + 1}. Expression: ${expression}`);
  console.log('   AST:');
  
  try {
    const ast = parse(expression);
    const formatted = prettyPrint(ast);
    console.log(formatted);
  } catch (error) {
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

console.log('\n=== Usage Examples ===');

console.log('\n1. Basic usage:');
console.log('   import { parse, prettyPrint } from "fhirparser";');
console.log('   const ast = parse("Patient.name");');
console.log('   console.log(prettyPrint(ast));');

console.log('\n2. Convenience function:');
console.log('   import { parse, printAST } from "fhirparser";');
console.log('   const ast = parse("Patient.name.given[0]");');
console.log('   printAST(ast); // Prints directly to console');

console.log('\n3. With custom indentation:');
console.log('   import { parse, prettyPrint } from "fhirparser";');
console.log('   const ast = parse("Patient.name");');
console.log('   console.log(prettyPrint(ast, 2)); // Start with 2 levels of indentation');

console.log('\n=== End Demo ==='); 