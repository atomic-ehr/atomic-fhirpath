#!/usr/bin/env bun
/**
 * Performance benchmark to measure the impact of parser optimizations
 * 
 * This script measures parsing performance for various FHIRPath expressions
 * to verify the effectiveness of the performance optimizations.
 */

import { parse } from '../src';

// Test expressions of varying complexity
const testExpressions = [
  // Simple expressions
  { expr: 'Patient', name: 'Simple identifier' },
  { expr: 'Patient.name', name: 'Simple dot access' },
  { expr: '42', name: 'Number literal' },
  { expr: '"hello world"', name: 'String literal' },
  
  // String-heavy expressions (tests string optimization)
  { expr: '"Hello \\u0048\\u0065\\u006C\\u006C\\u006F World"', name: 'Unicode escapes' },
  { expr: '`where`.`select`.`exists`', name: 'Quoted identifiers' },
  
  // Whitespace/comment heavy (tests skipWhitespace optimization)
  { expr: 'Patient   .   name   .   given   // comment\n.   first()', name: 'Whitespace heavy' },
  { expr: 'Patient /* comment */ . /* another */ name', name: 'Multi-line comments' },
  
  // Complex expressions (tests parseExpression optimization)
  { expr: 'a + b * c + d * e + f * g + h * i + j * k', name: 'Many operators' },
  { expr: 'Patient.name.where(use = "official").given.first()', name: 'Complex path' },
  
  // Function-heavy (tests argument array optimization)
  { expr: 'combine(a, b, c, d, e, f, g, h)', name: 'Many function args' },
  { expr: 'where(exists()).select(first()).combine(last())', name: 'Nested functions' },
];

// Warm up the parser
console.log('Warming up parser...');
for (let i = 0; i < 1000; i++) {
  parse('Patient.name.given');
}

console.log('\nRunning performance benchmarks...\n');
console.log('Expression                                    | Avg Time | Ops/sec  | Chars/sec');
console.log('----------------------------------------------|----------|----------|----------');

for (const { expr, name } of testExpressions) {
  const iterations = 10000;
  const times: number[] = [];
  
  // Run multiple iterations
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    parse(expr);
    const end = performance.now();
    times.push(end - start);
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const opsPerSec = 1000 / avg;
  const charsPerSec = (expr.length * 1000) / avg;
  
  // Format output
  const nameStr = name.padEnd(44);
  const avgStr = `${(avg * 1000).toFixed(1)}μs`.padStart(8);
  const opsStr = `${opsPerSec.toFixed(0)}/s`.padStart(9);
  const charsStr = `${(charsPerSec / 1000).toFixed(1)}K/s`.padStart(9);
  
  console.log(`${nameStr} | ${avgStr} | ${opsStr} | ${charsStr}`);
}

console.log('\nOptimization Summary:');
console.log('1. skipWhitespace() - Uses lookup table for O(1) whitespace checks');
console.log('2. readString() - Avoids string concatenation, builds once at end');
console.log('3. readQuotedIdentifier() - Same optimization as readString');
console.log('4. Unicode escapes - Uses hex lookup table instead of conditionals');
console.log('5. parseExpression() - Caches token type to avoid property access');
console.log('6. String interning - Reuses common token strings');
console.log('7. Array lookups - Uses arrays for postfix operator checks');
console.log('8. Function args - Pre-sizes arrays to avoid reallocation');