# Pluggable ModelProvider Design for FHIR Resources

## Executive Summary

This document presents the design for implementing a **pluggable ModelProvider architecture** that enables FHIRPath expressions to navigate various FHIR versions (R4, R5, STU3) and logical models with full type awareness. The ModelProvider is a critical component that bridges FHIRPath's type system with different model definitions, allowing users to work with multiple FHIR versions and custom logical models simultaneously.

## Current State Analysis

### Existing Interface

The current `ModelProvider` interface (in `src/model-provider.ts`) defines the following contract:

```typescript
interface ModelProvider {
  // Resource type operations
  getResourceType(name: string): ResourceType | null;
  hasResourceType(name: string): boolean;
  getAllResourceTypes(): string[];
  
  // Property operations
  getPropertyType(resource: string, property: string): FHIRPathType | null;
  isValidProperty(resource: string, property: string): boolean;
  getResourceProperties(resource: string): Map<string, FHIRPathType> | null;
  
  // Type hierarchy operations
  getResourceHierarchy(resource: string): string[];
  isResourceAssignable(source: string, target: string): boolean;
  
  // Special type handling
  getChoiceTypes(resource: string, property: string): FHIRPathType[] | null;
  resolveReferenceType(resource: string, property: string): string[] | null;
}
```

### Integration Points

The ModelProvider is used in:
- `TypeInferenceEngine`: For resolving property types during type inference
- `SemanticValidator`: For validating property access
- `TypedCompiler`: For type-aware compilation

### Type System Integration

The implementation must work with FHIRPath's type system:
- `FHIRPathType`: Base interface with name, cardinality, and type flags
- `ResourceType`: Extension for FHIR resources
- Cardinality: '0..0', '0..1', '1..1', '0..*', '1..*'

## Design Goals

1. **Multi-Version Support**: Handle FHIR R4, R5, STU3, and future versions
2. **Pluggable Architecture**: Allow registration of multiple ModelProviders for different models
3. **Logical Models**: Support custom logical models beyond standard FHIR resources
4. **Performance**: Sub-millisecond type lookups with minimal memory overhead
5. **Extensibility**: Support for profiles, extensions, and custom types
6. **Runtime Configuration**: Dynamic registration and selection of model providers
7. **Type Safety**: Leverage TypeScript's type system for compile-time guarantees
8. **Backward Compatibility**: Maintain compatibility with existing code

## Architecture Overview

### High-Level Pluggable Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ModelProviderRegistry                      │
│  (Central registry for all model providers)                  │
└───────────────┬─────────────┬─────────────┬─────────────────┘
                │             │             │
    ┌───────────▼──────┐ ┌───▼──────┐ ┌───▼──────────────┐
    │ FhirR4Provider   │ │ FhirR5   │ │ CustomLogical    │
    │                  │ │ Provider │ │ ModelProvider    │
    └───────────┬──────┘ └───┬──────┘ └───┬──────────────┘
                │             │             │
    ┌───────────▼──────────────▼─────────────▼───────────────┐
    │           Shared Type Registry Infrastructure           │
    └─────────────────────────────────────────────────────────┘
```

### Core Components

1. **ModelProviderRegistry**: Central registry managing multiple model providers
2. **ModelProvider Interface**: Standard interface implemented by all providers
3. **Model-Specific Providers**: Individual implementations for each model type
4. **ModelProviderContext**: Context object for model selection during evaluation
5. **Type Registry Infrastructure**: Shared utilities for type management

## Design Alternatives

### Alternative 1: Runtime JSON Loading

**Approach**: Load FHIR StructureDefinition JSON files at runtime

**Pros**:
- Flexibility to update definitions without recompilation
- Standard FHIR format
- Easy to validate against official definitions

**Cons**:
- Runtime parsing overhead
- Larger bundle size (JSON files)
- Type safety only at runtime

**Example Structure**:
```typescript
class FhirR4ModelProvider {
  private definitions: Map<string, StructureDefinition>;
  
