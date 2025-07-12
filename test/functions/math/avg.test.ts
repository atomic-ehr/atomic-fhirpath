import { describe, expect, test } from 'bun:test';
import { avg } from '../../../src/functions/math/avg';
import { fhirpath } from '../../../src';

describe('avg() function', () => {
  describe('core function', () => {
    test('returns null for empty array', () => {
      expect(avg([])).toBe(null);
    });
    
    test('calculates average of integers', () => {
      expect(avg([1, 2, 3])).toBe(2);
      expect(avg([10, 20, 30])).toBe(20);
      expect(avg([5])).toBe(5);
    });
    
    test('calculates average of decimals', () => {
      expect(avg([1.5, 2.5, 3.5])).toBe(2.5);
      expect(avg([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 10);
    });
    
    test('calculates average of mixed integers and decimals', () => {
      expect(avg([1, 2.5, 4])).toBe(2.5);
      expect(avg([10, 15])).toBe(12.5);
    });
    
    test('filters out null and undefined', () => {
      expect(avg([1, null, 3, undefined, 5])).toBe(3);
      expect(avg([null, undefined])).toBe(null);
    });
    
    test('throws for non-numeric values', () => {
      expect(() => avg(['string' as any])).toThrow('avg() requires numeric input');
      expect(() => avg([{} as any])).toThrow('avg() requires numeric input');
      expect(() => avg([true as any])).toThrow('avg() requires numeric input');
    });
    
    test('handles negative numbers', () => {
      expect(avg([-1, -2, -3])).toBe(-2);
      expect(avg([5, -5, 10])).toBeCloseTo(3.333333, 5);
    });
    
    test('handles large numbers', () => {
      expect(avg([1e10, 2e10, 3e10])).toBe(2e10);
    });
    
    test('returns integer when appropriate', () => {
      expect(avg([2, 4, 6])).toBe(4); // All integers, result is whole
      expect(Number.isInteger(avg([2, 4, 6]))).toBe(true);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('calculates average in FHIRPath', () => {
      const result = fhirpath({}, '(1 | 2 | 3).avg()');
      expect(result).toEqual([2]);
    });
    
    test('calculates average of decimals in FHIRPath', () => {
      const result = fhirpath({}, '(1.5 | 2.5 | 3.5).avg()');
      expect(result).toEqual([2.5]);
    });
    
    test('returns empty for empty collection', () => {
      const result = fhirpath({}, '{}.avg()');
      expect(result).toEqual([]);
    });
    
    test('works with data paths', () => {
      const data = {
        values: [10, 20, 30]
      };
      const result = fhirpath({}, 'values.avg()', data);
      expect(result).toEqual([20]);
    });
    
    test('filters nulls in collections', () => {
      const data = {
        values: [2, null, 4, null, 6]
      };
      const result = fhirpath({}, 'values.avg()', data);
      expect(result).toEqual([4]);
    });
    
    test('handles single value', () => {
      const result = fhirpath({}, '42.avg()');
      expect(result).toEqual([42]);
    });
  });
});