import { test, expect } from 'bun:test';
import { parse, ParseError } from '../../src';

test('errors show expression with position indicator', () => {
  try {
    parse('Patient.name(');
  } catch (error: any) {

    // Check it's a ParseError
    expect(error).toBeInstanceOf(ParseError);
    // Check the formatted message is now the main message
    console.log(error.message);
    expect(error.message).toContain('ParseError: Unexpected token in expression');
    expect(error.message).toContain('Patient.name(');
    expect(error.message).toContain('^');
    expect(error.message).toContain('at line 1, column 13');
    
    // Check we still have access to the original message
    expect(error.originalMessage).toBe('Unexpected token in expression. Expected an operand, function, or identifier.');
    expect(error.line).toBe(1);
    expect(error.column).toBe(13);
  }
});

test('errors for common mistakes', () => {
  const testCases = [
    {
      expr: 'Patient..name',
      expectedMsg: 'Expected identifier after dot',
      expectedCol: 9
    },
    {
      expr: 'Patient.name = "unterminated',
      expectedMsg: 'Unterminated string',
      expectedCol: 29
    },
    {
      expr: 'exists(name',
      expectedMsg: 'Expected closing parenthesis',
      expectedCol: 8
    },
    {
      expr: 'Patient + ',
      expectedMsg: 'Unexpected token in expression',
      expectedCol: 9
    }
  ];
  
  for (const { expr, expectedMsg, expectedCol } of testCases) {
    try {
      parse(expr);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error).toBeInstanceOf(ParseError);
      expect(error.originalMessage).toContain(expectedMsg);
      expect(error.column).toBe(expectedCol);
      expect(error.message).toContain(expr);
      expect(error.message).toContain('^');
    }
  }
});