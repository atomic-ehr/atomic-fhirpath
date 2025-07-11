# FHIRPath Parser & Compiler Overview

## Introduction

This project provides a complete, high-performance implementation of the FHIRPath expression language with advanced type inference and semantic validation capabilities. It transforms FHIRPath expressions from source code through parsing, type checking, validation, and compilation into optimized executable code.

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │───▶│   Parser    │───▶│   Type      │───▶│  Executable │
│ Expression  │    │    AST      │    │  Compiler   │    │    Code     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
"Patient.name"         Syntax Tree         Typed AST           eval() func
```

## Key Components

### 1. Parser (`docs/parser.md`)
**High-performance two-stage parsing with complete FHIRPath support**

- **Tokenizer**: Optimized lexical analysis with character code optimization
- **Parser**: Hybrid recursive descent + Pratt parsing for operator precedence
- **Features**: Expression caching, detailed error reporting, position tracking
- **Performance**: O(n) parsing with dispatch table optimizations

### 2. Type System (`src/type-system.ts`)
**Complete FHIRPath type hierarchy with cardinality constraints**

- **Types**: Primitives (string, integer, decimal, boolean, date, time, quantity)
- **Complex Types**: Resources, collections, backbone elements
- **Cardinality**: 0..0, 0..1, 1..1, 0..*, 1..* with constraint checking
- **Compatibility**: Type coercion rules and common supertype calculation

### 3. Compiler (`docs/compiler.md`)
**Type-aware compilation with semantic validation**

- **Type Inference**: Context-sensitive type resolution with scope management
- **Validation**: Comprehensive semantic checking with detailed error reporting
- **Code Generation**: Optimized executable code with performance enhancements
- **Integration**: Pluggable ModelProvider for FHIR schema information

## Key Features

### Complete FHIRPath Support
- All operators, functions, literals, and language constructs
- Full operator precedence handling
- Complex expressions with nested function calls
- Type operators (is, as) and type casting
- Variable references ($this, $index) and environment variables (%resource)

### Advanced Type System
- **Static Type Inference**: Infer types throughout expression trees
- **Semantic Validation**: Catch errors before runtime execution
- **FHIR Integration**: ModelProvider interface for resource schema information
- **Performance**: Type-guided optimizations for faster execution

### Developer Experience
- **Detailed Error Messages**: Precise error locations with helpful context
- **IDE Support**: Position tracking for syntax highlighting and autocomplete
- **Multiple Compilation Modes**: Strict validation or permissive parsing
- **Comprehensive Testing**: Extensive test suite covering all features

### High Performance
- **Optimized Parsing**: Dispatch tables and cached lookahead
- **Type-Aware Compilation**: Use type information for optimized code generation
- **Memory Efficient**: Minimal allocations with object reuse
- **Expression Caching**: LRU cache for frequently used expressions

## Usage Examples

### Basic Parsing and Compilation

```typescript
import { parse, compileWithTypes } from './src/index';

// Parse a FHIRPath expression
const ast = parse('Patient.name.where(use = "official").given[0]');

// Compile with type checking
const result = compileWithTypes('Patient.birthDate > @2000-01-01');

if (result.hasErrors) {
  console.log('Compilation errors:', result.errors);
} else {
  // Execute the compiled expression
  const evalResult = result.compiledNode.eval([patientData], patientData, {});
  console.log('Result:', evalResult);
}
```

### Type-Aware Compilation

```typescript
import { createResourceType, STRING_TYPE, DATE_TYPE, BOOLEAN_TYPE } from './src/type-system';

// Define resource schema
const patientType = createResourceType("Patient", new Map([
  ["name", createCollectionType(STRING_TYPE)],
  ["birthDate", DATE_TYPE],
  ["active", BOOLEAN_TYPE]
]));

// Compile with type context
const result = compileWithTypes('name.first()', {
  rootType: patientType,
  strictMode: true
});

// Type inference knows name is Collection<string>, so first() returns string
console.log(result.typedAST.inferredType?.name); // "string"
```

### Semantic Validation

```typescript
import { validateExpression } from './src/index';

// Validate expression semantics
const validation = validateExpression("'hello' + 42");

console.log(validation.isValid); // false
console.log(validation.errors); 
// ["Arithmetic operation requires numeric types, got string and integer"]
```

## Documentation Structure

- **[Parser Documentation](parser.md)** - Detailed parsing algorithm and implementation
- **[Compiler Documentation](compiler.md)** - Type system, inference, and compilation
- **[User-Defined Functions](user-defined-functions.md)** - Extending with custom functions

## Project Structure

```
src/
├── parser.ts              # Main parser implementation
├── tokenizer.ts           # Lexical analysis
├── types.ts              # AST node definitions
├── type-system.ts        # Type system foundation
├── typed-nodes.ts        # Enhanced AST with types
├── type-inference.ts     # Type inference engine
├── semantic-validator.ts # Validation rules
├── typed-compiler.ts     # Type-aware compilation
├── function-registry.ts  # Built-in function definitions
├── model-provider.ts     # FHIR schema interface
├── compiler.ts           # Original compiler (legacy)
├── evaluate.ts           # Expression evaluation
└── index.ts              # Main API exports

test/
├── type-system.test.ts   # Type system tests
├── type-inference.test.ts # Type inference tests
├── semantic-validator.test.ts # Validation tests
├── typed-compiler.test.ts # Compiler tests
└── parser/               # Parser-specific tests

docs/
├── overview.md           # This file
├── parser.md            # Parser documentation
└── compiler.md          # Compiler documentation
```

## Performance Characteristics

- **Parsing**: O(n) time complexity with optimized tokenization
- **Type Inference**: O(n) tree traversal with context caching
- **Validation**: O(n) semantic checking with early termination
- **Compilation**: O(n) code generation with type optimizations
- **Memory**: Minimal allocations with object reuse and caching

## Future Extensions

The architecture supports several future enhancements:

- **IDE Integration**: Language server protocol implementation
- **Static Analysis**: Advanced optimization and dead code elimination
- **FHIR Schema**: Complete ModelProvider implementation with R4/R5 support
- **Query Optimization**: Expression rewriting and optimization passes
- **Code Generation**: Target different runtime environments (WASM, GPU)

This implementation provides a solid foundation for advanced FHIRPath tooling while maintaining high performance and developer experience.