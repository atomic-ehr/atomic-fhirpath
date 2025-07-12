# Implement FHIRPathFunction Interface [pending]

## Overview
Introduce a modular FHIRPathFunction interface to replace the monolithic switch statement in the compiler. Each function will contain its own type information, compilation logic, and evaluation implementation in a dedicated file with unit tests.

## Motivation
- Current implementation has a 1000+ line switch statement for function compilation
- Difficult to test individual functions in isolation
- No clear extension point for custom functions
- Type information separated from implementation
- Hard to maintain and understand individual function behavior

## Tasks
- [ ] Create FHIRPathFunction interface definition
- [ ] Create function implementation structure
- [ ] Refactor existing built-in functions
- [ ] Update compiler to use new function system
- [ ] Add comprehensive unit tests per function
- [ ] Update documentation

## Design

### 1. FHIRPathFunction Interface
```typescript
interface FHIRPathFunction {
  // Function metadata
  name: string;
  category: 'collection' | 'string' | 'math' | 'logical' | 'existence' | 'navigation' | 'date' | 'type' | 'utility';
  description: string;
  
  // Type information
  signature: FunctionSignature;
  inferReturnType: (paramTypes: FHIRPathType[], contextType?: FHIRPathType) => FHIRPathType;
  
  // Compilation
  compile: (ast: FunctionCallNode, compiler: CompilerContext) => CompiledExpression;
  
  // Direct evaluation (for testing and simple cases)
  evaluate?: (context: any, ...args: any[]) => any;
}
```

### 2. Directory Structure
```
src/
├── functions/
│   ├── index.ts              # Exports all built-in functions
│   ├── base.ts               # Base classes and utilities
│   ├── collection/
│   │   ├── where.ts          # where() function + tests
│   │   ├── select.ts         # select() function + tests
│   │   ├── exists.ts         # exists() function + tests
│   │   ├── count.ts          # count() function + tests
│   │   └── ...
│   ├── string/
│   │   ├── length.ts         # length() function + tests
│   │   ├── substring.ts      # substring() function + tests
│   │   └── ...
│   ├── math/
│   │   ├── abs.ts            # abs() function + tests
│   │   ├── round.ts          # round() function + tests
│   │   └── ...
│   └── ...
├── function-registry.ts      # Updated to work with FHIRPathFunction
├── function-executor.ts      # New: Manages function execution
└── compiler.ts              # Updated to use function registry

test/
└── functions/               # Integration tests for function groups
```

### 3. Example Implementation (where.ts)
```typescript
import { FHIRPathFunction } from '../base';
import { BOOLEAN_TYPE, createCollectionType, ANY_TYPE } from '../../type-system';

export const whereFunction: FHIRPathFunction = {
  name: 'where',
  category: 'collection',
  description: 'Filter collection by criteria',
  
  signature: {
    name: 'where',
    parameters: [{
      name: 'criteria',
      type: BOOLEAN_TYPE,
      optional: false,
      description: 'Filter criteria'
    }],
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  
  inferReturnType: (paramTypes, contextType) => {
    return contextType?.isCollection ? contextType : createCollectionType(contextType || ANY_TYPE);
  },
  
  compile: (ast, compiler) => {
    const context = compiler.compileNode(ast.context);
    const criteria = compiler.compileNode(ast.arguments[0]);
    
    return (data, env) => {
      const collection = ensureArray(context(data, env));
      return collection.filter(item => {
        const result = criteria(item, env);
        return isTruthy(result);
      });
    };
  },
  
  evaluate: (context, criteria) => {
    const collection = ensureArray(context);
    return collection.filter(item => isTruthy(criteria(item)));
  }
};

// Unit tests in same file
describe('where() function', () => {
  it('should filter collection by criteria', () => {
    const result = whereFunction.evaluate([1, 2, 3, 4], x => x > 2);
    expect(result).toEqual([3, 4]);
  });
  
  it('should handle empty collections', () => {
    const result = whereFunction.evaluate([], x => true);
    expect(result).toEqual([]);
  });
  
  // More tests...
});
```

### 4. Function Registry Updates
```typescript
class FunctionRegistry {
  private functions = new Map<string, FHIRPathFunction>();
  
  register(func: FHIRPathFunction): void {
    this.functions.set(func.name, func);
  }
  
  get(name: string): FHIRPathFunction | undefined {
    return this.functions.get(name);
  }
  
  // Backward compatibility methods
  inferReturnType(name: string, paramTypes: FHIRPathType[], contextType?: FHIRPathType): FHIRPathType {
    const func = this.get(name);
    return func ? func.inferReturnType(paramTypes, contextType) : ANY_TYPE;
  }
}
```

### 5. Compiler Updates
```typescript
// In compiler.ts
private compileFunction(node: FunctionCallNode): CompiledExpression {
  const func = this.functionRegistry.get(node.name);
  
  if (!func) {
    // Check custom functions in context
    return this.compileCustomFunction(node);
  }
  
  return func.compile(node, this);
}

private compileCustomFunction(node: FunctionCallNode): CompiledExpression {
  return (data, env) => {
    const customFunc = env?.functions?.[node.name];
    if (!customFunc) {
      throw new Error(`Unknown function: ${node.name}`);
    }
    // Compile and execute custom function
  };
}
```

## Implementation Steps

### Phase 1: Foundation
1. Create `src/functions/base.ts` with interface and utilities
2. Create `src/function-executor.ts` for function management
3. Update `src/function-registry.ts` to support FHIRPathFunction

### Phase 2: Function Migration
4. Start with simple functions (no dependencies):
   - Math: abs, ceiling, floor
   - String: length, upper, lower
   - Type: toString, toInteger
5. Move to complex functions:
   - Collection: where, select, exists
   - Navigation: children, descendants
6. Handle special cases:
   - Functions with side effects
   - Functions needing compiler context

### Phase 3: Integration
7. Update compiler.ts to use new function system
8. Add support for custom functions in EvaluationContext
9. Ensure backward compatibility
10. Update all existing tests

### Phase 4: Testing & Documentation
11. Add unit tests for each function
12. Add integration tests for custom functions
13. Update documentation
14. Performance benchmarking

## Success Criteria
- [ ] All existing tests pass without modification
- [ ] Each function has dedicated unit tests
- [ ] Custom functions can be registered and executed
- [ ] Performance is equal or better than current implementation
- [ ] Code is more modular and maintainable
- [ ] Clear documentation for adding new functions

## Benefits
1. **Modularity**: Each function in its own file with tests
2. **Testability**: Unit test functions in isolation
3. **Extensibility**: Easy to add custom functions
4. **Maintainability**: Smaller, focused files
5. **Type Safety**: Type information with implementation
6. **Documentation**: Self-documenting function files

## Future Extensions
- Function versioning for backward compatibility
- Function composition utilities
- Performance hints (pure, deterministic, etc.)
- Async function support
- Function validation and linting