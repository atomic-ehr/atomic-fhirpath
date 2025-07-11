# Implement FHIR-Specific Functions [pending]

## Overview
Implement FHIR-specific FHIRPath functions for handling FHIR resources, extensions, choice types, and contained resources.

## Tasks
- [ ] Move pending-tests/17-fhir-specific.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement FHIR-specific functions in the codebase

## Requirements from Tests
1. **Value extraction**:
   - `getValue()` - Extract primitive value from element
   - `hasValue()` - Check if element has value
   - Handle FHIR's dual representation (value + _value)

2. **Extension handling**:
   - `extension(url)` - Filter extensions by URL
   - Support extension chains
   - Navigate nested extensions
   - Handle modifier extensions

3. **Choice type support**:
   - Recognize `[x]` notation (e.g., `value[x]`)
   - Type-specific property access
   - `as` operator for casting choices

4. **Reference resolution**:
   - `resolve()` - Follow references
   - Support contained resources
   - Handle external references appropriately
   - Cycle detection

5. **Bundle navigation**:
   - Access bundle entries
   - `entry.resource` navigation
   - `entry.request`/`entry.response`
   - Search result scoring

6. **Factory functions**:
   - `%factory.string(value)`
   - `%factory.boolean(value)`
   - Create FHIR primitives with metadata

7. **Polymorphic navigation**:
   - Navigate through resource inheritance
   - DomainResource properties
   - Resource base properties

8. **Primitive extensions**:
   - Access `_property` for extensions
   - Merge primitive and complex representations
   - Handle arrays properly

## Implementation Notes
- Deep FHIR understanding required
- Consider FHIR version differences
- Reference resolution needs boundaries
- Extension URLs are case-sensitive

## Success Criteria
- All tests in 17-fhir-specific.test.ts pass
- Correct FHIR semantics
- Handle all FHIR constructs
- Good performance
- Version-aware implementation