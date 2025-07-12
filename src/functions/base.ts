/**
 * FHIRPath Function Interface and Base Utilities
 * 
 * Defines the contract for FHIRPath function implementations with type information,
 * compilation logic, and evaluation capabilities.
 */

import type { FHIRPathType } from '../type-system';
import type { FunctionSignature } from '../typed-nodes';
import type { FunctionCallNode, ASTNode } from '../types';
import type { EvaluationContext, CompiledNode } from '../compiler-types';

/**
 * Runtime context passed to function implementations
 */
export interface RuntimeContext {
  /** The focus/context value (what $this refers to) */
  focus: any;
  /** The root resource (what $resource refers to) */
  resource?: any;
  /** Environment variables */
  environment?: Record<string, any>;
  /** Custom variables */
  variables?: Record<string, any>;
}

/**
 * Context available during compilation
 */
export interface CompilerContext {
  /** Compile an AST node to executable function */
  compileNode(node: ASTNode): CompiledExpression;
  /** Get the current variable scope */
  getVariableScope(): Map<string, any>;
  /** Check if in a collection context */
  isCollectionContext(): boolean;
  /** Report a compilation error */
  reportError(message: string, node: ASTNode): void;
}

/**
 * Compiled expression that can be executed
 */
export type CompiledExpression = (data: any, env: EvaluationContext) => any;

/**
 * Core FHIRPath function interface
 */
export interface FHIRPathFunction {
  /** Function name as used in FHIRPath expressions */
  name: string;
  
  /** Function category for documentation and organization */
  category: 'collection' | 'string' | 'math' | 'logical' | 'existence' | 
           'navigation' | 'date' | 'type' | 'utility';
  
  /** Human-readable description */
  description: string;
  
  /** Function signature with parameter definitions */
  signature: FunctionSignature;
  
  /** 
   * Either a fixed return type or a function to infer it.
   * If returnType is provided, inferReturnType is ignored.
   */
  returnType?: FHIRPathType;
  
  /**
   * Infer the return type based on context and parameters.
   * Only used if returnType is not provided.
   */
  inferReturnType?: (
    context: RuntimeContext,
    contextType: FHIRPathType | undefined,
    paramTypes: FHIRPathType[],
    ast: FunctionCallNode
  ) => FHIRPathType;
  
  /**
   * Compile the function call to an executable expression.
   * This is where the main logic goes, often delegating to evaluate().
   */
  compile: (context: CompilerContext, ast: FunctionCallNode) => CompiledExpression;
  
  /**
   * Core evaluation function that can be tested independently.
   * This should be a pure function when possible.
   */
  evaluate?: (...args: any[]) => any;
  
  /**
   * Optional validation function for additional parameter checking
   */
  validate?: (ast: FunctionCallNode, contextType?: FHIRPathType) => string[];
  
  /**
   * Performance hints
   */
  hints?: {
    /** Function has no side effects */
    pure?: boolean;
    /** Function always returns same result for same inputs */
    deterministic?: boolean;
    /** Function can be evaluated at compile time with literal args */
    constant?: boolean;
  };
}

/**
 * Utility function to ensure a value is an array
 */
export function ensureArray(value: any): any[] {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Check if a value is truthy in FHIRPath (handles empty collections)
 */
export function isTruthy(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(v => v === true);
  }
  return Boolean(value);
}

/**
 * Check if a value is empty in FHIRPath
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Get a single value from a collection (for functions that expect single values)
 */
export function getSingleValue(value: any): any {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return undefined;
    }
    if (value.length === 1) {
      return value[0];
    }
    throw new Error('Multiple values where single value expected');
  }
  return value;
}

/**
 * Base class for function implementations (optional)
 */
export abstract class BaseFHIRPathFunction implements FHIRPathFunction {
  abstract name: string;
  abstract category: FHIRPathFunction['category'];
  abstract description: string;
  abstract signature: FunctionSignature;
  
  returnType?: FHIRPathType;
  
  inferReturnType?(
    context: RuntimeContext,
    contextType: FHIRPathType | undefined,
    paramTypes: FHIRPathType[],
    ast: FunctionCallNode
  ): FHIRPathType {
    // Default implementation returns the fixed returnType if available
    if (this.returnType) {
      return this.returnType;
    }
    throw new Error(`No return type inference for function ${this.name}`);
  }
  
  abstract compile(context: CompilerContext, ast: FunctionCallNode): CompiledExpression;
  
  validate?(ast: FunctionCallNode, contextType?: FHIRPathType): string[] {
    // Default validation is handled by function registry
    return [];
  }
}

/**
 * Helper to create a simple function implementation
 */
export function createSimpleFunction(
  config: Omit<FHIRPathFunction, 'compile'> & {
    implementation: (...args: any[]) => any;
  }
): FHIRPathFunction {
  return {
    ...config,
    compile: (compiler, ast) => {
      const argExprs = ast.args.map(arg => compiler.compileNode(arg));
      
      return (data, env) => {
        // In FHIRPath, the context is the data parameter
        const argValues = argExprs.map(expr => expr(data, env));
        return config.implementation(data, ...argValues);
      };
    },
    evaluate: config.implementation
  };
}