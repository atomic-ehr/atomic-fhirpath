import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';
import { TokenType } from '../../src/types';

describe('Missing Features from ANTLR Grammar', () => {
  
  describe('Equivalence operators', () => {
    test('should parse ~ (equivalence) operator', () => {
      const ast = parse('a ~ b');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.EQUIVALENCE);
      expect((ast as any).left.name).toBe('a');
      expect((ast as any).right.name).toBe('b');
    });

    test('should parse !~ (not equivalent) operator', () => {
      const ast = parse('value !~ other');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.NOT_EQUIVALENCE);
      expect((ast as any).left.name).toBe('value');
      expect((ast as any).right.name).toBe('other');
    });

    test('equivalence should have same precedence as equality', () => {
      // Since = and ~ have the same precedence and are left-associative,
      // a = b ~ c should parse as (a = b) ~ c
      const ast = parse('a = b ~ c');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.EQUIVALENCE);
      expect((ast as any).left.kind).toBe('binary');
      expect((ast as any).left.op).toBe(TokenType.EQUALS);
      expect((ast as any).left.left.name).toBe('a');
      expect((ast as any).left.right.name).toBe('b');
      expect((ast as any).right.name).toBe('c');
    });
  });

  describe('Null literal', () => {
    test('should parse {} as null literal', () => {
      const ast = parse('{}');
      expect(ast.kind).toBe('null');
    });

    test('should use null literal in expressions', () => {
      const ast = parse('value = {}');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.EQUALS);
      expect((ast as any).left.name).toBe('value');
      expect((ast as any).right.kind).toBe('null');
    });

    test('should parse empty() != {}', () => {
      const ast = parse('empty() != {}');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.NOT_EQUALS);
      expect((ast as any).left.kind).toBe('function');
      expect((ast as any).left.name).toBe('empty');
      expect((ast as any).right.kind).toBe('null');
    });
  });

  describe('Long numbers', () => {
    test('should parse long integer with L suffix', () => {
      const ast = parse('12345L');
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe(12345);
      expect((ast as any).dataType).toBe('number');
    });

    test('should parse long integer with lowercase l suffix', () => {
      const ast = parse('99999l');
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe(99999);
    });

    test('should use long numbers in expressions', () => {
      const ast = parse('count > 1000000L');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.GREATER_THAN);
      expect((ast as any).right.value).toBe(1000000);
    });
  });

  describe('$total variable', () => {
    test('should parse $total special variable', () => {
      const ast = parse('$total');
      expect(ast.kind).toBe('variable');
      expect((ast as any).name).toBe('total');
    });

    test('should use $total in expressions', () => {
      const ast = parse('$index < $total');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.LESS_THAN);
      expect((ast as any).left.kind).toBe('variable');
      expect((ast as any).left.name).toBe('index');
      expect((ast as any).right.kind).toBe('variable');
      expect((ast as any).right.name).toBe('total');
    });

    test('should use $total in function calls', () => {
      const ast = parse("iif($index = $total - 1, 'last', 'not last')");
      expect(ast.kind).toBe('function');
      expect((ast as any).name).toBe('iif');
      expect((ast as any).args[0].kind).toBe('binary');
    });
  });

  describe('Qualified type specifiers', () => {
    test('should parse qualified type in is expression', () => {
      const ast = parse('value is FHIR.Observation');
      expect(ast.kind).toBe('is');
      expect((ast as any).expression.name).toBe('value');
      expect((ast as any).targetType).toBe('FHIR.Observation');
    });

    test('should parse multi-level qualified type', () => {
      const ast = parse('component as FHIR.Observation.Component');
      expect(ast.kind).toBe('as');
      expect((ast as any).expression.name).toBe('component');
      expect((ast as any).targetType).toBe('FHIR.Observation.Component');
    });

    test('should handle qualified types with multiple dots', () => {
      const ast = parse('resource is System.FHIR.R4.Patient');
      expect(ast.kind).toBe('is');
      expect((ast as any).targetType).toBe('System.FHIR.R4.Patient');
    });
  });

  describe('Operator precedence fixes', () => {
    test('implies should have lowest precedence', () => {
      // a or b implies c should parse as (a or b) implies c
      const ast = parse('a or b implies c');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.IMPLIES);
      expect((ast as any).left.kind).toBe('binary');
      expect((ast as any).left.op).toBe(TokenType.OR);
    });

    test('implies should be lower than and', () => {
      // a and b implies c should parse as (a and b) implies c
      const ast = parse('a and b implies c');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.IMPLIES);
      expect((ast as any).left.kind).toBe('binary');
      expect((ast as any).left.op).toBe(TokenType.AND);
    });

    test('complex precedence test', () => {
      // a = b and c != d implies e or f
      // should parse as ((a = b) and (c != d)) implies (e or f)
      const ast = parse('a = b and c != d implies e or f');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.IMPLIES);
      
      // Left side: (a = b) and (c != d)
      expect((ast as any).left.kind).toBe('binary');
      expect((ast as any).left.op).toBe(TokenType.AND);
      
      // Right side: e or f
      expect((ast as any).right.kind).toBe('binary');
      expect((ast as any).right.op).toBe(TokenType.OR);
    });
  });

  describe('Complex expressions with new features', () => {
    test('should parse expression with multiple new features', () => {
      const ast = parse('value !~ {} and count > 100L implies resource is FHIR.Bundle');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.IMPLIES);
    });

    test('should handle $total with qualified types', () => {
      const ast = parse('$index = $total - 1 and item is FHIR.Observation');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.AND);
    });

    test('should parse equivalence with null literal', () => {
      const ast = parse('(value ~ {}) != true');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.NOT_EQUALS);
      expect((ast as any).left.kind).toBe('binary');
      expect((ast as any).left.op).toBe(TokenType.EQUIVALENCE);
      expect((ast as any).left.right.kind).toBe('null');
    });
  });
});

describe('Edge cases for new features', () => {
  test('should handle {} in function arguments', () => {
    const ast = parse("iif(value = {}, 'empty', 'not empty')");
    expect(ast.kind).toBe('function');
    expect((ast as any).args[0].kind).toBe('binary');
    expect((ast as any).args[0].right.kind).toBe('null');
  });

  test('should handle long numbers in quantities', () => {
    // This should parse as long number, not quantity
    const ast = parse('1000L');
    expect(ast.kind).toBe('literal');
    expect((ast as any).dataType).toBe('number');
    expect((ast as any).value).toBe(1000);
  });

  test('should distinguish L suffix from identifiers', () => {
    // This should be number followed by identifier, not long number
    // Actually, this would be a tokenization error as there's no space
    expect(() => parse('123Labs')).toThrow();
  });
});