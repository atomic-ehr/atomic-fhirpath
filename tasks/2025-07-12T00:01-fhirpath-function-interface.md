# Implement FHIRPathFunction Interface [in-progress]

## Overview
Introduce a modular FHIRPathFunction interface to replace the monolithic switch statement in the compiler. Each function will contain its own type information, compilation logic, and evaluation implementation in a dedicated file with unit tests.

## Motivation
- Current implementation has a 1000+ line switch statement for function compilation
- Difficult to test individual functions in isolation
- No clear extension point for custom functions
- Type information separated from implementation
- Hard to maintain and understand individual function behavior

## Tasks
- [x] Create FHIRPathFunction interface definition
- [x] Create function implementation structure
- [x] Implement proof of concept (abs function)
- [x] Update function-registry.ts to support FHIRPathFunction
- [x] Create function-executor.ts for function management
- [ ] Update compiler to use new function system
- [ ] Refactor remaining built-in functions
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
  // one of elements
  // returnType - if returnType is fixed or inferReturnType
  returnType: FHIRPathType;
  inferReturnType: (context: FHIRPathContext, contextType?: FHIRPathType, paramTypes: FHIRPathType[], ast: FunctionCallNode) => FHIRPathType;
  
  // Compilation
  compile: (context: CompilerContext, ast: FunctionCallNode) => CompiledExpression;
  
  // core function, which will be used in compile; for example for abs() fhirpath function, it should be ts abs function
  // this function can be used for unit tests without need to setup surounding FHIRPath objects 
  evaluate?: (context: RuntimeContext, ...args: any[]) => any;
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
    
    return (context, data, env) => {
      //here could be generic checks for cardinality, nulls etc
      return whereFunction(context, criteria, collection);
    };
  },
  
  evaluate: (context, criteria, collection) => {
    const collection = ensureArray(context);
    return collection.filter(item => isTruthy(criteria(item)));
  }
};

// Unit tests in same file
describe('where() function', () => {
  const context = {}
  it('should filter collection by criteria', () => {
    const criteria = x => x > 2
    const result = whereFunction.evaluate(context, criteria, [1, 2, 3, 4]);
    expect(result).toEqual([3, 4]);
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

Report progress on this task here

## Progress Report

### 2025-07-12 - Initial Implementation

**Completed:**
1. Created `src/functions/base.ts` with:
   - FHIRPathFunction interface definition
   - Runtime and compiler context types
   - Utility functions (ensureArray, isTruthy, isEmpty, getSingleValue)
   - Optional BaseFHIRPathFunction abstract class
   - createSimpleFunction helper

2. Created directory structure:
   - `src/functions/` with subdirectories for each category
   - `test/functions/` for function-specific tests

3. Implemented abs() function as proof of concept:
   - `src/functions/math/abs.ts` - Full implementation with type inference
   - `test/functions/math/abs.test.ts` - Comprehensive unit tests
   - All tests passing (13 tests)

4. Updated `src/function-registry.ts`:
   - Added support for new FHIRPathFunction interface
   - Maintains backward compatibility with existing code
   - Automatically registers built-in functions from new system

5. Created `src/function-executor.ts`:
   - Manages function compilation and execution
   - Supports custom function registration
   - Proper error handling with FunctionExecutionError
   - Validates function calls

**Next Steps:**
- Update compiler.ts to use function-executor instead of switch statement
- Test integration with existing code
- Begin migrating remaining functions

### 2025-07-12 - Compiler Integration Complete

**Additional Completed:**
6. Updated `src/compiler.ts`:
   - Implemented CompilerContext interface in FHIRPathCompiler class
   - Modified compileFunction to check for new-style functions first
   - Created adapter between old eval function signature and new compiled expression
   - All existing tests pass without modification

7. Created integration tests:
   - `test/functions/integration/abs-integration.test.ts`
   - Verified abs() works through fhirpath() function
   - All 4 integration tests pass

8. Verified backward compatibility:
   - All existing abs() tests in test/07-functions-math.test.ts pass (7 tests)
   - No changes needed to existing test files

**System is now ready for function migration:**
- New functions can be added using FHIRPathFunction interface
- Old functions continue to work through legacy switch statement
- Gradual migration path established
- Full test coverage maintained
