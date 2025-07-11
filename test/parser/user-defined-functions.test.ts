import { describe, test, expect } from 'bun:test';
import { parse, type FunctionCallNode } from '../../src';

describe('User-defined functions', () => {
  test('should parse simple user-defined function calls', () => {
    const ast = parse('Patient.name.myCustomFunction()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('myCustomFunction');
    expect((ast as any).right.args).toHaveLength(0);
  });

  test('should parse user-defined functions with arguments', () => {
    const ast = parse('Patient.name.myCustomFunction(given, family)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('myCustomFunction');
    expect((ast as any).right.args).toHaveLength(2);
    expect((ast as any).right.args[0].kind).toBe('identifier');
    expect((ast as any).right.args[0].name).toBe('given');
    expect((ast as any).right.args[1].kind).toBe('identifier');
    expect((ast as any).right.args[1].name).toBe('family');
  });

  test('should parse user-defined functions with complex arguments', () => {
    const ast = parse('Patient.processName(name.given.first(), name.family + " suffix")');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('processName');
    expect((ast as any).right.args).toHaveLength(2);
    
    // First argument is a function call
    expect((ast as any).right.args[0].kind).toBe('dot');
    expect((ast as any).right.args[0].right.kind).toBe('function');
    expect((ast as any).right.args[0].right.name).toBe('first');
    
    // Second argument is a binary expression
    expect((ast as any).right.args[1].kind).toBe('binary');
    expect((ast as any).right.args[1].left.kind).toBe('dot');
    expect((ast as any).right.args[1].right.kind).toBe('literal');
  });

  test('should parse camelCase user-defined functions', () => {
    const ast = parse('Observation.calculateBMI(1,2)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('calculateBMI');
  });

  test('should parse snake_case user-defined functions', () => {
    const ast = parse('Patient.get_full_name()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('get_full_name');
  });

  test('should parse user-defined functions with numeric suffixes', () => {
    const ast = parse('Observation.getValue2()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('getValue2');
  });

  test('should parse user-defined functions at root level', () => {
    const ast = parse('myGlobalFunction(Patient, Observation)');
    expect(ast.kind).toBe('function');
    expect((ast as any).kind).toBe('function');
    expect((ast as any).name).toBe('myGlobalFunction');
    expect((ast as any).args).toHaveLength(2);
    expect((ast as any).args[0].kind).toBe('identifier');
    expect((ast as any).args[0].name).toBe('Patient');
    expect((ast as any).args[1].kind).toBe('identifier');
    expect((ast as any).args[1].name).toBe('Observation');
  });

  test('should parse chained user-defined functions', () => {
    const ast = parse('Patient.customTransform().anotherTransform().formatOutput()');
    
    // Verify the chain structure
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('formatOutput');
    
    expect((ast as any).left.kind).toBe('dot');
    expect((ast as any).left.right.kind).toBe('function');
    expect((ast as any).left.right.name).toBe('anotherTransform');
    
    expect((ast as any).left.left.kind).toBe('dot');
    expect((ast as any).left.left.right.kind).toBe('function');
    expect((ast as any).left.left.right.name).toBe('customTransform');
  });

  test('should parse user-defined functions mixed with built-in functions', () => {
    const ast = parse('Patient.name.where(use = "official").customFormat().first()');
    
    // The expression should parse correctly mixing built-in and custom functions
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('first');
    
    // Check the customFormat function
    expect((ast as any).left.kind).toBe('dot');
    expect((ast as any).left.right.kind).toBe('function');
    expect((ast as any).left.right.name).toBe('customFormat');
  });

  test('should parse user-defined functions with literals as arguments', () => {
    const ast = parse('Patient.customAge(18, "years", true, 3.14)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('customAge');
    expect((ast as any).right.args).toHaveLength(4);
    
    expect((ast as any).right.args[0].kind).toBe('literal');
    expect((ast as any).right.args[0].value).toBe(18);
    expect((ast as any).right.args[1].kind).toBe('literal');
    expect((ast as any).right.args[1].value).toBe('years');
    expect((ast as any).right.args[2].kind).toBe('literal');
    expect((ast as any).right.args[2].value).toBe(true);
    expect((ast as any).right.args[3].kind).toBe('literal');
    expect((ast as any).right.args[3].value).toBe(3.14);
  });

  test('should parse user-defined functions with date/time arguments', () => {
    const ast = parse('Patient.calculateAge(@2023-01-01, @2024-01-01T12:30:00Z)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('calculateAge');
    expect((ast as any).right.args).toHaveLength(2);
    
    expect((ast as any).right.args[0].kind).toBe('literal');
    expect((ast as any).right.args[0].dataType).toBe('date');
    expect((ast as any).right.args[1].kind).toBe('literal');
    expect((ast as any).right.args[1].dataType).toBe('datetime');
  });

  test('should parse user-defined functions with variables', () => {
    const ast = parse('Patient.customProcess($this, %resource)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('customProcess');
    expect((ast as any).right.args).toHaveLength(2);
    
    expect((ast as any).right.args[0].kind).toBe('variable');
    expect((ast as any).right.args[0].name).toBe('this');
    expect((ast as any).right.args[1].kind).toBe('envVariable');
    expect((ast as any).right.args[1].name).toBe('resource');
  });

  test('should parse user-defined functions in indexer expressions', () => {
    const ast = parse('Patient.name[customPredicate()]');
    expect(ast.kind).toBe('indexer');
    expect((ast as any).index.kind).toBe('function');
    expect((ast as any).index.name).toBe('customPredicate');
  });

  test('should parse user-defined functions with lambda-like expressions', () => {
    const ast = parse('Patient.customWhere(name.given.exists() and name.family.exists())');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('customWhere');
    expect((ast as any).right.args).toHaveLength(1);
    expect((ast as any).right.args[0].kind).toBe('binary');
  });

  test('should handle reserved words that look like custom functions', () => {
    // These should still be parsed as built-in keywords when standalone
    let ast = parse('exists()');
    expect(ast.kind).toBe('function');
    expect((ast as any).name).toBe('exists');
    
    // But allow them in custom function names
    ast = parse('Patient.existsCustom()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('existsCustom');
    
    ast = parse('Patient.myExists()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('myExists');
  });

  test('should parse very long user-defined function names', () => {
    const ast = parse('Patient.thisIsAVeryLongUserDefinedFunctionNameThatShouldStillParse()');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('thisIsAVeryLongUserDefinedFunctionNameThatShouldStillParse');
  });

  test('should parse user-defined functions with quantity arguments', () => {
    const ast = parse("Observation.convertUnit(80 'kg', 'lbs')");
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('convertUnit');
    expect((ast as any).right.args).toHaveLength(2);
    
    expect((ast as any).right.args[0]!.kind).toBe('literal');
    expect((ast as any).right.args[0]!.dataType).toBe('quantity');
    expect((ast as any).right.args[0]!.value).toBe("80 'kg'");
  });

  test('should parse nested user-defined function calls', () => {
    const ast = parse('Patient.outerFunction(innerFunction(x, y), z)');
    expect(ast.kind).toBe('dot');
    expect((ast as any).right.kind).toBe('function');
    expect((ast as any).right.name).toBe('outerFunction');
    expect((ast as any).right.args).toHaveLength(2);
    
    expect((ast as any).right.args[0].kind).toBe('function');
    expect((ast as any).right.args[0].name).toBe('innerFunction');
    expect((ast as any).right.args[0].args).toHaveLength(2);
  });
});