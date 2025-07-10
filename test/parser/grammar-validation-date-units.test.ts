import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';

describe('Grammar Validation: Date Units', () => {
  
  describe('Valid dateTimePrecision (singular)', () => {
    const validSingular = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];
    
    validSingular.forEach(unit => {
      test(`should parse '1 ${unit}' as quantity`, () => {
        const ast = parse(`1 ${unit}`);
        expect(ast.kind).toBe('literal');
        expect((ast as any).dataType).toBe('quantity');
        expect((ast as any).value).toBe(`1 ${unit}`);
      });
    });
  });

  describe('Valid pluralDateTimePrecision', () => {
    const validPlural = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];
    
    validPlural.forEach(unit => {
      test(`should parse '5 ${unit}' as quantity`, () => {
        const ast = parse(`5 ${unit}`);
        expect(ast.kind).toBe('literal');
        expect((ast as any).dataType).toBe('quantity');
        expect((ast as any).value).toBe(`5 ${unit}`);
      });
    });
  });

  describe('Invalid abbreviated units (not in grammar)', () => {
    // These abbreviations are NOT in the ANTLR grammar
    // They should either:
    // 1. Be parsed as quoted units: 5 'ms'
    // 2. Throw an error for unquoted usage
    const invalidAbbreviations = [
      { abbr: 'ms', desc: 'milliseconds abbreviation' },
      { abbr: 's', desc: 'seconds abbreviation' },
      { abbr: 'min', desc: 'minutes abbreviation' },
      { abbr: 'h', desc: 'hours abbreviation' },
      { abbr: 'd', desc: 'days abbreviation' },
      { abbr: 'wk', desc: 'weeks abbreviation' },
      { abbr: 'mo', desc: 'months abbreviation' },
      { abbr: 'a', desc: 'years abbreviation (annum)' }
    ];
    
    invalidAbbreviations.forEach(({ abbr, desc }) => {
      test(`should NOT parse '5 ${abbr}' as hardcoded unit (${desc})`, () => {
        // According to grammar, abbreviated units should not be hardcoded
        // They should either require quotes or throw an error
        expect(() => parse(`5 ${abbr}`)).toThrow();
      });
      
      test(`should parse '5 '${abbr}'' as quoted unit (${desc})`, () => {
        const ast = parse(`5 '${abbr}'`);
        expect(ast.kind).toBe('literal');
        expect((ast as any).dataType).toBe('quantity');
        expect((ast as any).value).toBe(`5 '${abbr}'`);
      });
    });
  });

  describe('Grammar compliance edge cases', () => {
    test('should only recognize exact unit names from grammar', () => {
      // Valid according to grammar
      expect(() => parse('1 year')).not.toThrow();
      expect(() => parse('2 years')).not.toThrow();
      
      // Invalid - not in grammar
      expect(() => parse('1 yr')).toThrow();
      expect(() => parse('1 y')).toThrow();
      expect(() => parse('1 YEAR')).toThrow(); // case sensitive
    });
    
    test('should handle unit without number correctly', () => {
      // Standalone unit should be identifier, not quantity
      const ast = parse('year');
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('year');
    });
  });

  describe('UCUM units (quoted)', () => {
    test('should parse UCUM units with quotes', () => {
      const ucumUnits = ['mg', 'kg', 'ml', 'cm', 'mm', '[in_i]', 'cel'];
      
      ucumUnits.forEach(unit => {
        const ast = parse(`5 '${unit}'`);
        expect(ast.kind).toBe('literal');
        expect((ast as any).dataType).toBe('quantity');
        expect((ast as any).value).toBe(`5 '${unit}'`);
      });
    });
  });

  describe('Complete grammar rule validation', () => {
    test('quantity rule: NUMBER unit?', () => {
      // NUMBER alone (no unit)
      const ast1 = parse('42');
      expect(ast1.kind).toBe('literal');
      expect((ast1 as any).dataType).toBe('number');
      
      // NUMBER with dateTimePrecision
      const ast2 = parse('1 day');
      expect(ast2.kind).toBe('literal');
      expect((ast2 as any).dataType).toBe('quantity');
      
      // NUMBER with pluralDateTimePrecision
      const ast3 = parse('7 days');
      expect(ast3.kind).toBe('literal');
      expect((ast3 as any).dataType).toBe('quantity');
      
      // NUMBER with STRING (quoted unit)
      const ast4 = parse("5 'kg'");
      expect(ast4.kind).toBe('literal');
      expect((ast4 as any).dataType).toBe('quantity');
    });
  });
});