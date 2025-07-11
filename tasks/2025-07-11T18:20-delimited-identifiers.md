# Implement Delimited Identifiers [pending]

## Overview
Implement support for delimited identifiers in FHIRPath to handle properties with special characters or reserved words.

## Tasks
- [ ] Move pending-tests/34-delimited-identifiers.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement delimited identifier support in the codebase

## Requirements from Tests
1. **Syntax support**:
   - Backtick delimiters: \`identifier\`
   - Allow spaces in names
   - Allow special characters
   - Allow reserved words as identifiers

2. **Use cases**:
   - Properties with spaces: \`first name\`
   - Reserved words: \`where\`, \`select\`
   - Special characters: \`value-x\`, \`a.b.c\`
   - Non-ASCII characters

3. **Parsing rules**:
   - Backticks are delimiters only
   - Escape backticks inside: \`\`
   - No string interpolation
   - Preserve exact identifier

4. **Resolution**:
   - Look up exact property name
   - Case-sensitive matching
   - No normalization
   - Work with all navigation

5. **Integration**:
   - Work in paths: Patient.\`first name\`
   - Work in functions: where(\`item-count\` > 5)
   - Environment variables: %\`my variable\`

6. **Error handling**:
   - Unmatched backticks
   - Empty identifiers
   - Clear error messages

## Implementation Notes
- Update lexer for backticks
- Modify parser grammar
- Property resolution changes
- Test with various names

## Success Criteria
- All tests in 34-delimited-identifiers.test.ts pass
- Clean syntax support
- No breaking changes
- Good error messages
- Well documented