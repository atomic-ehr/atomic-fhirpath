/**
 * FHIRPath max() function
 * 
 * Returns the maximum numeric value in the collection.
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
 * Core implementation of max() function
 */
export function max(collection: any[]): number | null {
  if (!Array.isArray(collection) || collection.length === 0) {
    return null; // Empty collection returns empty per spec
  }
  
  let maximum: number | null = null;
  let hasDecimal = false;
  
  for (const item of collection) {
    if (item === null || item === undefined) {
      continue; // Skip null/undefined values
    }
    
    if (typeof item !== 'number') {
      throw new Error('max() requires numeric input');
    }
    
    // Track if we have any decimal values
    if (!Number.isInteger(item)) {
      hasDecimal = true;
    }
    
    if (maximum === null || item > maximum) {
      maximum = item;
    }
  }
  
  return maximum;
}

/**
 * FHIRPath max() function implementation
 */
export const maxFunction: FHIRPathFunction = {
  name: 'max',
  category: 'math',
  description: 'Returns the maximum numeric value in the collection',
  
  signature: {
    name: 'max',
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
      // max() always operates on collections
      if (!Array.isArray(data)) {
        data = data === null || data === undefined ? [] : [data];
      }
      
      const result = max(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: max,
  
  hints: {
    pure: true,
    deterministic: true
  }
};