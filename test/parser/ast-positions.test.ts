import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';

describe('AST Position Tracking', () => {
  
  describe('Simple expressions', () => {
    test('should track position for identifier', () => {
      const input = 'Patient';
      const ast = parse(input);
      expect(ast.kind).toBe('identifier');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(7);
      expect(input.substring(ast.start, ast.end)).toBe('Patient');
    });

    test('should track position for number literal', () => {
      const input = '42';
      const ast = parse(input);
      expect(ast.kind).toBe('literal');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(2);
      expect(input.substring(ast.start, ast.end)).toBe('42');
    });

    test('should track position for string literal', () => {
      const input = "'hello world'";
      const ast = parse(input);
      expect(ast.kind).toBe('literal');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(13);
      expect(input.substring(ast.start, ast.end)).toBe("'hello world'");
    });

    test('should track position for boolean literal', () => {
      const input = 'true';
      const ast = parse(input);
      expect(ast.kind).toBe('literal');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(4);
      expect(input.substring(ast.start, ast.end)).toBe('true');
    });

    test('should track position for date literal', () => {
      const input = '@2023-01-15';
      const ast = parse(input);
      expect(ast.kind).toBe('literal');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(11);
      expect(input.substring(ast.start, ast.end)).toBe('@2023-01-15');
    });

    test('should track position for quantity literal', () => {
      const input = "5 'mg'";
      const ast = parse(input);
      expect(ast.kind).toBe('literal');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(6);
      expect(input.substring(ast.start, ast.end)).toBe("5 'mg'");
    });

    test('should track position for null literal', () => {
      const input = '{}';
      const ast = parse(input);
      expect(ast.kind).toBe('null');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(2);
      expect(input.substring(ast.start, ast.end)).toBe('{}');
    });
  });

  describe('Binary expressions', () => {
    test('should track positions in binary expression', () => {
      const input = '5 + 3';
      const ast = parse(input);
      expect(ast.kind).toBe('binary');
      
      // Check the entire expression
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(5);
      expect(input.substring(ast.start, ast.end)).toBe('5 + 3');
      
      // Check left operand
      expect((ast as any).left.start).toBe(0);
      expect((ast as any).left.end).toBe(1);
      expect(input.substring((ast as any).left.start, (ast as any).left.end)).toBe('5');
      
      // Check right operand
      expect((ast as any).right.start).toBe(4);
      expect((ast as any).right.end).toBe(5);
      expect(input.substring((ast as any).right.start, (ast as any).right.end)).toBe('3');
    });

    test('should track positions with multiple operators', () => {
      const input = '1 + 2 * 3';
      const ast = parse(input);
      expect(ast.kind).toBe('binary');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(9);
      expect(input.substring(ast.start, ast.end)).toBe('1 + 2 * 3');
    });
  });

  describe('Dot expressions', () => {
    test('should track positions in dot expression', () => {
      const input = 'Patient.name';
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(12);
      
      // Check left side
      expect((ast as any).left.start).toBe(0);
      expect((ast as any).left.end).toBe(7);
      expect(input.substring((ast as any).left.start, (ast as any).left.end)).toBe('Patient');
      
      // Check right side
      expect((ast as any).right.start).toBe(8);
      expect((ast as any).right.end).toBe(12);
      expect(input.substring((ast as any).right.start, (ast as any).right.end)).toBe('name');
    });

    test('should track positions in chained dot expression', () => {
      const input = 'Patient.name.given';
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(18);
      expect(input.substring(ast.start, ast.end)).toBe('Patient.name.given');
    });
  });

  describe('Function calls', () => {
    test('should track positions in function call without args', () => {
      const input = 'exists()';
      const ast = parse(input);
      expect(ast.kind).toBe('function');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(8);
      expect(input.substring(ast.start, ast.end)).toBe('exists()');
    });

    test('should track positions in function call with args', () => {
      const input = 'where(use = "official")';
      const ast = parse(input);
      expect(ast.kind).toBe('function');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(23);
      expect(input.substring(ast.start, ast.end)).toBe('where(use = "official")');
      
      // Check the argument
      const arg = (ast as any).args[0];
      expect(arg.start).toBe(6);
      expect(arg.end).toBe(22);
      expect(input.substring(arg.start, arg.end)).toBe('use = "official"');
    });

    test('should track positions in method call', () => {
      const input = 'Patient.name.exists()';
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(21);
      
      // Check the function part
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.start).toBe(13);
      expect((ast as any).right.end).toBe(21);
    });
  });

  describe('Indexer expressions', () => {
    test('should track positions in indexer expression', () => {
      const input = 'name[0]';
      const ast = parse(input);
      expect(ast.kind).toBe('indexer');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(7);
      expect(input.substring(ast.start, ast.end)).toBe('name[0]');
      
      // Check the expression being indexed
      expect((ast as any).expr.start).toBe(0);
      expect((ast as any).expr.end).toBe(4);
      
      // Check the index
      expect((ast as any).index.start).toBe(5);
      expect((ast as any).index.end).toBe(6);
    });
  });

  describe('Complex expressions', () => {
    test('should track positions in complex nested expression', () => {
      const input = 'Patient.name.where(use = "official").given[0]';
      const ast = parse(input);
      expect(ast.kind).toBe('indexer');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(45);
      expect(input.substring(ast.start, ast.end)).toBe(input);
    });

    test('should track positions with parentheses', () => {
      const input = '(5 + 3) * 2';
      const ast = parse(input);
      expect(ast.kind).toBe('binary');
      expect(ast.start).toBe(1);  // Starts after opening paren
      expect(ast.end).toBe(11);
      
      // The grouped expression inside parentheses
      const left = (ast as any).left;
      expect(left.start).toBe(1);  // After opening paren
      expect(left.end).toBe(6);    // Before closing paren
    });
  });

  describe('With whitespace and comments', () => {
    test('should track positions correctly with extra whitespace', () => {
      const input = '  Patient  .  name  ';
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect(ast.start).toBe(2);  // Start of 'Patient'
      expect(ast.end).toBe(18);   // End of 'name'
      
      expect((ast as any).left.start).toBe(2);
      expect((ast as any).left.end).toBe(9);
      expect((ast as any).right.start).toBe(14);
      expect((ast as any).right.end).toBe(18);
    });

    test('should track positions correctly with comments', () => {
      const input = 'Patient /* comment */ .name';
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(27);
      
      expect((ast as any).left.start).toBe(0);
      expect((ast as any).left.end).toBe(7);
      expect((ast as any).right.start).toBe(23);
      expect((ast as any).right.end).toBe(27);
    });

    test('should track positions with line comments', () => {
      const input = `Patient // comment
.name`;
      const ast = parse(input);
      expect(ast.kind).toBe('dot');
      expect((ast as any).left.name).toBe('Patient');
      expect((ast as any).right.name).toBe('name');
    });
  });

  describe('Special nodes', () => {
    test('should track positions for variables', () => {
      const input = '$this';
      const ast = parse(input);
      expect(ast.kind).toBe('variable');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(5);
      expect(input.substring(ast.start, ast.end)).toBe('$this');
    });

    test('should track positions for environment variables', () => {
      const input = '%resource';
      const ast = parse(input);
      expect(ast.kind).toBe('envVariable');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(9);
      expect(input.substring(ast.start, ast.end)).toBe('%resource');
    });

    test('should track positions for type operators', () => {
      const input = 'value is Patient';
      const ast = parse(input);
      expect(ast.kind).toBe('is');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(16);
      expect(input.substring(ast.start, ast.end)).toBe('value is Patient');
    });

    test('should track positions for unary operators', () => {
      const input = '-5';
      const ast = parse(input);
      expect(ast.kind).toBe('unary');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(2);
      expect(input.substring(ast.start, ast.end)).toBe('-5');
    });
  });

  describe('Position invariants', () => {
    test('parent node should encompass all child nodes', () => {
      const input = 'Patient.name.where(use = "official")';
      const ast = parse(input);
      
      function checkInvariant(node: any, parentStart?: number, parentEnd?: number) {
        if (node.start !== undefined && node.end !== undefined) {
          // Node should have valid positions
          expect(node.start).toBeGreaterThanOrEqual(0);
          expect(node.end).toBeGreaterThan(node.start);
          
          // If parent bounds are provided, check containment
          if (parentStart !== undefined && parentEnd !== undefined) {
            expect(node.start).toBeGreaterThanOrEqual(parentStart);
            expect(node.end).toBeLessThanOrEqual(parentEnd);
          }
          
          // Check children
          const childNodes = [];
          if (node.left) childNodes.push(node.left);
          if (node.right) childNodes.push(node.right);
          if (node.expr) childNodes.push(node.expr);
          if (node.index) childNodes.push(node.index);
          if (node.operand) childNodes.push(node.operand);
          if (node.expression) childNodes.push(node.expression);
          if (node.args) childNodes.push(...node.args);
          
          childNodes.forEach(child => checkInvariant(child, node.start, node.end));
        }
      }
      
      checkInvariant(ast);
    });

    test('position should map to exact source text', () => {
      const expressions = [
        'Patient',
        '42',
        "'hello'",
        'true',
        '5 + 3',
        'Patient.name',
        'exists()',
        'name[0]',
        '$this',
        '%resource',
        '@2023-01-01',
        "5 'mg'",
        '{}',
        'value is Patient',
        'Patient.name.where(use = "official").given[0]'
      ];
      
      expressions.forEach(input => {
        const ast = parse(input);
        const extracted = input.substring(ast.start, ast.end);
        expect(extracted).toBe(input.trim());
      });
    });
  });
});