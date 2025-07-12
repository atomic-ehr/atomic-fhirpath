/**
 * FHIRPath div() function
 * 
 * Performs integer division (truncated division).
 * This is the function form of the div operator.
 * Returns the integer quotient of dividing the context by the divisor.
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of div() function
 */
export function div(value: number | null | undefined, divisor: number | null | undefined): number | null {
  if (value === null || value === undefined || divisor === null || divisor === undefined) {
    return null;
  }
  
  if (typeof value !== 'number' || typeof divisor !== 'number') {
    throw new Error('div() requires numeric inputs');
  }
  
  if (divisor === 0) {
    throw new Error('Division by zero');
  }
  
  // Integer division - truncate towards zero
  const result = Math.trunc(value / divisor);
  
  // Convert -0 to 0
  return Object.is(result, -0) ? 0 : result;
}

/**
 * FHIRPath div() function implementation
 */
export const divFunction: FHIRPathFunction = {
  name: 'div',
  category: 'math',
  description: 'Performs integer division (truncated division)',
  
  signature: {
    name: 'div',
    parameters: [
      {
        name: 'divisor',
        type: 'System.Decimal',
        documentation: 'The divisor to divide by'
      }
    ],
    returnType: INTEGER_TYPE,
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  
  returnType: INTEGER_TYPE, // Always returns integer
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    // Compile the divisor argument
    const divisorExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      // Get divisor value
      const divisorResult = divisorExpr(data, env);
      const divisorValue = Array.isArray(divisorResult) ? divisorResult[0] : divisorResult;
      
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => div(item, divisorValue)).filter(v => v !== null);
      }
      
      // Handle single values
      const result = div(data, divisorValue);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: div,
  
  hints: {
    pure: true,
    deterministic: true
  }
};