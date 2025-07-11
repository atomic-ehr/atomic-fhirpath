# Implement String indexOf and trim Functions [pending]

## Overview
Implement string manipulation functions `indexOf()`, `lastIndexOf()`, and various trim functions for FHIRPath.

## Tasks
- [ ] Move pending-tests/36-string-indexof-trim.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement string functions in the codebase

## Requirements from Tests
1. **Index functions**:
   - `indexOf(substring)` - First occurrence
   - `lastIndexOf(substring)` - Last occurrence
   - `indexOf(substring, start)` - Search from position
   - Return -1 if not found
   - Case-sensitive search

2. **Trim functions**:
   - `trim()` - Remove leading/trailing whitespace
   - `trimStart()` / `trimLeft()` - Leading only
   - `trimEnd()` / `trimRight()` - Trailing only
   - Unicode whitespace support

3. **Advanced trim**:
   - `trim(characters)` - Remove specific chars
   - Character set support
   - Multiple character trimming

4. **String inspection**:
   - Position validation
   - Empty string handling
   - Null/undefined handling

5. **Unicode support**:
   - Proper character counting
   - Surrogate pair handling
   - Combining characters

6. **Edge cases**:
   - Empty search string
   - Search beyond length
   - Negative positions
   - Very long strings

## Implementation Notes
- Efficient algorithms
- Unicode-aware implementation
- Consistent with JavaScript
- Performance for long strings

## Success Criteria
- All tests in 36-string-indexof-trim.test.ts pass
- Unicode compliant
- Good performance
- Intuitive behavior
- Well documented