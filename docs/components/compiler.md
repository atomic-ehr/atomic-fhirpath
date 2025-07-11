# Compiler Component

## Overview
The compiler component transforms parsed ASTs into executable code with optional type checking and validation.

## Files
- `src/compiler.ts` - Basic compiler implementation
- `src/typed-compiler.ts` - Type-aware compiler
- `src/compiler-types.ts` - Compiler type definitions

## Compilation Modes

### Basic Compiler
- Direct AST to executable transformation
- No type checking
- Fast compilation

### Typed Compiler
- Integrated type inference
- Semantic validation
- Optimized code generation
- Comprehensive error reporting

## Compilation Pipeline
```
AST → Type Inference → Semantic Validation → Code Generation → Executable
```

## Key Features
- Performance-optimized code generation
- Multiple compilation modes (strict/permissive)
- Type-guided optimizations
- Detailed error messages

## API
```typescript
// Basic compilation
compile(expression: string): CompiledExpression

// Type-aware compilation
compileWithTypes(expression: string, options?: TypedCompilerOptions): CompilationResult
```

## Configuration Options
- `strictMode` - Reject unknown constructs
- `allowUnknownFunctions` - Permit undefined functions
- `modelProvider` - FHIR schema integration
- `rootType` - Context type for compilation

## Testing
- `test/compiler-basic.test.ts` - Basic compiler tests
- `test/typed-compiler.test.ts` - Typed compiler tests