# Implement Advanced Functions [pending]

## Overview
Implement advanced FHIRPath functions including set operations, conditional logic, debugging, regex, and string manipulation.

## Tasks
- [ ] Move pending-tests/16-advanced-functions.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement advanced functions in the codebase

## Requirements from Tests
1. **Set operations**:
   - `intersect()` - Common elements between collections
   - `exclude()` - Remove elements from collection
   - Set semantics (no duplicates in result)

2. **Conditional function**:
   - `iif(condition, trueResult, falseResult)`
   - Lazy evaluation of branches
   - Handles empty condition as false
   - Returns empty if condition is empty and no false branch

3. **Debug function**:
   - `trace(message)` - Output debug info
   - Returns input unchanged
   - Optional custom handler for output
   - Useful for development/debugging

4. **Regex functions**:
   - `matches(pattern)` - Test if matches regex
   - `replace(pattern, substitution)` - Replace matches
   - Support for flags (case-insensitive, multiline)
   - Capture group support in replace

5. **String manipulation**:
   - `split(delimiter)` - Split string into array
   - `join(delimiter)` - Join array into string
   - `trim()` - Remove whitespace
   - Handle empty/null appropriately

6. **Collection functions**:
   - `combine()` - Flatten nested collections
   - `union()` - Set union (no duplicates)
   - Different from `|` which keeps duplicates

7. **Regex patterns**:
   - ECMAScript regex syntax
   - Escape special characters properly
   - Support unicode patterns
   - Clear errors for invalid patterns

## Implementation Notes
- Consider regex engine choice
- Trace output mechanism needs design
- Set operations need efficient algorithms
- String functions should handle unicode

## Success Criteria
- All tests in 16-advanced-functions.test.ts pass
- Good regex performance
- Helpful trace implementation
- Efficient set operations
- Clear documentation