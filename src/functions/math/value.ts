/**
 * FHIRPath value() function
 * 
 * Extracts the numeric value from a Quantity type.
 * Returns empty for non-Quantity input.
 * Preserves integer vs decimal type based on the value.
 */

import { FHIRPathFunction } from '../base';
import { INTEGER_TYPE, DECIMAL_TYPE, QUANTITY_TYPE, FHIRPathType } from '../../type-system';
import type { FunctionSignature } from '../../typed-nodes';
import type { CompilerContext, RuntimeContext } from '../base';
import type { FunctionCallNode } from '../../types';
import type { CompiledExpression } from '../base';

/**
 * Core implementation of value() function
 */
export function value(input: any): number | null {
  if (input === null || input === undefined) {
    return null;
  }
  
  // Check if input is a Quantity type (has value and unit/code properties)
  if (typeof input === 'object' && 'value' in input) {
    const val = input.value;
    
    if (typeof val === 'number') {
      return val;
    }
    
    // Handle string values that might be numbers
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  
  // For non-Quantity types, return null (which becomes empty in FHIRPath)
  return null;
}

/**
 * FHIRPath value() function implementation
 */
export const valueFunction: FHIRPathFunction = {
  name: 'value',
  category: 'math',
  description: 'Extracts the numeric value from a Quantity type',
  
  signature: {
    name: 'value',
    parameters: [],
    returnType: DECIMAL_TYPE, // Can be integer or decimal
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  // Type inference based on the Quantity's value
  inferReturnType: (context: RuntimeContext, contextType?: FHIRPathType, paramTypes: FHIRPathType[], ast: FunctionCallNode): FHIRPathType => {
    // If input is not a Quantity, return will be empty
    if (contextType?.name !== 'Quantity') {
      return { type: 'Empty' } as FHIRPathType;
    }
    
    // For Quantity types, we can't know if the value is integer or decimal at compile time
    // So we default to decimal for safety
    return DECIMAL_TYPE;
  },
  
  compile: (compiler: CompilerContext, ast: FunctionCallNode): CompiledExpression => {
    return (data, env) => {
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => value(item)).filter(v => v !== null);
      }
      
      // Handle single values
      const result = value(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: value,
  
  hints: {
    pure: true,
    deterministic: true
  }
};