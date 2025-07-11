# Implement Repeat Function [pending]

## Overview
Implement the FHIRPath `repeat()` function for recursive tree traversal with proper termination and cycle detection.

## Tasks
- [ ] Move pending-tests/21-repeat-function.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement repeat function in the codebase

## Requirements from Tests
1. **Basic functionality**:
   - `repeat(expression)` - Recursively apply expression
   - Start with input collection
   - Apply expression to get next level
   - Continue until empty result
   - Return union of all results

2. **Termination conditions**:
   - Empty result stops recursion
   - Cycle detection prevents infinite loops
   - Maximum depth limit for safety

3. **Use cases**:
   - Tree traversal (parent/child relationships)
   - Graph navigation
   - Hierarchical data exploration
   - Transitive closure

4. **Collection handling**:
   - Works on collections at each level
   - Flattens results appropriately
   - Preserves order of discovery
   - May contain duplicates

5. **Example patterns**:
   ```fhirpath
   # Get all ancestors
   repeat(parent)
   
   # Get all descendants  
   repeat(children)
   
   # Follow references recursively
   repeat(link.resolve())
   ```

6. **Cycle detection**:
   - Track visited nodes
   - Stop if revisiting node
   - Configurable behavior on cycle

## Implementation Notes
- Need efficient visited set
- Consider memory for deep trees
- Clear termination semantics
- Good performance crucial

## Success Criteria
- All tests in 21-repeat-function.test.ts pass
- Handles cycles correctly
- Good performance on trees
- Memory efficient
- Clear documentation