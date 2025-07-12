/**
 * FHIRPath sum() function
 * 
 * Returns the sum of all numeric values in the collection.
 * Returns 0 for empty collections.
 * Filters out null/undefined values.
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE, DECIMAL_TYPE, FHIRPathType } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext, RuntimeContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of sum() function
 */
export function sum(collection: any[]): number {
  if (!Array.isArray(collection) || collection.length === 0) {
    return 0; // Empty collection returns 0 per spec
  }
  
  let total = 0;
  let hasDecimal = false;
  
  for (const item of collection) {
    if (item === null || item === undefined) {
      continue; // Skip null/undefined values
    }
    
    if (typeof item !== 'number') {
      throw new Error('sum() requires numeric input');
    }
    
    // Track if we have any decimal values
    if (!Number.isInteger(item)) {
      hasDecimal = true;
    }
    
    total += item;
  }
  
  // Return integer if all inputs were integers and result is whole
  if (!hasDecimal && Number.isInteger(total)) {
    return total;
  }
  
  return total;
}

/**
 * FHIRPath sum() function implementation
 */
export const sumFunction: FHIRPathFunction = {
  name: 'sum',
  category: 'math',
  description: 'Returns the sum of all numeric values in the collection',
  
  signature: {
    name: 'sum',
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
      // sum() always operates on collections
      if (!Array.isArray(data)) {
        data = data === null || data === undefined ? [] : [data];
      }
      
      const result = sum(data);
      return [result];
    };
  },
  
  evaluate: sum,
  
  hints: {
    pure: true,
    deterministic: true
  }
};