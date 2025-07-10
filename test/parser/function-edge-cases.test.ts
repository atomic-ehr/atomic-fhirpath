import { describe, test, expect } from 'bun:test';
import { parse } from '../../src';
import { printAST } from '../../src/ast-printer';

describe('Function edge cases', () => {
  test('should parse function names that start with keywords', () => {
    // Functions that start with built-in keywords
    const ast1 = parse('Patient.whereCustom()') as any;
    expect(ast1.kind).toBe('dot');

    expect(ast1.right.kind).toBe('function');
    expect(ast1.right.name).toBe('whereCustom');
    
    const ast2 = parse('Patient.existsAndValidate()') as any;
    expect(ast2.kind).toBe('dot');
    expect(ast2.right.kind).toBe('function');
    expect(ast2.right.name).toBe('existsAndValidate');
    
    const ast3 = parse('Patient.notEmpty()') as any;
    expect(ast3.kind).toBe('dot');
    expect(ast3.right.kind).toBe('function');
    expect(ast3.right.name).toBe('notEmpty');
    printAST(ast1);
  });

  test('should parse function names that contain keywords', () => {
    const ast1 = parse('Patient.hasWhereClause()') as any;
    expect(ast1.kind).toBe('dot');
    expect(ast1.right.kind).toBe('function');
    expect(ast1.right.name).toBe('hasWhereClause');
    
    const ast2 = parse('Patient.checkIfExists()') as any;
    expect(ast2.kind).toBe('dot');
    expect(ast2.right.kind).toBe('function');
    expect(ast2.right.name).toBe('checkIfExists');
  });

  test('should distinguish between keyword functions and custom functions', () => {
    // Built-in where function
    const ast1 = parse('Patient.where(active = true)') as any;
    expect(ast1.kind).toBe('dot');
    expect(ast1.right.kind).toBe('function');
    expect(ast1.right.name).toBe('where');
    
    // Custom where-like function
    const ast2 = parse('Patient.whereNot(active = true)') as any;
    expect(ast2.kind).toBe('dot');
    expect(ast2.right.kind).toBe('function');
    expect(ast2.right.name).toBe('whereNot');
  });

  test('should handle functions with no arguments vs property access', () => {
    // Function call with empty arguments
    const ast1 = parse('Patient.getName()') as any;
    expect(ast1.kind).toBe('dot');
    expect(ast1.right.kind).toBe('function');
    expect(ast1.right.name).toBe('getName');
    expect(ast1.right.args).toHaveLength(0);
    
    // Property access (no parentheses)
    const ast2 = parse('Patient.getName') as any;
    expect(ast2.kind).toBe('dot');
    expect(ast2.right.kind).toBe('identifier');
    expect(ast2.right.name).toBe('getName');
  });

  test('should parse functions with special characters in arguments', () => {
    const ast = parse("Patient.customSearch('name=O\\'Brien', 'city=New York')") as any;
    expect(ast.kind).toBe('dot');
    expect(ast.right.kind).toBe('function');
    expect(ast.right.name).toBe('customSearch');
    expect(ast.right.args).toHaveLength(2);
    expect(ast.right.args[0].value).toBe("name=O'Brien");
    expect(ast.right.args[1].value).toBe("city=New York");
  });

  test('should parse deeply nested custom function calls', () => {
    const ast = parse('a(b(c(d(e(f())))))') as any;
    
    // Verify the nesting
    expect(ast.kind).toBe('function');
    expect(ast.name).toBe('a');
    expect(ast.args).toHaveLength(1);
    
    expect(ast.args[0].kind).toBe('function');
    expect(ast.args[0].name).toBe('b');
    expect(ast.args[0].args).toHaveLength(1);
    
    expect(ast.args[0].args[0].kind).toBe('function');
    expect(ast.args[0].args[0].name).toBe('c');
  });

  test('should handle function calls in all positions', () => {
    // As indexer
    const ast1 = parse('Patient[customIndex()]') as any;
    expect(ast1).toMatchObject({
      kind: 'indexer',
      index: {
        kind: 'function',
        name: 'customIndex'
      }
    });

    // In binary expressions
    const ast2 = parse('customLeft() + customRight()') as any;
    expect(ast2).toMatchObject({
      kind: 'binary',
      left: {
        kind: 'function',
        name: 'customLeft'
      },
      right: {
        kind: 'function',
        name: 'customRight'
      }
    });

    // As unary operand
    const ast3 = parse('-customPredicate()') as any;
    expect(ast3).toMatchObject({
      kind: 'unary',
      operand: {
        kind: 'function',
        name: 'customPredicate'
      }
    });
  });

  test('should parse custom functions with all argument types', () => {
    const ast = parse('customFunc(42, \'string\', true, @2023-01-01, @T12:30:00, @2023-01-01T12:30:00Z, 5 \'mg\', $this, %resource, Patient.name, otherFunc())') as any;
    //printAST(ast);

    expect(ast.kind).toBe('function');
    expect(ast.name).toBe('customFunc');
    expect(ast.args).toHaveLength(11);
    
    // Verify argument types
    expect(ast.args[0].kind).toBe('literal');
    expect(ast.args[0].dataType).toBe('number');
    expect(ast.args[1].kind).toBe('literal');
    expect(ast.args[1].dataType).toBe('string');
    expect(ast.args[2].kind).toBe('literal');
    expect(ast.args[2].dataType).toBe('boolean');
    expect(ast.args[3].kind).toBe('literal');
    expect(ast.args[3].dataType).toBe('date');
    expect(ast.args[4].kind).toBe('literal');
    expect(ast.args[4].dataType).toBe('time');
    expect(ast.args[5].kind).toBe('literal');
    expect(ast.args[5].dataType).toBe('datetime');
    expect(ast.args[6].kind).toBe('literal');
    expect(ast.args[6].dataType).toBe('quantity');
    expect(ast.args[7].kind).toBe('variable');
    expect(ast.args[8].kind).toBe('envVariable');
    expect(ast.args[9].kind).toBe('dot');
    expect(ast.args[10].kind).toBe('function');
  });
});