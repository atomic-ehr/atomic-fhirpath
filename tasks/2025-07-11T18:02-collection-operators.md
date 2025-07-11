# Implement Collection Operators [completed]

## Overview
Implement FHIRPath collection operators (`|` union, `in` membership, `contains`) with proper semantics for duplicates and complex types.

## Tasks
- [x] Move pending-tests/12-operators-collection.test.ts to test directory
- [x] Verify test compliance with FHIRPath specification in ./refs/FHIRPath/spec/2019May/index.adoc
- [x] Fix test if not compliant with spec
- [x] Run tests to identify failures
- [x] Implement collection operators in the codebase
- [x] Run tests
- [x] run `bun run typecheck` to find ts errors
- [x] fix ts errors
- [x] update this file with summary what was done

## Summary of Changes

### 1. Test Compliance Fixes
- Updated union operator test to expect duplicate elimination as per FHIRPath spec
- Fixed empty collection membership test to return empty (not [false]) when left operand is empty

### 2. Implementation Changes

#### Union Operator (`|`)
- Implemented proper duplicate elimination using JSON.stringify for equality comparison
- Preserves order while removing duplicates as per spec

#### Membership Operator (`in`)
- Empty left operand returns empty
- Empty right operand returns false
- Single value in collection returns boolean result
- Collection in collection returns element-wise membership results

#### Contains Operator
- Empty collection contains X returns false
- Collection contains empty returns empty
- Single value containment check
- Collection contains collection checks if all elements are contained

#### Identifier Resolution Fix
- Fixed scoping issue where identifiers inside where() and all() functions couldn't access root data properties
- Now tries context first, then falls back to root data object if not found

### 3. Test Results
All 36 tests in the collection operators test suite now pass successfully.

## Requirements from Tests
1. **Union operator (`|`)**:
   - Concatenates collections preserving duplicates
   - Not a set union - keeps all elements
   - Handles mixed types appropriately
   - Works with primitives and complex objects

2. **Membership operator (`in`)**:
   - Tests if left operand is member of right collection
   - Supports single value in collection
   - Supports collection subset testing
   - Uses equality (not equivalence) for comparison
   - Case-sensitive for strings

3. **Contains operator**:
   - Reverse of `in` operator
   - Tests if collection contains value(s)
   - Same comparison semantics as `in`

4. **Empty/null handling**:
   - Empty `in` collection returns empty
   - Collection `in` empty returns false
   - Consistent null propagation

5. **Complex type support**:
   - Works with FHIR resources and complex objects
   - Property-based equality for objects
   - Handles nested structures

6. **Type compatibility**:
   - No type restrictions on union
   - Membership tests use type-aware equality

## Implementation Notes
- Consider performance for large collections
- May need efficient equality comparison
- Handle reference equality vs value equality
- Ensure consistent with existing collection functions

## Success Criteria
- All tests in 12-operators-collection.test.ts pass
- Good performance with large collections
- Clear semantics for edge cases
- Consistent with FHIRPath specification
