# Migrate Collection Functions to FHIRPathFunction Interface [pending]

## Overview
Migrate all collection-related functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### High Priority (Core Collection Operations)
- [ ] **where(criteria)** - Filter collection by boolean criteria
- [ ] **select(expression)** - Transform/map collection elements  
- [ ] **exists([criteria])** - Check if collection has elements (optionally matching criteria)
- [ ] **empty()** - Check if collection is empty
- [ ] **count()** - Count elements in collection

### Medium Priority (Collection Access)
- [ ] **first()** - Get first element of collection
- [ ] **last()** - Get last element of collection
- [ ] **tail()** - Get all elements except first
- [ ] **take(n)** - Take first n elements
- [ ] **skip(n)** - Skip first n elements

### Low Priority (Advanced Operations)
- [ ] **distinct()** - Remove duplicate elements
- [ ] **all(criteria)** - Check if all elements match criteria
- [ ] **any(criteria)** - Check if any element matches criteria

## Implementation Guidelines

### Common Patterns
1. Most collection functions operate on arrays and return arrays
2. Empty input should return empty array (not null)
3. Single values should be treated as single-element collections
4. Null/undefined in collections should be handled appropriately

### Example Implementation Structure
```typescript
// src/functions/collection/where.ts
export const whereFunction: FHIRPathFunction = {
  name: 'where',
  category: 'collection',
  description: 'Filter collection by criteria',
  
  signature: {
    name: 'where',
    parameters: [{
      name: 'criteria',
      type: BOOLEAN_TYPE,
      optional: false,
      description: 'Filter criteria expression'
    }],
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  
  inferReturnType: (context, contextType, paramTypes, ast) => {
    // where() returns collection of same type as input
    return contextType?.isCollection ? contextType : createCollectionType(contextType || ANY_TYPE);
  },
  
  compile: (compiler, ast) => {
    const criteriaExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      const collection = ensureArray(data);
      return collection.filter(item => {
        const result = criteriaExpr(item, env);
        return isTruthy(result);
      });
    };
  }
};
```

## Special Considerations

### where() and select()
- These functions evaluate expressions in the context of each collection item
- Need to handle proper scope/context switching
- The criteria/expression sees each item as the focus

### exists() 
- Has optional parameter - can be called with 0 or 1 arguments
- Without parameter: returns true if collection is non-empty
- With parameter: returns true if any element matches criteria

### all() and any()
- Similar to exists() but with different semantics
- all() returns true for empty collections
- any() returns false for empty collections

### distinct()
- Needs proper equality comparison for complex types
- Should preserve order of first occurrence

## Testing Requirements
1. Test with empty collections
2. Test with single-element collections  
3. Test with null/undefined values
4. Test with mixed-type collections where applicable
5. Test chaining of collection functions
6. Test with complex criteria expressions

## Dependencies
- Requires base types from type-system.ts
- May need utility functions for equality comparison
- Should use common helpers from base.ts

## Success Criteria
- [ ] All collection functions pass existing tests
- [ ] Each function has dedicated unit tests
- [ ] Functions can be chained naturally
- [ ] Performance is comparable to switch implementation
- [ ] Type inference works correctly