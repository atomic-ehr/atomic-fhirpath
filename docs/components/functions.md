# FHIRPath Functions Architecture

## Overview

The FHIRPath functions system provides a modular, extensible architecture for implementing built-in functions. This replaces the previous monolithic switch statement approach with individual function modules that implement a common interface.

## Architecture

### Core Components

1. **FHIRPathFunction Interface** (`src/functions/base.ts:43`)
   - Defines the contract all functions must implement
   - Provides metadata, type information, compilation, and evaluation logic

2. **Function Executor** (`src/functions/function-executor.ts`)
   - Manages function registration and lookup
   - Handles function compilation and execution
   - Provides backward compatibility layer

3. **Function Registry** (`src/functions/index.ts:40`)
   - Central map of all built-in functions
   - Organized by category for maintainability

### FHIRPathFunction Interface

```typescript
export interface FHIRPathFunction {
  name: string;
  category: 'collection' | 'string' | 'math' | 'logical' | 'existence' | 
            'navigation' | 'date' | 'type' | 'utility';
  description: string;
  signature: FunctionSignature;
  
  // Type information (one of these is required)
  returnType?: FHIRPathType;
  inferReturnType?: (context: RuntimeContext, contextType?: FHIRPathType, 
                     paramTypes: FHIRPathType[], ast: FunctionCallNode) => FHIRPathType;
  
  // Core functionality
  compile: (context: CompilerContext, ast: FunctionCallNode) => CompiledExpression;
  evaluate?: (...args: any[]) => any;
  
  // Optional features
  validate?: (ast: FunctionCallNode, contextType?: FHIRPathType) => string[];
  hints?: {
    pure?: boolean;
    deterministic?: boolean;
    constant?: boolean;
  };
}
```

### Integration with Compiler

The compiler (`src/compiler.ts:992`) checks for new-style functions first:

```typescript
const newStyleFunc = functionExecutor.getFunction(node.name);
if (newStyleFunc) {
  const compiledExpr = functionExecutor.compileFunction(this, node);
  // ... adapt between systems
}
```

## Function Categories

### Math Functions (`src/functions/math/`)

All mathematical operations on numeric values:

| Function | File | Description |
|----------|------|-------------|
| `abs()` | `abs.ts:33` | Absolute value |
| `ceiling()` | `ceiling.ts:33` | Round up to nearest integer |
| `floor()` | `floor.ts:33` | Round down to nearest integer |
| `round([precision])` | `round.ts:44` | Round to specified precision |
| `sqrt()` | `sqrt.ts:37` | Square root |
| `sum()` | `sum.ts:59` | Sum of collection elements |
| `min()` | `min.ts:55` | Minimum value in collection |
| `max()` | `max.ts:55` | Maximum value in collection |
| `avg()` | `avg.ts:61` | Average of collection elements |
| `div(divisor)` | `div.ts:41` | Integer division |
| `mod(divisor)` | `mod.ts:42` | Modulo operation |
| `value()` | `value.ts:45` | Extract numeric value from Quantity |

### Collection Functions (To Be Implemented)
- `where()`, `select()`, `exists()`, `all()`, `count()`, etc.

### String Functions (To Be Implemented)
- `length()`, `substring()`, `contains()`, `replace()`, etc.

### Other Categories
- Logical, Date, Type, Navigation, Utility functions

## Implementation Patterns

### Basic Function Pattern

For simple functions operating on single values:

```typescript
export const absFunction: FHIRPathFunction = {
  name: 'abs',
  category: 'math',
  description: 'Returns the absolute value',
  
  signature: {
    name: 'abs',
    parameters: [],
    returnType: DECIMAL_TYPE,
    minArity: 0,
    maxArity: 0
  },
  
  inferReturnType: (context, contextType) => {
    // Preserve input type
    if (contextType?.name === 'integer') return INTEGER_TYPE;
    if (contextType?.name === 'decimal') return DECIMAL_TYPE;
    return DECIMAL_TYPE;
  },
  
  compile: (compiler, ast) => {
    return (data, env) => {
      if (Array.isArray(data)) {
        return data.map(item => abs(item)).filter(v => v !== null);
      }
      const result = abs(data);
      return result === null ? [] : [result];
    };
  },
  
  evaluate: abs
};
```

### Aggregate Function Pattern

For functions operating on collections:

```typescript
export const sumFunction: FHIRPathFunction = {
  name: 'sum',
  category: 'math',
  
  compile: (compiler, ast) => {
    return (data, env) => {
      // Always treat as collection
      if (!Array.isArray(data)) {
        data = data === null || data === undefined ? [] : [data];
      }
      const result = sum(data);
      return [result]; // Always return array
    };
  }
};
```

### Functions with Parameters

For functions that take arguments:

```typescript
export const divFunction: FHIRPathFunction = {
  name: 'div',
  
  signature: {
    parameters: [{
      name: 'divisor',
      type: 'System.Decimal',
      documentation: 'The divisor to divide by'
    }]
  },
  
  compile: (compiler, ast) => {
    // Compile the argument expression
    const divisorExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      // Evaluate argument
      const divisorResult = divisorExpr(data, env);
      const divisorValue = Array.isArray(divisorResult) ? 
                          divisorResult[0] : divisorResult;
      
      // Apply function
      if (Array.isArray(data)) {
        return data.map(item => div(item, divisorValue))
                   .filter(v => v !== null);
      }
      const result = div(data, divisorValue);
      return result === null ? [] : [result];
    };
  }
};
```

## Testing Strategy

Each function should have comprehensive tests covering:

1. **Core Functionality** (`test/functions/math/abs.test.ts`)
   - Basic operations
   - Edge cases
   - Error conditions
   - Null/undefined handling

2. **FHIRPath Integration** 
   - Expression evaluation
   - Collection handling
   - Type preservation

Example test structure:
```typescript
describe('abs() function', () => {
  describe('core function', () => {
    test('should return absolute value', () => {
      expect(abs(5)).toBe(5);
      expect(abs(-5)).toBe(5);
    });
  });
  
  describe('FHIRPath integration', () => {
    test('should handle collections', () => {
      const result = fhirpath({}, '(-5 | 3 | -2).abs()');
      expect(result).toEqual([5, 3, 2]);
    });
  });
});
```

## Migration Status

### Completed
- ✅ Math functions (12/12) - All mathematical operations

### In Progress
- 🚧 Collection functions (0/15)
- 🚧 String functions (0/11)

### Planned
- ⏳ Logical functions
- ⏳ Date/Time functions
- ⏳ Type functions
- ⏳ Navigation functions
- ⏳ Utility functions

## Benefits

1. **Modularity** - Each function is self-contained
2. **Testability** - Functions can be tested in isolation
3. **Type Safety** - Strong typing throughout
4. **Extensibility** - Easy to add new functions
5. **Maintainability** - Clear separation of concerns
6. **Performance** - Functions can be optimized individually

## Future Enhancements

1. **Lazy Evaluation** - Defer computation until needed
2. **Compile-Time Optimization** - Evaluate constant expressions
3. **Custom Functions** - Allow user-defined functions
4. **Function Composition** - Build complex functions from simple ones
5. **Parallel Execution** - Process collections in parallel