# Math Functions Reference

This document provides detailed documentation for all implemented FHIRPath math functions.

## Basic Math Functions

### abs()
**File**: [`src/functions/math/abs.ts:33`](../../src/functions/math/abs.ts)

Returns the absolute value of a number.

**Signature**: `abs() : Integer | Decimal | Quantity`

**Behavior**:
- Preserves the input type (Integer stays Integer, Decimal stays Decimal)
- For Quantity types, preserves the unit
- Returns empty for non-numeric input
- Handles null/undefined by returning empty

**Examples**:
```fhirpath
5.abs()        // Returns: 5
(-5).abs()     // Returns: 5
5.2.abs()      // Returns: 5.2
(-5.2).abs()   // Returns: 5.2
```

### ceiling()
**File**: [`src/functions/math/ceiling.ts:33`](../../src/functions/math/ceiling.ts)

Returns the smallest integer greater than or equal to the input.

**Signature**: `ceiling() : Integer`

**Behavior**:
- Always returns Integer type
- Rounds towards positive infinity
- Handles JavaScript's -0 by converting to 0
- Returns empty for non-numeric input

**Examples**:
```fhirpath
5.2.ceiling()    // Returns: 6
5.0.ceiling()    // Returns: 5
(-5.2).ceiling() // Returns: -5
(-0.1).ceiling() // Returns: 0 (not -0)
```

### floor()
**File**: [`src/functions/math/floor.ts:33`](../../src/functions/math/floor.ts)

Returns the largest integer less than or equal to the input.

**Signature**: `floor() : Integer`

**Behavior**:
- Always returns Integer type
- Rounds towards negative infinity
- Handles JavaScript's -0 by converting to 0
- Returns empty for non-numeric input

**Examples**:
```fhirpath
5.8.floor()    // Returns: 5
5.0.floor()    // Returns: 5
(-5.2).floor() // Returns: -6
0.floor()      // Returns: 0
```

### round([precision])
**File**: [`src/functions/math/round.ts:44`](../../src/functions/math/round.ts)

Rounds to the nearest integer or to a specified precision.

**Signature**: `round([precision : Integer]) : Integer | Decimal`

