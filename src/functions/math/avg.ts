/**
 * FHIRPath avg() function
 * 
 * Returns the average (mean) of all numeric values in the collection.
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
 * Core implementation of avg() function
 */
export function avg(collection: any[]): number | null {
  if (!Array.isArray(collection) || collection.length === 0) {
    return null; // Empty collection returns empty per spec
  }
  
  let total = 0;
  let count = 0;
  let hasDecimal = false;
  
  for (const item of collection) {
    if (item === null || item === undefined) {
      continue; // Skip null/undefined values
    }
    
    if (typeof item !== 'number') {
      throw new Error('avg() requires numeric input');
    }
    
    // Track if we have any decimal values
    if (!Number.isInteger(item)) {
      hasDecimal = true;
    }
    
    total += item;
    count++;
  }
  
  if (count === 0) {
    return null; // No valid numeric values
  }
  
  const average = total / count;
  
  // Return integer if all inputs were integers and result is whole
  if (!hasDecimal && Number.isInteger(average)) {
    return average;
  }
  
  return average;
}

/**
 * FHIRPath avg() function implementation
 */
export const avgFunction: FHIRPathFunction = {
  name: 'avg',
  category: 'math',
  description: 'Returns the average of all numeric values in the collection',
  
  signature: {
    name: 'avg',
    parameters: [],
    returnType: DECIMAL_TYPE, // Can be integer or decimal
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  // Type inference based on input collection
  inferReturnType: (context: RuntimeContext, contextType?: FHIRPathType, paramTypes: FHIRPathType[], ast: FunctionCallNode): FHIRPathType => {
    // Average typically returns decimal unless all inputs are integers and result is whole
    // Since we can't know the result at compile time, we default to decimal
    return DECIMAL_TYPE;
  },
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    return (data, env) => {
      // avg() always operates on collections
      if (!Array.isArray(data)) {
        data = data === null || data === undefined ? [] : [data];
      }
      
      const result = avg(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: avg,
  
  hints: {
    pure: true,
    deterministic: true
  }
};