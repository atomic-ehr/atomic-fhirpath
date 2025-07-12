import { describe, expect, test } from 'bun:test';
import { sum } from '../../../src/functions/math/sum';
import { fhirpath } from '../../../src';

describe('sum() function', () => {
  describe('core function', () => {
    test('returns 0 for empty array', () => {
      expect(sum([])).toBe(0);
    });
    
    test('sums integers', () => {
      expect(sum([1, 2, 3])).toBe(6);
      expect(sum([10, -5, 15])).toBe(20);
    });
    
    test('sums decimals', () => {
      expect(sum([1.5, 2.5, 3.0])).toBe(7.0);
      expect(sum([0.1, 0.2, 0.3])).toBeCloseTo(0.6, 10);
    });
    
    test('sums mixed integers and decimals', () => {
      expect(sum([1, 2.5, 3])).toBe(6.5);
    });
    
    test('filters out null and undefined', () => {
      expect(sum([1, null, 2, undefined, 3])).toBe(6);
      expect(sum([null, undefined])).toBe(0);
    });
    
    test('throws for non-numeric values', () => {
      expect(() => sum(['string' as any])).toThrow('sum() requires numeric input');
      expect(() => sum([{} as any])).toThrow('sum() requires numeric input');
      expect(() => sum([true as any])).toThrow('sum() requires numeric input');
    });
    
    test('handles negative numbers', () => {
      expect(sum([-1, -2, -3])).toBe(-6);
      expect(sum([5, -10, 3])).toBe(-2);
    });
    
    test('handles large numbers', () => {
      expect(sum([1e10, 2e10, 3e10])).toBe(6e10);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('sums integers in FHIRPath', () => {
      const result = fhirpath({}, '(1 | 2 | 3).sum()');
      expect(result).toEqual([6]);
    });
    
    test('sums decimals in FHIRPath', () => {
      const result = fhirpath({}, '(1.5 | 2.5 | 3.0).sum()');
      expect(result).toEqual([7.0]);
    });
    
    test('returns 0 for empty collection', () => {
      const result = fhirpath({}, '{}.sum()');
      expect(result).toEqual([0]);
    });
    
    test('works with data paths', () => {
      const data = {
        values: [10, 20, 30]
      };
      const result = fhirpath({}, 'values.sum()', data);
      expect(result).toEqual([60]);
    });
    
    test('filters nulls in collections', () => {
      const data = {
        values: [1, null, 2, null, 3]
      };
      const result = fhirpath({}, 'values.sum()', data);
      expect(result).toEqual([6]);
    });
  });
});