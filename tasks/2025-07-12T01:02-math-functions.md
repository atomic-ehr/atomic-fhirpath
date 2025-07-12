# Migrate Math Functions to FHIRPathFunction Interface [completed]

## Overview
Migrate all mathematical functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### Already Migrated
- [x] **abs()** - Absolute value ✅
- [x] **ceiling()** - Round up to nearest integer ✅
- [x] **floor()** - Round down to nearest integer ✅
- [x] **round([precision])** - Round to specified precision ✅
- [x] **sqrt()** - Square root ✅

### Need Implementation from Scratch
- [ ] **sum()** - Sum of collection elements
- [ ] **min()** - Minimum value in collection
- [ ] **max()** - Maximum value in collection
- [ ] **avg()** - Average of collection elements
- [ ] **div(divisor)** - Integer division (function form, not operator)
- [ ] **mod(divisor)** - Modulo (function form, not operator)
- [ ] **value()** - Extract numeric value from Quantity type

## Implementation Guidelines

### Type Handling
1. Math functions require numeric input (INTEGER_TYPE, DECIMAL_TYPE, or QUANTITY_TYPE)
2. Should throw or return empty for non-numeric input
3. Type preservation: operations on integers should return integers when possible
4. Quantity types need special handling to preserve units

### Example Implementation Structure
```typescript
// src/functions/math/sqrt.ts
export const sqrtFunction: FHIRPathFunction = {
  name: 'sqrt',
  category: 'math',
  description: 'Returns the square root of a number',
  
  signature: {
    name: 'sqrt',
    parameters: [],
    returnType: DECIMAL_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: DECIMAL_TYPE, // Always returns decimal
  
  compile: (compiler, ast) => {
    return (data, env) => {
      if (Array.isArray(data)) {
        return data.map(item => sqrt(item)).filter(v => v !== null);
      }
      const result = sqrt(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: sqrt,
  
  hints: {
    pure: true,
    deterministic: true
  }
};

function sqrt(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number') {
    throw new Error('sqrt() requires numeric input');
  }
  if (value < 0) {
    throw new Error('sqrt() of negative number');
  }
  return Math.sqrt(value);
}
```

## Special Considerations

### Aggregate Functions (sum, min, max, avg)
- Operate on collections, not single values
- Empty collection handling:
  - sum() returns 0 for empty
  - avg() returns empty for empty
  - min() returns empty for empty
  - max() returns empty for empty
- Should filter out null/undefined values
- Type coercion between integer and decimal

### round([precision])
- Optional precision parameter (default 0)
- Negative precision rounds to left of decimal
- Uses "round half away from zero" per spec

### div() and mod()
- Function forms of operators
- Integer division semantics
- Handle division by zero appropriately

### value()
- Extracts numeric value from Quantity type
- Returns empty for non-Quantity input
- Preserves integer vs decimal type

### Quantity Type Support
- Some functions work with Quantity types
- Need to handle unit compatibility
- abs() preserves units
- Arithmetic operations need unit checking

## Type Inference Rules
1. Operations on integers return integers when result is whole
2. Operations involving decimals return decimals
3. sqrt() always returns decimal
4. Aggregate functions return type based on input collection
5. Quantity operations preserve quantity type with units

## Testing Requirements
1. Test with integer inputs
2. Test with decimal inputs  
3. Test with mixed numeric types
4. Test with null/undefined values
5. Test with non-numeric inputs (should error)
6. Test edge cases (division by zero, negative sqrt)
7. Test precision and rounding behavior
8. Test with very large/small numbers
9. Test with collections for aggregate functions

## Performance Considerations
- Use native Math functions where possible
- Avoid unnecessary type conversions
- Optimize aggregate functions for large collections
- Consider numerical stability for operations

## Error Handling
- Clear error messages for type mismatches
- Appropriate handling of mathematical errors (division by zero, domain errors)
- Consistent null/empty handling

## Progress Report

### 2025-07-12 - All Math Functions Complete ✓

**Completed Functions (12/12):**

**Basic Math Functions:**
1. **abs()** - Already completed as proof of concept
2. **ceiling()** - Implemented with -0 to 0 conversion fix
3. **floor()** - Implemented with -0 to 0 conversion fix  
4. **round()** - Implemented with optional precision parameter
5. **sqrt()** - Implemented with proper negative number handling

**Aggregate Functions:**
6. **sum()** - Returns sum of collection (0 for empty)
7. **min()** - Returns minimum value (empty for empty collection)
8. **max()** - Returns maximum value (empty for empty collection)
9. **avg()** - Returns average (empty for empty collection)

**Special Functions:**
10. **div(divisor)** - Integer division (truncates towards zero)
11. **mod(divisor)** - Modulo operation (result has sign of dividend)
12. **value()** - Extracts numeric value from Quantity types

**Key Implementation Details:**
- All functions handle null/undefined appropriately
- Collection processing filters out null values
- Type safety with proper error messages
- Comprehensive unit tests for each function (159 tests)
- All existing FHIRPath tests pass
- Function parameter compilation fixed for div/mod

**Special Considerations Addressed:**
- Fixed JavaScript's -0 (negative zero) issue for ceiling/floor
- round() supports both positive and negative precision
- sqrt() throws for single negative values but skips them in collections
- Aggregate functions handle empty collections per spec
- div/mod use compileNode() for parameter compilation
- value() properly identifies Quantity types

## Success Criteria
- [x] All math functions pass existing tests (12/12 implemented functions)
- [x] Each function has comprehensive unit tests (159 tests)
- [x] Type inference preserves appropriate numeric types
- [x] Performance is comparable to current implementation
- [x] Edge cases handled appropriately (including -0, division by zero, etc.)
- [x] Error messages are clear and helpful