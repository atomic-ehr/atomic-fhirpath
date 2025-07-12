/**
 * FHIRPath sqrt() function
 * 
 * Returns the square root of a number.
 * Always returns a decimal type.
 */

import { FHIRPathFunction } from '../base';
import { DECIMAL_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of sqrt() function
 */
export function sqrt(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new Error('sqrt() requires numeric input');
  }
  if (value < 0) {
    throw new Error('sqrt() cannot be applied to negative numbers');
  }
  return Math.sqrt(value);
}

/**
 * FHIRPath sqrt() function implementation
 */
export const sqrtFunction: FHIRPathFunction = {
  name: 'sqrt',
  category: 'math',
  description: 'Returns the square root of a number',
  
  signature: {
    name: 'sqrt',
    parameters: [],
    returnType: DECIMAL_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: DECIMAL_TYPE, // Always returns decimal
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    return (data, env) => {
      // Handle collections
      if (Array.isArray(data)) {
        const results = [];
        for (const item of data) {
          try {
            const value = sqrt(item);
            if (value !== null) results.push(value);
          } catch (e) {
            // Skip items that cause errors (e.g., negative numbers)
            // Per FHIRPath spec, errors in collection processing are skipped
          }
        }
        return results;
      }
      
      // Handle single values
      try {
        const result = sqrt(data);
        return result === null ? [] : [result];
      } catch (e) {
        // For single values, propagate the error
        throw e;
      }
    };
  },
  
  evaluate: sqrt,
  
  hints: {
    pure: true,
    deterministic: true
  }
};