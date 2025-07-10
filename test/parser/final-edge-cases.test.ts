import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';

describe('Final edge cases and grammar subtleties', () => {
  
  describe('Identifier edge cases', () => {
    test('identifiers starting with underscore', () => {
      const ast = parse('_privateField');
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('_privateField');
    });
    
    test('identifiers with numbers', () => {
      const ast = parse('field123');
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('field123');
    });
    
    test('very long identifiers', () => {
      const longId = 'a'.repeat(100) + '_' + '1'.repeat(50);
      const ast = parse(longId);
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe(longId);
    });
  });
  
  describe('Numeric edge cases', () => {
    test('very small decimals', () => {
      const ast = parse('0.00000001');
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe(0.00000001);
    });
    
    test('very large numbers', () => {
      const ast = parse('999999999999999999L');
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe(999999999999999999);
    });
    
    test('decimal with no integer part', () => {
      // Note: ANTLR grammar requires digits before decimal point
      // .5 would be tokenized as DOT followed by NUMBER
      expect(() => parse('.5')).toThrow();
    });
    
    test('decimal with trailing zeros', () => {
      const ast = parse('1.00000');
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe(1.0);
    });
  });
  
  describe('String edge cases', () => {
    test('empty string', () => {
      const ast = parse("''");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('');
    });
    
    test('string with only escapes', () => {
      const ast = parse("'\\n\\t\\r'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('\n\t\r');
    });
    
    test('string with mixed quotes', () => {
      const ast = parse("'He said \"hello\"'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('He said "hello"');
    });
    
    test('string with Unicode escapes at boundaries', () => {
      const ast = parse("'\\u0041\\u0042\\u0043'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('ABC');
    });
  });
  
  describe('Date/time edge cases', () => {
    test('date with only year', () => {
      const ast = parse('@2023');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('date');
      expect((ast as any).value).toBe('2023');
    });
    
    test('datetime with fractional seconds', () => {
      const ast = parse('@2023-01-01T12:00:00.999999');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('datetime');
    });
    
    test('time with only hour', () => {
      const ast = parse('@T12');
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('time');
      expect((ast as any).value).toBe('12');
    });
  });
  
  describe('Comment edge cases', () => {
    test('comment at end of expression', () => {
      const ast = parse('a + b // trailing comment');
      expect(ast.kind).toBe('binary');
    });
    
    test('nested comments', () => {
      // Note: /* /* nested */ */ is not valid in most languages
      // The comment ends at the first */, so this parses as 'a + b'
      const ast = parse('a /* outer /* not nested */ + b');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(9); // PLUS
    });
    
    test('comment-like content in strings', () => {
      const ast = parse("'// not a comment'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('// not a comment');
    });
  });
  
  describe('Whitespace edge cases', () => {
    test('no spaces around operators', () => {
      const ast = parse('a+b*c');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(9); // PLUS (TokenType.PLUS = 9)
      // Due to precedence, this is a + (b * c)
      expect((ast as any).right.kind).toBe('binary');
      expect((ast as any).right.op).toBe(11); // MULTIPLY
    });
    
    test('excessive whitespace', () => {
      const ast = parse('   \n\t  a   \n\n\t  +   \n\t\n  b   \n\t  ');
      expect(ast.kind).toBe('binary');
    });
    
    test('whitespace in function calls', () => {
      const ast = parse('func( a , b , c )');
      expect(ast.kind).toBe('function');
      expect((ast as any).args.length).toBe(3);
    });
  });
  
  describe('Operator precedence edge cases', () => {
    test('all operators in one expression', () => {
      // This tests precedence from highest to lowest
      const ast = parse('a.b[0] * c + d = e and f or g implies h');
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(23); // IMPLIES (lowest precedence)
    });
    
    test('unary with postfix', () => {
      const ast = parse('-a.b');
      expect(ast.kind).toBe('unary');
      expect((ast as any).operand.kind).toBe('dot');
    });
    
    test('multiple unary operators', () => {
      // Actually, multiple unary operators are valid in FHIRPath
      const ast1 = parse('--a');
      expect(ast1.kind).toBe('unary');
      expect((ast1 as any).operand.kind).toBe('unary');
      
      const ast2 = parse('+-a');
      expect(ast2.kind).toBe('unary');
      expect((ast2 as any).op).toBe(9); // PLUS
      expect((ast2 as any).operand.kind).toBe('unary');
      expect((ast2 as any).operand.op).toBe(10); // MINUS
    });
  });
  
  describe('Function and method chaining', () => {
    test('deep method chaining', () => {
      const ast = parse('a.b().c.d().e[0].f()');
      // The root is a dot expression, not a function
      // The structure is: ((((a.b()).c.d()).e[0]).f())
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.name).toBe('f');
    });
    
    test('function with empty argument list', () => {
      const ast = parse('func()');
      expect(ast.kind).toBe('function');
      expect((ast as any).args.length).toBe(0);
    });
    
    test('function with trailing comma', () => {
      // Most parsers don't allow trailing commas
      expect(() => parse('func(a, b,)')).toThrow();
    });
  });
  
  describe('Type specifier edge cases', () => {
    test('very long qualified type', () => {
      const ast = parse('x is A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P');
      expect(ast.kind).toBe('is');
      expect((ast as any).targetType).toBe('A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P');
    });
    
    test('type name starting with number', () => {
      // This should fail as identifiers can't start with numbers
      expect(() => parse('x is 123Type')).toThrow();
    });
  });
  
  describe('Environment variable edge cases', () => {
    test('environment variable with special characters', () => {
      const ast = parse("%'var-with-dashes'");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'var-with-dashes'");
    });
    
    test('empty environment variable string', () => {
      const ast = parse("%''");
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("''");
    });
  });
});