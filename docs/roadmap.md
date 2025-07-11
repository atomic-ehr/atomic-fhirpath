# FHIRPath Implementation Roadmap

## Top 3 Priority Features

### 1. ModelProvider Implementation for FHIR Resources
**Priority: CRITICAL**
**Estimated Effort: Large**

#### Why Critical
- Currently only an interface exists with no concrete implementation
- Essential for proper FHIR resource navigation and property resolution
- Blocks many advanced FHIRPath features that depend on type information
- Required for real-world FHIR processing

#### Scope
- Implement concrete ModelProvider for FHIR R4 resources
- Support for resource type hierarchy
- Property type resolution with cardinality
- Choice type handling (e.g., value[x])
- Extension support

#### Benefits
- Enable navigation through FHIR resources with proper type checking
- Support polymorphic property access
- Enable type-based filtering and validation
- Foundation for advanced features

### 2. Special Variables ($this, $index, $total)
**Priority: HIGH**
**Estimated Effort: Medium**

#### Why High Priority
- Required for filtering operations (`where()`, `select()`)
- Essential for iteration over collections
- Many FHIRPath expressions depend on these variables
- Already partially supported in the parser

#### Scope
- Implement `$this` for current item reference
- Implement `$index` for position tracking
- Implement `$total` for aggregate operations
- Update evaluation context management
- Ensure proper scoping in nested expressions

#### Benefits
- Enable complex filtering expressions
- Support position-based operations
- Allow self-referential expressions
- Complete the iteration model

### 3. Quantity Type with Units
**Priority: HIGH**
**Estimated Effort: Medium**

#### Why High Priority
- Critical for clinical data (lab results, medications, vitals)
- Common in real-world FHIR resources
- Required for proper comparison of measurements
- Foundation for clinical decision support

#### Scope
- Implement Quantity literal parsing (`10 'mg'`, `4 days`)
- UCUM unit system integration
- Quantity arithmetic operations
- Unit-aware comparisons
- Conversion between compatible units

#### Benefits
- Handle clinical measurements correctly
- Enable unit-aware calculations
- Support dosage and timing expressions
- Comply with FHIR quantity requirements

## Implementation Strategy

### Phase 1: ModelProvider (4-6 weeks)
1. Design provider interface implementation
2. Create FHIR R4 resource definitions
3. Implement type resolution logic
4. Add comprehensive tests
5. Integrate with existing type system

### Phase 2: Special Variables (2-3 weeks)
1. Extend evaluation context
2. Implement variable resolution
3. Update function implementations
4. Test with complex expressions
5. Update documentation

### Phase 3: Quantity Support (3-4 weeks)
1. Extend parser for quantity literals
2. Create Quantity type implementation
3. Implement UCUM integration
4. Add arithmetic operations
5. Implement comparisons

## Future Considerations

After completing the top 3 features:
- Complete remaining function implementations
- Add external constants support
- Implement type operations (is, as, ofType)
- Add date/time arithmetic
- Support for extensions and modifiers

## Success Metrics

- Pass FHIR FHIRPath test suite
- Support real-world FHIR queries
- Performance benchmarks maintained
- Full type safety in expressions
- Comprehensive documentation