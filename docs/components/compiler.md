# Compiler Component

## Overview

The FHIRPath compiler transforms parsed Abstract Syntax Trees (ASTs) into executable code with comprehensive type inference and semantic validation. It provides a complete compilation pipeline from source code to optimized, type-safe execution units.

**Key Features:**
- **Type Inference System** - Complete FHIRPath type system with cardinality constraints
- **Semantic Validation** - Comprehensive error detection and warning system
- **Pluggable Architecture** - ModelProvider interface for FHIR schema integration
- **Clean Compilation** - Type-aware code generation with performance optimization
- **Developer Experience** - Detailed error reporting with precise location information
- **Flexible Configuration** - Multiple compilation modes (strict, permissive, validation-only)

## Architecture

### Compilation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Parser    │───▶│   Type      │───▶│  Semantic   │───▶│   Code      │
│    AST      │    │ Inference   │    │ Validation  │    │ Generation  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
   Syntax Tree         Typed AST          Validated AST        Executable
```

### Component Files

- **`src/compiler.ts`** - Basic compiler implementation (legacy)
- **`src/typed-compiler.ts`** - Type-aware compiler orchestration
- **`src/compiler-types.ts`** - Compiler type definitions
- **`src/type-system.ts`** - FHIRPath type hierarchy and rules
- **`src/typed-nodes.ts`** - Enhanced AST nodes with types
- **`src/type-inference.ts`** - Type inference engine
- **`src/semantic-validator.ts`** - Expression validation
- **`src/function-registry.ts`** - Built-in function signatures
- **`src/model-provider.ts`** - FHIR schema interface

## API Reference

### Basic Compilation

```typescript
// Simple compilation without type checking
compile(expression: string): CompiledExpression

// Direct AST compilation
const compiler = new FHIRPathCompiler();
const compiled = compiler.compile(ast);
```

### Type-aware Compilation

```typescript
// Compile with type checking and validation
compileWithTypes(
  expression: string,
  options?: TypedCompilerOptions
): CompilationResult

interface TypedCompilerOptions {
  strictMode?: boolean;           // Reject unknown constructs
  allowUnknownFunctions?: boolean; // Permit undefined functions
  modelProvider?: ModelProvider;   // FHIR schema integration
  rootType?: FHIRPathType;        // Context type
}

interface CompilationResult {
  hasErrors: boolean;
  errors: CompilerError[];
  warnings: CompilerWarning[];
  typedAST?: TypedNode;
  compiledNode?: CompiledNode;
}
```

## Type System

### Primitive Types
- `string` - Text values
- `integer` - Whole numbers
- `decimal` - Decimal numbers  
- `boolean` - True/false values
- `date` - Date values (YYYY-MM-DD)
- `dateTime` - Date and time values
- `time` - Time values
- `quantity` - Numeric values with units

### Complex Types
- `Resource` - FHIR resources
- `Collection` - Collections of values
- `BackboneElement` - Complex sub-structures

### Cardinality
- `0..0` - Empty (no values allowed)
- `0..1` - Optional single value
- `1..1` - Required single value
- `0..*` - Optional collection
- `1..*` - Required collection

## Usage Examples

### Simple Compilation

```typescript
import { compile } from './src/index';

// Basic compilation
const expr = compile('Patient.name.given[0]');
const result = expr.eval([patientData], patientData, {});
```

### Type-aware Compilation

```typescript
import { compileWithTypes, createResourceType } from './src/index';

// Define patient type
const patientType = createResourceType("Patient", new Map([
  ["name", createCollectionType(HumanNameType)],
  ["birthDate", DATE_TYPE]
]));

// Compile with type checking
const result = compileWithTypes('name.given[0] + " " + name.family', {
  rootType: patientType,
  strictMode: true
});

if (result.hasErrors) {
  console.log('Compilation errors:', result.errors);
} else {
  const value = result.compiledNode.eval([patient], patient, {});
}
```

### Model Provider Integration

```typescript
// Custom model provider for FHIR schema
class FHIRModelProvider implements ModelProvider {
  getResourceType(name: string): FHIRPathType | null {
    // Return type definition for resource
  }
  
  getPropertyType(resource: string, property: string): FHIRPathType | null {
    // Return type of resource property
  }
}

// Use with compiler
const result = compileWithTypes(expression, {
  modelProvider: new FHIRModelProvider()
});
```

## Technical Details

### Type Inference Algorithm

1. **Context Resolution** - Determine input type from context
2. **Bottom-up Inference** - Infer types from leaves to root
3. **Function Resolution** - Look up function signatures
4. **Property Navigation** - Resolve property types via ModelProvider
5. **Type Propagation** - Calculate result types through operators

### Semantic Validation Rules

**Errors:**
- Type mismatches in operators
- Invalid function arguments
- Unknown properties or functions
- Cardinality violations

**Warnings:**
- Potential null references
- Deprecated function usage
- Performance anti-patterns

### Code Generation

The compiler generates optimized JavaScript functions:

```typescript
// Source: Patient.name[0].given
// Generated:
function(context, data, ctx) {
  const names = navigate(context, "name");
  const firstNames = index(names, 0);
  return navigate(firstNames, "given");
}
```

## Performance Optimizations

1. **Type-guided Generation** - Skip unnecessary type checks
2. **Constant Folding** - Evaluate constants at compile time
3. **Dead Code Elimination** - Remove unreachable code
4. **Inline Functions** - Inline simple functions
5. **Property Access** - Direct property access when type is known

## Error Handling

```typescript
interface CompilerError {
  message: string;
  start: number;
  end: number;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

// Example error
{
  message: "Type mismatch: cannot add string and number",
  start: 15,
  end: 25,
  line: 1,
  column: 16,
  severity: 'error'
}
```

## Testing

Test files:
- `test/type-system.test.ts` - Type system tests
- `test/type-inference.test.ts` - Type inference tests
- `test/semantic-validator.test.ts` - Validation tests
- `test/typed-compiler.test.ts` - Integration tests
- `test/compiler-basic.test.ts` - Basic compiler tests

## Integration

The compiler integrates with:
- **Parser** - Receives AST input
- **Type System** - Uses type definitions
- **Function Registry** - Function type information
- **Model Provider** - FHIR schema data
- **Runtime** - Produces executable code

## See Also
- [Parser Documentation](parser.md)
- [Type System Documentation](type-system.md)
- [Function Registry Documentation](function-registry.md)
- [FHIRPath Specification](../../refs/FHIRPath/spec/2019May/index.adoc)