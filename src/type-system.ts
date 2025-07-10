/**
 * FHIRPath Type System
 * 
 * Defines the type system for FHIRPath expressions with proper hierarchy,
 * cardinality constraints, and type compatibility rules.
 */

export type Cardinality = 
  | '0..0'  // Empty/impossible
  | '0..1'  // Optional single
  | '1..1'  // Required single
  | '0..*'  // Optional multiple
  | '1..*'  // Required multiple

export interface FHIRPathType {
  readonly name: string;
  readonly cardinality: Cardinality;
  readonly isCollection: boolean;
  readonly isPrimitive: boolean;
  readonly isResource: boolean;
}

export interface PrimitiveType extends FHIRPathType {
  readonly isPrimitive: true;
  readonly isResource: false;
  readonly isCollection: false;
}

export interface ComplexType extends FHIRPathType {
  readonly isPrimitive: false;
  readonly properties?: Map<string, FHIRPathType>;
}

export interface ResourceType extends ComplexType {
  readonly isResource: true;
  readonly resourceType: string;
}

export interface CollectionType extends FHIRPathType {
  readonly isCollection: true;
  readonly elementType: FHIRPathType;
}

export interface BackboneElementType extends ComplexType {
  readonly isResource: false;
  readonly isBackboneElement: true;
}