**Behavior**:
- Uses "round half away from zero" (banker's rounding)
- Without precision: returns Integer
- With precision > 0: rounds to decimal places, returns Decimal
- With precision < 0: rounds to powers of 10, returns Integer
- Precision must be an integer

**Examples**:
```fhirpath
5.5.round()        // Returns: 6
5.4.round()        // Returns: 5
(-5.5).round()     // Returns: -6
3.14159.round(2)   // Returns: 3.14
1234.round(-2)     // Returns: 1200
```

### sqrt()
**File**: [`src/functions/math/sqrt.ts:37`](../../src/functions/math/sqrt.ts)

Returns the square root of a number.

**Signature**: `sqrt() : Decimal`

**Behavior**:
- Always returns Decimal type
- Throws error for negative single values
- Skips negative values in collections
- Returns empty for non-numeric input

**Examples**:
```fhirpath
9.sqrt()          // Returns: 3.0
2.sqrt()          // Returns: 1.414...
0.sqrt()          // Returns: 0.0
(-9).sqrt()       // Error: sqrt() of negative number
(4 | -9 | 16).sqrt() // Returns: [2.0, 4.0] (skips -9)
```

## Aggregate Functions

### sum()
**File**: [`src/functions/math/sum.ts:59`](../../src/functions/math/sum.ts)

Returns the sum of all numeric values in a collection.

**Signature**: `sum() : Integer | Decimal`

**Behavior**:
- Returns 0 for empty collection (per spec)
- Filters out null/undefined values
- Returns Integer if all inputs are integers and result is whole
- Otherwise returns Decimal

**Examples**:
```fhirpath
(1 | 2 | 3).sum()        // Returns: 6
(1.5 | 2.5).sum()        // Returns: 4.0
{}.sum()                 // Returns: 0
(1 | null | 3).sum()     // Returns: 4
```

### min()
**File**: [`src/functions/math/min.ts:55`](../../src/functions/math/min.ts)

Returns the minimum value in a collection.

**Signature**: `min() : Integer | Decimal`

**Behavior**:
- Returns empty for empty collection
- Filters out null/undefined values
- Preserves numeric type of the minimum value
- Works with single values

**Examples**:
```fhirpath
(3 | 1 | 4 | 1 | 5).min()  // Returns: 1
(3.5 | 1.2 | 4.8).min()     // Returns: 1.2
{}.min()                    // Returns: empty
42.min()                    // Returns: 42
```

### max()
**File**: [`src/functions/math/max.ts:55`](../../src/functions/math/max.ts)

Returns the maximum value in a collection.

**Signature**: `max() : Integer | Decimal`

**Behavior**:
- Returns empty for empty collection
- Filters out null/undefined values
- Preserves numeric type of the maximum value
- Works with single values

**Examples**:
```fhirpath
(3 | 1 | 4 | 1 | 5).max()  // Returns: 5
(3.5 | 1.2 | 4.8).max()     // Returns: 4.8
{}.max()                    // Returns: empty
42.max()                    // Returns: 42
```

### avg()
**File**: [`src/functions/math/avg.ts:61`](../../src/functions/math/avg.ts)

Returns the average (arithmetic mean) of numeric values in a collection.

**Signature**: `avg() : Decimal`

**Behavior**:
- Returns empty for empty collection
- Filters out null/undefined values
- Usually returns Decimal (even for integer inputs)
- Returns Integer only if all inputs are integers and result is whole

**Examples**:
```fhirpath
(1 | 2 | 3).avg()        // Returns: 2
(10 | 20).avg()          // Returns: 15
(1 | 2 | 3 | 4).avg()    // Returns: 2.5
{}.avg()                 // Returns: empty
```

## Special Functions

### div(divisor)
**File**: [`src/functions/math/div.ts:41`](../../src/functions/math/div.ts)

Performs integer division (truncated division).

**Signature**: `div(divisor : Integer | Decimal) : Integer`

**Behavior**:
- Function form of the `div` operator
- Truncates towards zero (not floor division)
- Always returns Integer
- Throws error for division by zero

**Examples**:
```fhirpath
10.div(3)         // Returns: 3
(-10).div(3)      // Returns: -3
10.div(-3)        // Returns: -3
7.8.div(2.1)      // Returns: 3
10.div(0)         // Error: Division by zero
```

### mod(divisor)
**File**: [`src/functions/math/mod.ts:42`](../../src/functions/math/mod.ts)

Returns the modulo (remainder) of integer division.

**Signature**: `mod(divisor : Integer) : Integer`

**Behavior**:
- Function form of the `mod` operator
- Result has the same sign as the dividend
- Always returns Integer
- Throws error for division by zero

**Examples**:
```fhirpath
10.mod(3)         // Returns: 1
(-10).mod(3)      // Returns: -1
10.mod(-3)        // Returns: 1
7.mod(7)          // Returns: 0
10.mod(0)         // Error: Division by zero
```

### value()
**File**: [`src/functions/math/value.ts:45`](../../src/functions/math/value.ts)

Extracts the numeric value from a Quantity type.

**Signature**: `value() : Integer | Decimal`

**Behavior**:
- Returns the numeric value from Quantity objects
- Returns empty for non-Quantity inputs
- Handles string values in Quantity objects
- Preserves numeric type

**Examples**:
```fhirpath
// Given: dose = { value: 5.0, unit: 'mg' }
dose.value()      // Returns: 5.0

// Given: height = { value: '180', unit: 'cm' }
height.value()    // Returns: 180

5.value()         // Returns: empty (not a Quantity)
'string'.value()  // Returns: empty
```

## Type Inference

The math functions implement sophisticated type inference:

1. **Type Preservation**: Functions like `abs()` preserve the input type
2. **Type Promotion**: Mixed operations promote to the wider type
3. **Return Type Guarantees**: Some functions always return specific types:
   - `ceiling()`, `floor()` → always Integer
   - `sqrt()` → always Decimal
   - `div()`, `mod()` → always Integer

## Error Handling

All math functions follow consistent error handling:

1. **Null/Undefined**: Converted to empty or filtered out
2. **Non-numeric Input**: 
   - Single values: Throw descriptive error
   - Collections: Skip invalid values
3. **Domain Errors**: Clear error messages (e.g., "sqrt() of negative number")
4. **Division by Zero**: Explicit error

## Collection Behavior

Math functions handle collections consistently:

1. **Single Value Functions** (abs, ceiling, floor, round, sqrt):
   - Apply to each element
   - Filter out nulls
   - Skip invalid values

2. **Aggregate Functions** (sum, min, max, avg):
   - Operate on entire collection
   - Return single value or empty

3. **Binary Functions** (div, mod):
   - Apply operation with each collection element
   - Parameter is evaluated once

## Implementation Notes

### JavaScript Quirks Handled

1. **Negative Zero (-0)**:
   - `ceiling()` and `floor()` convert -0 to 0
   - Ensures consistent behavior across platforms

2. **Floating Point Precision**:
   - Tests use `toBeCloseTo()` for decimal comparisons
   - Handles IEEE 754 precision limitations

3. **Type Checking**:
   - Strict type validation before operations
   - Clear error messages for type mismatches

## Testing

Each function has comprehensive test coverage:
- Core functionality tests ([`test/functions/math/`](../../test/functions/math/))
- FHIRPath integration tests
- Edge case handling
- Error condition validation

Total: 159 tests across all math functions