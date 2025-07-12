/**
 * FHIRPath Function Executor
 * 
 * Manages function execution with proper error handling and context management.
 * Provides a bridge between the compiler and function implementations.
 */

import type { FHIRPathFunction, CompilerContext } from './functions';
import type { FunctionCallNode } from './types';
import type { CompiledExpression } from './functions/base';
import type { EvaluationContext } from './compiler-types';
import { functionRegistry } from './function-registry';

/**
 * Function execution error with context
 */
export class FunctionExecutionError extends Error {
  constructor(
    public functionName: string,
    public originalError: Error,
    public context?: any
  ) {
    super(`Error executing function '${functionName}': ${originalError.message}`);
    this.name = 'FunctionExecutionError';
    this.stack = originalError.stack;
  }
}

/**
 * Function executor that manages function compilation and execution
 */
export class FunctionExecutor {
  private customFunctions = new Map<string, FHIRPathFunction>();
  
  constructor(
    private registry: typeof functionRegistry = functionRegistry
  ) {}
  
  /**
   * Register a custom function
   */
  registerCustomFunction(func: FHIRPathFunction): void {
    this.customFunctions.set(func.name, func);
  }
  
  /**
   * Unregister a custom function
   */
  unregisterCustomFunction(name: string): boolean {
    return this.customFunctions.delete(name);
  }
  
  /**
   * Get a function by name (custom or built-in)
   */
  getFunction(name: string): FHIRPathFunction | undefined {
    // Check custom functions first (allows overriding built-ins)
    const customFunc = this.customFunctions.get(name);
    if (customFunc) {
      return customFunc;
    }
    
    // Then check built-in functions
    return this.registry.getFunction(name);
  }
  
  /**
   * Check if a function exists
   */
  hasFunction(name: string): boolean {
    return this.customFunctions.has(name) || this.registry.has(name);
  }
  
  /**
   * Compile a function call
   */
  compileFunction(
    compiler: CompilerContext,
    ast: FunctionCallNode
  ): CompiledExpression {
    const func = this.getFunction(ast.name);
    
    if (!func) {
      // Check if it's a custom function in the evaluation context
      return this.compileContextFunction(compiler, ast);
    }
    
    try {
      return func.compile(compiler, ast);
    } catch (error) {
      throw new FunctionExecutionError(
        ast.name,
        error as Error,
        { ast }
      );
    }
  }
  
  /**
   * Compile a function from the evaluation context
   */
  private compileContextFunction(
    compiler: CompilerContext,
    ast: FunctionCallNode
  ): CompiledExpression {
    // Compile arguments
    const argExprs = ast.args.map(arg => compiler.compileNode(arg));
    
    return (data: any, env: EvaluationContext) => {
      const customFunc = env.functions?.[ast.name];
      
      if (!customFunc) {
        throw new Error(`Unknown function: ${ast.name}`);
      }
      
      // Evaluate arguments
      const argValues = argExprs.map(expr => expr(data, env));
      
      try {
        // Call custom function with context as first argument
        return customFunc(data, ...argValues);
      } catch (error) {
        throw new FunctionExecutionError(
          ast.name,
          error as Error,
          { data, args: argValues }
        );
      }
    };
  }
  
  /**
   * Get all available function names
   */
  getAllFunctionNames(): string[] {
    const builtInNames = this.registry.getAllNames();
    const customNames = Array.from(this.customFunctions.keys());
    
    // Combine and deduplicate
    return Array.from(new Set([...builtInNames, ...customNames]));
  }
  
  /**
   * Get functions by category
   */
  getFunctionsByCategory(category: string): string[] {
    const result: string[] = [];
    
    // Built-in functions
    const builtInByCategory = this.registry.getByCategory(category);
    for (const name of Array.from(builtInByCategory.keys())) {
      result.push(name);
    }
    
    // Custom functions
    for (const [name, func] of Array.from(this.customFunctions)) {
      if (func.category === category) {
        result.push(name);
      }
    }
    
    return result;
  }
  
  /**
   * Validate a function call
   */
  validateFunctionCall(ast: FunctionCallNode): string[] {
    const errors: string[] = [];
    
    const func = this.getFunction(ast.name);
    if (!func) {
      // Will be checked at runtime for context functions
      return errors;
    }
    
    // Check arity
    const argCount = ast.args.length;
    const sig = func.signature;
    
    if (argCount < sig.minArity) {
      errors.push(
        `Function '${ast.name}' requires at least ${sig.minArity} arguments, got ${argCount}`
      );
    }
    
    if (!sig.isVariadic && argCount > sig.maxArity) {
      errors.push(
        `Function '${ast.name}' accepts at most ${sig.maxArity} arguments, got ${argCount}`
      );
    }
    
    // Additional validation from function
    if (func.validate) {
      const additionalErrors = func.validate(ast);
      errors.push(...additionalErrors);
    }
    
    return errors;
  }
}

// Global function executor instance
export const functionExecutor = new FunctionExecutor();