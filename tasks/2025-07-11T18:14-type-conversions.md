# Implement Type Conversions [pending]

## Overview
Implement comprehensive type conversion functions and implicit conversion rules for FHIRPath.

## Tasks
- [ ] Move pending-tests/26-type-conversions.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement type conversion functions in the codebase

## Requirements from Tests
1. **Implicit conversions**:
   - Integer to Decimal when needed
   - Single element collection to singleton
   - No other implicit conversions

2. **Explicit conversion functions**:
   - Safe conversions (return empty on failure)
   - Preserve precision where possible
   - Handle edge cases gracefully

3. **String conversions**:
   - Parse various formats
   - Locale-independent parsing
   - Handle scientific notation
   - Trim whitespace

4. **Number conversions**:
   - Integer boundaries checking
   - Decimal precision preservation
   - Handle special values (infinity, NaN)

5. **DateTime conversions**:
   - Parse ISO 8601 formats
   - Handle partial dates
   - Timezone parsing
   - Maintain precision

6. **Boolean conversions**:
   - String: 'true', 'false' (case-insensitive)
   - Numbers: 0 = false, others = true
   - Empty = false principle

7. **Collection handling**:
   - Apply to each element
   - Return empty for any failures
   - Preserve collection structure

## Implementation Notes
- Consistent error handling
- No exceptions - return empty
- Consider localization issues
- Performance for bulk conversions

## Success Criteria
- All tests in 26-type-conversions.test.ts pass
- Safe conversion semantics
- Good performance
- Clear documentation
- Predictable behavior