# Implement Collection Functions [pending]

## Overview
Implement additional collection manipulation functions for FHIRPath beyond basic operations.

## Tasks
- [ ] Move pending-tests/27-collection-functions.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement collection functions in the codebase

## Requirements from Tests
1. **Aggregation functions**:
   - `aggregate(expression, init)` - Fold/reduce operation
   - Custom aggregation logic
   - Accumulator pattern

2. **Grouping functions**:
   - Group by expression result
   - Maintain element order
   - Return grouped structure

3. **Ordering functions**:
   - `orderBy(expression)` - Sort by expression
   - Multi-level sorting
   - Ascending/descending options
   - Stable sort requirement

4. **Indexing functions**:
   - Negative indices (from end)
   - Range selection
   - Safe bounds checking

5. **Distinct operations**:
   - Remove duplicates
   - Custom equality function
   - Preserve first occurrence

6. **Zip operations**:
   - Combine parallel collections
   - Handle length mismatches
   - Multiple collection zip

## Implementation Notes
- Efficient algorithms important
- Preserve collection semantics
- Handle large collections
- Consider memory usage

## Success Criteria
- All tests in 27-collection-functions.test.ts pass
- Good performance
- Memory efficient
- Intuitive behavior
- Comprehensive documentation