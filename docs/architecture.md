# FHIRPath Implementation Architecture

## Overview

This project implements a complete FHIRPath expression language parser, type system, and compiler. FHIRPath is a path-based navigation and extraction language for FHIR (Fast Healthcare Interoperability Resources) data structures.

## Project Structure

```
atomic-fhirpath/
├── src/                     # Core implementation
│   ├── parser.ts           # Expression parser
│   ├── tokenizer.ts        # Lexical analysis
│   ├── types.ts            # AST node definitions
│   ├── compiler.ts         # Expression compiler
│   ├── evaluate.ts         # Runtime evaluation
│   ├── type-system.ts      # Type system foundation
│   ├── typed-nodes.ts      # Enhanced AST with types
│   ├── type-inference.ts   # Type inference engine
│   ├── semantic-validator.ts # Semantic validation
│   ├── typed-compiler.ts   # Type-aware compilation
│   ├── function-registry.ts # Built-in functions
│   ├── model-provider.ts   # FHIR schema interface
│   ├── context.ts          # Evaluation context
│   ├── error-formatter.ts  # Error formatting utilities
│   ├── ast-printer.ts      # AST visualization
│   └── index.ts            # Public API
├── test/                   # Test suite
│   ├── parser/            # Parser-specific tests
│   ├── 01-literals.test.ts through 08-functions-datetime.test.ts
│   └── Various component tests
├── docs/                   # Documentation
├── refs/                   # Reference materials
│   └── FHIRPath/          # FHIRPath specification
└── tasks/                  # Task tracking

```

## Core Components

### 1. Parser & Tokenizer
**Files**: `parser.ts`, `tokenizer.ts`, `types.ts`

The parser implements a high-performance two-stage parsing approach:
- **Tokenizer**: Character-based lexical analysis with optimized dispatch
- **Parser**: Hybrid recursive descent + Pratt parsing for operator precedence
- **AST**: Complete abstract syntax tree representation

Key features:
- Expression caching with LRU cache
- Detailed error reporting with position tracking
- Support for all FHIRPath operators and constructs

### 2. Type System
**Files**: `type-system.ts`, `typed-nodes.ts`

Complete FHIRPath type hierarchy implementation:
- Primitive types: string, integer, decimal, boolean, date, time, dateTime, quantity
- Complex types: Resources, collections, backbone elements
- Cardinality constraints: 0..0, 0..1, 1..1, 0..*, 1..*
- Type compatibility and coercion rules

### 3. Type Inference Engine
**Files**: `type-inference.ts`, `model-provider.ts`

Context-sensitive type resolution:
- Visitor pattern implementation
- Property resolution through ModelProvider
- Function return type calculation
- Variable scope management

### 4. Semantic Validator
**File**: `semantic-validator.ts`

Comprehensive expression validation:
- Type compatibility checking
- Function parameter validation
- Operator usage validation
- Error/warning/info categorization

### 5. Compiler
**Files**: `compiler.ts`, `typed-compiler.ts`, `compiler-types.ts`

Two compilation approaches:
- **Basic Compiler**: Direct AST to executable code
- **Typed Compiler**: Type-aware compilation with validation

Features:
- Performance-optimized code generation
- Integration with type inference and validation
- Configurable compilation options

### 6. Function Registry
**File**: `function-registry.ts`

Built-in function management:
- Complete FHIRPath function library
- Type signatures and return type inference
- Category-based organization
- Extensible architecture

### 7. Evaluation Engine
**Files**: `evaluate.ts`, `context.ts`

Runtime expression evaluation:
- Context-based execution
- Variable resolution
- Function dispatch
- Result aggregation

## Key Interfaces

### ModelProvider
Plugin interface for FHIR schema information:
```typescript
interface ModelProvider {
  getResourceType(name: string): ResourceType | null;
  getPropertyType(resourceType: string, propertyName: string): FHIRPathType | null;
  isValidResource(resourceType: string): boolean;
  getSuperTypes(resourceType: string): string[];
  isSubTypeOf(childType: string, parentType: string): boolean;
}
```

### Compilation Pipeline
```
Source → Tokenizer → Parser → Type Inference → Validation → Code Generation → Executable
```

### Public API
Main entry points in `index.ts`:
- `parse(expression: string)`: Parse to AST
- `compile(expression: string)`: Basic compilation
- `compileWithTypes(expression: string, options?)`: Type-aware compilation
- `validateExpression(expression: string, context?)`: Validation only

## Implementation Status

### Completed Features
- ✅ Complete parser with all FHIRPath syntax
- ✅ Type system implementation
- ✅ Type inference engine
- ✅ Semantic validation
- ✅ Basic compiler
- ✅ Typed compiler
- ✅ Function registry (most built-in functions)
- ✅ Expression caching
- ✅ Error reporting

### Partial/Missing Features
- ⚠️ ModelProvider implementation (interface only)
- ⚠️ Some built-in functions not fully implemented
- ❌ Quantity type with units
- ❌ External constants (%ext)
- ❌ Some date/time arithmetic
- ❌ Custom function extensions

## Testing Strategy

The test suite is comprehensive:
- Unit tests for each component
- Integration tests for compilation pipeline
- FHIRPath specification compliance tests
- Performance benchmarks
- Edge case coverage

Test organization:
- `parser/`: Parser-specific tests
- `01-08-*.test.ts`: Feature-based integration tests
- Component tests: `type-system.test.ts`, `semantic-validator.test.ts`, etc.

## Performance Characteristics

- **Parsing**: O(n) with optimized tokenization
- **Type Inference**: O(n) tree traversal
- **Compilation**: O(n) with caching
- **Memory**: Efficient with object reuse and LRU cache

## Extension Points

1. **ModelProvider**: Implement for FHIR R4/R5 schemas
2. **Custom Functions**: Extend function registry
3. **Optimization Passes**: Add to compilation pipeline
4. **Target Platforms**: Generate code for different runtimes

## Dependencies

Minimal external dependencies:
- Core TypeScript/JavaScript only
- No runtime dependencies
- Development dependencies for testing (Bun test framework)