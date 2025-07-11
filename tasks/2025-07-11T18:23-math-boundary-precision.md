# Implement Math Boundary and Precision Handling [pending]

## Overview
Implement proper boundary checking and precision handling for mathematical operations in FHIRPath.

## Tasks
- [ ] Move pending-tests/37-math-boundary-precision.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement boundary and precision handling in the codebase

## Requirements from Tests
1. **Integer boundaries**:
   - Maximum safe integer
   - Minimum safe integer
   - Overflow detection
   - Underflow handling

2. **Decimal precision**:
   - Significant digits preservation
   - Rounding modes
   - Precision loss detection
   - Scientific notation

3. **Arithmetic boundaries**:
   - Division by zero handling
   - Infinity representation
   - NaN handling
   - Overflow in operations

4. **Precision operations**:
   - Round to specific precision
   - Truncate vs round
   - Banker's rounding
   - Ceiling/floor variants

5. **Comparison precision**:
   - Epsilon comparisons
   - Decimal equality tolerance
   - Significant figure comparison

6. **Error handling**:
   - Clear overflow errors
   - Precision loss warnings
   - Invalid operation errors
   - Recovery strategies

## Implementation Notes
- Use decimal library if needed
- IEEE 754 considerations
- Consistent error handling
- Performance vs precision tradeoffs

## Success Criteria
- All tests in 37-math-boundary-precision.test.ts pass
- Predictable behavior
- Clear error messages
- Good performance
- Well documented limits