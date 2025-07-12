import { describe, expect, test } from 'bun:test';
import { value } from '../../../src/functions/math/value';
import { fhirpath } from '../../../src';

describe('value() function', () => {
  describe('core function', () => {
    test('extracts value from Quantity object', () => {
      expect(value({ value: 5.0, unit: 'mg' })).toBe(5.0);
      expect(value({ value: 10, unit: 'kg' })).toBe(10);
      expect(value({ value: 3.14, code: 'mm' })).toBe(3.14);
    });
    
    test('handles string values in Quantity', () => {
      expect(value({ value: '5.0', unit: 'mg' })).toBe(5.0);
      expect(value({ value: '10', unit: 'kg' })).toBe(10);
      expect(value({ value: '3.14', code: 'mm' })).toBe(3.14);
    });
    
    test('returns null for non-Quantity types', () => {
      expect(value(5)).toBe(null);
      expect(value('string')).toBe(null);
      expect(value(true)).toBe(null);
      expect(value([])).toBe(null);
      expect(value({})).toBe(null); // Object without 'value' property
    });
    
    test('returns null for null/undefined', () => {
      expect(value(null)).toBe(null);
      expect(value(undefined)).toBe(null);
    });
    
    test('handles invalid string values', () => {
      expect(value({ value: 'not-a-number', unit: 'mg' })).toBe(null);
      expect(value({ value: 'abc123', unit: 'kg' })).toBe(null);
    });
    
    test('handles negative values', () => {
      expect(value({ value: -5.0, unit: 'mg' })).toBe(-5.0);
      expect(value({ value: '-10', unit: 'kg' })).toBe(-10);
    });
    
    test('handles zero', () => {
      expect(value({ value: 0, unit: 'mg' })).toBe(0);
      expect(value({ value: '0', unit: 'kg' })).toBe(0);
    });
    
    test('preserves decimal precision', () => {
      expect(value({ value: 1.23456789, unit: 'mg' })).toBe(1.23456789);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('extracts value from Quantity in FHIRPath', () => {
      const data = {
        dose: { value: 5.0, unit: 'mg' }
      };
      const result = fhirpath({}, 'dose.value()', data);
      expect(result).toEqual([5.0]);
    });
    
    test('works with collections of Quantities', () => {
      const data = {
        doses: [
          { value: 5.0, unit: 'mg' },
          { value: 10.0, unit: 'mg' },
          { value: 15.0, unit: 'mg' }
        ]
      };
      const result = fhirpath({}, 'doses.value()', data);
      expect(result).toEqual([5.0, 10.0, 15.0]);
    });
    
    test('returns empty for non-Quantity types', () => {
      const result = fhirpath({}, '5.value()');
      expect(result).toEqual([]);
      
      const result2 = fhirpath({}, "'string'.value()");
      expect(result2).toEqual([]);
    });
    
    test('filters out non-Quantities in mixed collections', () => {
      const data = {
        mixed: [
          { value: 5.0, unit: 'mg' },
          10,
          { value: 15.0, unit: 'mg' },
          'string'
        ]
      };
      const result = fhirpath({}, 'mixed.value()', data);
      expect(result).toEqual([5.0, 15.0]);
    });
    
    test('handles empty collections', () => {
      const result = fhirpath({}, '{}.value()');
      expect(result).toEqual([]);
    });
    
    test('works with string values', () => {
      const data = {
        dose: { value: '25.5', unit: 'mg' }
      };
      const result = fhirpath({}, 'dose.value()', data);
      expect(result).toEqual([25.5]);
    });
  });
});