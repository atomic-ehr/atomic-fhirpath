import { test, expect, describe } from 'bun:test';
import { evaluate } from '../src/evaluate';
import type { EvaluationContext } from '../src/compiler-types';

describe('Compiler Caching', () => {
  const patient = {
    resourceType: 'Patient',
    name: [
      {
        use: 'official',
        family: 'Doe',
        given: ['John', 'Q']
      }
    ],
    age: 25
  };

  test('should cache compiled expressions', () => {
    const ctx: EvaluationContext = {};
    
    // First evaluation - should compile and cache
    const result1 = evaluate(ctx, 'name.given', patient);
    expect(result1).toEqual(['John', 'Q']);
    
    // Verify cache was created
    expect(ctx._cache).toBeDefined();
    expect(ctx._cache!.size).toBe(1);
    expect(ctx._cache!.has('name.given')).toBe(true);
    
    // Second evaluation - should use cached version
    const cachedCompiled = ctx._cache!.get('name.given');
    const result2 = evaluate(ctx, 'name.given', patient);
    expect(result2).toEqual(['John', 'Q']);
    
    // Verify same compiled node was used
    expect(ctx._cache!.get('name.given')).toBe(cachedCompiled);
    expect(ctx._cache!.size).toBe(1);
  });

  test('should cache multiple expressions independently', () => {
    const ctx: EvaluationContext = {};
    
    // Evaluate different expressions
    evaluate(ctx, 'resourceType', patient);
    evaluate(ctx, 'name.family', patient);
    evaluate(ctx, 'age + 5', patient);
    
    // Verify all are cached
    expect(ctx._cache!.size).toBe(3);
    expect(ctx._cache!.has('resourceType')).toBe(true);
    expect(ctx._cache!.has('name.family')).toBe(true);
    expect(ctx._cache!.has('age + 5')).toBe(true);
  });

  test('should share cache across multiple evaluations with same context', () => {
    const ctx: EvaluationContext = {};
    
    // Multiple patients
    const patient2 = {
      resourceType: 'Patient',
      name: [{ family: 'Smith', given: ['Jane'] }],
      age: 30
    };
    
    // Evaluate same expression on different data
    const result1 = evaluate(ctx, 'name.family', patient);
    const result2 = evaluate(ctx, 'name.family', patient2);
    
    expect(result1).toEqual(['Doe']);
    expect(result2).toEqual(['Smith']);
    
    // Should only have one cached compilation
    expect(ctx._cache!.size).toBe(1);
  });

  test('performance: cached expressions should be faster', () => {
    const ctx: EvaluationContext = {};
    const complexExpr = 'name.where(use = \'official\').given[0]';
    
    // Warm up and measure first compilation
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      evaluate({}, complexExpr, patient); // New context each time
    }
    const timeWithoutCache = performance.now() - start1;
    
    // Measure with cache
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
      evaluate(ctx, complexExpr, patient); // Same context
    }
    const timeWithCache = performance.now() - start2;
    
    // Cached version should be significantly faster
    console.log(`Without cache: ${timeWithoutCache.toFixed(2)}ms`);
    console.log(`With cache: ${timeWithCache.toFixed(2)}ms`);
    console.log(`Speedup: ${(timeWithoutCache / timeWithCache).toFixed(2)}x`);
    
    expect(timeWithCache).toBeLessThan(timeWithoutCache);
  });

  test('different contexts should have independent caches', () => {
    const ctx1: EvaluationContext = {};
    const ctx2: EvaluationContext = {};
    
    evaluate(ctx1, 'name', patient);
    evaluate(ctx2, 'age', patient);
    
    // Each context has its own cache
    expect(ctx1._cache!.size).toBe(1);
    expect(ctx1._cache!.has('name')).toBe(true);
    expect(ctx1._cache!.has('age')).toBe(false);
    
    expect(ctx2._cache!.size).toBe(1);
    expect(ctx2._cache!.has('age')).toBe(true);
    expect(ctx2._cache!.has('name')).toBe(false);
  });

  test('can pre-populate cache', () => {
    const ctx: EvaluationContext = {
      _cache: new Map()
    };
    
    // Pre-compile some expressions
    const expressions = ['name', 'age', 'resourceType'];
    for (const expr of expressions) {
      evaluate(ctx, expr, {}); // Compile with empty data
    }
    
    expect(ctx._cache.size).toBe(3);
    
    // Now use with real data - should use cached versions
    expect(evaluate(ctx, 'name', patient)).toEqual(patient.name);
    expect(evaluate(ctx, 'age', patient)).toEqual([25]);
    expect(evaluate(ctx, 'resourceType', patient)).toEqual(['Patient']);
  });
});