/**
 * Function Type Registry
 * 
 * Registry of function signatures with type inference logic for FHIRPath functions.
 * Provides type information for built-in functions and allows registration of custom functions.
 */

import { 
  type FHIRPathType, 
  STRING_TYPE, 
  INTEGER_TYPE, 
  DECIMAL_TYPE, 
  BOOLEAN_TYPE, 
  DATE_TYPE, 
  DATETIME_TYPE, 
  TIME_TYPE, 
  QUANTITY_TYPE, 
  EMPTY_TYPE, 
  ANY_TYPE,
  createCollectionType,
  TypeCompatibility,
  CardinalityOps
} from './type-system';

import { type FunctionSignature, type FunctionParameter } from './typed-nodes';

export interface FunctionTypeInference {
  (paramTypes: FHIRPathType[], contextType?: FHIRPathType): FHIRPathType;
}

export interface FunctionRegistryEntry {
  readonly signature: FunctionSignature;
  readonly inferReturnType: FunctionTypeInference;
  readonly category: 'collection' | 'string' | 'math' | 'logical' | 'existence' | 'navigation' | 'date' | 'type' | 'utility';
  readonly description?: string;
}

export class FunctionRegistry {
  private functions = new Map<string, FunctionRegistryEntry>();
  
  constructor() {
    this.registerBuiltInFunctions();
  }
  
  /**
   * Register a function with type inference
   */
  register(name: string, entry: FunctionRegistryEntry): void {
    this.functions.set(name, entry);
  }
  
  /**
   * Get function registry entry
   */
  get(name: string): FunctionRegistryEntry | undefined {
    return this.functions.get(name);
  }
  
  /**
   * Check if function exists
   */
  has(name: string): boolean {
    return this.functions.has(name);
  }
  
  /**
   * Get all registered function names
   */
  getAllNames(): string[] {
    return Array.from(this.functions.keys());
  }
  
  /**
   * Get functions by category
   */
  getByCategory(category: string): Map<string, FunctionRegistryEntry> {
    const result = new Map<string, FunctionRegistryEntry>();
    for (const [name, entry] of Array.from(this.functions)) {
      if (entry.category === category) {
        result.set(name, entry);
      }
    }
    return result;
  }
  
  /**
   * Infer return type for a function call
   */
  inferReturnType(functionName: string, paramTypes: FHIRPathType[], contextType?: FHIRPathType): FHIRPathType {
    const entry = this.get(functionName);
    if (!entry) {
      return ANY_TYPE; // Unknown function
    }
    
    return entry.inferReturnType(paramTypes, contextType);
  }
  
  /**
   * Validate function call parameters
   */
  validateParameters(functionName: string, paramTypes: FHIRPathType[]): string[] {
    const entry = this.get(functionName);
    if (!entry) {
      return [`Unknown function: ${functionName}`];
    }
    
    const errors: string[] = [];
    const sig = entry.signature;
    
    // Check arity
    if (paramTypes.length < sig.minArity) {
      errors.push(`Function ${functionName} requires at least ${sig.minArity} arguments, got ${paramTypes.length}`);
    }
    
    if (paramTypes.length > sig.maxArity && !sig.isVariadic) {
      errors.push(`Function ${functionName} accepts at most ${sig.maxArity} arguments, got ${paramTypes.length}`);
    }
    
    // Check parameter types
    for (let i = 0; i < Math.min(paramTypes.length, sig.parameters.length); i++) {
      const param = sig.parameters[i];
      if (!param) continue;
      
      const expectedType = param.type;
      const actualType = paramTypes[i];
      
      if (actualType && !TypeCompatibility.isAssignable(actualType, expectedType)) {
        errors.push(`Function ${functionName} parameter ${i + 1} expects ${expectedType.name}, got ${actualType.name}`);
      }
    }
    
    return errors;
  }
  
