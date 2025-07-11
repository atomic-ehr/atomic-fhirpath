# Implement Variable Management [pending]

## Overview
Implement comprehensive variable management including definition, scoping, and resolution for FHIRPath expressions.

## Tasks
- [ ] Move pending-tests/35-variable-management.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement variable management in the codebase

## Requirements from Tests
1. **Variable definition**:
   - Define variables in scope
   - Multiple variable support
   - Any type values
   - Update existing variables

2. **Variable scoping**:
   - Lexical scoping rules
   - Inner scope shadows outer
   - Scope inheritance
   - Isolated contexts

3. **Let expressions**:
   - `let` keyword support
   - Multiple assignments
   - Use in expressions
   - Proper cleanup

4. **Variable resolution**:
   - $ prefix for user variables
   - % prefix for environment
   - Resolution order
   - Error on undefined

5. **Context management**:
   - Push/pop contexts
   - Nested contexts
   - Context isolation
   - Memory efficiency

6. **Advanced patterns**:
   - Computed variable names
   - Variable interpolation
   - Recursive definitions
   - Circular reference detection

## Implementation Notes
- Efficient context stack
- Memory management important
- Clear scoping rules
- Good debugging support

## Success Criteria
- All tests in 35-variable-management.test.ts pass
- Clean API design
- Efficient implementation
- Clear semantics
- Good documentation