import { describe, expect, test } from 'bun:test';
import { mod } from '../../../src/functions/math/mod';
import { fhirpath } from '../../../src';

describe('mod() function', () => {
  describe('core function', () => {
    test('calculates modulo for positive numbers', () => {
      expect(mod(10, 3)).toBe(1);
      expect(mod(10, 2)).toBe(0);
      expect(mod(7, 3)).toBe(1);
      expect(mod(1, 2)).toBe(1);
    });
    
    test('handles negative dividend', () => {
      expect(mod(-10, 3)).toBe(-1); // Result has sign of dividend
      expect(mod(-7, 3)).toBe(-1);
      expect(mod(-1, 2)).toBe(-1);
    });
    
    test('handles negative divisor', () => {
      expect(mod(10, -3)).toBe(1);  // Result has sign of dividend (positive)
      expect(mod(7, -3)).toBe(1);
    });
    
    test('handles both negative', () => {
      expect(mod(-10, -3)).toBe(-1); // Result has sign of dividend (negative)
      expect(mod(-7, -3)).toBe(-1);
    });
    
    test('handles decimal inputs', () => {
      expect(mod(10.5, 3)).toBeCloseTo(1.5, 10);
      expect(mod(7.8, 2)).toBeCloseTo(1.8, 10);
    });
    
    test('returns null for null/undefined', () => {
      expect(mod(null, 5)).toBe(null);
      expect(mod(10, null)).toBe(null);
      expect(mod(undefined, 5)).toBe(null);
      expect(mod(10, undefined)).toBe(null);
    });
    
    test('throws for division by zero', () => {
      expect(() => mod(10, 0)).toThrow('Division by zero');
      expect(() => mod(-5, 0)).toThrow('Division by zero');
      expect(() => mod(0, 0)).toThrow('Division by zero');
    });
    
    test('throws for non-numeric inputs', () => {
      expect(() => mod('10' as any, 3)).toThrow('mod() requires numeric inputs');
      expect(() => mod(10, '3' as any)).toThrow('mod() requires numeric inputs');
    });
    
    test('handles edge cases', () => {
      expect(mod(0, 5)).toBe(0);
      expect(mod(-0, 5)).toBe(0); // -0 converted to 0
      expect(mod(5, 5)).toBe(0);
      expect(mod(3, 10)).toBe(3); // When dividend < divisor
    });
  });
  
  describe('FHIRPath integration', () => {
    test('calculates modulo in FHIRPath', () => {
      const result = fhirpath({}, '10.mod(3)');
      expect(result).toEqual([1]);
    });
    
    test('handles negative numbers in FHIRPath', () => {
      const result = fhirpath({}, '(-10).mod(3)');
      expect(result).toEqual([-1]);
    });
    
    test('works with collections', () => {
      const result = fhirpath({}, '(10 | 11 | 12).mod(3)');
      expect(result).toEqual([1, 2, 0]);
    });
    
    test('returns empty for empty collection', () => {
      const result = fhirpath({}, '{}.mod(5)');
      expect(result).toEqual([]);
    });
    
    test('throws for division by zero', () => {
      expect(() => fhirpath({}, '10.mod(0)')).toThrow();
    });
    
    test('handles when dividend is less than divisor', () => {
      const result = fhirpath({}, '3.mod(10)');
      expect(result).toEqual([3]);
    });
  });
});