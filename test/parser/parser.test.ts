import { test, expect, describe } from 'bun:test';
import { parse, astToString, visitAST, clearCache, printAST } from '../../src';
import { Tokenizer } from '../../src/tokenizer';
import { TokenType, ParseError } from '../../src/types';

describe('Tokenizer', () => {
  test('should tokenize simple identifiers', () => {
    const tokenizer = new Tokenizer();
    tokenizer.reset('name');
    
    const token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.IDENTIFIER);
    expect(token.value).toBe('name');
  });

  test('should tokenize numbers', () => {
    const tokenizer = new Tokenizer();
    
    tokenizer.reset('42');
    let token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.NUMBER);
    expect(token.value).toBe('42');
    
    tokenizer.reset('3.14159');
    token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.NUMBER);
    expect(token.value).toBe('3.14159');
  });

  test('should tokenize strings', () => {
    const tokenizer = new Tokenizer();
    
    tokenizer.reset("'hello world'");
    let token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.STRING);
    expect(token.value).toBe('hello world');
    
    tokenizer.reset('"hello world"');
    token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.STRING);
    expect(token.value).toBe('hello world');
  });

  test('should tokenize operators', () => {
    const tokenizer = new Tokenizer();
    const operators = [
      ['+', TokenType.PLUS],
      ['-', TokenType.MINUS],
      ['*', TokenType.MULTIPLY],
      ['/', TokenType.DIVIDE],
      ['=', TokenType.EQUALS],
      ['!=', TokenType.NOT_EQUALS],
      ['<', TokenType.LESS_THAN],
      ['>', TokenType.GREATER_THAN],
      ['<=', TokenType.LESS_EQUALS],
      ['>=', TokenType.GREATER_EQUALS],
      ['and', TokenType.AND],
      ['or', TokenType.OR],
    ];
    
    for (const [op, type] of operators) {
      tokenizer.reset(op);
      const token = tokenizer.nextToken();
      expect(token.type).toBe(type);
    }
  });

  test('should tokenize date/time literals', () => {
    const tokenizer = new Tokenizer();
    
    tokenizer.reset('@2023-01-01');
    let token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.DATE);
    expect(token.value).toBe('2023-01-01');
    
    tokenizer.reset('@2023-01-01T12:30:00');
    token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.DATETIME);
    expect(token.value).toBe('2023-01-01T12:30:00');
    
    tokenizer.reset('@T12:30:00');
    token = tokenizer.nextToken();
    expect(token.type).toBe(TokenType.TIME);
    expect(token.value).toBe('12:30:00');
  });
});

