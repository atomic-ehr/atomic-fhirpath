# Implement Statistical Functions [pending]

## Overview
Implement statistical and mathematical aggregate functions for FHIRPath collections.

## Tasks
- [ ] Move pending-tests/33-statistical-functions.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement statistical functions in the codebase

## Requirements from Tests
1. **Basic statistics**:
   - `mean()` / `avg()` - Arithmetic mean
   - `median()` - Middle value
   - `mode()` - Most frequent value
   - `sum()` - Total (may exist)

2. **Spread measures**:
   - `stdDev()` - Standard deviation
   - `variance()` - Statistical variance
   - `range()` - Max - min
   - Population vs sample options

3. **Percentiles**:
   - `percentile(n)` - Nth percentile
   - `quartile(n)` - Quartiles (25, 50, 75)
   - Interpolation methods
   - Handle edge cases

4. **Advanced statistics**:
   - `correlation()` - Between two sets
   - `covariance()` - Statistical covariance
   - `regression()` - Linear regression

5. **Type handling**:
   - Numeric types only
   - Integer/Decimal support
   - Quantity with same units
   - Error on non-numeric

6. **Empty handling**:
   - Return empty for empty input
   - Minimum size requirements
   - Clear error messages

## Implementation Notes
- Numerical stability important
- Handle large datasets
- Precision considerations
- Standard algorithms

## Success Criteria
- All tests in 33-statistical-functions.test.ts pass
- Numerically accurate
- Good performance
- Handle edge cases
- Clear documentation