  private registerBuiltInFunctions(): void {
    // Collection functions
    this.register('where', {
      signature: {
        name: 'where',
        parameters: [
          { name: 'criteria', type: BOOLEAN_TYPE, optional: false, description: 'Filter criteria' }
        ],
        returnType: (paramTypes: FHIRPathType[]) => createCollectionType(ANY_TYPE),
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // where() returns a collection of the same type as the input
        return contextType?.isCollection ? contextType : createCollectionType(contextType || ANY_TYPE);
      },
      category: 'collection',
      description: 'Filter collection by criteria'
    });
    
    this.register('select', {
      signature: {
        name: 'select',
        parameters: [
          { name: 'expression', type: ANY_TYPE, optional: false, description: 'Selection expression' }
        ],
        returnType: (paramTypes: FHIRPathType[]) => createCollectionType(paramTypes[0] || ANY_TYPE),
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // select() returns a collection of the expression type
        return createCollectionType(paramTypes[0] || ANY_TYPE);
      },
      category: 'collection',
      description: 'Transform collection elements'
    });
    
    this.register('exists', {
      signature: {
        name: 'exists',
        parameters: [
          { name: 'criteria', type: BOOLEAN_TYPE, optional: true, description: 'Optional criteria' }
        ],
        returnType: BOOLEAN_TYPE,
        minArity: 0,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'existence',
      description: 'Check if collection has elements matching criteria'
    });
    
    this.register('empty', {
      signature: {
        name: 'empty',
        parameters: [],
        returnType: BOOLEAN_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'existence',
      description: 'Check if collection is empty'
    });
    
    this.register('count', {
      signature: {
        name: 'count',
        parameters: [],
        returnType: INTEGER_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => INTEGER_TYPE,
      category: 'collection',
      description: 'Count elements in collection'
    });
    
    this.register('first', {
      signature: {
        name: 'first',
        parameters: [],
        returnType: ANY_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // first() returns single element of collection type
        if (contextType?.isCollection) {
          const collectionType = contextType as any;
          return collectionType.elementType || ANY_TYPE;
        }
        return contextType || ANY_TYPE;
      },
      category: 'collection',
      description: 'Get first element of collection'
    });
    
    this.register('last', {
      signature: {
        name: 'last',
        parameters: [],
        returnType: ANY_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // last() returns single element of collection type
        if (contextType?.isCollection) {
          const collectionType = contextType as any;
          return collectionType.elementType || ANY_TYPE;
        }
        return contextType || ANY_TYPE;
      },
      category: 'collection',
      description: 'Get last element of collection'
    });
    
    this.register('tail', {
      signature: {
        name: 'tail',
        parameters: [],
        returnType: ANY_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // tail() returns collection of same type
        return contextType || createCollectionType(ANY_TYPE);
      },
      category: 'collection',
      description: 'Get all elements except first'
    });
    
    this.register('skip', {
      signature: {
        name: 'skip',
        parameters: [
          { name: 'count', type: INTEGER_TYPE, optional: false, description: 'Number of elements to skip' }
        ],
        returnType: ANY_TYPE,
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // skip() returns collection of same type
        return contextType || createCollectionType(ANY_TYPE);
      },
      category: 'collection',
      description: 'Skip first n elements'
    });
    
    this.register('take', {
      signature: {
        name: 'take',
        parameters: [
          { name: 'count', type: INTEGER_TYPE, optional: false, description: 'Number of elements to take' }
        ],
        returnType: ANY_TYPE,
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // take() returns collection of same type
        return contextType || createCollectionType(ANY_TYPE);
      },
      category: 'collection',
      description: 'Take first n elements'
    });
    
    this.register('distinct', {
      signature: {
        name: 'distinct',
        parameters: [],
        returnType: ANY_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // distinct() returns collection of same type
        return contextType || createCollectionType(ANY_TYPE);
      },
      category: 'collection',
      description: 'Remove duplicate elements'
    });
    
    // String functions
    this.register('length', {
      signature: {
        name: 'length',
        parameters: [],
        returnType: INTEGER_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => INTEGER_TYPE,
      category: 'string',
      description: 'Get string length'
    });
    
    this.register('substring', {
      signature: {
        name: 'substring',
        parameters: [
          { name: 'start', type: INTEGER_TYPE, optional: false, description: 'Start position' },
          { name: 'length', type: INTEGER_TYPE, optional: true, description: 'Length' }
        ],
        returnType: STRING_TYPE,
        minArity: 1,
        maxArity: 2,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => STRING_TYPE,
      category: 'string',
      description: 'Extract substring'
    });
    
    this.register('startsWith', {
      signature: {
        name: 'startsWith',
        parameters: [
          { name: 'prefix', type: STRING_TYPE, optional: false, description: 'Prefix to check' }
        ],
        returnType: BOOLEAN_TYPE,
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'string',
      description: 'Check if string starts with prefix'
    });
    
    this.register('endsWith', {
      signature: {
        name: 'endsWith',
        parameters: [
          { name: 'suffix', type: STRING_TYPE, optional: false, description: 'Suffix to check' }
        ],
        returnType: BOOLEAN_TYPE,
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'string',
      description: 'Check if string ends with suffix'
    });
    
    this.register('contains', {
      signature: {
        name: 'contains',
        parameters: [
          { name: 'substring', type: STRING_TYPE, optional: false, description: 'Substring to find' }
        ],
        returnType: BOOLEAN_TYPE,
        minArity: 1,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'string',
      description: 'Check if string contains substring'
    });
    
    this.register('upper', {
      signature: {
        name: 'upper',
        parameters: [],
        returnType: STRING_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => STRING_TYPE,
      category: 'string',
      description: 'Convert to uppercase'
    });
    
    this.register('lower', {
      signature: {
        name: 'lower',
        parameters: [],
        returnType: STRING_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => STRING_TYPE,
      category: 'string',
      description: 'Convert to lowercase'
    });
    
    // Math functions
    this.register('abs', {
      signature: {
        name: 'abs',
        parameters: [],
        returnType: (paramTypes: FHIRPathType[]) => paramTypes[0] || DECIMAL_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => {
        // abs() returns same numeric type as input
        if (contextType === INTEGER_TYPE || contextType === DECIMAL_TYPE || contextType === QUANTITY_TYPE) {
          return contextType;
        }
        return DECIMAL_TYPE;
      },
      category: 'math',
      description: 'Absolute value'
    });
    
    this.register('ceiling', {
      signature: {
        name: 'ceiling',
        parameters: [],
        returnType: INTEGER_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => INTEGER_TYPE,
      category: 'math',
      description: 'Round up to nearest integer'
    });
    
    this.register('floor', {
      signature: {
        name: 'floor',
        parameters: [],
        returnType: INTEGER_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => INTEGER_TYPE,
      category: 'math',
      description: 'Round down to nearest integer'
    });
    
    this.register('round', {
      signature: {
        name: 'round',
        parameters: [
          { name: 'precision', type: INTEGER_TYPE, optional: true, description: 'Decimal places' }
        ],
        returnType: DECIMAL_TYPE,
        minArity: 0,
        maxArity: 1,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => DECIMAL_TYPE,
      category: 'math',
      description: 'Round to specified precision'
    });
    
    // Type conversion functions
    this.register('toString', {
      signature: {
        name: 'toString',
        parameters: [],
        returnType: STRING_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => STRING_TYPE,
      category: 'type',
      description: 'Convert to string'
    });
    
    this.register('toInteger', {
      signature: {
        name: 'toInteger',
        parameters: [],
        returnType: INTEGER_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => INTEGER_TYPE,
      category: 'type',
      description: 'Convert to integer'
    });
    
    this.register('toDecimal', {
      signature: {
        name: 'toDecimal',
        parameters: [],
        returnType: DECIMAL_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => DECIMAL_TYPE,
      category: 'type',
      description: 'Convert to decimal'
    });
    
    this.register('toDateTime', {
      signature: {
        name: 'toDateTime',
        parameters: [],
        returnType: DATETIME_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => DATETIME_TYPE,
      category: 'type',
      description: 'Convert to datetime'
    });
    
    // Logical functions
    this.register('not', {
      signature: {
        name: 'not',
        parameters: [],
        returnType: BOOLEAN_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
      category: 'logical',
      description: 'Logical negation'
    });
    
    // Date/time functions
    this.register('now', {
      signature: {
        name: 'now',
        parameters: [],
        returnType: DATETIME_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => DATETIME_TYPE,
      category: 'date',
      description: 'Current date and time'
    });
    
    this.register('today', {
      signature: {
        name: 'today',
        parameters: [],
        returnType: DATE_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => DATE_TYPE,
      category: 'date',
      description: 'Current date'
    });
    
    this.register('timeOfDay', {
      signature: {
        name: 'timeOfDay',
        parameters: [],
        returnType: TIME_TYPE,
        minArity: 0,
        maxArity: 0,
        isVariadic: false
      },
      inferReturnType: (paramTypes, contextType) => TIME_TYPE,
      category: 'date',
      description: 'Current time of day'
    });
  }
}

// Global function registry instance
export const functionRegistry = new FunctionRegistry();