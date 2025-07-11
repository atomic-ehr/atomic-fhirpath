/**
 * FHIRPath Parser - High-performance recursive descent parser
 * 
 * This module provides the main API for parsing FHIRPath expressions.
 * It includes:
 * - Parser and tokenizer exports
 * - Expression caching for performance
 * - AST visitor pattern for traversal
 * - Utility functions for AST manipulation
 */

// Core exports - parser, tokenizer, and types
export { Parser, parser } from './parser';
export { Tokenizer } from './tokenizer';
export * from './types';
export { prettyPrint, printAST } from './ast-printer';
export { formatError, type FormattedError } from './error-formatter';
export { compile, compiler } from './compiler';
export { evaluate } from './evaluate';
export { createContext, clearCache, getCacheStats, precompile } from './context';
export type { CompiledNode, EvalFunction, EvaluationContext } from './compiler-types';

// Type system exports
export * from './type-system';
export * from './typed-nodes';
export * from './function-registry';
export * from './type-inference';
export * from './semantic-validator';
export * from './typed-compiler';
export * from './model-provider';

// Import evaluate locally for fhirpath function
import { evaluate as evaluateFn } from './evaluate';
import type { EvaluationContext } from './compiler-types';

/**
 * FHIRPath evaluation function with a simple API
 * Compatible with test expectations
 * 
 * @param context - The evaluation context (variables, functions, etc.)
 * @param expression - The FHIRPath expression to evaluate
 * @param data - The data to evaluate against
 * @returns The result of evaluation as an array
 */
export function fhirpath(context: any, expression: string, data?: any): any[] {
  // Convert simple context object to EvaluationContext if needed
  const ctx: EvaluationContext = context._cache ? context : { ...context };
  return evaluateFn(ctx, expression, data);
}

/**
 * Compile FHIRPath expression with type inference and validation
 * 
 * @param expression - The FHIRPath expression to compile
 * @param options - Compilation options including type information
 * @returns Compilation result with typed AST and validation errors
 */
export function compileWithTypes(expression: string, options?: import('./typed-compiler').TypedCompilerOptions): import('./typed-compiler').TypedCompilationResult {
  const ast = parse(expression);
  const { TypedCompiler } = require('./typed-compiler');
  const compiler = new TypedCompiler(options);
  return compiler.compile(ast, options?.rootType);
}

/**
 * Validate FHIRPath expression for semantic correctness
 * 
 * @param expression - The FHIRPath expression to validate
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 */
export function validateExpression(expression: string, options?: Partial<import('./semantic-validator').ValidationContext>): import('./semantic-validator').ValidationResult {
  const ast = parse(expression);
  const { TypedNodeUtils } = require('./typed-nodes');
  const { TypeInferenceEngine } = require('./type-inference');
  const { SemanticValidator } = require('./semantic-validator');
  
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const inferredAST = inferrer.inferTypes(typedAST);
  
  const validator = new SemanticValidator(options);
  return validator.validate(inferredAST);
}

/**
 * Create a ModelProvider-aware compilation context
 * 
 * @param modelProvider - The model provider for FHIR schema information
 * @param rootType - The root type for the expression context
 * @returns Configured compilation options
 */
export function createTypedContext(modelProvider?: import('./model-provider').ModelProvider, rootType?: import('./type-system').FHIRPathType): import('./typed-compiler').TypedCompilerOptions {
  return {
    modelProvider,
    rootType,
    strictMode: false,
    allowUnknownFunctions: true,
    performValidation: true
  };
}

import { parser } from './parser';
import type { ASTNode } from './types';
import { ParseError } from './types';
import { formatError } from './error-formatter';

/**
 * Simple LRU (Least Recently Used) cache implementation
 * 
 * Used to cache parsed expressions to avoid re-parsing frequently used
 * FHIRPath expressions. The cache automatically evicts least recently
 * used entries when it reaches capacity.
 * 
 * LRU strategy ensures that frequently used expressions stay in cache
 * while rarely used ones are evicted first.
 */
class LRUCache<K, V> {
  private max: number;           // Maximum number of entries
  private cache: Map<K, V>;      // Map maintains insertion order

