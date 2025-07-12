# Migrate Navigation Functions to FHIRPathFunction Interface [pending]

## Overview
Implement navigation functions for traversing FHIR resource structures. These functions are part of the FHIRPath specification but may not be implemented yet in this codebase.

## Functions to Implement (per FHIRPath spec)

### Resource Navigation
- [ ] **children()** - Returns all child nodes
- [ ] **descendants()** - Returns all descendant nodes recursively  
- [ ] **parent()** - Returns the parent node (if available)

### Not Yet Identified
Additional navigation functions may be discovered during implementation or from the FHIRPath specification.

## Implementation Considerations

### Context Requirements
Navigation functions require knowledge of the resource structure:
1. Need to track parent-child relationships
2. May require enhancement to evaluation context
3. Consider how to maintain navigation context through expression evaluation

### Example Conceptual Structure
```typescript
// src/functions/navigation/children.ts
export const childrenFunction: FHIRPathFunction = {
  name: 'children',
  category: 'navigation',
  description: 'Returns all direct child nodes',
  
  signature: {
    name: 'children',
    parameters: [],
    returnType: ANY_TYPE, // Returns collection of mixed types
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  compile: (compiler, ast) => {
    return (data, env) => {
      if (!data || typeof data !== 'object') {
        return [];
      }
      
      const children = [];
      
      // Extract all child properties
      if (Array.isArray(data)) {
        data.forEach(item => {
          children.push(...getChildren(item));
        });
      } else {
        children.push(...getChildren(data));
      }
      
      return children;
    };
  }
};

function getChildren(obj: any): any[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return [];
  }
  
  const children = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !key.startsWith('_')) {
      const value = obj[key];
      if (Array.isArray(value)) {
        children.push(...value);
      } else if (value !== null && value !== undefined) {
        children.push(value);
      }
    }
  }
  return children;
}
```

## Special Considerations

### FHIR Resource Structure
- FHIR resources have specific patterns
- Some properties are metadata (e.g., resourceType)
- Arrays vs single values need careful handling
- Extension arrays have special semantics

### Performance
- descendants() could be expensive on large resources
- Consider depth limits or cycle detection
- Efficient tree traversal algorithms

### Parent Tracking
- parent() requires maintaining parent references
- May need to enhance AST or evaluation context
- Consider memory implications

## Testing Requirements
1. Test with various FHIR resource types
2. Test with nested structures
3. Test with arrays and single values
4. Test performance with large resources
5. Test edge cases (circular references, null values)

## Research Needed
- [ ] Review FHIRPath specification for exact semantics
- [ ] Understand how parent context should be maintained
- [ ] Determine if these functions are actually needed
- [ ] Check test files for usage examples

## Success Criteria
- [ ] Navigation functions work correctly on FHIR resources
- [ ] Performance is acceptable for typical use cases
- [ ] Parent references work correctly if implemented
- [ ] All tests pass