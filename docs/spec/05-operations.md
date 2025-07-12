# Chapter 5: Operations

## Overview

Operators in FHIRPath:
- Work between path expressions (`expr op expr`)
- Generally propagate empty collections
- Return specific types based on operation
- Follow defined precedence rules

**Key principle**: `{} op anything` returns `{}`

## Equality Operations

### = (Equals)
Strict equality comparison.

**Rules**:
- Both operands must be same type
- For single-item collections:
  - **Primitives**: Exact match (String by Unicode, numbers by value)
  - **Complex types**: All properties must be equal recursively
  - **Quantities**: Same dimension, units converted if needed
  - **Date/Time**: Comparison by precision, respecting timezone
- For multi-item collections: Order-dependent comparison
- Different sizes → `false`
- Either empty → `{}`

**Date/Time Equality**:
```
@2012 = @2012                    // true
@2012-01 = @2012                 // {} (different precision)
@2012-01-01T10:30:31.0 = @2012-01-01T10:30:31  // true
```

### ~ (Equivalent)
Loose equality comparison.

**Differences from =**:
- String: Case-insensitive, normalized whitespace
- Decimal: Rounded to least precise operand
- Date/Time: Different precision → `false` (not `{}`)
- Collections: Order-independent comparison
- `{} ~ {}` returns `true`

**Examples**:
```
'ABC' ~ 'abc'                    // true
3.14 ~ 3.140                     // true  
@2012-01 ~ @2012                 // false (not empty)
```

### != (Not Equals)
Converse of equals: `a != b` same as `not(a = b)`

### !~ (Not Equivalent)
Converse of equivalent: `a !~ b` same as `not(a ~ b)`

## Comparison Operations

### Common Rules
- Defined for: strings, numbers, quantities, dates/times
- Both operands must be single values
- Both must be same type (or convertible)
- String comparison is lexical by Unicode
- Quantity comparison requires same dimensions
- Partial dates: Different precision → `{}`

### > (Greater Than)
```
10 > 5                           // true
'abc' > 'ABC'                    // true (lexical)
4 'm' > 4 'cm'                   // true
@2018-03-01 > @2018-01-01        // true
@2018-03 > @2018-03-01           // {} (different precision)
```

### < (Less Than)
```
10 < 5                           // false
'abc' < 'ABC'                    // false
@2018-03-01 < @2018-01-01        // false
```

### <= (Less or Equal)
Equivalent to `a < b or a = b`

### >= (Greater or Equal)
Equivalent to `a > b or a = b`

## Type Operations

### is (Type Test)
Tests if value is of specified type.
```
Observation.value is Quantity    // true if Quantity
Patient.deceased is Boolean      // true if Boolean
```

### as (Type Cast)
Casts to type or returns empty.
```
Observation.value as Quantity    // value if Quantity, else {}
```

## Collection Operations

### | (Union)
Combines collections, removing duplicates.
```
name.given | name.family         // All unique names
```

### in (Membership)
Tests if left is in right collection.
```
'home' in contact.telecom.use    // true if 'home' exists
5 in (1 | 2 | 5 | 10)           // true
```

### contains (Containership)
Reverse of `in`: `a contains b` same as `b in a`

## Boolean Logic

### Three-valued logic
- `true`, `false`, or `{}` (unknown)
- Empty propagates through operations

### and
| Left | Right | Result |
|------|-------|--------|
| true | true | true |
| true | false | false |
| true | {} | {} |
| false | any | false |
| {} | {} | {} |

### or
| Left | Right | Result |
|------|-------|--------|
| true | any | true |
| false | false | false |
| false | true | true |
| false | {} | {} |
| {} | {} | {} |

### not()
- `not(true)` → `false`
- `not(false)` → `true`
- `not({})` → `{}`

### xor
Exclusive or: `(a or b) and not(a and b)`

### implies
Logical implication:
- `false implies anything` → `true`
- `true implies true` → `true`
- `true implies false` → `false`
- `{} implies x` → `true` or `{}`

## Math Operations

### Arithmetic
- `+` Addition
- `-` Subtraction (binary and unary)
- `*` Multiplication
- `/` Division (decimal result)
- `div` Integer division
- `mod` Modulo

**Type Rules**:
- Integer op Integer → Integer (except `/`)
- Decimal involved → Decimal
- Quantity math preserves units

**Examples**:
```
10 / 3                           // 3.333...
10 div 3                         // 3
10 mod 3                         // 1
5 'cm' + 2 'm'                   // 205 'cm'
```

### & (String Concatenation)
```
'Hello' & ' ' & 'World'          // 'Hello World'
```

## Date/Time Arithmetic

### Addition
- Date/DateTime/Time + Quantity[time] → Date/DateTime/Time
```
@2018-01-01 + 3 months           // @2018-04-01
@T10:00 + 2 hours                // @T12:00
```

### Subtraction
- Date/DateTime/Time - Date/DateTime/Time → Quantity[time]
- Date/DateTime/Time - Quantity[time] → Date/DateTime/Time
```
@2018-04-01 - @2018-01-01        // 90 days
@2018-01-01 - 1 month            // @2017-12-01
```

## Operator Precedence

From lowest to highest:
1. `implies`
2. `or`, `xor`
3. `and`
4. `=`, `!=`, `~`, `!~`, `in`, `contains`
5. `<`, `>`, `<=`, `>=`, `is`, `as`
6. `|` (union)
7. `+`, `-`, `&`
8. `*`, `/`, `div`, `mod`
9. unary `-`, `not()`
10. `.`, `[]`, `()` (path, indexer, function call)

Use parentheses to override precedence:
```
a and b or c     // (a and b) or c
a and (b or c)   // Explicit grouping
```

## Next: [Advanced Features →](06-advanced-features.md)