import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';
import { TokenType } from '../../src/types';

describe('Date Hardcoded Units', () => {
  
  describe('Singular date units', () => {
    test('should parse year unit', () => {
      const ast = parse('1 year');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 year');
    });

    test('should parse month unit', () => {
      const ast = parse('1 month');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 month');
    });

    test('should parse week unit', () => {
      const ast = parse('1 week');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 week');
    });

    test('should parse day unit', () => {
      const ast = parse('1 day');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 day');
    });

    test('should parse hour unit', () => {
      const ast = parse('1 hour');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 hour');
    });

    test('should parse minute unit', () => {
      const ast = parse('1 minute');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 minute');
    });

    test('should parse second unit', () => {
      const ast = parse('1 second');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 second');
    });

    test('should parse millisecond unit', () => {
      const ast = parse('1 millisecond');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1 millisecond');
    });
  });

  describe('Plural date units', () => {
    test('should parse years unit', () => {
      const ast = parse('5 years');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('5 years');
    });

    test('should parse months unit', () => {
      const ast = parse('3 months');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('3 months');
    });

    test('should parse weeks unit', () => {
      const ast = parse('2 weeks');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('2 weeks');
    });

    test('should parse days unit', () => {
      const ast = parse('10 days');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('10 days');
    });

    test('should parse hours unit', () => {
      const ast = parse('24 hours');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('24 hours');
    });

    test('should parse minutes unit', () => {
      const ast = parse('30 minutes');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('30 minutes');
    });

    test('should parse seconds unit', () => {
      const ast = parse('60 seconds');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('60 seconds');
    });

    test('should parse milliseconds unit', () => {
      const ast = parse('500 milliseconds');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('500 milliseconds');
    });
  });

  describe('Date units with decimals', () => {
    test('should parse decimal years', () => {
      const ast = parse('1.5 years');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('1.5 years');
    });

    test('should parse decimal months', () => {
      const ast = parse('2.5 months');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('2.5 months');
    });

    test('should parse decimal days', () => {
      const ast = parse('0.5 days');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('0.5 days');
    });
  });

  describe('Date units in expressions', () => {
    test('should use date units in arithmetic', () => {
      const ast = parse('today() + 5 days');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.PLUS);
      expect((ast as any).right.kind).toBe('literal');
      expect((ast as any).right.dataType).toBe('quantity');
      expect((ast as any).right.value).toBe('5 days');
    });

    test('should use date units in subtraction', () => {
      const ast = parse('birthDate + 18 years');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.PLUS);
      expect((ast as any).left.name).toBe('birthDate');
      expect((ast as any).right.value).toBe('18 years');
    });

    test('should use date units in comparisons', () => {
      const ast = parse('dateTime < now() - 2 hours');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.LESS_THAN);
    });

    test('should parse complex date calculations', () => {
      const ast = parse('birthDate < today() - 18 years');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.LESS_THAN);
      expect((ast as any).right.kind).toBe('binary');
      expect((ast as any).right.op).toBe(TokenType.MINUS);
      expect((ast as any).right.right.value).toBe('18 years');
    });
  });

  describe('Edge cases', () => {
    test('should not parse standalone date units as identifiers', () => {
      // Standalone 'years' should be an identifier, not a quantity
      const ast = parse('years');
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('years');
    });

    test('should parse date units only after numbers', () => {
      // 'x years' where x is an identifier should not be a quantity
      // This will throw because 'years' is not a valid continuation
      expect(() => parse('x years')).toThrow();
    });

    test('should handle zero with date units', () => {
      const ast = parse('0 days');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe('0 days');
    });

    test('should handle negative numbers with date units', () => {
      const ast = parse('-5 days');
      expect(ast.kind).toBe('unary');
      expect((ast as any).op).toBe(TokenType.MINUS);
      expect((ast as any).operand.kind).toBe('literal');
      expect((ast as any).operand.dataType).toBe('quantity');
      expect((ast as any).operand.value).toBe('5 days');
    });
  });

  describe('Date units vs quoted units', () => {
    test('should distinguish between date units and quoted units', () => {
      // Date unit (no quotes)
      const ast1 = parse('5 days');
      expect(ast1.kind).toBe('literal');
      expect((ast1 as any).dataType).toBe('quantity');
      expect((ast1 as any).value).toBe('5 days');

      // Quoted unit
      const ast2 = parse("5 'days'");
      expect(ast2.kind).toBe('literal');
      expect((ast2 as any).dataType).toBe('quantity');
      expect((ast2 as any).value).toBe("5 'days'");
    });

    test('should not treat non-date units as hardcoded', () => {
      // 'meters' is not a date unit, so this should parse differently
      expect(() => parse('5 meters')).toThrow();
    });
  });

  describe('AST string representation', () => {
    test('should correctly represent date units in astToString', () => {
      const ast = parse('5 years');
      expect(astToString(ast)).toBe('5 years');
    });

    test('should correctly represent complex expressions with date units', () => {
      const ast = parse('today() + 30 days');
      expect(astToString(ast)).toContain('30 days');
    });
  });

  describe('Abbreviated units require quotes (per ANTLR grammar)', () => {
    test('should require quotes for ms (milliseconds)', () => {
      expect(() => parse('100 ms')).toThrow();
      const ast = parse("100 'ms'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("100 'ms'");
    });

    test('should require quotes for s (seconds)', () => {
      expect(() => parse('30 s')).toThrow();
      const ast = parse("30 's'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("30 's'");
    });

    test('should require quotes for min (minutes)', () => {
      expect(() => parse('15 min')).toThrow();
      const ast = parse("15 'min'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("15 'min'");
    });

    test('should require quotes for h (hours)', () => {
      expect(() => parse('2 h')).toThrow();
      const ast = parse("2 'h'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("2 'h'");
    });

    test('should require quotes for d (days)', () => {
      expect(() => parse('7 d')).toThrow();
      const ast = parse("7 'd'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("7 'd'");
    });

    test('should require quotes for wk (weeks)', () => {
      expect(() => parse('4 wk')).toThrow();
      const ast = parse("4 'wk'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("4 'wk'");
    });

    test('should require quotes for mo (months)', () => {
      expect(() => parse('6 mo')).toThrow();
      const ast = parse("6 'mo'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("6 'mo'");
    });

    test('should require quotes for a (years/annum)', () => {
      expect(() => parse('1 a')).toThrow();
      const ast = parse("1 'a'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("1 'a'");
    });
  });
});