# Implement Equivalence Operators [pending]

## Overview
Implement FHIRPath equivalence operators (`~` and `!~`) that test semantic equivalence rather than strict equality.

## Tasks
- [ ] Move pending-tests/25-equivalence-operators.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement equivalence operators in the codebase

## Requirements from Tests
1. **Equivalence rules**:
   - `~` tests if values are equivalent
   - `!~` tests if values are not equivalent
   - More forgiving than `=` equality

2. **String equivalence**:
   - Case-insensitive comparison
   - Normalize whitespace
   - Trim leading/trailing space
   - Unicode normalization

3. **Number equivalence**:
   - Decimal precision tolerance
   - 1.0 ~ 1.00 ~ 1
   - Handle floating point issues

4. **DateTime equivalence**:
   - Different timezone representations
   - Same instant in time
   - Precision differences ignored

5. **Quantity equivalence**:
   - Unit conversion (1 m ~ 100 cm)
   - UCUM canonical form
   - Precision handling

6. **Complex type equivalence**:
   - Property order independent
   - Recursive equivalence
   - Ignore insignificant properties
   - Handle missing vs null

7. **Collection equivalence**:
   - Order independent by default
   - Element-wise equivalence
   - Same cardinality required

## Implementation Notes
- Different from equality operator
- Need UCUM for quantity conversion
- String normalization important
- Consider performance impact

## Success Criteria
- All tests in 25-equivalence-operators.test.ts pass
- Clear equivalence semantics
- Good performance
- Handle all types properly
- Well documented behavior