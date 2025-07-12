import { describe, expect, test } from 'bun:test';
import { div } from '../../../src/functions/math/div';
import { fhirpath } from '../../../src';

describe('div() function', () => {
  describe('core function', () => {
    test('performs integer division', () => {
      expect(div(10, 3)).toBe(3);
      expect(div(10, 2)).toBe(5);
      expect(div(7, 2)).toBe(3);
      expect(div(1, 2)).toBe(0);
    });
    
    test('handles negative numbers', () => {
      expect(div(-10, 3)).toBe(-3);
      expect(div(10, -3)).toBe(-3);
      expect(div(-10, -3)).toBe(3);
    });
    
    test('truncates towards zero', () => {
      expect(div(7, 3)).toBe(2);  // 2.333... -> 2
      expect(div(-7, 3)).toBe(-2); // -2.333... -> -2 (not -3)
      expect(div(7, -3)).toBe(-2); // -2.333... -> -2
    });
    
    test('handles decimal inputs', () => {
      expect(div(10.5, 3.2)).toBe(3); // 3.28... -> 3
      expect(div(7.8, 2.1)).toBe(3);  // 3.71... -> 3
    });
    
    test('returns null for null/undefined', () => {
      expect(div(null, 5)).toBe(null);
      expect(div(10, null)).toBe(null);
      expect(div(undefined, 5)).toBe(null);
      expect(div(10, undefined)).toBe(null);
    });
    
    test('throws for division by zero', () => {
      expect(() => div(10, 0)).toThrow('Division by zero');
      expect(() => div(-5, 0)).toThrow('Division by zero');
      expect(() => div(0, 0)).toThrow('Division by zero');
    });
    
    test('throws for non-numeric inputs', () => {
      expect(() => div('10' as any, 3)).toThrow('div() requires numeric inputs');
      expect(() => div(10, '3' as any)).toThrow('div() requires numeric inputs');
    });
    
    test('handles edge cases', () => {
      expect(div(0, 5)).toBe(0);
      expect(div(-0, 5)).toBe(0); // -0 converted to 0
      expect(div(Infinity, 5)).toBe(Infinity);
      expect(div(-Infinity, 5)).toBe(-Infinity);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('performs division in FHIRPath', () => {
      const result = fhirpath({}, '10.div(3)');
      expect(result).toEqual([3]);
    });
    
    test('handles negative numbers in FHIRPath', () => {
      const result = fhirpath({}, '(-10).div(3)');
      expect(result).toEqual([-3]);
    });
    
    test('works with collections', () => {
      const result = fhirpath({}, '(10 | 20 | 7).div(3)');
      expect(result).toEqual([3, 6, 2]);
    });
    
    test('handles decimal inputs', () => {
      const result = fhirpath({}, '10.5.div(3.2)');
      expect(result).toEqual([3]);
    });
    
    test('returns empty for empty collection', () => {
      const result = fhirpath({}, '{}.div(5)');
      expect(result).toEqual([]);
    });
    
    test('throws for division by zero', () => {
      expect(() => fhirpath({}, '10.div(0)')).toThrow();
    });
  });
});