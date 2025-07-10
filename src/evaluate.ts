import { parser } from './parser';
import { compile } from './compiler';
import type { EvaluationContext, CompiledNode } from './compiler-types';

/**
 * Evaluate a FHIRPath expression against data
 * 
 * @param ctx - The evaluation context (can contain variables, functions, etc.)
 * @param expression - The FHIRPath expression to evaluate
 * @param data - The data to evaluate against (becomes the initial context)
 * @returns The result of evaluation as an array
 */
export function evaluate(ctx: EvaluationContext, expression: string, data?: any): any[] {
  // Initialize cache if not present
  if (!ctx._cache) {
    ctx._cache = new Map<string, CompiledNode>();
  }
  
  // Check cache for compiled expression
  let compiled = ctx._cache.get(expression);
  
  if (!compiled) {
    // Parse and compile if not cached
    const ast = parser.parse(expression);
    compiled = compile(ast);
    
    // Store in cache
    ctx._cache.set(expression, compiled);
  }
  
  // Prepare the initial context
  const initialContext = Array.isArray(data) ? data : [data];
  
  // The root resource is the first item in the context (or the data itself)
  const rootResource = Array.isArray(data) && data.length > 0 ? data[0] : data;
  
  // Evaluate
  return compiled.eval(initialContext, rootResource, ctx);
}