# Chapter 6: Advanced Features

## Aggregates (STU)

### aggregate(aggregator, [init])

General-purpose aggregation function with iteration variables:
- `$this` - Current item
- `$index` - Current index
- `$total` - Running total (starts with init or `{}`)

**Examples**:
```
// Sum
value.aggregate($this + $total, 0)

// Min
value.aggregate(
  iif($total.empty(), $this, 
    iif($this < $total, $this, $total))
)

// Average
value.aggregate($total + $this, 0) / value.count()

// Running product
value.aggregate($this * $total, 1)
```

## Environment Variables

Variables passed from calling environment, prefixed with `%`:

### Standard Variables
```
%ucum     // URL for UCUM (http://unitsofmeasure.org)
%context  // Original node passed to evaluation engine
```

### Custom Variables
- Formal extension point
- Can use delimited identifiers: `%`us-zip``
- Can hold any type, not just primitives
- Undefined → error
- Defined but no value → empty `{}`

**Example**:
```
Patient.telecom.where(
  value.matches(%`us-phone-regex`)
)
```

## Type System

### Models and Namespaces

Types are namespaced by model:
- **System types**: `System.String`, `System.Integer`, etc.
- **FHIR types**: `FHIR.Patient`, `FHIR.Observation`
- **Other models**: Custom namespaces

### Type Resolution
1. Search context-specific model first
2. Then search System model
3. For root identifiers: type resolution takes precedence

**Example**:
```
Patient              // Resolves to type if at root
value is FHIR.Quantity  // Explicit namespace
```

### Type Specifiers
Used in `is`, `as`, and `ofType()`:
```
value is Quantity           // Context model first
value is System.String      // Explicit System type
value.ofType(FHIR.Quantity) // Explicit FHIR type
```

## Reflection (STU)

### Type Information Access

Types have properties accessible via reflection:

#### Primitive Types
```
type.name       // Type name
type.namespace  // Model namespace
```

#### Class Types
Additional properties:
```
type.properties          // List of properties
type.superTypes         // Parent types
type.baseType           // Direct parent
```

#### Collection Types
```
type.elementType        // Type of elements
```

### Using Reflection
```
// Check type dynamically
Patient.type().name = 'Patient'

// Access property information
Patient.type().properties.where(name = 'identifier')
```

## Type Safety and Strict Evaluation

### Strict Mode
- Type checking at compile time
- Cardinality validation
- Property existence verification

### Type Conversions
Implicit conversions allowed when unambiguous:
- Integer → Decimal
- Single-item collection → Value
- Value → Single-item collection

### Error Handling
Type mismatches result in:
- Compile-time errors (strict mode)
- Runtime errors (single-value expected)
- Empty results (safe navigation)

## Advanced Patterns

### Dynamic Property Access
```
// Using where() with type checking
element.where($this is Quantity and value > 10)

// Polymorphic navigation
value.ofType(Quantity).unit
```

### Complex Aggregations
```
// Group and count
encounter.class.aggregate(
  $total.combine(
    {group: $this, count: 1}
  ).aggregate(
    iif(group = $this.group,
      {group: group, count: count + 1},
      $total
    )
  )
)
```

### Environment Variable Patterns
```
// Feature flags
iif(%feature-enabled, 
  advancedLogic(), 
  simpleLogic()
)

// External configuration
value.matches(%validation-pattern)
```

## Performance Considerations

### Expression Caching
- Parsed expressions can be cached
- Environment variables allow parameterization

### Lazy Evaluation
- Short-circuit boolean operators
- Efficient collection operations

### Type Information
- Compile-time type checking preferred
- Runtime reflection has overhead

## Extensibility

### Custom Functions
Define in implementation:
```
// Implementation-specific
customFunction(param1, param2)
```

### Custom Types
Models can define:
- New primitive types
- Complex types with properties
- Type hierarchies

### Environment Extensions
- Custom variables
- External data access
- Configuration values

## Next: [Grammar Reference →](07-grammar.md)