// Core primitive types
export const STRING_TYPE: PrimitiveType = {
  name: 'string',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const INTEGER_TYPE: PrimitiveType = {
  name: 'integer',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const DECIMAL_TYPE: PrimitiveType = {
  name: 'decimal',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const BOOLEAN_TYPE: PrimitiveType = {
  name: 'boolean',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const DATE_TYPE: PrimitiveType = {
  name: 'date',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const DATETIME_TYPE: PrimitiveType = {
  name: 'dateTime',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const TIME_TYPE: PrimitiveType = {
  name: 'time',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: true,
  isResource: false
};

export const QUANTITY_TYPE: ComplexType = {
  name: 'Quantity',
  cardinality: '1..1',
  isCollection: false,
  isPrimitive: false,
  isResource: false,
  properties: new Map([
    ['value', DECIMAL_TYPE],
    ['unit', STRING_TYPE],
    ['system', STRING_TYPE],
    ['code', STRING_TYPE]
  ])
};

// Empty type for null/empty collections
export const EMPTY_TYPE: FHIRPathType = {
  name: 'empty',
  cardinality: '0..0',
  isCollection: false,
  isPrimitive: false,
  isResource: false
};

// Any type for unknown/dynamic types
export const ANY_TYPE: FHIRPathType = {
  name: 'any',
  cardinality: '0..*',
  isCollection: true,
  isPrimitive: false,
  isResource: false
};

/**
 * Create a collection type from an element type
 */
export function createCollectionType(elementType: FHIRPathType, cardinality: Cardinality = '0..*'): CollectionType {
  return {
    name: `Collection<${elementType.name}>`,
    cardinality,
    isCollection: true,
    isPrimitive: false,
    isResource: false,
    elementType
  };
}

/**
 * Create a resource type
 */
export function createResourceType(resourceType: string, properties?: Map<string, FHIRPathType>): ResourceType {
  return {
    name: resourceType,
    cardinality: '1..1',
    isCollection: false,
    isPrimitive: false,
    isResource: true,
    resourceType,
    properties
  };
}

/**
 * Type compatibility and coercion rules
 */
export class TypeCompatibility {
  /**
   * Check if sourceType can be assigned to targetType
   */
  static isAssignable(sourceType: FHIRPathType, targetType: FHIRPathType): boolean {
    // Any type accepts everything
    if (targetType === ANY_TYPE) return true;
    
    // Empty type can only accept empty
    if (sourceType === EMPTY_TYPE) return targetType === EMPTY_TYPE;
    
    // Same type
    if (sourceType.name === targetType.name) return true;
    
    // Numeric coercion: integer can be assigned to decimal
    if (sourceType === INTEGER_TYPE && targetType === DECIMAL_TYPE) return true;
    
    // Collection compatibility
    if (sourceType.isCollection && targetType.isCollection) {
      const sourceCollection = sourceType as CollectionType;
      const targetCollection = targetType as CollectionType;
      return this.isAssignable(sourceCollection.elementType, targetCollection.elementType);
    }
    
    // Single to collection
    if (!sourceType.isCollection && targetType.isCollection) {
      const targetCollection = targetType as CollectionType;
      return this.isAssignable(sourceType, targetCollection.elementType);
    }
    
    // Resource inheritance (would need ModelProvider for full implementation)
    if (sourceType.isResource && targetType.isResource) {
      return sourceType.name === targetType.name;
    }
    
    return false;
  }
  
  /**
   * Get the common supertype of two types
   */
  static getCommonSupertype(type1: FHIRPathType, type2: FHIRPathType): FHIRPathType {
    if (type1 === type2) return type1;
    
    // Empty type handling
    if (type1 === EMPTY_TYPE) return type2;
    if (type2 === EMPTY_TYPE) return type1;
    
    // Numeric hierarchy: integer + decimal = decimal
    if ((type1 === INTEGER_TYPE && type2 === DECIMAL_TYPE) ||
        (type1 === DECIMAL_TYPE && type2 === INTEGER_TYPE)) {
      return DECIMAL_TYPE;
    }
    
    // Collection handling
    if (type1.isCollection && type2.isCollection) {
      const collection1 = type1 as CollectionType;
      const collection2 = type2 as CollectionType;
      const commonElementType = this.getCommonSupertype(collection1.elementType, collection2.elementType);
      return createCollectionType(commonElementType);
    }
    
    // Different types default to any
    return ANY_TYPE;
  }
  
  /**
   * Check if a type can be used in a boolean context
   */
  static isBooleanCompatible(type: FHIRPathType): boolean {
    // All types can be used in boolean context in FHIRPath
    // Empty collections are false, non-empty are true
    return true;
  }
  
  /**
   * Check if a type supports arithmetic operations
   */
  static isArithmeticCompatible(type: FHIRPathType): boolean {
    return type === INTEGER_TYPE || 
           type === DECIMAL_TYPE || 
           type === QUANTITY_TYPE;
  }
  
  /**
   * Check if a type supports string operations
   */
  static isStringCompatible(type: FHIRPathType): boolean {
    return type === STRING_TYPE;
  }
  
  /**
   * Check if a type supports comparison operations
   */
  static isComparableType(type: FHIRPathType): boolean {
    return type.isPrimitive || type === QUANTITY_TYPE;
  }
}

/**
 * Cardinality operations
 */
export class CardinalityOps {
  /**
   * Check if cardinality allows empty values
   */
  static allowsEmpty(cardinality: Cardinality): boolean {
    return cardinality.startsWith('0');
  }
  
  /**
   * Check if cardinality allows multiple values
   */
  static allowsMultiple(cardinality: Cardinality): boolean {
    return cardinality.endsWith('*');
  }
  
  /**
   * Check if cardinality requires at least one value
   */
  static requiresValue(cardinality: Cardinality): boolean {
    return cardinality.startsWith('1');
  }
  
  /**
   * Combine cardinalities for operations
   */
  static combine(card1: Cardinality, card2: Cardinality): Cardinality {
    const allows1Empty = this.allowsEmpty(card1);
    const allows2Empty = this.allowsEmpty(card2);
    const allows1Multiple = this.allowsMultiple(card1);
    const allows2Multiple = this.allowsMultiple(card2);
    
    // If either allows empty, result allows empty
    const resultAllowsEmpty = allows1Empty || allows2Empty;
    
    // If either allows multiple, result allows multiple
    const resultAllowsMultiple = allows1Multiple || allows2Multiple;
    
    if (resultAllowsEmpty && resultAllowsMultiple) return '0..*';
    if (resultAllowsEmpty && !resultAllowsMultiple) return '0..1';
    if (!resultAllowsEmpty && resultAllowsMultiple) return '1..*';
    return '1..1';
  }
}