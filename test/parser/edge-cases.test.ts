import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';

describe('Edge Cases and Additional Tests', () => {
  test('should parse parameterless function calls', () => {
    const tests = [
      { expr: 'today()', expectedName: 'today' },
      { expr: 'now()', expectedName: 'now' },
      { expr: 'empty()', expectedName: 'empty' },
      { expr: 'exists()', expectedName: 'exists' },
    ];

    for (const { expr, expectedName } of tests) {
      const result = parse(expr);
      expect(result.kind).toBe('function');
      expect((result as any).name).toBe(expectedName);
      expect((result as any).args).toEqual([]);
    }
  });



  test('should parse quantity literals', () => {
    const tests = [
      { expr: "4.5 'mg'", value: "4.5 'mg'" },
      { expr: "10 'km'", value: "10 'km'" },
      { expr: "5.0 'mL'", value: "5.0 'mL'" },
      { expr: "100 'cm'", value: "100 'cm'" },
      { expr: '18 years', value: '18 years' },
      { expr: '5 minutes', value: '5 minutes' },
      { expr: '1 day', value: '1 day' },
      { expr: '2.5 hours', value: '2.5 hours' },
    ];

    for (const { expr, value } of tests) {
      const result = parse(expr);
      expect(result.kind).toBe('literal');
      expect((result as any).dataType).toBe('quantity');
      expect((result as any).value).toBe(value);
    }
  });

  test('should parse complex expressions with quantities', () => {
    const expr = "Patient.birthDate < today() - 18 years";
    const result = parse(expr);
    expect(result.kind).toBe('binary');
    
    // Right side should be a binary expression (today() - 18 years)
    const rightSide = (result as any).right;
    expect(rightSide.kind).toBe('binary');
    expect(rightSide.left.kind).toBe('function');
    expect(rightSide.left.name).toBe('today');
    expect(rightSide.right.kind).toBe('literal');
    expect(rightSide.right.dataType).toBe('quantity');
    expect(rightSide.right.value).toBe('18 years');
  });

  test('should handle edge cases in tokenization', () => {
    // Empty parens - should throw because of unexpected )
    expect(() => parse('()')).toThrow('Unexpected ) in expression. Expected an operand, function, or identifier.');
    
    // Multiple spaces
    const multiSpace = parse('5     minutes');
    expect(multiSpace.kind).toBe('literal');
    expect((multiSpace as any).dataType).toBe('quantity');
    
    // Numbers without units aren't quantities
    const justNumber = parse('42');
    expect(justNumber.kind).toBe('literal');
    expect((justNumber as any).dataType).toBe('number');
    
    // String followed by identifier - parser sees these as two expressions
    // and throws because it expects EOF after the first
    expect(() => parse("'hello' world")).toThrow();
  });

  test('should handle nested function calls', () => {
    const expr = 'Patient.name.where(use = "official").exists()';
    const result = parse(expr);
    
    // The result is a dot expression where:
    // - left is the where() call
    // - right is the exists() function call
    expect(result.kind).toBe('dot');
    const right = (result as any).right;
    expect(right.kind).toBe('function');
    expect(right.name).toBe('exists');
    expect(right.args).toEqual([]);
    
    // The left side should be another dot expression ending in where()
    const left = (result as any).left;
    expect(left.kind).toBe('dot');
    expect(left.right.kind).toBe('function');
    expect(left.right.name).toBe('where');
  });

  test('should parse chained empty() and not()', () => {
    const tests = [
      'value.empty()',
      'value.empty().not()',
      'value.not().empty()',
      'Patient.name.empty()',
    ];

    for (const expr of tests) {
      const result = parse(expr);
      expect(result).toBeDefined();
      // Just verify it parses without error
    }
  });

  test('should handle special characters in strings', () => {
    const tests = [
      { expr: "'hello\\'world'", expected: "hello'world" },
      { expr: '"hello\\"world"', expected: 'hello"world' },
      { expr: "'hello\\nworld'", expected: "hello\nworld" },
      { expr: "'hello\\tworld'", expected: "hello\tworld" },
    ];

    for (const { expr, expected } of tests) {
      const result = parse(expr);
      expect(result.kind).toBe('literal');
      expect((result as any).value).toBe(expected);
    }
  });

  test('should treat "not" as identifier, not as operator', () => {
    // 'not' is not a valid operator in FHIRPath - it should be treated as an identifier
    const ast = parse('not');
    expect(ast.kind).toBe('identifier');
    expect((ast as any).name).toBe('not');
    
    // 'not' can be used as a property name
    const dotAst = parse('value.not');
    expect(dotAst.kind).toBe('dot');
    expect((dotAst as any).left.name).toBe('value');
    expect((dotAst as any).right.name).toBe('not');
    
    // 'not' can be used as a function call
    const funcAst = parse('not()');
    expect(funcAst.kind).toBe('function');
    expect((funcAst as any).name).toBe('not');
    expect((funcAst as any).args).toEqual([]);
    
    // 'not' cannot be used as a unary operator - should throw error
    expect(() => parse('not value')).toThrow();
  });

  test('should parse all types of literals', () => {
    const tests = [
      { expr: '42', dataType: 'number', value: 42 },
      { expr: '3.14', dataType: 'number', value: 3.14 },
      { expr: 'true', dataType: 'boolean', value: true },
      { expr: 'false', dataType: 'boolean', value: false },
      { expr: "'hello'", dataType: 'string', value: 'hello' },
      { expr: '@2023-01-01', dataType: 'date', value: '2023-01-01' },
      { expr: '@T14:30:00', dataType: 'time', value: '14:30:00' },
      { expr: '@2023-01-01T14:30:00', dataType: 'datetime', value: '2023-01-01T14:30:00' },
      { expr: "5 'mg'", dataType: 'quantity', value: "5 'mg'" },
    ];

    for (const { expr, dataType, value } of tests) {
      const result = parse(expr);
      expect(result.kind).toBe('literal');
      expect((result as any).dataType).toBe(dataType);
      expect((result as any).value).toBe(value);
    }
  });
});