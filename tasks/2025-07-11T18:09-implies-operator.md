# Implement Implies Operator [pending]

## Overview
Implement the FHIRPath implies operator (`implies`) for logical implication with proper three-valued logic.

## Tasks
- [ ] Move pending-tests/19-implies-operator.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement implies operator in the codebase

## Requirements from Tests
1. **Implies operator semantics**:
   - `A implies B` equivalent to `(not A) or B`
   - Right-associative
   - Lower precedence than other logical operators

2. **Truth table**:
   ```
   A     | B     | A implies B
   ------|-------|------------
   true  | true  | true
   true  | false | false
   true  | empty | empty
   false | true  | true
   false | false | true
   false | empty | true
   empty | true  | true
   empty | false | empty
   empty | empty | empty
   ```

3. **Short-circuit evaluation**:
   - If A is false, return true (don't evaluate B)
   - If A is empty and B would error, return empty
   - Otherwise evaluate both operands

4. **Use cases**:
   - Validation rules
   - Conditional requirements
   - Business logic expressions

5. **Collection handling**:
   - Single boolean extracted from collections
   - Empty collections treated as empty
   - Type checking for boolean operands

## Implementation Notes
- Add to operator precedence table
- Implement three-valued logic carefully
- Consider short-circuit optimization
- Clear error messages

## Success Criteria
- All tests in 19-implies-operator.test.ts pass
- Correct truth table implementation
- Proper precedence handling
- Short-circuit behavior verified