  async loadDefinitions() {
    const files = await loadJsonFiles('./fhir-definitions/r4/');
    this.parseDefinitions(files);
  }
}
```

### Alternative 2: Code Generation (Recommended)

**Approach**: Generate TypeScript code from FHIR definitions at build time

**Pros**:
- Compile-time type safety
- Optimal runtime performance
- Smaller bundle size
- IDE autocomplete support

**Cons**:
- Requires build step
- Less flexible for runtime updates

**Example Generated Code**:
```typescript
// Generated from FHIR definitions
export const PatientDefinition: ResourceDefinition = {
  resourceType: 'Patient',
  baseType: 'DomainResource',
  properties: {
    identifier: { type: 'Identifier', cardinality: '0..*' },
    active: { type: 'boolean', cardinality: '0..1' },
    name: { type: 'HumanName', cardinality: '0..*' },
    gender: { type: 'code', cardinality: '0..1', binding: 'administrative-gender' },
    birthDate: { type: 'date', cardinality: '0..1' },
    // ... more properties
  }
};
```

### Alternative 3: Hybrid Approach

**Approach**: Core definitions as generated code, extensions loaded at runtime

**Pros**:
- Balance of performance and flexibility
- Supports custom profiles
- Reasonable bundle size

**Cons**:
- More complex implementation
- Two different loading mechanisms

## Recommended Design: Pluggable Architecture with Registry

### Core Interfaces

```typescript
// Model Provider Registry
interface ModelProviderRegistry {
  // Registration
  register(provider: ModelProvider, options?: RegistrationOptions): void;
  unregister(modelId: string): void;
  
  // Provider access
  getProvider(modelId: string): ModelProvider | null;
  getDefaultProvider(): ModelProvider | null;
  getAllProviders(): Map<string, ModelProvider>;
  
  // Model resolution
  resolveProvider(context: ModelProviderContext): ModelProvider;
}

interface RegistrationOptions {
  modelId: string;        // Unique identifier (e.g., 'fhir-r4', 'fhir-r5')
  modelVersion?: string;  // Version identifier
  isDefault?: boolean;    // Set as default provider
  aliases?: string[];     // Alternative names
}

interface ModelProviderContext {
  modelId?: string;       // Explicit model selection
  modelVersion?: string;  // Version constraint
  resourceType?: string;  // Resource type hint
  namespace?: string;     // Namespace for logical models
}

// Enhanced ModelProvider interface
interface ModelProvider {
  // Model metadata
  getModelInfo(): ModelInfo;
  
  // Existing interface methods...
  getResourceType(name: string): ResourceType | null;
  hasResourceType(name: string): boolean;
  getAllResourceTypes(): string[];
  
  // Namespace support for logical models
  getResourceTypeWithNamespace(namespace: string, name: string): ResourceType | null;
  getNamespaces(): string[];
}

interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: 'fhir' | 'logical' | 'custom';
  supportedNamespaces?: string[];
  description?: string;
}

// Shared data structures
interface ResourceDefinition {
  resourceType: string;
  namespace?: string;     // For logical models
  baseType?: string;
  url: string;
  properties: Map<string, PropertyDefinition>;
  requiredProperties: Set<string>;
}

interface PropertyDefinition {
  path: string;
  type: PropertyType | PropertyType[]; // Union for choice types
  cardinality: Cardinality;
  isModifier?: boolean;
  isSummary?: boolean;
  binding?: ValueSetBinding;
  referenceTargets?: string[]; // For Reference types
}

interface PropertyType {
  code: string; // 'string', 'boolean', 'Reference', etc.
  profile?: string[]; // For profiled types
}

interface ValueSetBinding {
  strength: 'required' | 'extensible' | 'preferred' | 'example';
  valueSet: string;
}
```

### ModelProviderRegistry Implementation

```typescript
export class DefaultModelProviderRegistry implements ModelProviderRegistry {
  private providers: Map<string, ModelProvider> = new Map();
  private defaultProviderId: string | null = null;
  private aliases: Map<string, string> = new Map(); // alias -> modelId
  
  register(provider: ModelProvider, options?: RegistrationOptions): void {
    const modelInfo = provider.getModelInfo();
    const modelId = options?.modelId || modelInfo.id;
    
    // Register provider
    this.providers.set(modelId, provider);
    
    // Set as default if requested
    if (options?.isDefault || this.providers.size === 1) {
      this.defaultProviderId = modelId;
    }
    
    // Register aliases
    if (options?.aliases) {
      options.aliases.forEach(alias => {
        this.aliases.set(alias, modelId);
      });
    }
  }
  
  unregister(modelId: string): void {
    this.providers.delete(modelId);
    
    // Clear aliases
    for (const [alias, id] of this.aliases) {
      if (id === modelId) {
        this.aliases.delete(alias);
      }
    }
    
    // Update default if needed
    if (this.defaultProviderId === modelId) {
      this.defaultProviderId = this.providers.size > 0 
        ? this.providers.keys().next().value 
        : null;
    }
  }
  
