#!/usr/bin/env bun

import { parse, clearCache } from '../src';

const expressions = [
  { name: 'simple', expr: 'name' },
  { name: 'dot-chain', expr: 'Patient.name.given' },
  { name: 'arithmetic', expr: '1 + 2 * 3 - 4' },
  { name: 'complex', expr: 'Patient.name.given[0] + " " + Patient.name.family' },
];

const iterations = 10000;

console.log('🚀 FHIRPath Parser Quick Benchmark\n');

// Benchmark without cache
console.log('📊 Without Cache:');
for (const { name, expr } of expressions) {
  clearCache();
  
  // Warmup
  for (let i = 0; i < 100; i++) {
    clearCache();
    parse(expr);
  }
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    clearCache();
    parse(expr);
  }
  const time = performance.now() - start;
  const avgUs = (time / iterations) * 1000;
  
  console.log(`  ${name.padEnd(15)} ${avgUs.toFixed(2).padStart(6)}μs`);
}

console.log('\n📊 With Cache:');
for (const { name, expr } of expressions) {
  clearCache();
  parse(expr); // Prime cache
  
  // Warmup
  for (let i = 0; i < 100; i++) {
    parse(expr);
  }
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    parse(expr);
  }
  const time = performance.now() - start;
  const avgUs = (time / iterations) * 1000;
  
  console.log(`  ${name.padEnd(15)} ${avgUs.toFixed(2).padStart(6)}μs`);
}

// Memory usage estimate
if (typeof process !== 'undefined' && process.memoryUsage) {
  const mem = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
}