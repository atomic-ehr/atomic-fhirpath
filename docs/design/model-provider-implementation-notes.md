# ModelProvider Implementation Notes

## Code Generation Strategy

### Build Pipeline

```mermaid
graph LR
    A[FHIR R4 Definitions] --> B[Definition Parser]
    B --> C[Code Generator]
    C --> D[TypeScript Files]
    D --> E[Build Process]
    E --> F[Optimized Bundle]
```

### Generated File Structure

```
src/generated/
├── fhir-r4-definitions/
│   ├── resources/
│   │   ├── patient.generated.ts
│   │   ├── observation.generated.ts
│   │   └── ... (145 resource files)
│   ├── data-types/
│   │   ├── human-name.generated.ts
│   │   ├── identifier.generated.ts
│   │   └── ... (data type files)
│   ├── index.ts
│   └── type-registry.generated.ts
```

### Sample Generated Code

```typescript
// patient.generated.ts
import type { ResourceDefinition } from '../types';

export const PatientDefinition: ResourceDefinition = {
  resourceType: 'Patient',
  baseType: 'DomainResource',
  url: 'http://hl7.org/fhir/StructureDefinition/Patient',
  properties: new Map([
    ['identifier', {
      path: 'Patient.identifier',
      type: { code: 'Identifier' },
      cardinality: '0..*',
      isSummary: true,
      description: 'An identifier for this patient'
    }],
    // ... more properties
  ]),
  requiredProperties: new Set(),
  searchParameters: new Map([
    ['identifier', { type: 'token', path: 'Patient.identifier' }],
    ['name', { type: 'string', path: 'Patient.name' }],
    // ... more search params
  ])
};
```

## Performance Optimizations

### 1. Pre-computed Indices

```typescript
class OptimizedTypeRegistry {
  // Primary storage
  private resources: Map<string, ResourceDefinition>;
  
  // Optimized lookup structures
  private propertyLookup: Map<string, PropertyDefinition>; // "Patient.name" -> PropertyDef
  private choiceTypeLookup: Map<string, PropertyDefinition[]>; // "Observation.value" -> [variants]
  private hierarchyLookup: Map<string, Set<string>>; // "Patient" -> Set{"DomainResource", "Resource"}
  
  // Build all indices at initialization
  private buildOptimizedIndices() {
    for (const [resourceType, def] of this.resources) {
      // Flatten property paths for O(1) lookup
      this.indexProperties(resourceType, def);
      
      // Pre-compute hierarchy
      this.indexHierarchy(resourceType, def);
      
      // Pre-group choice types
      this.indexChoiceTypes(resourceType, def);
    }
  }
}
```

### 2. Memory-Efficient Storage

```typescript
// Use string interning for repeated values
class StringPool {
  private pool: Map<string, string> = new Map();
  
  intern(str: string): string {
    if (!this.pool.has(str)) {
      this.pool.set(str, str);
    }
    return this.pool.get(str)!;
  }
}

// Reduces memory for repeated strings like "0..1", "string", etc.
```

### 3. Lazy Loading Strategy

```typescript
class LazyModelProvider implements ModelProvider {
  private loaded: Set<string> = new Set();
  private loaders: Map<string, () => Promise<ResourceDefinition>> = new Map();
  
  async ensureLoaded(resourceType: string) {
    if (!this.loaded.has(resourceType)) {
      const loader = this.loaders.get(resourceType);
      if (loader) {
        const def = await loader();
        this.registry.register(resourceType, def);
        this.loaded.add(resourceType);
      }
    }
  }
  
  getPropertyType(resource: string, property: string): FHIRPathType | null {
    // Synchronous API requires pre-loading or blocking
    // Consider async ModelProvider interface
  }
}
```

## Complex Scenarios

### 1. Handling Extensions

```typescript
interface ExtensionHandling {
  // Standard extension property
  getExtensionType(url: string): FHIRPathType | null;
  
  // Profile-specific extensions
  getProfileExtensions(resourceType: string, profile: string): Map<string, FHIRPathType>;
  
  // Modifier extensions
  isModifierExtension(url: string): boolean;
}
```

### 2. Slicing Support

```typescript
interface SlicedElement {
  sliceName: string;
  discriminator: {
    type: 'value' | 'pattern' | 'type' | 'profile';
    path: string;
  };
  rules: 'open' | 'closed' | 'openAtEnd';
}

// Example: Observation.component slices
const componentSlices = new Map<string, SlicedElement>([
  ['systolic', {
    sliceName: 'systolic',
    discriminator: { type: 'pattern', path: 'code' },
    rules: 'open'
  }]
]);
```

### 3. Circular Reference Handling

```typescript
class CircularReferenceHandler {
  private visiting: Set<string> = new Set();
  
  resolveType(typeName: string, context: ResolutionContext): FHIRPathType | null {
    if (this.visiting.has(typeName)) {
      // Return a lazy reference type
      return { 
        name: typeName, 
        isCircularRef: true,
        resolve: () => this.resolveType(typeName, context)
      };
    }
    
    this.visiting.add(typeName);
    try {
      // Actual resolution
      return this.doResolveType(typeName, context);
    } finally {
      this.visiting.delete(typeName);
    }
  }
}
```