  getProvider(modelId: string): ModelProvider | null {
    // Check direct ID
    const provider = this.providers.get(modelId);
    if (provider) return provider;
    
    // Check aliases
    const aliasedId = this.aliases.get(modelId);
    return aliasedId ? this.providers.get(aliasedId) : null;
  }
  
  getDefaultProvider(): ModelProvider | null {
    return this.defaultProviderId 
      ? this.providers.get(this.defaultProviderId) || null
      : null;
  }
  
  resolveProvider(context: ModelProviderContext): ModelProvider {
    // Explicit model selection
    if (context.modelId) {
      const provider = this.getProvider(context.modelId);
      if (provider) return provider;
    }
    
    // Try to infer from resource type
    if (context.resourceType) {
      for (const provider of this.providers.values()) {
        if (provider.hasResourceType(context.resourceType)) {
          return provider;
        }
      }
    }
    
    // Fall back to default
    const defaultProvider = this.getDefaultProvider();
    if (defaultProvider) return defaultProvider;
    
    throw new Error('No suitable ModelProvider found');
  }
}
```

### Example Provider Implementations

```typescript
// FHIR R4 Provider
export class FhirR4ModelProvider implements ModelProvider {
  private registry: TypeRegistry;
  
  constructor() {
    this.registry = new TypeRegistry();
    // Load FHIR R4 definitions
  }
  
  getModelInfo(): ModelInfo {
    return {
      id: 'fhir-r4',
      name: 'FHIR R4',
      version: '4.0.1',
      type: 'fhir',
      description: 'HL7 FHIR Release 4'
    };
  }
  
  // ... implementation
}

// FHIR R5 Provider
export class FhirR5ModelProvider implements ModelProvider {
  getModelInfo(): ModelInfo {
    return {
      id: 'fhir-r5',
      name: 'FHIR R5',
      version: '5.0.0',
      type: 'fhir',
      description: 'HL7 FHIR Release 5'
    };
  }
  
  // ... implementation
}

// Custom Logical Model Provider
export class CustomLogicalModelProvider implements ModelProvider {
  private models: Map<string, Map<string, ResourceDefinition>> = new Map();
  
  getModelInfo(): ModelInfo {
    return {
      id: 'custom-logical',
      name: 'Custom Logical Models',
      version: '1.0.0',
      type: 'logical',
      supportedNamespaces: Array.from(this.models.keys()),
      description: 'User-defined logical models'
    };
  }
  
  addLogicalModel(namespace: string, model: ResourceDefinition): void {
    if (!this.models.has(namespace)) {
      this.models.set(namespace, new Map());
    }
    this.models.get(namespace)!.set(model.resourceType, model);
  }
  
  getResourceTypeWithNamespace(namespace: string, name: string): ResourceType | null {
    const model = this.models.get(namespace)?.get(name);
    return model ? this.convertToResourceType(model) : null;
  }
  
  // ... implementation
}
```

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)
1. Implement ModelProviderRegistry
2. Update ModelProvider interface with new methods
3. Create base classes for common functionality
4. Set up plugin architecture

### Phase 2: FHIR Providers (Week 2-3)
1. Implement FhirR4ModelProvider
2. Create FhirR5ModelProvider stub
3. Set up code generation for FHIR definitions
4. Handle version-specific differences

### Phase 3: Logical Model Support (Week 3-4)
1. Implement CustomLogicalModelProvider
2. Create logical model definition format
3. Add namespace resolution
4. Support model composition

### Phase 4: Integration & Migration (Week 4-5)
1. Update existing code to use registry
2. Maintain backward compatibility
3. Comprehensive testing across versions
4. Performance optimization

## Key Design Decisions

### 1. Registry-Based Architecture
**Decision**: Use a central registry for all model providers
**Rationale**: Enables runtime selection and multi-version support
**Trade-off**: Small overhead for provider resolution

### 2. Namespace Support
**Decision**: Add namespace support for logical models
**Rationale**: Prevents naming conflicts between different models
**Alternative**: Prefix-based naming

### 3. Model Context Resolution
**Decision**: Support both explicit and implicit model selection
**Rationale**: Flexibility for different use cases
**Trade-off**: More complex resolution logic

### 4. Plugin Architecture
**Decision**: Allow third-party model providers
**Rationale**: Extensibility for custom domains
**Trade-off**: Need to maintain stable interfaces

### 5. Backward Compatibility
**Decision**: Default to FHIR R4 when no model specified
**Rationale**: Smooth migration for existing code
**Alternative**: Require explicit model selection

## Dynamic vs Static Model Providers

### Dynamic Model Provider
For scenarios where models need to be updated at runtime:

```typescript
export class DynamicModelProvider implements ModelProvider {
  private definitions: Map<string, ResourceDefinition> = new Map();
  private version: number = 0; // Version counter for cache invalidation
  
