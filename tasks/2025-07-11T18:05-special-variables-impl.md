# Implement Special Variables ($this, $index, $total) [pending]

## Overview
Implement FHIRPath special variables that provide context during collection operations. This extends the existing special variables task with specific test requirements.

## Tasks
- [ ] Move pending-tests/15-special-variables.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement special variables in the codebase

## Requirements from Tests
1. **Special variables**:
   - `$this` - Current item in collection operation
   - `$index` - Zero-based position in collection
   - `$total` - Total count of collection

2. **Context availability**:
   - Only in collection operations: `where()`, `select()`, `all()`, `any()`
   - Not available at top level
   - Error if used outside valid context

3. **Nested contexts**:
   - Each collection operation creates new context
   - Inner context shadows outer
   - Can access outer via closure

4. **Usage patterns**:
   ```fhirpath
   # Basic filtering
   collection.where($index < 3)
   collection.where($this.active = true)
   collection.where($index = $total - 1)  # last item
   
   # Complex expressions
   collection.select($this.value * $index)
   collection.where($index mod 2 = 0)  # even positions
   
   # Nested operations
   parent.select($this.children.where($index < 2))
   ```

5. **Type semantics**:
   - `$this` - Type of collection elements
   - `$index` - Always Integer
   - `$total` - Always Integer

6. **Edge cases**:
   - Empty collections: operations not executed
   - Single item: $index = 0, $total = 1
   - Null items: $this can be null

## Implementation Notes
- Enhance evaluation context stack
- Parser already handles $ prefix
- Track context in collection functions
- Consider performance impact

## Success Criteria
- All tests in 15-special-variables.test.ts pass
- Clear error for invalid usage
- Correct values in all contexts
- Good performance
- No context leakage