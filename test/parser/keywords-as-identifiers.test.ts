import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';
import { printAST } from '../../src/index';

describe('Keywords as Identifiers', () => {
  
  describe('Keywords as property names after dot', () => {
    test('should parse "as" as property name', () => {
      const ast = parse('Patient.as');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('as');
      expect(astToString(ast)).toBe('Patient.as');
    });

    test('should parse "is" as property name', () => {
      const ast = parse('value.is');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('is');
    });

    test('should parse "contains" as property name', () => {
      const ast = parse('text.contains');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('contains');
    });

    test('should parse "in" as property name', () => {
      const ast = parse('data.in');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('in');
    });

    test('should parse "and" as property name', () => {
      const ast = parse('logic.and');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('and');
    });

    test('should parse "or" as property name', () => {
      const ast = parse('logic.or');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('or');
    });

    test('should parse "implies" as property name', () => {
      const ast = parse('rule.implies');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('implies');
    });

    test('should parse "div" as property name (already works)', () => {
      const ast = parse('text.div');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('div');
    });

    test('should parse "mod" as property name', () => {
      const ast = parse('math.mod');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('mod');
    });

    test('should parse "where" as property name', () => {
      const ast = parse('query.where');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('where');
    });

    test('should parse "select" as property name', () => {
      const ast = parse('query.select');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('select');
    });

    test('should parse "all" as property name', () => {
      const ast = parse('collection.all');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('all');
    });

    test('should parse "exists" as property name', () => {
      const ast = parse('item.exists');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('exists');
    });

    test('should parse "empty" as property name', () => {
      const ast = parse('collection.empty');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('empty');
    });

    test('should parse "true" as property name', () => {
      const ast = parse('boolean.true');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('true');
    });

    test('should parse "false" as property name', () => {
      const ast = parse('boolean.false');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('false');
    });
  });

  describe('Keywords in complex expressions', () => {
    test('should parse keyword property followed by method call', () => {
      const ast = parse('item.where.count()');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.name).toBe('count');
    });

    test('should parse keyword property in function argument', () => {
      const ast = parse('items.where(type = resource.as)');
      expect(ast.kind).toBe('dot');
      const whereArg = (ast as any).right.args[0];
      expect(whereArg.right.kind).toBe('dot');
      expect(whereArg.right.right.name).toBe('as');
    });

    test('should parse chained keyword properties', () => {
      const ast = parse('data.in.contains');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('contains');
      expect((ast as any).left.right.name).toBe('in');
    });

    test('should parse keyword property with indexer', () => {
      const ast = parse('items.where[0]');
      expect(ast.kind).toBe('indexer');
      expect((ast as any).expr.right.name).toBe('where');
    });
  });

  describe('Edge cases and disambiguation', () => {
    test('should distinguish between keyword as operator and property', () => {
      // As operator
      const ast1 = parse('value as String');
      expect(ast1.kind).toBe('as');
      
      // As property
      const ast2 = parse('value.as');
      expect(ast2.kind).toBe('dot');
      expect((ast2 as any).right.name).toBe('as');
    });

    test('should distinguish between "is" operator and property', () => {
      // Is operator
      const ast1 = parse('value is String');
      expect(ast1.kind).toBe('is');
      
      // Is property
      const ast2 = parse('value.is');
      expect(ast2.kind).toBe('dot');
      expect((ast2 as any).right.name).toBe('is');
    });

    test('should distinguish between "contains" function and property', () => {
      // Contains operator
      const ast1 = parse('collection contains item');
      expect(ast1.kind).toBe('binary');
      expect((ast1 as any).op).toBe(43); // TokenType.CONTAINS
      
      // Contains property
      const ast2 = parse('text.contains');
      expect(ast2.kind).toBe('dot');
      expect((ast2 as any).right.name).toBe('contains');
    });

    test('should handle keywords in qualified identifiers', () => {
      const ast = parse('FHIR.where.type');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('type');
      expect((ast as any).left.right.name).toBe('where');
    });

    test('should still parse keywords as functions when followed by parentheses', () => {
      const ast = parse('collection.where(active = true)');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.name).toBe('where');
    });

    test('should handle keyword at start of expression when valid', () => {
      // Keywords can now be used as identifiers when not in operator context
      const ast1 = parse('where');
      expect(ast1.kind).toBe('identifier');
      expect((ast1 as any).name).toBe('where');
      
      const ast2 = parse('and');
      expect(ast2.kind).toBe('identifier');
      expect((ast2 as any).name).toBe('and');
      
      // These with dot should also work
      const ast3 = parse('where.value');
      expect(ast3.kind).toBe('dot');
      expect((ast3 as any).left.name).toBe('where');
      expect((ast3 as any).right.name).toBe('value');
    });
  });

  describe('Backtick workaround comparison', () => {
    test('should produce same AST with backticks and without for keywords after dot', () => {
      const ast1 = parse('Patient.`as`');
      const ast2 = parse('Patient.as');
      
      expect(ast1.kind).toBe(ast2.kind);
      expect((ast1 as any).right.name).toBe((ast2 as any).right.name);
    });

    test('should parse keywords with and without backticks at expression start', () => {
      // Keywords can now be used without backticks
      const ast1 = parse('where');
      expect(ast1.kind).toBe('identifier');
      expect((ast1 as any).name).toBe('where');
      
      // Backticks still work
      const ast2 = parse('`where`');
      expect(ast2.kind).toBe('identifier');
      expect((ast2 as any).name).toBe('where');
      
      // Both produce the same result
      expect((ast1 as any).name).toBe((ast2 as any).name);
    });
  });

  describe('Real-world examples', () => {
    test('should parse Questionnaire.item.type property', () => {
      const ast = parse('Questionnaire.item.type');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('type');
    });

    test('should parse resource.meta.source property', () => {
      const ast = parse('resource.meta.source');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('source');
    });

    test('should handle FHIR resources with keyword-like properties', () => {
      const ast = parse('Observation.value.as');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('as');
      
      const ast2 = parse('Condition.evidence.code.where');
      expect(ast2.kind).toBe('dot');
      expect((ast2 as any).right.name).toBe('where');
    });
  });
});