## Testing Considerations

### 1. Conformance Testing

```typescript
describe('FHIR Conformance', () => {
  it('should handle all R4 resource types', () => {
    const officialResources = loadOfficialResourceList();
    for (const resourceType of officialResources) {
      expect(provider.hasResourceType(resourceType)).toBe(true);
    }
  });
  
  it('should resolve all standard properties', () => {
    const testCases = loadFHIRTestSuite();
    for (const test of testCases) {
      const result = provider.getPropertyType(test.resource, test.property);
      expect(result).toMatchSnapshot();
    }
  });
});
```

### 2. Performance Benchmarks

```typescript
describe('Performance', () => {
  const provider = new FhirR4ModelProvider();
  
  it('should perform property lookups in < 1ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      provider.getPropertyType('Patient', 'name');
    }
    const duration = performance.now() - start;
    expect(duration / 10000).toBeLessThan(0.001); // < 0.001ms per lookup
  });
  
  it('should initialize in < 100ms', () => {
    const start = performance.now();
    new FhirR4ModelProvider();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

### 3. Edge Case Testing

```typescript
describe('Edge Cases', () => {
  it('handles deeply nested properties', () => {
    const type = provider.getPropertyType('Bundle', 'entry.resource.name.given');
    expect(type).toBeDefined();
  });
  
  it('handles invalid choice type syntax', () => {
    const type = provider.getChoiceTypes('Observation', 'value'); // Missing [x]
    expect(type).toBeNull();
  });
  
  it('handles backbone elements', () => {
    const type = provider.getPropertyType('Patient', 'contact.name');
    expect(type).toBe('HumanName');
  });
});
```

## Integration Points

### 1. TypeInferenceEngine Integration

```typescript
// Extend TypeInferenceContext
interface EnhancedTypeInferenceContext extends TypeInferenceContext {
  modelProvider: FhirR4ModelProvider;
  profileContext?: string; // Support for profiles
  strictMode: boolean;
}

// Enhanced property resolution
private resolvePropertyType(
  resourceType: string, 
  propertyPath: string,
  context: EnhancedTypeInferenceContext
): FHIRPathType | null {
  // Handle dotted paths
  const parts = propertyPath.split('.');
  let currentType = resourceType;
  
  for (const part of parts) {
    const propType = context.modelProvider.getPropertyType(currentType, part);
    if (!propType) {
      return context.strictMode ? null : ANY_TYPE;
    }
    currentType = propType.name;
  }
  
  return propType;
}
```

### 2. SemanticValidator Integration

```typescript
// Enhanced validation with FHIR awareness
class FhirAwareSemanticValidator extends SemanticValidator {
  protected validatePropertyAccess(
    node: PropertyAccessNode,
    context: ValidationContext
  ): void {
    const resourceType = this.getResourceType(node.base);
    
    if (!context.modelProvider.isValidProperty(resourceType, node.property)) {
      // Check for common FHIR patterns
      if (this.isValidFhirPattern(resourceType, node.property)) {
        this.addWarning(node, `Non-standard FHIR pattern: ${node.property}`);
      } else {
        this.addError(node, `Unknown property: ${resourceType}.${node.property}`);
      }
    }
  }
  
  private isValidFhirPattern(resourceType: string, property: string): boolean {
    // Handle patterns like "value[x]" where x is a type name
    // Handle extension access patterns
    // Handle contained resource access
    return false; // Simplified
  }
}
```

## Migration Strategy

### Phase 1: Parallel Implementation
- Implement new ModelProvider alongside NullModelProvider
- Add feature flag to enable/disable
- Comprehensive testing with both providers

### Phase 2: Gradual Rollout
- Enable for specific resource types first
- Monitor performance and correctness
- Gather feedback from edge cases

### Phase 3: Full Migration
- Switch default to new provider
- Deprecate NullModelProvider
- Remove feature flag

## Open Questions and Decisions Needed

1. **Async vs Sync API**: Should ModelProvider methods be async to support lazy loading?
   - Pro: Better performance, smaller initial bundle
   - Con: Major API change, complexity

2. **Profile Support**: How deep should initial profile support be?
   - Option A: Core resources only
   - Option B: Include common profiles (US Core, etc.)
   - Option C: Full profile support with dynamic loading

3. **Extension Strategy**: How to handle custom extensions?
   - Option A: Register extensions separately
   - Option B: Include in resource definitions
   - Option C: Dynamic extension discovery

4. **Validation Level**: How much FHIR validation in ModelProvider?
   - Option A: Type information only
   - Option B: Include cardinality validation
   - Option C: Full invariant checking

5. **Caching Policy**: What should be cached and for how long?
   - Option A: Cache everything forever
   - Option B: LRU cache with size limit
   - Option C: Time-based cache with refresh