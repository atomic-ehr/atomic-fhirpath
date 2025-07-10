import { test, expect, describe } from 'bun:test';
import { parse, printAST } from '../../src';

describe('Grammar Completeness Check', () => {
  
  describe('All expression types from ANTLR grammar', () => {
    // 1. termExpression - covered by basic tests
    
    // 2. invocationExpression - expression '.' invocation
    test('invocationExpression with all invocation types', () => {
      // memberInvocation
      expect(() => parse('Patient.name')).not.toThrow();
      
      // functionInvocation
      expect(() => parse('Patient.name.exists()')).not.toThrow();
      
      // thisInvocation
      expect(() => parse('defineVariable("x", 5).$this')).not.toThrow();
      
      // indexInvocation
      expect(() => parse('repeat(item).$index')).not.toThrow();
      
      // totalInvocation
      expect(() => parse('repeat(item).$total')).not.toThrow();
    });
    
    // 3. indexerExpression
    test('indexerExpression', () => {
      expect(() => parse('items[0]')).not.toThrow();
      expect(() => parse('items[index]')).not.toThrow();
      expect(() => parse('items[index + 1]')).not.toThrow();
    });
    
    // 4. polarityExpression
    test('polarityExpression (unary + and -)', () => {
      expect(() => parse('+5')).not.toThrow();
      expect(() => parse('-10')).not.toThrow();
      expect(() => parse('-(x + y)')).not.toThrow();
      expect(() => parse('+value')).not.toThrow();
    });
    
    // 5. multiplicativeExpression
    test('multiplicativeExpression with all operators', () => {
      expect(() => parse('a * b')).not.toThrow();
      expect(() => parse('a / b')).not.toThrow();
      expect(() => parse('a div b')).not.toThrow();
      expect(() => parse('a mod b')).not.toThrow();
    });
    
    // 6. additiveExpression
    test('additiveExpression with all operators', () => {
      expect(() => parse('a + b')).not.toThrow();
      expect(() => parse('a - b')).not.toThrow();
      expect(() => parse('a & b')).not.toThrow(); // string concatenation
    });
    
    // 7. typeExpression
    test('typeExpression (is/as)', () => {
      expect(() => parse('value is String')).not.toThrow();
      expect(() => parse('value as Quantity')).not.toThrow();
      expect(() => parse('value is FHIR.Observation')).not.toThrow();
    });
    
    // 8. unionExpression
    test('unionExpression', () => {
      expect(() => parse('a | b')).not.toThrow();
      expect(() => parse('collection1 | collection2')).not.toThrow();
    });
    
    // 9. inequalityExpression
    test('inequalityExpression with all operators', () => {
      expect(() => parse('a < b')).not.toThrow();
      expect(() => parse('a <= b')).not.toThrow();
      expect(() => parse('a > b')).not.toThrow();
      expect(() => parse('a >= b')).not.toThrow();
    });
    
    // 10. equalityExpression
    test('equalityExpression with all operators', () => {
      expect(() => parse('a = b')).not.toThrow();
      expect(() => parse('a != b')).not.toThrow();
      expect(() => parse('a ~ b')).not.toThrow();
      expect(() => parse('a !~ b')).not.toThrow();
    });
    
    // 11. membershipExpression
    test('membershipExpression', () => {
      expect(() => parse('item in collection')).not.toThrow();
      expect(() => parse('collection contains item')).not.toThrow();
    });
    
    // 12. andExpression
    test('andExpression', () => {
      expect(() => parse('a and b')).not.toThrow();
      expect(() => parse('x > 0 and y < 10')).not.toThrow();
    });
    
    // 13. orExpression
    test('orExpression with or/xor', () => {
      expect(() => parse('a or b')).not.toThrow();
      expect(() => parse('a xor b')).not.toThrow();
    });
    
    // 14. impliesExpression
    test('impliesExpression', () => {
      expect(() => parse('a implies b')).not.toThrow();
      expect(() => parse('condition implies result')).not.toThrow();
    });
  });
  
  describe('All term types from ANTLR grammar', () => {
    // invocationTerm - covered above
    
    // literalTerm - all literal types
    test('all literal types', () => {
      // nullLiteral
      expect(() => parse('{}')).not.toThrow();
      
      // booleanLiteral
      expect(() => parse('true')).not.toThrow();
      expect(() => parse('false')).not.toThrow();
      
      // stringLiteral
      expect(() => parse("'hello'")).not.toThrow();
      expect(() => parse('"world"')).not.toThrow();
      
      // numberLiteral
      expect(() => parse('42')).not.toThrow();
      expect(() => parse('3.14')).not.toThrow();
      
      // longNumberLiteral
      expect(() => parse('123L')).not.toThrow();
      
      // dateLiteral
      expect(() => parse('@2023-01-15')).not.toThrow();
      
      // dateTimeLiteral
      expect(() => parse('@2023-01-15T10:30:00Z')).not.toThrow();
      
      // timeLiteral
      expect(() => parse('@T10:30:00')).not.toThrow();
      
      // quantityLiteral
      expect(() => parse("5 'mg'")).not.toThrow();
      expect(() => parse('18 years')).not.toThrow();
    });
    
    // externalConstantTerm
    test('external constants', () => {
      expect(() => parse('%resource')).not.toThrow();
      expect(() => parse("%'some constant'")).not.toThrow();
      expect(() => parse('%ucum')).not.toThrow();
    });
    
    // parenthesizedTerm
    test('parenthesized expressions', () => {
      expect(() => parse('(a + b)')).not.toThrow();
      expect(() => parse('((a + b) * c)')).not.toThrow();
      expect(() => parse('(true)')).not.toThrow();
    });
  });
  
  describe('Special identifiers that can be used as regular identifiers', () => {
    // From the grammar, these keywords can also be identifiers in certain contexts
    test('keywords as identifiers from grammar', () => {
      printAST(parse('Patient in'));

      expect(() => parse('as')).not.toThrow(); // identifier rule includes 'as'
      expect(() => parse('contains')).not.toThrow(); // identifier rule includes 'contains'
      expect(() => parse('in')).not.toThrow(); // identifier rule includes 'in'


      expect(() => parse('is')).not.toThrow(); // identifier rule includes 'is'
    });
  });
  
  describe('Delimited identifiers', () => {
    test('should parse backtick-quoted identifiers', () => {
      expect(() => parse('`div`')).not.toThrow();
      expect(() => parse('`special identifier`')).not.toThrow();
      expect(() => parse('Patient.`status`')).not.toThrow();
    });
  });
  
  describe('Comment handling', () => {
    test('single-line comments', () => {
      expect(() => parse('a + b // comment')).not.toThrow();
      expect(() => parse('// comment\na + b')).not.toThrow();
    });
    
    test('multi-line comments', () => {
      expect(() => parse('a /* comment */ + b')).not.toThrow();
      expect(() => parse('/* multi\nline\ncomment */ a + b')).not.toThrow();
    });
  });
  
  describe('Escape sequences in strings', () => {
    test('all escape sequences from grammar', () => {
      expect(() => parse("'\\`'")).not.toThrow(); // backtick
      expect(() => parse("'\\''")).not.toThrow(); // apostrophe
      expect(() => parse("'\\\\'")).not.toThrow(); // backslash
      expect(() => parse("'\\/'")).not.toThrow(); // forward slash
      expect(() => parse("'\\f'")).not.toThrow(); // form feed
      expect(() => parse("'\\n'")).not.toThrow(); // newline
      expect(() => parse("'\\r'")).not.toThrow(); // carriage return
      expect(() => parse("'\\t'")).not.toThrow(); // tab
      expect(() => parse("'\\u0041'")).not.toThrow(); // Unicode escape
    });
  });
  
  describe('Date/time format completeness', () => {
    test('date formats', () => {
      expect(() => parse('@2023')).not.toThrow(); // year only
      expect(() => parse('@2023-01')).not.toThrow(); // year-month
      expect(() => parse('@2023-01-15')).not.toThrow(); // full date
    });
    
    test('datetime formats', () => {
      expect(() => parse('@2023-01-15T10')).not.toThrow(); // hour only
      expect(() => parse('@2023-01-15T10:30')).not.toThrow(); // hour:minute
      expect(() => parse('@2023-01-15T10:30:45')).not.toThrow(); // hour:minute:second
      expect(() => parse('@2023-01-15T10:30:45.123')).not.toThrow(); // with milliseconds
      expect(() => parse('@2023-01-15T10:30:45Z')).not.toThrow(); // UTC
      expect(() => parse('@2023-01-15T10:30:45+05:00')).not.toThrow(); // positive offset
      expect(() => parse('@2023-01-15T10:30:45-08:00')).not.toThrow(); // negative offset
    });
    
    test('time formats', () => {
      expect(() => parse('@T10')).not.toThrow(); // hour only
      expect(() => parse('@T10:30')).not.toThrow(); // hour:minute
      expect(() => parse('@T10:30:45')).not.toThrow(); // hour:minute:second
      expect(() => parse('@T10:30:45.123')).not.toThrow(); // with milliseconds
    });
  });
  
  describe('Quantity units', () => {
    test('all time unit variations', () => {
      // Singular forms
      expect(() => parse('1 year')).not.toThrow();
      expect(() => parse('1 month')).not.toThrow();
      expect(() => parse('1 week')).not.toThrow();
      expect(() => parse('1 day')).not.toThrow();
      expect(() => parse('1 hour')).not.toThrow();
      expect(() => parse('1 minute')).not.toThrow();
      expect(() => parse('1 second')).not.toThrow();
      expect(() => parse('1 millisecond')).not.toThrow();
      
      // Plural forms
      expect(() => parse('2 years')).not.toThrow();
      expect(() => parse('3 months')).not.toThrow();
      expect(() => parse('4 weeks')).not.toThrow();
      expect(() => parse('5 days')).not.toThrow();
      expect(() => parse('6 hours')).not.toThrow();
      expect(() => parse('7 minutes')).not.toThrow();
      expect(() => parse('8 seconds')).not.toThrow();
      expect(() => parse('9 milliseconds')).not.toThrow();
    });
    
    test('UCUM units in quotes', () => {
      expect(() => parse("5 'mg'")).not.toThrow();
      expect(() => parse("100 'mL'")).not.toThrow();
      expect(() => parse("2.5 'cm'")).not.toThrow();
    });
  });
});

