# Implement Conversion Alias Functions [pending]

## Overview
Implement alias functions for type conversions that provide alternative names and enhanced functionality.

## Tasks
- [ ] Move pending-tests/38-conversion-alias-functions.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement conversion alias functions in the codebase

## Requirements from Tests
1. **Alias mappings**:
   - `int()` -> `toInteger()`
   - `dec()` -> `toDecimal()`
   - `str()` -> `toString()`
   - `bool()` -> `toBoolean()`
   - Other common aliases

2. **Enhanced conversions**:
   - Format specifiers
   - Locale support
   - Custom patterns
   - Validation options

3. **Convenience functions**:
   - `number()` - Convert to best numeric type
   - `text()` - Convert to display text
   - `id()` - Convert to identifier

4. **Parse functions**:
   - `parseInteger()`
   - `parseDecimal()`
   - `parseDate(format)`
   - Error handling options

5. **Format functions**:
   - `format(pattern)`
   - Date/time formatting
   - Number formatting
   - Custom formats

6. **Chain support**:
   - Multiple conversions
   - Pipeline pattern
   - Error propagation

## Implementation Notes
- Maintain compatibility
- Consistent naming
- Good defaults
- Extensible design

## Success Criteria
- All tests in 38-conversion-alias-functions.test.ts pass
- Intuitive aliases
- No breaking changes
- Good documentation
- Consistent behavior