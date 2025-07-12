/**
 * FHIRPath abs() function
 * 
 * Returns the absolute value of a numeric input.
 * Maintains the same numeric type (integer or decimal).
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE, DECIMAL_TYPE, QUANTITY_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of abs() function
 */
export function abs(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new Error('abs() requires numeric input');
  }
  return Math.abs(value);
}

/**
 * FHIRPath abs() function implementation
 */
export const absFunction: FHIRPathFunction = {
  name: 'abs',
  category: 'math',
  description: 'Returns the absolute value of a number',
  
  signature: {
    name: 'abs',
    parameters: [],
    returnType: DECIMAL_TYPE, // Will be overridden by inferReturnType
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  inferReturnType: (context, contextType, paramTypes, ast) => {
    // abs() returns the same numeric type as input
    if (contextType === INTEGER_TYPE || contextType === DECIMAL_TYPE || contextType === QUANTITY_TYPE) {
      return contextType;
    }
    // Default to decimal for other types
    return DECIMAL_TYPE;
  },
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    // abs() has no arguments, it operates on the context
    return (data, env) => {
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => abs(item)).filter(v => v !== null);
      }
      // Handle single values
      const result = abs(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: abs,
  
  hints: {
    pure: true,
    deterministic: true
  }
};