describe('Potential gaps or edge cases', () => {
  test('empty function calls', () => {
    expect(() => parse('exists()')).not.toThrow();
    expect(() => parse('empty()')).not.toThrow();
  });
  
  test('nested type operations', () => {
    expect(() => parse('(value as Quantity) is Quantity')).not.toThrow();
  });
  
  test('complex qualified identifiers', () => {
    expect(() => parse('a.b.c.d.e')).not.toThrow();
    expect(() => parse('System.Collections.Generic.List')).not.toThrow();
  });
  
  test('whitespace handling in various positions', () => {
    expect(() => parse('  a  +  b  ')).not.toThrow();
    expect(() => parse('a\n+\nb')).not.toThrow();
    expect(() => parse('a\t+\tb')).not.toThrow();
    expect(() => parse('a\r\n+\r\nb')).not.toThrow();
  });
  
  test('operator combinations', () => {
    expect(() => parse('a + b * c')).not.toThrow();
    expect(() => parse('a * b + c')).not.toThrow();
    expect(() => parse('a = b and c != d')).not.toThrow();
    expect(() => parse('a or b and c')).not.toThrow();
  });
  
  test('special characters in quoted strings', () => {
    expect(() => parse("'Hello, world!'")).not.toThrow();
    expect(() => parse("'Line 1\\nLine 2'")).not.toThrow();
    expect(() => parse("'Tab\\there'")).not.toThrow();
    expect(() => parse("'Quote: \\'text\\''")).not.toThrow();
  });
  
  test('numbers with leading zeros', () => {
    expect(() => parse('001')).not.toThrow(); // ANTLR grammar allows leading zeros
    expect(() => parse('00.5')).not.toThrow();
    expect(() => parse('0123')).not.toThrow();
  });
});