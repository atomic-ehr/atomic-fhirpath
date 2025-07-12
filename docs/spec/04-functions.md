# Chapter 4: Functions

## Overview

Functions in FHIRPath:
- Always take a collection as input (implicit first parameter)
- Always return a collection as output
- Can be chained using dot notation
- May have additional parameters in parentheses

Special variables in function expressions:
- `$this` - Current item being evaluated
- `$index` - Index of current item in collection

## Function Categories

### Existence Functions

#### empty() : Boolean
Returns `true` if input collection is empty, `false` otherwise.
```
Patient.name.empty()  // true if no names
```

#### exists([criteria]) : Boolean
Returns `true` if collection has any elements.
```
identifier.exists()                    // Any identifier
identifier.exists(use = 'official')    // Any official identifier
```

#### all(criteria) : Boolean
Returns `true` if criteria is true for ALL elements. Empty → `true`.
```
name.all(use = 'official')  // All names are official
```

#### allTrue() : Boolean
Returns `true` if all items are `true`. Empty → `true`.

#### anyTrue() : Boolean
Returns `true` if any item is `true`. Empty → `false`.

#### allFalse() : Boolean
Returns `true` if all items are `false`. Empty → `true`.

#### anyFalse() : Boolean
Returns `true` if any item is `false`. Empty → `false`.

#### subsetOf(other) : Boolean
Returns `true` if all items in input exist in other collection.

#### supersetOf(other) : Boolean
Returns `true` if input contains all items from other collection.

#### isDistinct() : Boolean
Returns `true` if all items in collection are distinct.

#### distinct() : collection
Returns collection with duplicates removed.

#### count() : Integer
Returns number of items in collection. Empty → `0`.

### Filtering and Projection

#### where(criteria) : collection
Filters collection to items where criteria is true.
```
telecom.where(use = 'home')
name.where(given.exists())
```

#### select(projection) : collection
Projects each item through an expression.
```
name.select(given | family)  // All given and family names
Bundle.entry.select(resource)  // Extract resources
```

#### repeat(projection) : collection
Recursively applies projection until no new items.
```
descendants()  // Same as repeat(children())
```

#### ofType(type) : collection
Filters collection to items of specified type.
```
Observation.value.ofType(Quantity)
```

### Subsetting

#### [index] : collection
Returns item at index (0-based).
```
name[0]      // First name
name[-1]     // Last name (negative index from end)
```

#### single() : collection
Returns single item if collection has exactly one, otherwise error.

#### first() : collection
Returns first item or empty.

#### last() : collection
Returns last item or empty.

#### tail() : collection
Returns all items except first.

#### skip(num) : collection
Skips first num items.

#### take(num) : collection
Takes first num items.

#### intersect(other) : collection
Returns items that exist in both collections (preserves order from input).

#### exclude(other) : collection
Returns items not in other collection.

### Combining

#### union(other) : collection
Combines collections, removing duplicates (also available as `|` operator).

#### combine(other) : collection
Combines collections, preserving duplicates.

### Conversion Functions

#### iif(criterion, true-result [, otherwise-result]) : collection
Conditional selection.
```
iif(gender = 'male', 'Mr.', 'Ms.')
```

#### convertsToBoolean() : Boolean
#### toBoolean() : Boolean
Test/perform conversion to Boolean.

#### convertsToInteger() : Boolean
#### toInteger() : Integer
Test/perform conversion to Integer.

#### convertsToDate() : Boolean
#### toDate() : Date
Test/perform conversion to Date.

#### convertsToDateTime() : Boolean
#### toDateTime() : DateTime
Test/perform conversion to DateTime.

#### convertsToDecimal() : Boolean
#### toDecimal() : Decimal
Test/perform conversion to Decimal.

#### convertsToQuantity([unit]) : Boolean
#### toQuantity([unit]) : Quantity
Test/perform conversion to Quantity.

#### convertsToString() : Boolean
#### toString() : String
Test/perform conversion to String.

#### convertsToTime() : Boolean
#### toTime() : Time
Test/perform conversion to Time.

### String Manipulation

#### indexOf(substring) : Integer
Returns 0-based index of substring, or -1 if not found.

#### substring(start [, length]) : String
Extracts substring.
```
name.given.substring(0, 1)  // First character
```

#### startsWith(prefix) : Boolean
Tests if string starts with prefix.

#### endsWith(suffix) : Boolean
Tests if string ends with suffix.

#### contains(substring) : Boolean
Tests if string contains substring.

#### upper() : String
Converts to uppercase.

#### lower() : String
Converts to lowercase.

#### replace(pattern, substitution) : String
Replaces all occurrences of pattern.

#### matches(regex) : Boolean
Tests if string matches regular expression.

#### replaceMatches(regex, substitution) : String
Replaces matches using regex.

#### length() : Integer
Returns string length.

#### toChars() : collection
Splits string into collection of single characters.

### Math Functions (STU)

#### abs() : Integer | Decimal | Quantity
Absolute value.

#### ceiling() : Integer
Rounds up to nearest integer.

#### exp() : Decimal
Natural exponential function (e^x).

#### floor() : Integer
Rounds down to nearest integer.

#### ln() : Decimal
Natural logarithm.

#### log(base) : Decimal
Logarithm with specified base.

#### power(exponent) : Integer | Decimal
Raises to power.

#### round([precision]) : Decimal
Rounds to specified decimal places.

#### sqrt() : Decimal
Square root.

#### truncate() : Integer
Truncates decimal to integer.

### Tree Navigation

#### children() : collection
Returns direct children of all items.

#### descendants() : collection
Returns all descendants recursively.

### Utility Functions

#### trace(name [, projection]) : collection
Outputs debug information and returns input unchanged.
```
name.trace('names').where(use = 'official')
```

#### now() : DateTime
Returns current date/time.

#### timeOfDay() : Time
Returns current time.

#### today() : Date
Returns current date.

## Function Behavior Notes

1. **Error Handling**: Functions expecting single values error on multi-item collections
2. **Type Conversion**: Automatic conversion happens when unambiguous
3. **Empty Propagation**: Most functions return empty for empty input
4. **Order Preservation**: Most functions preserve input order
5. **Distinct Behavior**: Some functions (`distinct()`, `union()`) remove duplicates

## Common Patterns

```
// Filtering with complex criteria
Patient.contact.where(
  relationship.coding.exists(system = 'http://terminology.hl7.org/CodeSystem/v3-RoleCode')
)

// Extracting and flattening
Bundle.entry.select(resource.name).distinct()

// Conditional logic
Patient.select(
  iif(gender = 'male', 'Mr. ', 'Ms. ') + name.given.first()
)

// Type-safe navigation
Observation.value.ofType(Quantity).where(value > 10)
```

## Next: [Operations →](05-operations.md)