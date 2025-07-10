import { test, expect, describe } from 'bun:test';
import { measureParsePerformanceComparison } from './performance-utils';

describe('Parser Performance Tests', () => {
  test('should parse simple expression with good performance', () => {
    const expression = 'Patient.name.given';
    const { cached, nonCached } = measureParsePerformanceComparison(expression, expression, 1000);
    
    // Verify the result is correct
    const { parse } = require('../src');
    const ast = parse(expression);
    expect(ast.kind).toBe('dot');
    
    // Performance expectations
    expect(nonCached.avgUs).toBeLessThan(10);
    expect(cached.avgUs).toBeLessThan(1);
  });
});
