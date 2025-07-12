# Function Registry Component

## Overview
Manages built-in FHIRPath functions with type signatures and implementations.

## Files
- [`src/function-registry.ts`](../../src/function-registry.ts) - Function definitions and registry

## Function Categories

### Existence Functions
- `exists()` - Check if collection has items
- `empty()` - Check if collection is empty
- `all()` - Check if all items match condition
- `allTrue()` - Check if all items are true
- `anyTrue()` - Check if any item is true
- `allFalse()` - Check if all items are false
- `anyFalse()` - Check if any item is false

### Filtering/Projection
- `where(criteria)` - Filter by condition
- `select(projection)` - Transform items
- `first()` - Get first item
- `last()` - Get last item
- `tail()` - Get all but first
- `skip(n)` - Skip n items
- `take(n)` - Take n items
- `distinct()` - Remove duplicates

### Aggregation
- `count()` - Count items
- `sum()` - Sum numeric values
- `min()` - Minimum value
- `max()` - Maximum value
- `avg()` - Average value

### String Functions
- `length()` - String length
- `startsWith(prefix)` - Check prefix
- `endsWith(suffix)` - Check suffix
- `contains(substring)` - Check substring
- `substring(start, length?)` - Extract substring
- `upper()` - Convert to uppercase
- `lower()` - Convert to lowercase
- `replace(pattern, replacement)` - Replace text
- `matches(regex)` - Regex match
- `indexOf(substring)` - Find position
- `split(separator)` - Split string
- `join(separator)` - Join strings

### Math Functions
- `abs()` - Absolute value
- `ceiling()` - Round up
- `floor()` - Round down
- `round(precision?)` - Round to precision
- `truncate()` - Remove decimals
- `sqrt()` - Square root
- `exp()` - Exponential
- `ln()` - Natural logarithm
- `log(base)` - Logarithm
- `power(exponent)` - Power

### Type Functions
- `is(type)` - Type check
- `as(type)` - Type cast
- `ofType(type)` - Filter by type

### Date/Time Functions
- `now()` - Current datetime
- `today()` - Current date
- `timeOfDay()` - Current time

## Function Registration
```typescript
interface FunctionSignature {
  name: string;
  parameters: ParameterDefinition[];
  returnType: (paramTypes: FHIRPathType[], contextType?: FHIRPathType) => FHIRPathType;
  minArity: number;
  maxArity: number;
}
```

**Key entry points:**
- [`FunctionRegistry` class](../../src/function-registry.ts#L36) - Main registry implementation
- [`createFunctionRegistry()`](../../src/function-registry.ts#L1486) - Create default registry
- [`FunctionSignature` interface](../../src/function-registry.ts#L7) - Function metadata

## Testing
- `test/function-registry.test.ts` - Function registry tests
- `test/03-functions-basic.test.ts` through `test/08-functions-datetime.test.ts`