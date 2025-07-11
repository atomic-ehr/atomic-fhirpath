# Implement Advanced Math Functions [pending]

## Overview
Implement advanced mathematical functions and operations for FHIRPath including power, logarithms, trigonometry, and statistical functions.

## Tasks
- [ ] Move pending-tests/20-math-advanced.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement advanced math functions in the codebase

## Requirements from Tests
1. **Power and roots**:
   - `power(exponent)` - Raise to power
   - `sqrt()` - Square root
   - `exp()` - e^x
   - Handle negative numbers appropriately

2. **Logarithms**:
   - `ln()` - Natural logarithm
   - `log(base)` - Logarithm with custom base
   - Domain checking (positive numbers only)

3. **Trigonometric functions**:
   - `sin()`, `cos()`, `tan()`
   - `asin()`, `acos()`, `atan()`
   - Radians vs degrees handling

4. **Rounding variants**:
   - `round(precision)` - Round to decimal places
   - `truncate()` - Remove decimal part
   - Banking rounding option

5. **Statistical aggregates**:
   - `avg()` - Average/mean
   - `sum()` - Total
   - `min()`, `max()` - Already exist
   - `stdDev()` - Standard deviation
   - `variance()` - Statistical variance

6. **Number properties**:
   - Handle infinity and NaN
   - Precision limitations
   - Overflow/underflow detection

## Implementation Notes
- Use JavaScript Math library
- Consider decimal precision library
- Handle edge cases carefully
- Document precision limitations

## Success Criteria
- All tests in 20-math-advanced.test.ts pass
- Accurate calculations
- Good error handling
- Performance acceptable
- Clear documentation of limitations