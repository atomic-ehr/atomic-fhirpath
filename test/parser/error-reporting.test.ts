import { test, expect, describe } from 'bun:test';
import { parse, ParseError } from '../../src';

describe('Enhanced Error Reporting', () => {
  test('should show expression with caret pointing to error position', () => {
    try {
      parse('Patient.name(');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      const parseError = error as ParseError;
      
      // Check that the formatted message is now the main message
      expect(parseError.message).toContain('ParseError:');
      expect(parseError.message).toContain('Patient.name(');
      expect(parseError.message).toContain('^');
      expect(parseError.message).toContain('at line 1, column 13');
      expect((parseError as any).expression).toBe('Patient.name(');
      
      console.log('\nExample error output:');
      console.log(parseError.message);
    }
  });

  test('should show multiline expressions with error position', () => {
    const expr = `Patient.name
      .where(use = "official"
      .given`;
      
    try {
      parse(expr);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      const parseError = error as ParseError;
      
      const formatted = parseError.message;
      expect(formatted).toContain('at line 3');
      expect(formatted).toContain('.given');
      expect(formatted).toContain('^');
      
      console.log('\nMultiline error output:');
      console.log(formatted);
    }
  });

  test('should provide helpful suggestions for common errors', () => {
    // Unterminated string
    try {
      parse('Patient.name = "unterminated');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('Unterminated string');
      console.log('\nUnterminated string error:');
      console.log(formatted);
    }

    // Missing closing parenthesis
    try {
      parse('exists(name.given');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('Expected closing parenthesis');
      console.log('\nMissing parenthesis error:');
      console.log(formatted);
    }

    // Unexpected token
    try {
      parse('Patient..name');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('Expected identifier after dot');
      console.log('\nUnexpected token error:');
      console.log(formatted);
    }
  });

  test('should handle errors at different positions', () => {
    // Error at the beginning
    try {
      parse('(');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('at line 1, column 1');
      console.log('\nError at beginning:');
      console.log(formatted);
    }

    // Error in the middle
    try {
      parse('Patient.name[0]..given');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('Expected identifier after dot');
      expect(formatted).toContain('Patient.name[0]..given');
      console.log('\nError in middle:');
      console.log(formatted);
    }

    // Error at the end
    try {
      parse('Patient.name +');
    } catch (error) {
      const formatted = (error as Error).message;
      expect(formatted).toContain('Patient.name +');
      console.log('\nError at end:');
      console.log(formatted);
    }
  });

  test('should show accurate column positions for various tokens', () => {
    // Test with different token types
    const testCases = [
      { expr: 'Patient.123', expectedCol: 8 }, // number after dot
      { expr: 'Patient.(', expectedCol: 9 }, // paren after dot
      { expr: 'Patient + +', expectedCol: 11 }, // double operator
      { expr: 'exists(,)', expectedCol: 8 }, // comma without arg
    ];

    for (const { expr, expectedCol } of testCases) {
      try {
        parse(expr);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const parseError = error as ParseError;
        expect(parseError.column).toBe(expectedCol);
        
        const formatted = parseError.message;
        console.log(`\nError in "${expr}":`);
        console.log(formatted);
      }
    }
  });
});