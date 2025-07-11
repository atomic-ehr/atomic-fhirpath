# Implement Type System Functions [pending]

## Overview
Implement FHIRPath type system functions including type checking (`is`, `as`), type introspection (`type()`, `ofType()`), conversions, and type checking functions.

## Tasks
- [ ] Move pending-tests/13-type-system.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement type system functions in the codebase

## Requirements from Tests
1. **Type checking operators**:
   - `is` - Test if value is of given type
   - `as` - Cast value to type (return empty if not compatible)

2. **Type introspection**:
   - `type()` - Return type name with namespace
   - `ofType()` - Filter collection by type

3. **Conversion functions**:
   - `toInteger()`, `toDecimal()`, `toString()`
   - `toBoolean()`, `toDate()`, `toDateTime()`, `toTime()`
   - `toQuantity()`, `toRatio()`
   - Safe conversions - return empty on failure

4. **Conversion check functions**:
   - `convertsToInteger()`, `convertsToDecimal()`, etc.
   - Return true/false if conversion would succeed
   - Never throw errors

5. **Type categories**:
   - Primitive types: Integer, Decimal, String, Boolean, Date, DateTime, Time
   - Complex types: Quantity, Code, Id
   - FHIR types: All resource types
   - System namespace for primitives

6. **Polymorphic support**:
   - Support FHIR resource type hierarchies
   - DomainResource, Resource base types
   - Interface types (e.g., Element)

7. **Collection handling**:
   - Type functions work on collections
   - `ofType()` filters collections
   - Conversions apply to each element

## Implementation Notes
- Integrate with existing type system
- Consider caching type metadata
- Handle FHIR type hierarchies properly
- Ensure consistent namespace handling

## Success Criteria
- All tests in 13-type-system.test.ts pass
- Type safety throughout system
- Good performance for type checks
- Clear error messages
- Extensible for custom types