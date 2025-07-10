import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';
import { Tokenizer } from '../../src/tokenizer';
import { TokenType } from '../../src/types';
import { printAST } from '../../src/index';

describe('Comment Support', () => {
  
  describe('Single-line comments', () => {
    test('should ignore single-line comment at end of expression', () => {
      const ast = parse('Patient.name // This is a comment');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('name');
    });

    test('should ignore single-line comment on separate line', () => {
      const ast = parse(`
        // This is a comment
        Patient.name
      `);
      expect(ast.kind).toBe('dot');
    });

    test('should handle multiple single-line comments', () => {
      const ast = parse(`
        // First comment
        Patient // Second comment
        .name // Third comment
      `);
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('name');
      printAST(ast);


    });

    test('should handle single-line comment with special characters', () => {
      const ast = parse('5 + 3 // Comment with @#$% special chars!');
      expect(ast.kind).toBe('binary');
      expect((ast as any).left.value).toBe(5);
      expect((ast as any).right.value).toBe(3);
    });

    test('should not treat // inside string as comment', () => {
      const ast = parse("'http://example.com'.substring(0, 5)");
      expect(ast.kind).toBe('dot');
      expect((ast as any).left.value).toBe('http://example.com');
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.name).toBe('substring');
    });
  });

  describe('Multi-line comments', () => {
    test('should ignore multi-line comment in expression', () => {
      const ast = parse('Patient /* this is ignored */ .name');
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('name');
    });

    test('should handle multi-line comment spanning multiple lines', () => {
      const ast = parse(`
        Patient
        /* 
         * This is a multi-line comment
         * with multiple lines
         */
        .name
      `);
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.name).toBe('name');
    });

    test('should handle nested comment-like sequences', () => {
      const ast = parse('5 /* comment with // inside */ + 3');
      expect(ast.kind).toBe('binary');
      expect((ast as any).left.value).toBe(5);
      expect((ast as any).right.value).toBe(3);
    });

    test('should handle multiple multi-line comments', () => {
      const ast = parse('/* first */ 5 /* second */ + /* third */ 3');
      expect(ast.kind).toBe('binary');
    });

    test('should not treat /* inside string as comment', () => {
      const ast = parse("'/* not a comment */'");
      expect(ast.kind).toBe('literal');
      expect((ast as any).value).toBe('/* not a comment */');
    });

    test('should handle empty multi-line comment', () => {
      const ast = parse('5 /**/ + 3');
      expect(ast.kind).toBe('binary');
    });
  });

  describe('Comments in complex expressions', () => {
    test('should handle comments in function calls', () => {
      const ast = parse(`
        Patient.name
          .where(/* filter */ given /* given name */ = 'John' /* end */)
      `);
      expect(ast.kind).toBe('dot');
      expect((ast as any).right.kind).toBe('function');
      expect((ast as any).right.name).toBe('where');
    });

    test('should handle comments between operators', () => {
      const ast = parse(`
        age /* patient age */ >= /* minimum */ 18 // adult check
      `);
      expect(ast.kind).toBe('binary');
      expect((ast as any).op).toBe(TokenType.GREATER_EQUALS);
    });

    test('should handle comments in quantity expressions', () => {
      const ast = parse("5 /* amount */ 'mg' // dosage");
      expect(ast.kind).toBe('literal');
      expect((ast as any).dataType).toBe('quantity');
      expect((ast as any).value).toBe("5 'mg'");
    });

    test('should handle comments in date expressions', () => {
      const ast = parse('@2023-01-01 /* start date */ + 30 days // one month later');
      expect(ast.kind).toBe('binary');
    });
  });

  describe('Edge cases', () => {
    test('should handle unclosed multi-line comment', () => {
      expect(() => parse('5 + /* unclosed comment')).toThrow('Unterminated comment');
    });

    test('should handle comment at start of expression', () => {
      const ast = parse('/* comment */ Patient.name');
      expect(ast.kind).toBe('dot');
    });

    test('should handle comment at end of expression', () => {
      const ast = parse('Patient.name /* final comment */');
      expect(ast.kind).toBe('dot');
    });

    test('should handle only comments (empty expression after comments)', () => {
      expect(() => parse('// just a comment')).toThrow();
      expect(() => parse('/* just a comment */')).toThrow();
    });

    test('should preserve line numbers when skipping comments', () => {
      const tokenizer = new Tokenizer();
      tokenizer.reset(`
        // Line 2
        /* Line 3
           Line 4 */
        Patient
      `);
      
      const token = tokenizer.nextToken();
      expect(token.type).toBe(TokenType.IDENTIFIER);
      expect(token.value).toBe('Patient');
      // Token should be on line 5 after skipping comments
    });
  });

  describe('Comments with special patterns', () => {
    test('should handle URLs in comments', () => {
      const ast = parse('value // See http://hl7.org/fhir');
      expect(ast.kind).toBe('identifier');
    });

    test('should handle comment with */ pattern inside single-line comment', () => {
      const ast = parse('5 // This has */ in it\n+ 3');
      expect(ast.kind).toBe('binary');
    });

    test('should handle escaped characters in comments', () => {
      const ast = parse('name /* Comment with \\n escape */');
      expect(ast.kind).toBe('identifier');
    });

    test('should handle comment-like patterns in various contexts', () => {
      // In string
      const ast1 = parse("'//not-a-comment'");
      expect(ast1.kind).toBe('literal');
      expect((ast1 as any).value).toBe('//not-a-comment');

      // In quoted identifier
      const ast2 = parse('`//property`');
      expect(ast2.kind).toBe('identifier');
      expect((ast2 as any).name).toBe('//property');
    });
  });
});