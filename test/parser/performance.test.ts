import { test, expect, describe } from 'bun:test';
import { measureParsePerformanceComparison, writePerfLog } from './performance-utils';
import type { PerfResult } from './performance-utils';

describe('Performance Benchmarks', () => {
  const results: PerfResult[] = [];

  test('Parser performance - simple expression', () => {
    const expression = 'name';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 5000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(20);
    expect(cached.avgUs).toBeLessThan(1);
  });

  test('Parser performance - arithmetic expression', () => {
    const expression = '1 + 2 * 3 - 4 / 2';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 5000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(50);
    expect(cached.avgUs).toBeLessThan(5);
  });

  test('Parser performance - complex path expression', () => {
    const expression = 'Patient.name.given[0] + " " + Patient.name.family';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 3000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(100);
    expect(cached.avgUs).toBeLessThan(10);
  });

  test('Parser performance - deeply nested expression', () => {
    let expression = 'a';
    for (let i = 0; i < 10; i++) {
      expression = `(${expression} + b)`;
    }
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 2000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(200);
    expect(cached.avgUs).toBeLessThan(20);
  });

  test('Parser performance - function calls', () => {
    const expression = 'exists() and contains(value, "test")';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 3000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(150);
    expect(cached.avgUs).toBeLessThan(15);
  });

  test('Parser performance - mixed operations', () => {
    const expression = 'Patient.name.given.first() + " " + Patient.name.family';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 2000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(300);
    expect(cached.avgUs).toBeLessThan(30);
  });

  test('Performance regression detection', () => {
    const expression = 'Bundle.entry.resource.where(resourceType="Patient").name.given';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 1000);
    
    results.push(nonCached, cached);
    expect(nonCached.avgUs).toBeLessThan(500);
    expect(cached.avgUs).toBeLessThan(50);
  });

  // Write performance log after all tests
  test('Write performance log', () => {
    writePerfLog(results);
    console.log('\n✓ Performance results written to performance.log');
    expect(results.length).toBeGreaterThan(0);
  });
});