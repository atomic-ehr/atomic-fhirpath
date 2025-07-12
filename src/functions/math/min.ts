/**
 * FHIRPath min() function
 * 
 * Returns the minimum numeric value in the collection.
 * Returns empty for empty collections or collections with no numeric values.
 * Filters out null/undefined values.
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE, DECIMAL_TYPE, FHIRPathType } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext, RuntimeContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of min() function
 */
export function min(collection: any[]): number | null {
  if (!Array.isArray(collection) || collection.length === 0) {
    return null; // Empty collection returns empty per spec
  }
  
  let minimum: number | null = null;
  let hasDecimal = false;
  
  for (const item of collection) {
    if (item === null || item === undefined) {
      continue; // Skip null/undefined values
    }
    
    if (typeof item !== 'number') {
      throw new Error('min() requires numeric input');
    }
    
    // Track if we have any decimal values
    if (!Number.isInteger(item)) {
      hasDecimal = true;
    }
    
    if (minimum === null || item < minimum) {
      minimum = item;
    }
  }
  
  return minimum;
}

/**
 * FHIRPath min() function implementation
 */
export const minFunction: FHIRPathFunction = {
  name: 'min',
  category: 'math',
  description: 'Returns the minimum numeric value in the collection',
  
  signature: {
    name: 'min',
    parameters: [],
    returnType: DECIMAL_TYPE, // Can be integer or decimal
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  // Type inference based on input collection
  inferReturnType: (context: RuntimeContext, contextType?: FHIRPathType, paramTypes: FHIRPathType[], ast: FunctionCallNode): FHIRPathType => {
    // If all inputs are integers, return integer, otherwise decimal
    if (contextType?.type === 'Collection' && contextType.elementType?.name === 'integer') {
      return INTEGER_TYPE;
    }
    return DECIMAL_TYPE;
  },
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    return (data, env) => {
      // min() always operates on collections
      if (!Array.isArray(data)) {
        data = data === null || data === undefined ? [] : [data];
      }
      
      const result = min(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: min,
  
  hints: {
    pure: true,
    deterministic: true
  }
};