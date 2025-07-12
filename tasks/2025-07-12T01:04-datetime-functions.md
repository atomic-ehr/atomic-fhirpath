# Migrate Date/Time Functions to FHIRPathFunction Interface [pending]

## Overview
Migrate all date and time related functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### Already Have Registry Entries
- [ ] **now()** - Current date and time
- [ ] **today()** - Current date (no time component)
- [ ] **timeOfDay()** - Current time (no date component)

### Additional Date/Time Functions (if needed)
Based on FHIRPath spec, these might need implementation:
- [ ] **toDate()** - Convert string to date
- [ ] **toTime()** - Convert string to time  
- [ ] **toDateTime()** - Convert string to datetime

## Implementation Guidelines

### Caching Behavior
Date/time functions must return consistent values within a single expression evaluation:
1. First call to now() sets a cached value
2. Subsequent calls return the same value
3. Cache is stored in EvaluationContext
4. Different functions (now, today, timeOfDay) derive from same moment

### Example Implementation Structure
```typescript
// src/functions/date/now.ts
export const nowFunction: FHIRPathFunction = {
  name: 'now',
  category: 'date',
  description: 'Returns the current date and time',
  
  signature: {
    name: 'now',
    parameters: [],
    returnType: DATETIME_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: DATETIME_TYPE,
  
  compile: (compiler, ast) => {
    return (data, env) => {
      // Check cache first
      if (env._nowCache) {
        return [env._nowCache];
      }
      
      // Generate and cache new value
      const now = new Date().toISOString();
      env._nowCache = now;
      
      // Also set today and timeOfDay caches from same moment
      const date = now.substring(0, 10); // YYYY-MM-DD
      const time = now.substring(11, 19); // HH:mm:ss
      
      env._todayCache = date;
      env._timeOfDayCache = time;
      
      return [now];
    };
  },
  
  evaluate: () => {
    // For unit testing without caching
    return new Date().toISOString();
  },
  
  hints: {
    pure: false, // Has side effects (caching)
    deterministic: false // Different results each run
  }
};
```

### Date/Time Format Requirements
Per FHIRPath specification:
- **Date**: YYYY-MM-DD format
- **Time**: HH:mm:ss format (no timezone)
- **DateTime**: ISO 8601 format with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)

### today() Implementation
```typescript
// src/functions/date/today.ts
export const todayFunction: FHIRPathFunction = {
  name: 'today',
  category: 'date',
  description: 'Returns the current date',
  
  signature: {
    name: 'today',
    parameters: [],
    returnType: DATE_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: DATE_TYPE,
  
  compile: (compiler, ast) => {
    return (data, env) => {
      // Check if already cached
      if (env._todayCache) {
        return [env._todayCache];
      }
      
      // Check if now() was called first
      if (env._nowCache) {
        const date = env._nowCache.substring(0, 10);
        env._todayCache = date;
        return [date];
      }
      
      // Generate new date and set all caches
      const now = new Date();
      const nowStr = now.toISOString();
      const date = nowStr.substring(0, 10);
      const time = nowStr.substring(11, 19);
      
      env._nowCache = nowStr;
      env._todayCache = date;
      env._timeOfDayCache = time;
      
      return [date];
    };
  }
};
```

## Special Considerations

### Cache Coordination
- All three functions (now, today, timeOfDay) must coordinate
- If any is called, all three values are derived from same moment
- Prevents inconsistencies like today() returning one date and now() returning a different date

### Timezone Handling
- now() includes timezone information
- today() is just a date, no timezone
- timeOfDay() is just a time, no timezone
- Consider server timezone vs client timezone

### Type Safety
- Functions return specific date/time types
- These types have special comparison and arithmetic semantics
- String representation must follow FHIRPath format exactly

## Testing Requirements
1. Test format compliance (ISO 8601, etc.)
2. Test caching behavior within same evaluation
3. Test cache coordination between functions
4. Test that evaluate() method works without caching
5. Test timezone handling
6. Mock date/time for deterministic tests

### Example Test
```typescript
it('should cache now() value within evaluation', () => {
  const env: EvaluationContext = {};
  const compiled = nowFunction.compile({} as any, {} as any);
  
  const result1 = compiled(null, env);
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 10));
  const result2 = compiled(null, env);
  
  expect(result1).toEqual(result2); // Same value
  expect(env._nowCache).toBe(result1[0]);
});
```

## Type Definitions
Ensure proper date/time types are defined in type system:
- DATE_TYPE
- TIME_TYPE  
- DATETIME_TYPE

These types affect comparison operations and arithmetic.

## Success Criteria
- [ ] All date/time functions return properly formatted values
- [ ] Caching works correctly within single evaluation
- [ ] Cache coordination prevents inconsistencies
- [ ] All existing tests pass
- [ ] Timezone handling is correct
- [ ] Unit tests cover caching behavior