import { describe, expect, test } from 'bun:test';
import { min } from '../../../src/functions/math/min';
import { fhirpath } from '../../../src';

describe('min() function', () => {
  describe('core function', () => {
    test('returns null for empty array', () => {
      expect(min([])).toBe(null);
    });
    
    test('finds minimum of integers', () => {
      expect(min([3, 1, 4, 1, 5])).toBe(1);
      expect(min([10, -5, 15])).toBe(-5);
      expect(min([42])).toBe(42);
    });
    
    test('finds minimum of decimals', () => {
      expect(min([3.5, 1.2, 4.8])).toBe(1.2);
      expect(min([0.1, 0.2, 0.05])).toBe(0.05);
    });
    
    test('finds minimum of mixed integers and decimals', () => {
      expect(min([3, 1.5, 4])).toBe(1.5);
      expect(min([1.0, 2, 0.5])).toBe(0.5);
    });
    
    test('filters out null and undefined', () => {
      expect(min([3, null, 1, undefined, 5])).toBe(1);
      expect(min([null, undefined])).toBe(null);
    });
    
    test('throws for non-numeric values', () => {
      expect(() => min(['string' as any])).toThrow('min() requires numeric input');
      expect(() => min([{} as any])).toThrow('min() requires numeric input');
      expect(() => min([true as any])).toThrow('min() requires numeric input');
    });
    
    test('handles negative numbers', () => {
      expect(min([-1, -2, -3])).toBe(-3);
      expect(min([5, -10, 3])).toBe(-10);
    });
    
    test('handles edge cases', () => {
      expect(min([Infinity, 1, 2])).toBe(1);
      expect(min([-Infinity, 1, 2])).toBe(-Infinity);
      // Note: min([0, -0]) could return either 0 or -0 since they're equal
      const result = min([0, -0]);
      expect(result === 0 || Object.is(result, -0)).toBe(true);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('finds minimum in FHIRPath', () => {
      const result = fhirpath({}, '(3 | 1 | 4 | 1 | 5).min()');
      expect(result).toEqual([1]);
    });
    
    test('finds minimum of decimals in FHIRPath', () => {
      const result = fhirpath({}, '(3.5 | 1.2 | 4.8).min()');
      expect(result).toEqual([1.2]);
    });
    
    test('returns empty for empty collection', () => {
      const result = fhirpath({}, '{}.min()');
      expect(result).toEqual([]);
    });
    
    test('works with data paths', () => {
      const data = {
        values: [10, 5, 20, 3]
      };
      const result = fhirpath({}, 'values.min()', data);
      expect(result).toEqual([3]);
    });
    
    test('filters nulls in collections', () => {
      const data = {
        values: [5, null, 2, null, 8]
      };
      const result = fhirpath({}, 'values.min()', data);
      expect(result).toEqual([2]);
    });
    
    test('handles single value', () => {
      const result = fhirpath({}, '42.min()');
      expect(result).toEqual([42]);
    });
  });
});