/**
 * FHIRPath Built-in Functions
 * 
 * Central export point for all built-in FHIRPath functions.
 * Functions are organized by category for maintainability.
 */

import type { FHIRPathFunction } from './base';

// Math functions
import { 
  absFunction, ceilingFunction, floorFunction, roundFunction, sqrtFunction, 
  sumFunction, minFunction, maxFunction, avgFunction, divFunction, modFunction, valueFunction 
} from './math';

// Collection functions (to be implemented)
// import { whereFunction, selectFunction, ... } from './collection';

// String functions (to be implemented)
// import { lengthFunction, substringFunction, ... } from './string';

// Logical functions (to be implemented)
// import { notFunction, iifFunction, ... } from './logical';

// Date functions (to be implemented)
// import { nowFunction, todayFunction, ... } from './date';

// Type functions (to be implemented)
// import { toStringFunction, toIntegerFunction, ... } from './type';

// Navigation functions (to be implemented)
// import { childrenFunction, descendantsFunction, ... } from './navigation';

// Utility functions (to be implemented)
// import { traceFunction, ... } from './utility';

/**
 * Map of all built-in functions
 */
export const builtInFunctions = new Map<string, FHIRPathFunction>([
  // Math functions
  ['abs', absFunction],
  ['ceiling', ceilingFunction],
  ['floor', floorFunction],
  ['round', roundFunction],
  ['sqrt', sqrtFunction],
  ['sum', sumFunction],
  ['min', minFunction],
  ['max', maxFunction],
  ['avg', avgFunction],
  ['div', divFunction],
  ['mod', modFunction],
  ['value', valueFunction],
  
  // More functions to be added as they are implemented
]);

/**
 * Get a built-in function by name
 */
export function getBuiltInFunction(name: string): FHIRPathFunction | undefined {
  return builtInFunctions.get(name);
}

/**
 * Check if a function is built-in
 */
export function isBuiltInFunction(name: string): boolean {
  return builtInFunctions.has(name);
}

/**
 * Get all built-in function names
 */
export function getBuiltInFunctionNames(): string[] {
  return Array.from(builtInFunctions.keys());
}

// Re-export base types and utilities
export type { FHIRPathFunction, RuntimeContext, CompilerContext, CompiledExpression } from './base';
export { 
  ensureArray, 
  isTruthy, 
  isEmpty, 
  getSingleValue,
  BaseFHIRPathFunction,
  createSimpleFunction 
} from './base';