  // Dynamic loading from server
  async loadFromServer(url: string): Promise<void> {
    const response = await fetch(url);
    const structureDefs = await response.json();
    this.updateDefinitions(structureDefs);
  }
  
  // Hot reload support
  updateDefinition(structureDef: StructureDefinition): void {
    const resourceDef = this.convertStructureDefinition(structureDef);
    this.definitions.set(resourceDef.resourceType, resourceDef);
    this.version++; // Invalidate caches
    this.rebuildIndices();
  }
  
  removeDefinition(resourceType: string): void {
    this.definitions.delete(resourceType);
    this.version++;
    this.rebuildIndices();
  }
  
  // Watch for changes
  watchForUpdates(callback: (update: ModelUpdate) => void): void {
    // WebSocket or polling implementation
  }
}
```

### Static Model Provider
For build-time optimized scenarios:

```typescript
// Generated at build time
export class StaticFhirR4Provider implements ModelProvider {
  // All definitions pre-compiled into the bundle
  private static readonly DEFINITIONS = {
    Patient: PatientDefinition,
    Observation: ObservationDefinition,
    // ... all other resources
  };
  
  // Pre-computed indices for maximum performance
  private static readonly PROPERTY_INDEX = buildPropertyIndex(DEFINITIONS);
  private static readonly HIERARCHY_INDEX = buildHierarchyIndex(DEFINITIONS);
  
  // Zero initialization cost
  constructor() {
    // No loading needed
  }
}
```

### Hybrid Approach
Supporting both static and dynamic models:

```typescript
export class HybridModelProvider implements ModelProvider {
  private staticDefinitions: Map<string, ResourceDefinition>;
  private dynamicDefinitions: Map<string, ResourceDefinition> = new Map();
  private mergedView: Map<string, ResourceDefinition> = new Map();
  
  constructor(staticDefs: Map<string, ResourceDefinition>) {
    this.staticDefinitions = staticDefs;
    this.rebuildMergedView();
  }
  
  // Add/update dynamic definitions
  addDynamicDefinition(def: ResourceDefinition): void {
    this.dynamicDefinitions.set(def.resourceType, def);
    this.rebuildMergedView();
  }
  
  private rebuildMergedView(): void {
    // Dynamic definitions override static ones
    this.mergedView = new Map([
      ...this.staticDefinitions,
      ...this.dynamicDefinitions
    ]);
  }
}
```

## Performance Considerations

### Memory Usage
- Static providers: ~5-7MB for complete FHIR definitions
- Dynamic providers: Variable based on loaded definitions
- Hybrid approach: Static baseline + dynamic overhead

### Lookup Performance
- Static: O(1) with pre-computed indices
- Dynamic: O(1) after index rebuild
- Provider resolution: O(1) in registry

### Initialization Cost
- Static: Near zero (pre-compiled)
- Dynamic: Depends on loading strategy
- Hybrid: Static baseline instant, dynamic loaded on demand

## Error Handling

1. **Unknown Resources**: Return null, don't throw
2. **Invalid Properties**: Return null for type, false for validation
3. **Circular References**: Detect and handle gracefully
4. **Missing Definitions**: Log warning, fall back to ANY type

## Testing Strategy

### Unit Tests
- Each ModelProvider method
- Edge cases (circular refs, missing types)
- Performance benchmarks

### Integration Tests
- With TypeInferenceEngine
- With SemanticValidator
- End-to-end FHIRPath expressions

### Test Data
- Use official FHIR examples
- Cover all resource types
- Include complex scenarios

## Future Considerations

1. **FHIR R5 Support**: Design allows easy addition of R5 provider
2. **Custom Profiles**: Extension mechanism for profiles
3. **Performance Optimization**: Lazy loading for rarely used types
4. **Validation Rules**: Could add invariant checking

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large bundle size | High | Code generation minimizes size |
| Complex type hierarchies | Medium | Pre-compute hierarchy information |
| Choice type complexity | Medium | Clear abstraction layer |
| Performance regression | High | Comprehensive benchmarking |

## Integration with FHIRPath Evaluation

### Context-Aware Evaluation

```typescript
interface FHIRPathEvaluationContext {
  modelProvider?: ModelProvider;
  modelContext?: ModelProviderContext;
  // ... other context properties
}

