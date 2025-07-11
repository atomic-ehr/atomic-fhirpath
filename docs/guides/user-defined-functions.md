# User-Defined Functions in FHIRPath Parser

## Overview

The FHIRPath parser supports user-defined functions out of the box. Any valid identifier followed by parentheses will be parsed as a function call, regardless of whether it's a built-in FHIRPath function or a custom one defined by the implementation.

## How It Works

The parser doesn't distinguish between built-in and user-defined functions during parsing. This decision is intentionally deferred to the semantic analysis or evaluation phase. This approach provides maximum flexibility for FHIRPath implementations.

### Parsing Process

1. The tokenizer recognizes any valid identifier (letters, digits, underscores)
2. The parser checks if the identifier is followed by `(`
3. If yes, it parses it as a function call with arguments
4. If no, it treats it as a property access or type name

## Examples

### Simple User-Defined Functions

```fhirpath
// Custom function without arguments
Patient.name.myCustomFunction()

// Custom function with arguments
Patient.name.formatName(given, family)

// Custom function with complex arguments
Patient.calculateAge(@2023-01-01, "years")
```

### Naming Conventions

The parser supports various naming conventions for functions:

```fhirpath
// camelCase
Patient.calculateBodyMassIndex()

// snake_case
Patient.get_full_name()

// With numbers
Patient.getValue2()

// Long descriptive names
Patient.performComplexCalculationWithMultipleParameters()
```

### Integration with Built-in Functions

User-defined functions can be freely mixed with built-in FHIRPath functions:

```fhirpath
// Chaining built-in and custom functions
Patient.name
  .where(use = 'official')      // built-in
  .customFormat()               // user-defined
  .first()                      // built-in

// Custom functions in expressions
Patient.identifier.where(customValidator(system, value))
```

### Global Functions

Functions don't need to be methods on objects:

```fhirpath
// Global custom function
myGlobalFunction(Patient, Observation)

// Nested function calls
outerFunction(innerFunction(x, y), z)
```

## Implementation Considerations

### Semantic Analysis

Since the parser accepts any identifier as a potential function, the implementation must:

1. Maintain a registry of available functions (built-in and user-defined)
2. Validate function existence during evaluation
3. Check argument count and types
4. Provide meaningful error messages for undefined functions

### Function Registry Example

```typescript
interface FunctionRegistry {
  // Built-in functions
  'exists': () => boolean;
  'where': (predicate: Expression) => Collection;
  
  // User-defined functions
  'myCustomFunction': (...args: any[]) => any;
  'formatName': (given: string, family: string) => string;
}

// During evaluation
if (!(functionName in registry)) {
  throw new Error(`Unknown function: ${functionName}`);
}
```

### Best Practices

1. **Naming**: Choose descriptive names that don't conflict with built-in functions
2. **Documentation**: Document custom functions thoroughly
3. **Type Safety**: Implement proper type checking during evaluation
4. **Error Handling**: Provide clear error messages for missing functions

## AST Representation

User-defined functions produce the same AST structure as built-in functions:

```typescript
{
  kind: 'function',
  name: 'myCustomFunction',
  args: [
    // ... argument AST nodes
  ],
  start: 10,
  end: 30
}
```

This uniform representation simplifies AST processing and transformation.

## Advanced Usage

### Functions as Predicates

```fhirpath
// Custom predicate function in where clause
Patient.contact.where(customIsEmergencyContact())

// Custom function in indexer
Patient.name[customNameMatcher('John')]
```

### Variable Arguments

The parser supports any number of arguments:

```fhirpath
// No arguments
customFunction()

// Multiple arguments
customFunction(a, b, c, d, e)

// Mixed argument types
customFunction(123, "string", true, @2023-01-01, $this)
```

## Conclusion

The FHIRPath parser's design makes user-defined functions a natural extension of the language. By deferring function validation to the semantic phase, the parser remains simple, fast, and flexible, allowing implementations to define their own custom functions as needed.