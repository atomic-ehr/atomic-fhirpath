# Getting Started with FHIRPath Parser

This guide will help you quickly get started with the FHIRPath parser and compiler.

## Installation

```bash
# Using Bun (recommended)
bun install atomic-fhirpath

# Using npm
npm install atomic-fhirpath

# Using yarn
yarn add atomic-fhirpath
```

## Quick Start

### Basic Usage

```typescript
import { fhirpath } from 'atomic-fhirpath';

// Sample FHIR data
const patient = {
  resourceType: 'Patient',
  name: [{
    given: ['John', 'Jacob'],
    family: 'Doe',
    use: 'official'
  }],
  birthDate: '1980-01-01',
  active: true
};

// Evaluate a FHIRPath expression
const result = fhirpath(patient, 'name.given[0]');
console.log(result); // ['John']

// More complex expression
const officialName = fhirpath(patient, 'name.where(use = "official").given');
console.log(officialName); // ['John', 'Jacob']
```

### Common Patterns

#### Property Navigation
```typescript
// Simple property access
fhirpath(patient, 'birthDate');        // ['1980-01-01']

// Nested property access
fhirpath(patient, 'name.family');      // ['Doe']

// Array indexing
fhirpath(patient, 'name[0].given[0]'); // ['John']
```

#### Filtering Collections
```typescript
// Filter with where()
fhirpath(bundle, 'entry.where(resource.resourceType = "Patient")');

// Check existence
fhirpath(patient, 'name.exists()');    // [true]

// Count elements
fhirpath(patient, 'name.count()');     // [1]
```

#### Working with Operators
```typescript
// Comparison
fhirpath(patient, 'birthDate < @2000-01-01'); // [true]

// String concatenation
fhirpath(patient, 'name[0].given[0] + " " + name[0].family'); // ['John Doe']

// Collection union
fhirpath(data, 'addresses | telecom'); // Combined collections
```

## Advanced Usage

### Type-Safe Compilation

```typescript
import { compileWithTypes, createResourceType, STRING_TYPE } from 'atomic-fhirpath';

// Define resource type
const patientType = createResourceType("Patient", new Map([
  ["name", createCollectionType(HumanNameType)],
  ["birthDate", DATE_TYPE]
]));

// Compile with type checking
const result = compileWithTypes('name.given[0]', {
  rootType: patientType,
  strictMode: true
});

if (result.hasErrors) {
  console.log('Compilation errors:', result.errors);
} else {
  const value = result.compiledNode.eval([patient], patient, {});
}
```

### Custom Functions

```typescript
import { fhirpath, registerCustomFunction } from 'atomic-fhirpath';

// Register a custom function
registerCustomFunction('age', {
  fn: (context) => {
    const birthDate = context[0];
    if (!birthDate) return [];
    
    const years = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return [years];
  },
  signature: {
    name: 'age',
    returnType: 'integer',
    parameters: []
  }
});

// Use custom function
const age = fhirpath(patient, 'birthDate.age()');
```

### Performance Tips

1. **Use Expression Caching** - Expressions are cached by default
2. **Compile Once** - For repeated evaluations, compile once and reuse
3. **Type Information** - Provide type information for better optimization

```typescript
// Compile once, evaluate many times
const compiled = compile('name.where(use = "official").given');
const results = patients.map(p => compiled.eval([p], p, {}));
```

## Error Handling

```typescript
try {
  const result = fhirpath(patient, 'invalid.expression[');
} catch (error) {
  console.log(error.message);  // Detailed error message
  console.log(error.position); // Character position
  console.log(error.line);     // Line number
  console.log(error.column);   // Column number
}
```

## Supported Features

- ✅ All FHIRPath operators (arithmetic, comparison, logical, collection)
- ✅ Property navigation and indexing
- ✅ Built-in functions (where, select, exists, count, etc.)
- ✅ Date/time literals and operations
- ✅ String manipulation functions
- ✅ Type checking and casting (is, as)
- ✅ Variables ($this, %resource)

See [FHIRPath Support](overview/fhirpath-support.md) for complete feature list.

## Next Steps

- [API Reference](API-REFERENCE.md) - Complete API documentation
- [Cookbook](cookbook/common-patterns.md) - Common FHIRPath patterns
- [Architecture](architecture.md) - System design and internals
- [Contributing](guides/contributing.md) - How to contribute

## Resources

- [FHIRPath Specification](http://hl7.org/fhirpath/)
- [FHIR Documentation](https://www.hl7.org/fhir/)
- [GitHub Repository](https://github.com/atomic-ehr/atomic-fhirpath)