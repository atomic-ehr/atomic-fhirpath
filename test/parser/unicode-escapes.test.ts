import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';

describe('Unicode Escape Sequences', () => {
  
  describe('Basic Unicode escapes in strings', () => {
    test('should parse Unicode escape for ASCII character', () => {
      const ast = parse("'\\u0041'"); // A
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('A');
    });

    test('should parse Unicode escape for number', () => {
      const ast = parse("'\\u0031\\u0032\\u0033'"); // 123
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('123');
    });

    test('should parse Unicode escape for space', () => {
      const ast = parse("'Hello\\u0020World'"); // space
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('Hello World');
    });

    test('should parse multiple Unicode escapes', () => {
      const ast = parse("'\\u0048\\u0065\\u006C\\u006C\\u006F'"); // Hello
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('Hello');
    });
  });

  describe('International characters', () => {
    test('should parse Unicode escape for Latin extended character', () => {
      const ast = parse("'\\u00E9'"); // é
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('é');
    });

    test('should parse Unicode escape for Greek character', () => {
      const ast = parse("'\\u03B1'"); // α (alpha)
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('α');
    });

    test('should parse Unicode escape for CJK character', () => {
      const ast = parse("'\\u4E2D'"); // 中 (Chinese)
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('中');
    });

    test('should parse Unicode escape for Arabic character', () => {
      const ast = parse("'\\u0633'"); // س (Arabic letter seen)
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('س');
    });

    test('should parse Unicode escape for emoji', () => {
      const ast = parse("'\\u2764'"); // ❤ (heart)
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('❤');
    });
  });

  describe('Mixed content with Unicode escapes', () => {
    test('should parse string with mixed regular and Unicode characters', () => {
      const ast = parse("'Patient \\u00E0 l\\u0027h\\u00F4pital'"); // Patient à l'hôpital
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe("Patient à l'hôpital");
    });

    test('should parse Unicode escapes with other escape sequences', () => {
      const ast = parse("'Line 1\\n\\u0009Line 2'"); // \u0009 is tab
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe("Line 1\n\tLine 2");
    });

    test('should handle Unicode escape in complex expression', () => {
      const ast = parse("Patient.name.where(given = 'Jos\\u00E9')");
      expect(ast.kind).toBe('dot');
      const whereArg = (ast as any).right.args[0];
      expect(whereArg.right.value).toBe('José');
    });
  });

  describe('Additional escape sequences', () => {
    test('should parse form feed escape', () => {
      const ast = parse("'Page 1\\fPage 2'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('Page 1\fPage 2');
    });

    test('should parse forward slash escape', () => {
      const ast = parse("'http:\\/\\/example.com'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('http://example.com');
    });
  });

  describe('Unicode escapes in delimited identifiers', () => {
    test('should parse Unicode escape in backtick identifier', () => {
      const ast = parse('`caf\\u00E9`'); // café
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('café');
    });

    test('should parse mixed content in backtick identifier', () => {
      const ast = parse('Patient.`\\u0074\\u0065st`'); // test
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('test');
    });

    test('should handle Unicode in backtick with other escapes', () => {
      const ast = parse('`line\\u005Cbreak`'); // \u005C is backslash
      expect(ast.kind).toBe('identifier');
      expect((ast as any).name).toBe('line\\break');
    });
  });

  describe('Edge cases and errors', () => {
    test('should handle incomplete Unicode escape', () => {
      expect(() => parse("'\\u041'")).toThrow(); // Only 3 hex digits
    });

    test('should handle invalid hex digits in Unicode escape', () => {
      expect(() => parse("'\\u004G'")).toThrow(); // G is not hex
    });

    test('should handle Unicode escape at end of string', () => {
      expect(() => parse("'\\u")).toThrow(); // Unterminated
    });

    test('should handle case-insensitive hex digits', () => {
      const ast1 = parse("'\\u00aA'"); // Mixed case
      expect((ast1 as any).value).toBe('ª');
      
      const ast2 = parse("'\\u00AA'"); // Uppercase
      expect((ast2 as any).value).toBe('ª');
    });

    test('should preserve literal backslash-u when not valid escape', () => {
      // This might throw or handle differently based on implementation
      // Most parsers would throw on invalid escape sequences
      expect(() => parse("'\\uXYZW'")).toThrow();
    });
  });

  describe('Unicode in quoted external constants', () => {
    test('should parse Unicode escape in quoted external constant', () => {
      const ast = parse("%'r\\u00E9sultat'"); // résultat
      expect(ast.kind).toBe('envVariable');
      expect((ast as any).name).toBe("'r\\u00E9sultat'"); // Raw escape preserved
    });
  });

  describe('Real-world healthcare examples', () => {
    test('should handle patient name with accents', () => {
      const ast = parse("Patient.name.where(family = 'M\\u00FCller')"); // Müller
      expect(ast.kind).toBe('dot');
      const whereArg = (ast as any).right.args[0];
      expect(whereArg.right.value).toBe('Müller');
    });

    test('should handle medical terms with special characters', () => {
      const ast = parse("'\\u00B5g'"); // µg (microgram)
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('µg');
    });

    test('should handle degree symbol', () => {
      const ast = parse("'37.5\\u00B0C'"); // 37.5°C
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('37.5°C');
    });
  });
});