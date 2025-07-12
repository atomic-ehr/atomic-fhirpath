# FHIRPath Parser - Feature Support

## Currently Supported Features ✅

### Basic Navigation
- Property access: `Patient.name`, `Observation.value`
- Chained access: `Patient.name.given`, `Patient.contact.telecom`
- Indexed access: `name[0]`, `given[0]`
- Mixed: `Patient.name[0].given[0]`

### Operators
#### Arithmetic
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Integer division: `div`
- Modulo: `mod`
- Unary plus/minus: `+5`, `-5`

#### Comparison
- Equals: `=` ✅
- Not equals: `!=` ✅
- Less than: `<` ✅
- Greater than: `>` ✅ 
- Less than or equal: `<=` ✅
- Greater than or equal: `>=` ✅
- All comparison operators support:
  - Element-wise comparison for collections
  - Empty collection semantics
  - Type checking (throws error for incompatible types)
  - Temporal value comparison

#### Logical ✅
- And: `and` ✅
- Or: `or` ✅
- Xor: `xor` ✅
- Implies: `implies` ✅
- Not function: `not()` ✅
- All logical operators support:
  - Three-valued logic (true, false, empty)
  - Type checking (requires boolean operands)
  - Short-circuit evaluation for `and` and `or`
  - Proper empty propagation

#### Collection ✅
- Union: `|` ✅ (eliminates duplicates as per spec)
- Membership: `in` ✅ (supports single value and collection membership tests)
- Contains: `contains` ✅ (reverse of `in` operator)

### Literals
- Numbers: `42`, `3.14`
- Strings: `'hello'`, `"world"`
- Booleans: `true`, `false`
- Date/Time: `@2014-01-25`, `@T14:30:00`, `@2014-01-25T14:30:14.559`

### Functions

#### Math Functions ✅ (Fully Implemented)
All math functions have been migrated to the new modular architecture:
- `abs()` - Absolute value ([`src/functions/math/abs.ts`](../../src/functions/math/abs.ts))
- `ceiling()` - Round up to integer ([`src/functions/math/ceiling.ts`](../../src/functions/math/ceiling.ts))
- `floor()` - Round down to integer ([`src/functions/math/floor.ts`](../../src/functions/math/floor.ts))
- `round([precision])` - Round to precision ([`src/functions/math/round.ts`](../../src/functions/math/round.ts))
- `sqrt()` - Square root ([`src/functions/math/sqrt.ts`](../../src/functions/math/sqrt.ts))
- `sum()` - Sum of collection ([`src/functions/math/sum.ts`](../../src/functions/math/sum.ts))
- `min()` - Minimum value ([`src/functions/math/min.ts`](../../src/functions/math/min.ts))
- `max()` - Maximum value ([`src/functions/math/max.ts`](../../src/functions/math/max.ts))
- `avg()` - Average of collection ([`src/functions/math/avg.ts`](../../src/functions/math/avg.ts))
- `div(divisor)` - Integer division ([`src/functions/math/div.ts`](../../src/functions/math/div.ts))
- `mod(divisor)` - Modulo operation ([`src/functions/math/mod.ts`](../../src/functions/math/mod.ts))
- `value()` - Extract from Quantity ([`src/functions/math/value.ts`](../../src/functions/math/value.ts))

See [Math Functions Reference](../components/math-functions.md) for detailed documentation.

#### Other Functions (Legacy Implementation)
Many functions are recognized and evaluated through the legacy system:
- `exists()`, `empty()`, `not()`
- `count()`, `first()`, `last()`
- `distinct()`, `union()`
- `substring()`, `contains()`, `startsWith()`, `endsWith()`
- `upper()`, `lower()`, `split()`, `join()`
- `where()`, `select()`, `ofType()`
- And many more...

### Complex Expressions
- Operator precedence: `1 + 2 * 3` correctly evaluates as `1 + (2 * 3)`
- Grouped expressions: `(1 + 2) * 3`
- Mixed navigation and operators: `Patient.name.given[0] + " " + Patient.name.family`
- Function chaining: `name.where(use = "official").given.first()`

## Not Yet Supported ❌

### Type Operations
- Type checking: `value is Quantity`
- Type casting: `value as Quantity`
- Type filtering: Already parses `ofType()` but needs evaluation

### Quantity Literals
- `4.5 'mg'`
- `10 'km'`

### Special Variables
- `$this`
- `$index`
- `$total`

### Advanced Functions
- Date arithmetic: `today() - 18 years`
- Regular expressions in `matches()` and `replaceMatches()`
- Aggregate functions with custom expressions

## Performance Characteristics

Based on our benchmarks:
- Simple identifier parsing: ~0.24μs (no cache) / ~0.07μs (cached)
- Complex path expressions: ~1.37μs
- Large expressions (100 terms): ~12.24μs
- Cache provides 3-7x speedup for repeated expressions

## Test Coverage

From the FHIRPath specification test suite:
- ✅ Basic navigation and property access
- ✅ All arithmetic operators
- ✅ All comparison operators
- ✅ All logical operators
- ✅ Function call syntax (both with and without arguments)
- ✅ String manipulation functions
- ✅ Mathematical functions
- ✅ Collection operations (union, distinct)
- ✅ Complex nested expressions
- ✅ Operator precedence
- ⚠️ Type operations (syntax recognized but not evaluated)
- ❌ Quantity literals
- ❌ Special variables

## Usage Examples

```typescript
import { parse } from './src';

// Simple navigation
parse('Patient.name.given');

// Arithmetic with correct precedence
parse('1 + 2 * 3'); // Evaluates as 1 + (2 * 3)

// Complex filtering (parses but needs evaluation)
parse('Patient.telecom.where(use = "official")');

// String concatenation
parse('given[0] + " " + family');

// Function calls
parse('name.exists()');
parse('substring(0, 10)');

// Collection operations
parse('name | contact.name');
```