# Implement ModelProvider for FHIR R4 Resources [pending]

## Overview

Implement a concrete ModelProvider that enables FHIRPath expressions to navigate FHIR R4 resources with full type awareness and property resolution.

## Background

Currently, the project has only an interface definition for ModelProvider (`src/model-provider.ts`) with no concrete implementation. This is a critical gap that prevents:
- Proper navigation of FHIR resources
- Type-aware property access
- Polymorphic type handling
- Resource validation

## Requirements

### 1. Core ModelProvider Implementation
- [ ] Create `FhirR4ModelProvider` class implementing `ModelProvider` interface
- [ ] Support all FHIR R4 resource types
- [ ] Handle base resource inheritance (DomainResource, Resource)
- [ ] Support backbone elements and complex types

### 2. Type Resolution
- [ ] Implement `getResourceType(name: string)` for all R4 resources
- [ ] Implement `getPropertyType(resourceType: string, propertyName: string)`
- [ ] Handle choice types (e.g., value[x] → valueString, valueQuantity, etc.)
- [ ] Support cardinality constraints from FHIR definitions

### 3. Type Hierarchy
- [ ] Implement `getSuperTypes(resourceType: string)` 
- [ ] Implement `isSubTypeOf(childType: string, parentType: string)`
- [ ] Handle FHIR inheritance chain (e.g., Observation → DomainResource → Resource)

### 4. FHIR Definitions
- [ ] Load FHIR R4 structure definitions
- [ ] Parse element definitions for type information
- [ ] Cache parsed definitions for performance
- [ ] Support extension definitions

### 5. Integration
- [ ] Update `TypeInferenceContext` to use ModelProvider
- [ ] Ensure backward compatibility with existing code
- [ ] Add configuration option to select ModelProvider

## Technical Design

### Architecture
```typescript
class FhirR4ModelProvider implements ModelProvider {
  private definitions: Map<string, StructureDefinition>;
  private typeCache: Map<string, ResourceType>;
  
  constructor() {
    this.loadDefinitions();
  }
  
  getResourceType(name: string): ResourceType | null {
    // Implementation
  }
  
  getPropertyType(resourceType: string, propertyName: string): FHIRPathType | null {
    // Handle standard properties
    // Handle choice types
    // Handle extensions
  }
}
```

### Data Source Options
1. Use FHIR R4 JSON definitions from HL7
2. Generate TypeScript definitions from FHIR spec
3. Use existing FHIR TypeScript type definitions as reference

## Testing Requirements

- [ ] Unit tests for each ModelProvider method
- [ ] Integration tests with type inference
- [ ] Test all FHIR R4 resource types
- [ ] Test choice type resolution
- [ ] Test inheritance hierarchy
- [ ] Performance benchmarks

## Acceptance Criteria

1. Can resolve types for all FHIR R4 resources
2. Properly handles choice types (value[x])
3. Supports type hierarchy navigation
4. Integrates seamlessly with existing type system
5. Performance impact < 10% on compilation
6. 100% test coverage for new code

## Implementation Steps

1. Research FHIR R4 structure definitions format
2. Design data structure for resource definitions
3. Implement definition loading/parsing
4. Implement ModelProvider methods
5. Integrate with TypeInferenceContext
6. Write comprehensive tests
7. Update documentation
8. Performance optimization

## Dependencies

- FHIR R4 specification files
- May need JSON/XML parser for definitions
- Consider using existing FHIR libraries for reference

## Estimated Effort

- Research and Design: 1 week
- Implementation: 2-3 weeks
- Testing: 1 week
- Documentation: 2-3 days
- Total: 4-6 weeks

## Notes

- Consider starting with a subset of common resources (Patient, Observation, Condition)
- Ensure design allows for future R5 support
- Consider caching strategies for performance
- May need to handle custom profiles in the future