describe('Parser', () => {
  // Clear cache before each test
  clearCache();

  test('should parse simple identifiers', () => {
    const ast = parse('name');
    expect(ast.kind).toBe('identifier');
    expect((ast as any).name).toBe('name');
  });

  test('should parse literals', () => {
    let ast = parse('42');
    expect(ast.kind).toBe('literal');
    expect((ast as any).value).toBe(42);
    
    ast = parse("'hello'");
    expect(ast.kind).toBe('literal');
    expect((ast as any).value).toBe('hello');
    
    ast = parse('true');
    expect(ast.kind).toBe('literal');
    expect((ast as any).value).toBe(true);
    
    ast = parse('false');
    expect(ast.kind).toBe('literal');
    expect((ast as any).value).toBe(false);
  });

  test('should parse binary expressions', () => {
    const ast = parse('1 + 2');
    expect(ast.kind).toBe('binary');
    expect((ast as any).op).toBe(TokenType.PLUS);
    expect((ast as any).left.value).toBe(1);
    expect((ast as any).right.value).toBe(2);
  });

  test('should respect operator precedence', () => {
    const ast = parse('1 + 2 * 3');
    expect(ast.kind).toBe('binary');
    expect((ast as any).op).toBe(TokenType.PLUS);
    expect((ast as any).left.value).toBe(1);
    expect((ast as any).right.kind).toBe('binary');
    expect((ast as any).right.op).toBe(TokenType.MULTIPLY);
    expect((ast as any).right.left.value).toBe(2);
    expect((ast as any).right.right.value).toBe(3);
    
    // With parentheses
    const ast2 = parse('(1 + 2) * 3');
    expect(ast2.kind).toBe('binary');
    expect((ast2 as any).op).toBe(TokenType.MULTIPLY);
    expect((ast2 as any).left.kind).toBe('binary');
    expect((ast2 as any).left.op).toBe(TokenType.PLUS);
  });

  test('should parse unary expressions', () => {
    let ast = parse('-42');
    expect(ast.kind).toBe('unary');
    expect((ast as any).op).toBe(TokenType.MINUS);
    expect((ast as any).operand.value).toBe(42);
    
    ast = parse('+42');
    expect(ast.kind).toBe('unary');
    expect((ast as any).op).toBe(TokenType.PLUS);
    expect((ast as any).operand.value).toBe(42);
  });

  test('should parse dot expressions', () => {
    const ast = parse('Patient.name');
    expect(ast.kind).toBe('dot');
    console.log(ast);
    expect((ast as any).left.name).toBe('Patient');
    expect((ast as any).right.name).toBe('name');
  });

  test('should parse chained dot expressions', () => {
    const ast = parse('Patient.name.given');
    expect(ast.kind).toBe('dot');
    expect((ast as any).left.kind).toBe('dot');
    expect((ast as any).right.name).toBe('given');
  });

  test('should parse function calls', () => {
    let ast = parse('exists()');
    expect(ast.kind).toBe('function');
    expect((ast as any).name).toBe('exists');
    expect((ast as any).args).toHaveLength(0);
    
    ast = parse('substring(0, 5)');
    expect(ast.kind).toBe('function');
    expect((ast as any).name).toBe('substring');
    expect((ast as any).args).toHaveLength(2);
    expect((ast as any).args[0].value).toBe(0);
    expect((ast as any).args[1].value).toBe(5);
  });

  test('should parse indexer expressions', () => {
    const ast = parse('items[0]');
    expect(ast.kind).toBe('indexer');
    expect((ast as any).expr.name).toBe('items');
    expect((ast as any).index.value).toBe(0);
  });

  test('should parse complex expressions', () => {
    // Test complex chained operations
    const ast = parse("Patient.name.given");
    expect(ast.kind).toBe('dot');
    expect((ast as any).left.kind).toBe('dot');
    expect((ast as any).left.left.name).toBe('Patient');
    expect((ast as any).left.right.name).toBe('name');
    expect((ast as any).right.name).toBe('given');
  });

  test('should parse FHIRPath specification examples', () => {
    // Test various real FHIRPath expressions
    const validExpressions = [
      // Navigation
      'Patient.name',
      'Patient.name.given',
      'Patient.name[0].given[0]',
      'Observation.value',
      
      // Arithmetic with precedence
      '1 + 2 * 3',
      '(weight / (height * height)) * 10000',
      
      // Comparisons
      'age > 18',
      'value < 100 and value > 0',
      'status = "active" or status = "completed"',
      
      // Functions
      'name.exists()',
      'telecom.empty()',
      'identifier.count()',
      'given.first()',
      'given.last()',
      
      // Complex expressions
      'Patient.name.given[0] + " " + Patient.name.family',
      'active and (gender = "male" or gender = "female")',
      
      // Union operator
      'name | contact.name',
      
      // Function calls on paths
      'value.ofType(Quantity)',
      'name.union(contact.name)',
      'given.distinct()',
    ];
    
    for (const expr of validExpressions) {
      try {
        parse(expr);
      } catch (e: any) {
        throw new Error(`Failed to parse: "${expr}" - ${e.message}`);
      }
    }
  });



  test('should handle errors gracefully', () => {
    expect(() => parse('')).toThrow(ParseError);
    expect(() => parse('1 +')).toThrow(ParseError);
    expect(() => parse('(1 + 2')).toThrow(ParseError);
    expect(() => parse('name(')).toThrow(ParseError);
  });

  test('should use cache for repeated expressions', () => {
    const expr = 'Patient.name.given';
    const ast1 = parse(expr);
    const ast2 = parse(expr);
    
    // Should be the same object reference when cached
    expect(ast1).toBe(ast2);
    
    // Without cache
    const ast3 = parse(expr, false);
    expect(ast3).not.toBe(ast1);
    expect(astToString(ast3)).toBe(astToString(ast1));
  });
});

describe('AST Visitor', () => {
  test('should visit all nodes', () => {
    const ast = parse('items[0] + 42');
    const visited: string[] = [];
    
    visitAST(ast, {
      visitLiteral: (node) => visited.push(`literal:${node.value}`),
      visitIdentifier: (node) => visited.push(`id:${node.name}`),
      visitBinary: (node) => visited.push('binary'),
      visitIndexer: (node) => visited.push('indexer'),
      visitDot: (node) => visited.push('dot'),
    });
    
    expect(visited).toContain('binary');
    expect(visited).toContain('indexer');
    expect(visited).toContain('id:items');
    expect(visited).toContain('literal:0');
    expect(visited).toContain('literal:42');

  });
});

describe('AST Printer', () => {
  test('should print AST', () => {
    const ast = parse('Patient.name.where(use = "official").given');
    printAST(ast);
  });
});

describe('Performance', () => {
  test('should parse large expressions efficiently', () => {
    // Generate a large expression
    let expr = '1';
    for (let i = 0; i < 100; i++) {
      expr += ` + ${i}`;
    }
    
    const start = performance.now();
    const ast = parse(expr);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10); // Should parse in under 10ms
    expect(ast.kind).toBe('binary');
  });

  test('should benefit from caching', () => {
    const expr = 'Patient.name.given';
    
    // Clear cache first
    clearCache();
    
    // First parse (cold)
    const ast1 = parse(expr);
    
    // Second parse (should be cached)
    const ast2 = parse(expr);
    
    // Should be the same object reference when cached
    expect(ast2).toBe(ast1);
    
    // Without cache should be different object
    const ast3 = parse(expr, false);
    expect(ast3).not.toBe(ast1);
    expect(astToString(ast3)).toBe(astToString(ast1));
  });
});