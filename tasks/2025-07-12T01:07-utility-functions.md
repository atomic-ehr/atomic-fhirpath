# Migrate Utility Functions to FHIRPathFunction Interface [pending]

## Overview
Implement utility functions that provide debugging, metadata access, and other miscellaneous functionality in FHIRPath expressions.

## Functions to Implement (per FHIRPath spec)

### Debugging Functions
- [ ] **trace(name)** - Output debug information during evaluation

### Metadata Functions  
- [ ] **extension(url)** - Access FHIR extensions by URL
- [ ] **hasExtension(url)** - Check if extension exists

### Other Potential Utility Functions
Additional utility functions may be identified from:
- FHIRPath specification review
- Test file analysis
- User requirements

## Implementation Guidelines

### trace(name) Function
The trace function is used for debugging FHIRPath expressions:
```typescript
// src/functions/utility/trace.ts
export const traceFunction: FHIRPathFunction = {
  name: 'trace',
  category: 'utility',
  description: 'Output debug information during evaluation',
  
  signature: {
    name: 'trace',
    parameters: [{
      name: 'name',
      type: STRING_TYPE,
      optional: false,
      description: 'Label for the trace output'
    }],
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  
  inferReturnType: (context, contextType) => {
    // trace() returns the input unchanged
    return contextType || ANY_TYPE;
  },
  
  compile: (compiler, ast) => {
    const nameExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      const name = getSingleValue(nameExpr(data, env));
      
      // Output trace information
      console.log(`[TRACE: ${name}]`, data);
      
      // Return input unchanged
      return Array.isArray(data) ? data : [data];
    };
  },
  
  hints: {
    pure: false, // Has side effects (console output)
    deterministic: true // Same input produces same output
  }
};
```

### extension(url) Function
Access FHIR extensions by URL:
```typescript
// src/functions/utility/extension.ts
export const extensionFunction: FHIRPathFunction = {
  name: 'extension',
  category: 'utility',
  description: 'Access FHIR extensions by URL',
  
  signature: {
    name: 'extension',
    parameters: [{
      name: 'url',
      type: STRING_TYPE,
      optional: false,
      description: 'Extension URL to match'
    }],
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  
  compile: (compiler, ast) => {
    const urlExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      const url = getSingleValue(urlExpr(data, env));
      if (!url) return [];
      
      const results = [];
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item && typeof item === 'object' && Array.isArray(item.extension)) {
          // Filter extensions by URL
          const matching = item.extension.filter(ext => ext.url === url);
          results.push(...matching);
        }
      }
      
      return results;
    };
  }
};
```

## Special Considerations

### trace() Behavior
- Should not modify the data
- Output destination may be configurable
- Consider structured logging
- May be disabled in production

### Extension Handling
- FHIR-specific functionality
- Extensions can be nested
- Need to handle modifierExtension too
- URL matching should be exact

### Performance Impact
- trace() has I/O overhead
- Consider conditional compilation
- May need rate limiting

## Configuration Options
Consider adding configuration for:
- Trace output destination (console, file, custom handler)
- Trace enable/disable flag
- Maximum trace output size
- Structured output format

## Testing Requirements
1. Test trace() output capture
2. Test trace() doesn't modify data
3. Test extension() with various FHIR resources
4. Test extension() with missing extensions
5. Test nested extension scenarios
6. Mock console for trace() tests

### Example Test
```typescript
it('should output trace information', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  
  const result = fhirpath({}, 'trace("test")', [1, 2, 3]);
  
  expect(consoleSpy).toHaveBeenCalledWith('[TRACE: test]', [1, 2, 3]);
  expect(result).toEqual([1, 2, 3]); // Data unchanged
  
  consoleSpy.mockRestore();
});
```

## Future Enhancements
- Structured trace output (JSON)
- Conditional tracing
- Performance profiling integration
- Custom trace handlers
- Trace levels (debug, info, warn)

## Success Criteria
- [ ] trace() provides useful debugging output
- [ ] trace() doesn't affect evaluation results
- [ ] extension() correctly filters FHIR extensions
- [ ] Tests can capture and verify trace output
- [ ] Performance impact is minimal
- [ ] Configuration options work as expected