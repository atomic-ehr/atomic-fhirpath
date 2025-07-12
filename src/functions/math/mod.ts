/**
 * FHIRPath mod() function
 * 
 * Returns the modulo (remainder) of integer division.
 * This is the function form of the mod operator.
 * The result has the same sign as the dividend (first operand).
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of mod() function
 */
export function mod(value: number | null | undefined, divisor: number | null | undefined): number | null {
  if (value === null || value === undefined || divisor === null || divisor === undefined) {
    return null;
  }
  
  if (typeof value !== 'number' || typeof divisor !== 'number') {
    throw new Error('mod() requires numeric inputs');
  }
  
  if (divisor === 0) {
    throw new Error('Division by zero');
  }
  
  // JavaScript % operator already gives the result with sign of dividend
  // For integers, this is what we want
  const result = value % divisor;
  
  // Convert -0 to 0
  return Object.is(result, -0) ? 0 : result;
}

/**
 * FHIRPath mod() function implementation
 */
export const modFunction: FHIRPathFunction = {
  name: 'mod',
  category: 'math',
  description: 'Returns the modulo (remainder) of integer division',
  
  signature: {
    name: 'mod',
    parameters: [
      {
        name: 'divisor',
        type: 'System.Integer',
        documentation: 'The divisor for modulo operation'
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
        return data.map(item => mod(item, divisorValue)).filter(v => v !== null);
      }
      
      // Handle single values
      const result = mod(data, divisorValue);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: mod,
  
  hints: {
    pure: true,
    deterministic: true
  }
};