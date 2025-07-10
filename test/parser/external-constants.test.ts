import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';
import { TokenType } from '../../src/types';

describe('External Constants', () => {
  
  describe('Identifier-based external constants', () => {
    test('should parse %resource', () => {
      const ast = parse('%resource');
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe('resource');
    });

    test('should parse %context', () => {
      const ast = parse('%context');
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe('context');
    });

    test('should parse %ucum', () => {
      const ast = parse('%ucum');
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe('ucum');
    });

    test('should use external constants in expressions', () => {
      const ast = parse('%resource.id = "123"');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.EQUALS);
      expect((ast as any).left.kind).toBe('dot');
      expect((ast as any).left.left.kind).toBe('envVariable');
      expect((ast as any).left.left.name).toBe('resource');
    });
  });

  describe('Quoted external constants', () => {
    test('should parse single-quoted external constant', () => {
      const ast = parse("%'simple string'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'simple string'");
    });

    test('should parse double-quoted external constant', () => {
      const ast = parse('%"double quoted"');
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe('"double quoted"');
    });

    test('should parse external constant with spaces', () => {
      const ast = parse("%'my constant value'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'my constant value'");
    });

    test('should parse external constant with escape sequences', () => {
      const ast = parse("%'can\\'t stop'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'can\\'t stop'");
    });

    test('should parse empty quoted external constant', () => {
      const ast = parse("%''");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("''");
    });

    test('should use quoted external constants in expressions', () => {
      const ast = parse("%'myConstant' = 42");
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.EQUALS);
      expect((ast as any).left.kind).toBe('envVariable');
      expect((ast as any).left.name).toBe("'myConstant'");
      expect((ast as any).right.value).toBe(42);
    });

    test('should parse external constant with special characters', () => {
      const ast = parse("%'http://example.com/path'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'http://example.com/path'");
    });

    test('should parse external constant with newlines', () => {
      const ast = parse("%'line1\\nline2'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'line1\\nline2'");
    });

    test('should handle quoted constants in function calls', () => {
      const ast = parse("resolve(%'base-url')");
      expect(ast.kind).toBe('function');
      expect((ast as any).name).toBe('resolve');
      expect((ast as any).args[0].kind).toBe('envVariable');
      expect((ast as any).args[0].name).toBe("'base-url'");
    });

    test('should handle quoted constants with dot access', () => {
      const ast = parse("%'my.resource'.type");
      expect(ast.kind).toBe('dot');
      expect((ast as any).left.kind).toBe('envVariable');
      expect((ast as any).left.name).toBe("'my.resource'");
      expect((ast as any).right.name).toBe('type');
    });
  });

  describe('Mixed external constants', () => {
    test('should handle both types in same expression', () => {
      const ast = parse("%resource = %'expected-resource'");
      expect(ast.kind).toBe('binary');
      expect((ast as any).left.kind).toBe('envVariable');
      expect((ast as any).left.name).toBe('resource');
      expect((ast as any).right.kind).toBe('envVariable');
      expect((ast as any).right.name).toBe("'expected-resource'");
    });

    test('should distinguish between similar names', () => {
      const ast1 = parse('%context');
      const ast2 = parse("%'context'");
      expect((ast1 as any).name).toBe('context');
      expect((ast2 as any).name).toBe("'context'");
    });
  });

  describe('Error cases', () => {
    test('should error on unterminated quoted constant', () => {
      expect(() => parse("%'unterminated")).toThrow();
    });

    test('should error on % without identifier or quote', () => {
      expect(() => parse("% ")).toThrow();
    });

    test('should error on invalid characters after %', () => {
      expect(() => parse("%123")).toThrow();
    });
  });

  describe('AST string representation', () => {
    test('should correctly represent identifier constants', () => {
      const ast = parse('%resource');
      expect(astToString(ast)).toBe('%resource');
    });

    test('should correctly represent quoted constants', () => {
      const ast = parse("%'my constant'");
      expect(astToString(ast)).toBe("%'my constant'");
    });
  });
});