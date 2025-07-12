/**
 * FHIRPath round() function
 * 
 * Rounds a decimal to the nearest integer, or to a specified precision.
 * Uses "round half away from zero" strategy per FHIRPath spec.
 */

import { FHIRPathFunction, getSingleValue } from '../base';
import { DECIMAL_TYPE, INTEGER_TYPE } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of round() function
 * @param value - The number to round
 * @param precision - Number of decimal places (default 0)
 */
export function round(value: number | null | undefined, precision: number = 0): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number') {
    throw new Error('round() requires numeric input');
  }
  if (!Number.isInteger(precision)) {
    throw new Error('round() precision must be an integer');
  }
  
  // Handle rounding to specified precision
  if (precision === 0) {
    // Round half away from zero for integers
    return value < 0 ? -Math.round(-value) : Math.round(value);
  }
  
  const factor = Math.pow(10, precision);
  
  if (precision > 0) {
    // Round to decimal places
    return Math.round(value * factor) / factor;
  } else {
    // Round to left of decimal (negative precision)
    // Use inverse factor for negative precision
    const inverseFactor = Math.pow(10, -precision);
    return Math.round(value / inverseFactor) * inverseFactor;
  }
}

/**
 * FHIRPath round() function implementation
 */
export const roundFunction: FHIRPathFunction = {
  name: 'round',
  category: 'math',
  description: 'Rounds to the nearest integer or specified precision',
  
  signature: {
    name: 'round',
    parameters: [{
      name: 'precision',
      type: INTEGER_TYPE,
      optional: true,
      description: 'Number of decimal places (default 0)'
    }],
    minArity: 0,
    maxArity: 1,
    isVariadic: false
  },
  
  inferReturnType: (context, contextType, paramTypes, ast) => {
    // If precision is provided and > 0, returns decimal
    // Otherwise returns integer
    if (ast.args.length > 0) {
      // We'd need to evaluate the precision to know for sure
      // For now, assume decimal if precision is provided
      return DECIMAL_TYPE;
    }
    return INTEGER_TYPE;
  },
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    // Compile precision argument if provided
    const precisionExpr = ast.args.length > 0 
      ? compiler.compileNode(ast.args[0])
      : null;
    
    return (data, env) => {
      // Get precision value if provided
      let precision = 0;
      if (precisionExpr) {
        const precisionResult = precisionExpr(data, env);
        const precisionValue = getSingleValue(precisionResult);
        if (precisionValue !== null && precisionValue !== undefined) {
          if (typeof precisionValue !== 'number' || !Number.isInteger(precisionValue)) {
            throw new Error('round() precision must be an integer');
          }
          precision = precisionValue;
        }
      }
      
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => round(item, precision)).filter(v => v !== null);
      }
      
      // Handle single values
      const result = round(data, precision);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: round,
  
  hints: {
    pure: true,
    deterministic: true
  }
};