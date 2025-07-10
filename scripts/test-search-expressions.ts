#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { parse } from '../src';

interface SearchExpressions {
  stats: {
    totalSearchParameters: number;
    withExpressions: number;
    withoutExpressions: number;
    uniqueExpressions: number;
  };
  expressions: Array<{
    name: string;
    expression: string;
    base?: string[];
    type?: string;
    description?: string;
  }>;
  uniqueExpressions: string[];
}

async function testSearchExpressions() {
  const inputFile = path.join(__dirname, '..', 'search-expressions.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}. Run extract-search-expressions.ts first.`);
    process.exit(1);
  }

  console.log('🧪 Testing FHIRPath parser against real SearchParameter expressions...\n');

  const data: SearchExpressions = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  
  let passed = 0;
  let failed = 0;
  const failures: { expression: string; error: string }[] = [];
  const errorCategories = new Map<string, number>();

  // Test each unique expression
  for (const expr of data.uniqueExpressions) {
    try {
      parse(expr);
      passed++;
    } catch (e: any) {
      failed++;
      const error = e.message || 'Unknown error';
      
      // Categorize errors
      let category = 'Other';
      if (error.includes('Expected identifier after .')) category = 'Missing identifier after dot';
      else if (error.includes('Unexpected token')) category = 'Unexpected token';
      else if (error.includes('Empty expression')) category = 'Empty expression';
      else if (error.includes('Unexpected character')) category = 'Unexpected character';
      
      errorCategories.set(category, (errorCategories.get(category) || 0) + 1);
      
      // Store first 20 failures for analysis
      if (failures.length < 20) {
        failures.push({ expression: expr, error });
      }
    }
  }

  // Calculate success rate
  const total = data.uniqueExpressions.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  // Display results
  console.log('📊 Results:');
  console.log(`   Total expressions: ${total}`);
  console.log(`   ✅ Passed: ${passed} (${successRate}%)`);
  console.log(`   ❌ Failed: ${failed} (${(100 - parseFloat(successRate)).toFixed(1)}%)`);

  if (failed > 0) {
    console.log('\n📈 Error Categories:');
    const sortedCategories = Array.from(errorCategories.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [category, count] of sortedCategories) {
      const percentage = ((count / failed) * 100).toFixed(1);
      console.log(`   ${category}: ${count} (${percentage}%)`);
    }

    console.log('\n❌ Sample Failures:');
    failures.forEach(({ expression, error }, i) => {
      console.log(`\n${i + 1}. Expression: ${expression.substring(0, 100)}${expression.length > 100 ? '...' : ''}`);
      console.log(`   Error: ${error}`);
    });

    if (failed > 20) {
      console.log(`\n   ... and ${failed - 20} more failures`);
    }
  }

  // Identify missing features
  console.log('\n🔍 Analysis:');
  
  // Check for common patterns in failed expressions
  const patterns = {
    'resolve()': 0,
    'extension(': 0,
    'as(': 0,
    'where(': 0,
    'memberOf(': 0,
    '.as(': 0,
    ' as ': 0,
    ' is ': 0,
    'hasValue()': 0,
    'descendants()': 0,
    'trace(': 0,
  };

  for (const expr of data.uniqueExpressions) {
    for (const [pattern, _] of Object.entries(patterns)) {
      if (expr.includes(pattern)) {
        patterns[pattern]++;
      }
    }
  }

  console.log('   Common patterns in all expressions:');
  const sortedPatterns = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0);
  
  for (const [pattern, count] of sortedPatterns) {
    const percentage = ((count / total) * 100).toFixed(1);
    console.log(`   "${pattern}": ${count} expressions (${percentage}%)`);
  }

  // Success by complexity
  const complexityBuckets = {
    simple: { total: 0, passed: 0 }, // < 20 chars
    medium: { total: 0, passed: 0 }, // 20-50 chars
    complex: { total: 0, passed: 0 }, // 50-100 chars
    veryComplex: { total: 0, passed: 0 }, // > 100 chars
  };

  for (const expr of data.uniqueExpressions) {
    let bucket: keyof typeof complexityBuckets;
    if (expr.length < 20) bucket = 'simple';
    else if (expr.length < 50) bucket = 'medium';
    else if (expr.length < 100) bucket = 'complex';
    else bucket = 'veryComplex';

    complexityBuckets[bucket].total++;
    
    try {
      parse(expr);
      complexityBuckets[bucket].passed++;
    } catch (e) {
      // Already counted in main loop
    }
  }

  console.log('\n📏 Success rate by expression length:');
  console.log(`   Simple (<20 chars): ${complexityBuckets.simple.passed}/${complexityBuckets.simple.total} (${((complexityBuckets.simple.passed / complexityBuckets.simple.total) * 100).toFixed(1)}%)`);
  console.log(`   Medium (20-50 chars): ${complexityBuckets.medium.passed}/${complexityBuckets.medium.total} (${((complexityBuckets.medium.passed / complexityBuckets.medium.total) * 100).toFixed(1)}%)`);
  console.log(`   Complex (50-100 chars): ${complexityBuckets.complex.passed}/${complexityBuckets.complex.total} (${((complexityBuckets.complex.passed / complexityBuckets.complex.total) * 100).toFixed(1)}%)`);
  console.log(`   Very Complex (>100 chars): ${complexityBuckets.veryComplex.passed}/${complexityBuckets.veryComplex.total} (${((complexityBuckets.veryComplex.passed / complexityBuckets.veryComplex.total) * 100).toFixed(1)}%)`);
}

// Run the test
testSearchExpressions().catch(console.error);