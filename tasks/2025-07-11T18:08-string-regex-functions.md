# Implement String and Regex Functions [pending]

## Overview
Implement additional string manipulation and regex pattern matching functions for FHIRPath.

## Tasks
- [ ] Move pending-tests/18-string-regex.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement string and regex functions in the codebase

## Requirements from Tests
1. **Pattern matching**:
   - Advanced regex patterns
   - Unicode support
   - Named capture groups
   - Lookahead/lookbehind assertions

2. **String operations**:
   - Case conversions
   - Padding functions
   - Truncation with ellipsis
   - Word wrapping

3. **Validation patterns**:
   - Email validation
   - URL validation
   - Phone number patterns
   - Custom format validation

4. **Text processing**:
   - Remove HTML tags
   - Extract text content
   - Normalize whitespace
   - Handle special characters

5. **Performance considerations**:
   - Regex caching
   - Efficient string building
   - Memory usage for large texts

## Implementation Notes
- Build on existing regex support
- Consider security (ReDoS attacks)
- Unicode normalization important
- Consistent with other string functions

## Success Criteria
- All tests in 18-string-regex.test.ts pass
- Secure regex handling
- Good performance
- Comprehensive string utilities