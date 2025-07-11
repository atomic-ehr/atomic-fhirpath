# Type Inference Component

## Overview
Context-sensitive type resolution engine that infers types throughout FHIRPath expression trees.

## Files
- `src/type-inference.ts` - Type inference engine
- `src/model-provider.ts` - FHIR schema interface

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

## Type Inference Process
1. Start with root context type
2. Traverse AST nodes
3. Resolve property types via ModelProvider
4. Calculate function return types
5. Propagate types through tree

## Testing
- `test/type-inference.test.ts` - Type inference tests