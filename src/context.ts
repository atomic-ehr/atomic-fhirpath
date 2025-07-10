import type { EvaluationContext, CompiledNode } from './compiler-types';

/**
 * Create a new evaluation context with caching enabled
 * 
 * @param options - Optional configuration for the context
 * @returns A new evaluation context
 */
export function createContext(options?: {
  variables?: Record<string, any>;
  functions?: Record<string, Function>;
  cacheSize?: number;
}): EvaluationContext {
  const ctx: EvaluationContext = {
    _cache: new Map<string, CompiledNode>(),
    variables: options?.variables || {},
    functions: options?.functions || {}
  };
  
  // If cacheSize is specified, implement LRU eviction
  if (options?.cacheSize) {
    const maxSize = options.cacheSize;
    const originalSet = ctx._cache.set.bind(ctx._cache);
    
    ctx._cache.set = function(key: string, value: CompiledNode) {
      // Remove oldest entry if at capacity
      if (this.size >= maxSize && !this.has(key)) {
        const firstKey = this.keys().next().value;
        this.delete(firstKey);
      }
      
      // If key exists, delete and re-add to move to end
      if (this.has(key)) {
        this.delete(key);
      }
      
      return originalSet(key, value);
    };
  }
  
  return ctx;
}

/**
 * Clear the cache in an evaluation context
 * 
 * @param ctx - The evaluation context
 */
export function clearCache(ctx: EvaluationContext): void {
  ctx._cache?.clear();
}

/**
 * Get cache statistics for an evaluation context
 * 
 * @param ctx - The evaluation context
 * @returns Cache statistics
 */
export function getCacheStats(ctx: EvaluationContext): {
  size: number;
  expressions: string[];
} {
  if (!ctx._cache) {
    return { size: 0, expressions: [] };
  }
  
  return {
    size: ctx._cache.size,
    expressions: Array.from(ctx._cache.keys())
  };
}

/**
 * Pre-compile expressions into the context cache
 * 
 * @param ctx - The evaluation context
 * @param expressions - Array of FHIRPath expressions to pre-compile
 */
export function precompile(ctx: EvaluationContext, expressions: string[]): void {
  // Import inline to avoid circular dependency
  const { evaluate } = require('./evaluate');
  
  for (const expr of expressions) {
    // Compile with empty data - just to populate cache
    evaluate(ctx, expr, {});
  }
}