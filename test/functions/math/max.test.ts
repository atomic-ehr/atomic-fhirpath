import { describe, expect, test } from 'bun:test';
import { max } from '../../../src/functions/math/max';
import { fhirpath } from '../../../src';

describe('max() function', () => {
  describe('core function', () => {
    test('returns null for empty array', () => {
      expect(max([])).toBe(null);
    });
    
    test('finds maximum of integers', () => {
      expect(max([3, 1, 4, 1, 5])).toBe(5);
      expect(max([10, -5, 15])).toBe(15);
      expect(max([42])).toBe(42);
    });
    
    test('finds maximum of decimals', () => {
      expect(max([3.5, 1.2, 4.8])).toBe(4.8);
      expect(max([0.1, 0.2, 0.05])).toBe(0.2);
    });
    
    test('finds maximum of mixed integers and decimals', () => {
      expect(max([3, 1.5, 4])).toBe(4);
      expect(max([1.0, 2, 2.5])).toBe(2.5);
    });
    
    test('filters out null and undefined', () => {
      expect(max([3, null, 5, undefined, 1])).toBe(5);
      expect(max([null, undefined])).toBe(null);
    });
    
    test('throws for non-numeric values', () => {
      expect(() => max(['string' as any])).toThrow('max() requires numeric input');
      expect(() => max([{} as any])).toThrow('max() requires numeric input');
      expect(() => max([true as any])).toThrow('max() requires numeric input');
    });
    
    test('handles negative numbers', () => {
      expect(max([-1, -2, -3])).toBe(-1);
      expect(max([5, -10, 3])).toBe(5);
    });
    
    test('handles edge cases', () => {
      expect(max([Infinity, 1, 2])).toBe(Infinity);
      expect(max([-Infinity, 1, 2])).toBe(2);
      expect(max([0, -0])).toBe(0); // 0 is greater than -0 in JS
    });
  });
  
  describe('FHIRPath integration', () => {
    test('finds maximum in FHIRPath', () => {
      const result = fhirpath({}, '(3 | 1 | 4 | 1 | 5).max()');
      expect(result).toEqual([5]);
    });
    
    test('finds maximum of decimals in FHIRPath', () => {
      const result = fhirpath({}, '(3.5 | 1.2 | 4.8).max()');
      expect(result).toEqual([4.8]);
    });
    
    test('returns empty for empty collection', () => {
      const result = fhirpath({}, '{}.max()');
      expect(result).toEqual([]);
    });
    
    test('works with data paths', () => {
      const data = {
        values: [10, 5, 20, 3]
      };
      const result = fhirpath({}, 'values.max()', data);
      expect(result).toEqual([20]);
    });
    
    test('filters nulls in collections', () => {
      const data = {
        values: [5, null, 8, null, 2]
      };
      const result = fhirpath({}, 'values.max()', data);
      expect(result).toEqual([8]);
    });
    
    test('handles single value', () => {
      const result = fhirpath({}, '42.max()');
      expect(result).toEqual([42]);
    });
  });
});