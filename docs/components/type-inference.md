# Type Inference Component

## Overview
Context-sensitive type resolution engine that infers types throughout FHIRPath expression trees.

## Files
- [`src/type-inference.ts`](../../src/type-inference.ts) - Type inference engine
- [`src/model-provider.ts`](../../src/model-provider.ts) - FHIR schema interface

## Algorithm
- Visitor pattern traversal
- Context-aware property resolution
- Function return type calculation
- Variable scope management

## Features

### Expression Type Inference
- Literal type detection
- Operator result types
- Function return types
- Property access resolution

### Context Management
- Root type propagation
- Variable scope tracking
- Collection element types
- Nested context handling

## ModelProvider Interface
```typescript
interface ModelProvider {
  getResourceType(name: string): ResourceType | null;
  getPropertyType(resourceType: string, propertyName: string): FHIRPathType | null;
  isValidResource(resourceType: string): boolean;
  getSuperTypes(resourceType: string): string[];
  isSubTypeOf(childType: string, parentType: string): boolean;
}
```

**Key entry points:**
- [`inferTypes()` function](../../src/type-inference.ts#L57) - Main type inference API
- [`TypeInferenceVisitor` class](../../src/type-inference.ts#L108) - Visitor implementation
- [`ModelProvider` interface](../../src/model-provider.ts#L3) - Schema plugin interface

## Type Inference Process
1. Start with root context type
2. Traverse AST nodes
3. Resolve property types via ModelProvider
4. Calculate function return types
5. Propagate types through tree

## Testing
- `test/type-inference.test.ts` - Type inference tests