  constructor(max: number = 100) {
    this.max = max;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * If found, moves the entry to the end (most recently used)
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // LRU behavior: move accessed item to end
      // Map iteration order is insertion order
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Set a value in the cache
   * Evicts the oldest entry if at capacity
   */
  set(key: K, value: V): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.max) {
      // First key is the oldest due to Map's insertion order
      const firstKey = this.cache.keys().next().value as K;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Global cache for parsed expressions
 * 
 * Caches up to 1000 parsed expressions to improve performance
 * when the same FHIRPath expressions are parsed repeatedly.
 * This is common in FHIR applications where search parameters
 * and constraints are evaluated many times.
 */
const expressionCache = new LRUCache<string, ASTNode>(10000);

/**
 * Parse a FHIRPath expression into an AST
 * 
 * This is the main entry point for parsing FHIRPath expressions.
 * By default, it uses an LRU cache to avoid re-parsing expressions
 * that have been parsed before.
 * 
 * @param expression - The FHIRPath expression to parse
 * @param useCache - Whether to use the expression cache (default: true)
 * @returns The parsed AST
 * @throws ParseError if the expression is invalid
 * 
 * @example
 * const ast = parse('Patient.name.given');
 * const ast2 = parse('Observation.value as Quantity', false); // Skip cache
 */
export function parse(expression: string, useCache: boolean = true): ASTNode {
  // Check cache first for performance
  if (useCache) {
    const cached = expressionCache.get(expression);
    if (cached) {
      return cached;
    }
  }

  try {
    // Parse the expression
    const ast = parser.parse(expression);
    
    // Store in cache for future use
    if (useCache) {
      expressionCache.set(expression, ast);
    }
    
    return ast;
  } catch (error) {
    // If it's a ParseError, enhance it with the formatted message
    if (error instanceof ParseError) {
      const originalExpression = (error as any).expression || expression;
      const formatted = formatError(error, originalExpression);
      
      // Create a new error with the formatted message as the main message
      const enhancedError = new ParseError(
        formatted.formattedMessage,
        error.position,
        error.line,
        error.column
      );
      
      // Store the original message and expression for reference
      (enhancedError as any).originalMessage = error.message;
      (enhancedError as any).expression = originalExpression;
      
      throw enhancedError;
    }
    
    // Re-throw non-ParseError errors
    throw error;
  }
}

/**
 * Clear the parser expression cache
 * 
 * Useful when memory usage is a concern or when expressions
 * are no longer needed. The cache will rebuild as new expressions
 * are parsed.
 */
export function clearParserCache(): void {
  expressionCache.clear();
}

/**
 * AST Visitor interface for traversing parsed expressions
 * 
 * The visitor pattern allows you to perform operations on AST nodes
 * without modifying the node classes themselves. Each visit method
 * is optional, so you only need to implement the ones you care about.
 * 
 * @example
 * const visitor: ASTVisitor = {
 *   visitIdentifier(node) {
 *     console.log('Found identifier:', node.name);
 *   },
 *   visitFunction(node) {
 *     console.log('Found function call:', node.name);
 *   }
 * };
 * visitAST(ast, visitor);
 */
export interface ASTVisitor {
  visitLiteral?(node: import('./types').LiteralNode): void;
  visitIdentifier?(node: import('./types').IdentifierNode): void;
  visitBinary?(node: import('./types').BinaryOpNode): void;
  visitUnary?(node: import('./types').UnaryOpNode): void;
  visitFunction?(node: import('./types').FunctionCallNode): void;
  visitIndexer?(node: import('./types').IndexerNode): void;
  visitDot?(node: import('./types').DotNode): void;
  visitAs?(node: import('./types').AsTypeNode): void;
  visitIs?(node: import('./types').IsTypeNode): void;
  visitVariable?(node: import('./types').VariableNode): void;
  visitEnvVariable?(node: import('./types').EnvironmentVariableNode): void;
  visitNull?(node: import('./types').NullLiteralNode): void;
}

/**
 * Visit all nodes in an AST using the visitor pattern
 * 
 * Performs a depth-first traversal of the AST, calling the appropriate
 * visitor method for each node. The visitor is called for parent nodes
 * before their children.
 * 
 * @param node - The root node to visit
 * @param visitor - The visitor object with visit methods
 * 
 * @example
 * // Count all function calls in an expression
 * let functionCount = 0;
 * visitAST(ast, {
 *   visitFunction(node) {
 *     functionCount++;
 *   }
 * });
 */
export function visitAST(node: ASTNode, visitor: ASTVisitor): void {
  switch (node.kind) {
    case 'literal':
      visitor.visitLiteral?.(node);
      break;
      
    case 'identifier':
      visitor.visitIdentifier?.(node);
      break;
      
    case 'binary':
      // Visit the binary node first, then its children
      visitor.visitBinary?.(node);
      visitAST(node.left, visitor);
      visitAST(node.right, visitor);
      break;
      
    case 'unary':
      // Visit the unary node first, then its operand
      visitor.visitUnary?.(node);
      visitAST(node.operand, visitor);
      break;
      
    case 'function':
      // Visit the function node first, then its arguments
      visitor.visitFunction?.(node);
      for (const arg of node.args) {
        visitAST(arg, visitor);
      }
      break;
      
    case 'indexer':
      // Visit the indexer node, then the expression and index
      visitor.visitIndexer?.(node);
      visitAST(node.expr, visitor);
      visitAST(node.index, visitor);
      break;
      
    case 'dot':
      // Visit the dot node, then left and right sides
      visitor.visitDot?.(node);
      visitAST(node.left, visitor);
      visitAST(node.right, visitor);
      break;
      
    case 'as':
      // Visit the type cast node, then the expression
      visitor.visitAs?.(node);
      visitAST(node.expression, visitor);
      break;
      
    case 'is':
      // Visit the type check node, then the expression
      visitor.visitIs?.(node);
      visitAST(node.expression, visitor);
      break;
      
    case 'variable':
      visitor.visitVariable?.(node);
      break;
      
    case 'envVariable':
      visitor.visitEnvVariable?.(node);
      break;
      
    case 'null':
      visitor.visitNull?.(node);
      break;
  }
}

/**
 * Helper to convert TokenType to operator symbol
 */
function getOperatorSymbol(op: TokenType): string {
  switch (op) {
    case TokenType.DOT: return '.';
    case TokenType.PLUS: return '+';
    case TokenType.MINUS: return '-';
    case TokenType.MULTIPLY: return '*';
    case TokenType.DIVIDE: return '/';
    case TokenType.MOD: return 'mod';
    case TokenType.DIV: return 'div';
    case TokenType.EQUALS: return '=';
    case TokenType.NOT_EQUALS: return '!=';
    case TokenType.LESS_THAN: return '<';
    case TokenType.GREATER_THAN: return '>';
    case TokenType.LESS_EQUALS: return '<=';
    case TokenType.GREATER_EQUALS: return '>=';
    case TokenType.AND: return 'and';
    case TokenType.OR: return 'or';
    case TokenType.IMPLIES: return 'implies';
    case TokenType.XOR: return 'xor';
    case TokenType.PIPE: return '|';
    case TokenType.IN: return 'in';
    case TokenType.CONTAINS: return 'contains';
    case TokenType.AMPERSAND: return '&';
    case TokenType.EQUIVALENCE: return '~';
    case TokenType.NOT_EQUIVALENCE: return '!~';

    default: return `Op${op}`;
  }
}

/**
 * Convert an AST to a string representation (for debugging)
 * 
 * This function reconstructs a string representation of the parsed AST.
 * Useful for debugging, testing, and understanding how expressions are parsed.
 * The output may include extra parentheses to show precedence clearly.
 * 
 * @param node - The AST node to stringify
 * @returns String representation of the AST
 * 
 * @example
 * const ast = parse('Patient.name[0].given');
 * console.log(astToString(ast));
 * // Output: "Patient.name[0].given"
 */
export function astToString(node: ASTNode): string {
  switch (node.kind) {
    case 'literal':
      // Quantities and date/time literals don't need quotes
      if (node.dataType === 'quantity' || node.dataType === 'date' || 
          node.dataType === 'time' || node.dataType === 'datetime') {
        return String(node.value);
      }
      // String literals need quotes, other literals don't
      return typeof node.value === 'string' ? `'${node.value}'` : String(node.value);
      
    case 'identifier':
      return node.name;
      
    case 'binary':
      // Show precedence with parentheses
      return `(${astToString(node.left)} ${getOperatorSymbol(node.op)} ${astToString(node.right)})`;
      
    case 'unary':
      // Unary operators before their operand
      return `(${getOperatorSymbol(node.op)} ${astToString(node.operand)})`;
      
    case 'function':
      // Function name with comma-separated arguments
      return `${node.name}(${node.args.map(astToString).join(', ')})`;
      
    case 'indexer':
      // Expression followed by index in brackets
      return `${astToString(node.expr)}[${astToString(node.index)}]`;
      
    case 'dot':
      // Dot notation for property access
      return `${astToString(node.left)}.${astToString(node.right)}`;
      
    case 'as':
      // Type casting with 'as'
      return `(${astToString(node.expression)} as ${node.targetType})`;
      
    case 'is':
      // Type checking with 'is'
      return `(${astToString(node.expression)} is ${node.targetType})`;
      
    case 'variable':
      // Variables prefixed with $
      return `$${node.name}`;
      
    case 'envVariable':
      // Environment variables prefixed with %
      return `%${node.name}`;
      
    case 'null':
      // Null literal
      return '{}';
  }
}

// Re-export TokenType for astToString to convert operator enums to strings
import { TokenType } from './types';