// Usage in evaluation
function evaluateFHIRPath(
  expression: string,
  resource: any,
  context?: FHIRPathEvaluationContext
): any[] {
  const provider = context?.modelProvider || 
    registry.resolveProvider(context?.modelContext || {
      resourceType: resource.resourceType
    });
  
  // Use provider for type resolution during evaluation
  // ...
}
```

### Model-Specific Functions

```typescript
// Allow model-specific custom functions
interface ModelProvider {
  // ... existing methods
  
  // Custom functions for this model
  getCustomFunctions?(): Map<string, FHIRPathFunction>;
}

// Example: FHIR R5 specific function
class FhirR5ModelProvider {
  getCustomFunctions() {
    return new Map([
      ['r5specific', {
        name: 'r5specific',
        implementation: (context, ...args) => {
          // R5-specific logic
        }
      }]
    ]);
  }
}
```

## Questions for Review

1. **Dynamic Loading Strategy**: Should dynamic providers support async APIs, or maintain sync interface with background updates?
2. **Cache Invalidation**: How should dependent components handle model updates in dynamic scenarios?
3. **Model Versioning**: Should we support multiple versions of the same model simultaneously?
4. **Performance Targets**: What are acceptable performance metrics for dynamic model updates?
5. **Security**: How should we validate and sandbox dynamically loaded models?
6. **Conflict Resolution**: How to handle conflicts when multiple providers claim the same resource type?
7. **Migration Path**: Should we provide tools to convert existing FHIR profiles to our format?

## Next Steps

1. Approval of design approach
2. Set up code generation tooling
3. Begin implementation of Phase 1
4. Regular progress reviews

## Appendix: Example Usage

### Basic Setup
```typescript
// Create registry
const registry = new DefaultModelProviderRegistry();

// Register static FHIR R4 provider
const r4Provider = new StaticFhirR4Provider();
registry.register(r4Provider, {
  modelId: 'fhir-r4',
  aliases: ['r4', 'fhir'],
  isDefault: true
});

// Register dynamic FHIR R5 provider
const r5Provider = new DynamicFhirR5Provider();
await r5Provider.loadFromServer('https://example.com/fhir/r5/definitions');
registry.register(r5Provider, {
  modelId: 'fhir-r5',
  aliases: ['r5']
});

// Register custom logical model provider
const logicalProvider = new CustomLogicalModelProvider();
registry.register(logicalProvider, {
  modelId: 'custom-logical'
});
```

### Using Different Models
```typescript
// Explicit model selection
const r4Patient = registry.getProvider('fhir-r4')
  ?.getResourceType('Patient');

const r5Patient = registry.getProvider('fhir-r5')
  ?.getResourceType('Patient');

// Context-based resolution
const provider = registry.resolveProvider({
  modelId: 'fhir-r5'
});

// Working with logical models
logicalProvider.addLogicalModel('myapp', {
  resourceType: 'CustomPatient',
  namespace: 'myapp',
  properties: new Map([
    ['mrn', { type: 'string', cardinality: '1..1' }],
    ['visits', { type: 'CustomVisit', cardinality: '0..*' }]
  ])
});

const customType = logicalProvider
  .getResourceTypeWithNamespace('myapp', 'CustomPatient');
```

### Dynamic Updates
```typescript
// Watch for model updates
const dynamicProvider = registry.getProvider('fhir-r5') as DynamicModelProvider;

dynamicProvider.watchForUpdates((update) => {
  console.log(`Model updated: ${update.resourceType}`);
  // Re-evaluate affected expressions
});

// Hot reload a definition
dynamicProvider.updateDefinition(newPatientStructureDef);
```

### FHIRPath Integration
```typescript
// Evaluate with specific model
const result = evaluateFHIRPath(
  'Patient.name.given',
  patient,
  {
    modelProvider: r5Provider,
    modelContext: { modelId: 'fhir-r5' }
  }
);

// Let the system auto-detect
const autoResult = evaluateFHIRPath(
  'Observation.value as Quantity',
  observation
  // Provider resolved based on resource type
);
```