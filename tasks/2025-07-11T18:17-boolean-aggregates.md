# Implement Boolean Aggregate Functions [pending]

## Overview
Implement boolean aggregate functions that operate on collections to produce boolean results.

## Tasks
- [ ] Move pending-tests/31-boolean-aggregates.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement boolean aggregate functions in the codebase

## Requirements from Tests
1. **Existence functions**:
   - `exists()` - True if non-empty
   - `exists(criteria)` - True if any match
   - `empty()` - True if empty
   - Inverse relationship

2. **Universal quantifiers**:
   - `all(condition)` - True if all match
   - `allTrue()` - All elements are true
   - `allFalse()` - All elements are false
   - Empty collection semantics

3. **Existential quantifiers**:
   - `any(condition)` - True if any match
   - `anyTrue()` - Any element is true
   - `anyFalse()` - Any element is false
   - Short-circuit evaluation

4. **Counting functions**:
   - `count() > 0` patterns
   - Efficient implementation
   - No unnecessary materialization

5. **Complex conditions**:
   - Nested boolean logic
   - Property testing
   - Type checking in conditions

6. **Three-valued logic**:
   - Handle empty/unknown
   - Propagation rules
   - Consistent with operators

## Implementation Notes
- Short-circuit where possible
- Efficient for large collections
- Clear empty semantics
- Consistent with SQL-like behavior

## Success Criteria
- All tests in 31-boolean-aggregates.test.ts pass
- Efficient implementation
- Clear semantics
- Good performance
- Intuitive behavior