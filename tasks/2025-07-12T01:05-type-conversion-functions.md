# Migrate Type Conversion Functions to FHIRPathFunction Interface [pending]

## Overview
Migrate all type conversion and type inspection functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### Already Have Registry Entries
- [ ] **toString()** - Convert to string representation
- [ ] **toInteger()** - Convert to integer
- [ ] **toDecimal()** - Convert to decimal
- [ ] **toDateTime()** - Convert to datetime
- [ ] **toBoolean()** - Convert to boolean (if in registry)
- [ ] **toQuantity()** - Convert to quantity (if in registry)

### Type Inspection Functions
- [ ] **type()** - Get the type of a value
- [ ] **is(type)** - Check if value is of specified type (note: also an operator)
- [ ] **as(type)** - Cast value to type (note: also an operator)

### Additional Conversions (per spec)
- [ ] **toDate()** - Convert to date
- [ ] **toTime()** - Convert to time

## Implementation Guidelines

### Conversion Rules
Each conversion function has specific rules for what can be converted:
1. Some conversions are always valid (e.g., any value to string)
2. Some require specific formats (e.g., string to integer)
3. Invalid conversions return empty, not error
4. Preserve null/empty semantics

### Example Implementation Structure
```typescript
// src/functions/type/toString.ts
export const toStringFunction: FHIRPathFunction = {
  name: 'toString',
  category: 'type',
  description: 'Convert value to string representation',
  
  signature: {
    name: 'toString',
    parameters: [],
    returnType: STRING_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: STRING_TYPE,
  
  compile: (compiler, ast) => {
    return (data, env) => {
      if (data === null || data === undefined) {
        return [];
      }
      
      if (Array.isArray(data)) {
        return data.map(item => convertToString(item)).filter(v => v !== null);
      }
      
      const result = convertToString(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: convertToString
};

function convertToString(value: any): string | null {
  if (value === null || value === undefined) return null;
  
  // Boolean special case per FHIRPath
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // Date/time types need proper formatting
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Quantity type
  if (value && typeof value === 'object' && 'value' in value && 'unit' in value) {
    return `${value.value} '${value.unit}'`;
  }
  
  return String(value);
}
```

### toInteger() Conversion Rules
```typescript
function convertToInteger(value: any): number | null {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : null;
  }
  
  if (typeof value === 'string') {
    // Must be valid integer format
    if (/^-?\d+$/.test(value.trim())) {
      const num = parseInt(value, 10);
      if (!Number.isNaN(num) && Number.isSafeInteger(num)) {
        return num;
      }
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  return null; // Invalid conversion
}
```

## Special Considerations

### type() Function
- Returns the type name as a string
- For primitives: 'String', 'Integer', 'Decimal', 'Boolean', 'Date', 'Time', 'DateTime'
- For resources: The resource type name
- For collections: Type of first element (or empty)

### String Parsing
- toInteger(): Only exact integer strings (no decimals, no exponents)
- toDecimal(): Accepts decimal notation
- toDateTime(): Must follow ISO 8601 format
- toDate(): Must follow YYYY-MM-DD format
- toTime(): Must follow HH:mm:ss format

### Boolean Conversion
- Empty string -> false
- 'true' (case insensitive) -> true
- 'false' (case insensitive) -> false
- Other strings -> empty
- 0 -> false
- Other numbers -> true

### Quantity Type
- toString() formats as: value 'unit'
- toQuantity() parses from string format
- Preserves value and unit components

## Type Preservation
- Converting between compatible types should preserve precision
- Round-trip conversions should work when valid
- Integer to Decimal preserves exact value
- Decimal to Integer only if whole number

## Testing Requirements
1. Test valid conversions for each type
2. Test invalid conversions return empty
3. Test null/undefined handling
4. Test collection handling
5. Test edge cases:
   - Large numbers
   - Special float values (Infinity, NaN)
   - Unicode strings
   - Invalid date strings
6. Test round-trip conversions
7. Test precision preservation

## Error Handling
- Invalid conversions return empty (not error)
- Clear distinction between empty input and failed conversion
- No exceptions thrown for invalid input

## Success Criteria
- [ ] All conversion functions follow FHIRPath rules exactly
- [ ] Invalid conversions return empty consistently
- [ ] All existing tests pass
- [ ] Comprehensive unit tests for each function
- [ ] Round-trip conversions work correctly
- [ ] Performance is acceptable for large datasets