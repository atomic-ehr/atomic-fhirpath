# Type System Component

## Overview
Complete FHIRPath type hierarchy implementation with cardinality constraints and compatibility rules.

## Files
- [`src/type-system.ts`](../../src/type-system.ts) - Core type definitions and utilities
- [`src/typed-nodes.ts`](../../src/typed-nodes.ts) - Enhanced AST nodes with type information

## Type Hierarchy

### Primitive Types
- `string` - Text values
- `integer` - Whole numbers
- `decimal` - Decimal numbers
- `boolean` - True/false values
- `date` - Date values
- `time` - Time values
- `dateTime` - Combined date and time
- `quantity` - Numeric values with units (partial support)

### Complex Types
- `Resource` - FHIR resources
- `Collection` - Multi-valued types
- `BackboneElement` - Nested structures

### Special Types
- `Any` - Universal type
- `Empty` - No value type

## Cardinality
- `0..0` - No values allowed
- `0..1` - Optional single value
- `1..1` - Required single value
- `0..*` - Optional multiple values
- `1..*` - Required multiple values

## Type Compatibility
- Integer → Decimal promotion
- Collection element type checking
- Common supertype calculation

## API
```typescript
interface FHIRPathType {
  readonly name: string;
  readonly cardinality: Cardinality;
  readonly isCollection: boolean;
  readonly isPrimitive: boolean;
  readonly isResource: boolean;
}
```

**Key entry points:**
- [`FHIRPathType` base class](../../src/type-system.ts#L45) - Type base class
- [`PrimitiveType` class](../../src/type-system.ts#L144) - Primitive types
- [`ResourceType` class](../../src/type-system.ts#L172) - Resource types
- [`CollectionType` class](../../src/type-system.ts#L209) - Collection types
- [`createResourceType()` function](../../src/type-system.ts#L238) - Type factory

## Testing
- `test/type-system.test.ts` - Type system unit tests