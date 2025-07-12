# Migrate String Functions to FHIRPathFunction Interface [pending]

## Overview
Migrate all string manipulation functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### Already Have Registry Entries
- [ ] **length()** - Get string length
- [ ] **startsWith(prefix)** - Check if string starts with prefix
- [ ] **endsWith(suffix)** - Check if string ends with suffix
- [ ] **contains(substring)** - Check if string contains substring (function form)
- [ ] **substring(start, [length])** - Extract substring
- [ ] **upper()** - Convert to uppercase
- [ ] **lower()** - Convert to lowercase

### Need Implementation from Scratch
- [ ] **replace(pattern, replacement)** - Replace substring/pattern
- [ ] **trim()** - Remove leading/trailing whitespace
- [ ] **split(delimiter)** - Split string into array
- [ ] **join(separator)** - Join array elements into string

## Implementation Guidelines

### Type Handling
1. String functions should work on single strings, not collections
2. When called on collections, apply to each element
3. Return empty for null/undefined input
4. Non-string inputs should be converted via toString() if possible

### Example Implementation Structure
```typescript
// src/functions/string/length.ts
export const lengthFunction: FHIRPathFunction = {
  name: 'length',
  category: 'string',
  description: 'Returns the length of a string',
  
  signature: {
    name: 'length',
    parameters: [],
    returnType: INTEGER_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: INTEGER_TYPE,
  
  compile: (compiler, ast) => {
    return (data, env) => {
      if (data === null || data === undefined) {
        return [];
      }
      
      // Handle collections
      if (Array.isArray(data)) {
        return data.map(item => 
          typeof item === 'string' ? item.length : null
        ).filter(v => v !== null);
      }
      
      // Handle single value
      if (typeof data === 'string') {
        return [data.length];
      }
      
      // Try to convert to string
      const str = String(data);
      return [str.length];
    };
  },
  
  evaluate: (value) => {
    if (typeof value !== 'string') return null;
    return value.length;
  }
};
```

## Special Considerations

### substring(start, [length])
- Uses 0-based indexing per FHIRPath spec
- If length is omitted, returns from start to end
- Negative indices should be handled appropriately
- Out of bounds should return empty string, not error

### replace(pattern, replacement)
- Pattern can be string literal or regex pattern
- Need to handle regex syntax properly
- Global replacement vs first occurrence

### split(delimiter)
- Returns array of strings
- Empty delimiter behavior needs to be defined
- Consecutive delimiters handling

### join(separator)
- Operates on array/collection input
- Converts non-string elements to strings
- Default separator behavior if not specified

### trim()
- Removes all leading and trailing whitespace
- Should handle various Unicode whitespace characters
- Consider trimStart() and trimEnd() variants if needed

## Testing Requirements
1. Test with empty strings
2. Test with null/undefined
3. Test with non-string inputs
4. Test with Unicode characters
5. Test edge cases (empty delimiters, out of bounds indices)
6. Test on collections of strings
7. Test method chaining

## Type Inference
- Most string functions return STRING_TYPE
- length() returns INTEGER_TYPE  
- split() returns collection of STRING_TYPE
- Functions preserve cardinality when applied to collections

## Performance Considerations
- Avoid unnecessary string conversions
- Use native JavaScript string methods where possible
- Handle large strings efficiently
- Consider memory usage for split() on large strings

## Success Criteria
- [ ] All string functions pass existing tests
- [ ] Each function has comprehensive unit tests
- [ ] Unicode handling is correct
- [ ] Type inference works properly
- [ ] Performance is acceptable
- [ ] Edge cases are handled gracefully