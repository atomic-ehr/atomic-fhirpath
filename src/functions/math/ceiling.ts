/**
 * FHIRPath ceiling() function
 * 
 * Returns the smallest integer greater than or equal to the input number.
 * Always returns an integer type.
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of ceiling() function
 */
export function ceiling(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new Error('ceiling() requires numeric input');
  }
  const result = Math.ceil(value);
  // Convert -0 to 0 to match expected behavior
  return Object.is(result, -0) ? 0 : result;
}

/**
 * FHIRPath ceiling() function implementation
 */
export const ceilingFunction: FHIRPathFunction = {
  name: 'ceiling',
  category: 'math',
  description: 'Returns the smallest integer greater than or equal to the input',
  
  signature: {
    name: 'ceiling',
    parameters: [],
    returnType: INTEGER_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: INTEGER_TYPE, // Always returns integer
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    return (data, env) => {
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => ceiling(item)).filter(v => v !== null);
      }
      // Handle single values
      const result = ceiling(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: ceiling,
  
  hints: {
    pure: true,
    deterministic: true
  }
};