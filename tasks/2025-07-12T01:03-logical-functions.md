# Migrate Logical Functions to FHIRPathFunction Interface [pending]

## Overview
Migrate logical and control flow functions from the compiler switch statement to individual FHIRPathFunction implementations.

## Functions to Migrate

### Already Have Registry Entry
- [ ] **not()** - Logical negation

### Need Implementation from Scratch  
- [ ] **iif(condition, trueResult, [falseResult])** - Conditional evaluation (if-then-else)

### Related Operators (Not Functions)
These are operators, not functions, and don't need migration:
- `and` - Logical AND operator
- `or` - Logical OR operator  
- `xor` - Logical XOR operator
- `implies` - Logical implication operator

## Implementation Guidelines

### Three-Valued Logic
FHIRPath uses three-valued logic (true, false, empty/null):
1. Operations with empty generally propagate empty
2. Exception: some operations have defined behavior with empty
3. Need careful handling of null/undefined vs empty collection

### Example Implementation Structure
```typescript
// src/functions/logical/not.ts
export const notFunction: FHIRPathFunction = {
  name: 'not',
  category: 'logical',
  description: 'Logical negation with three-valued logic',
  
  signature: {
    name: 'not',
    parameters: [],
    returnType: BOOLEAN_TYPE,
    minArity: 0,
    maxArity: 0,
    isVariadic: false
  },
  
  returnType: BOOLEAN_TYPE,
  
  compile: (compiler, ast) => {
    return (data, env) => {
      // Extract single boolean from collection
      const value = getSingleBoolean(data);
      
      if (value === null || value === undefined) {
        return []; // empty
      }
      
      return [!value];
    };
  },
  
  evaluate: (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'boolean') {
      throw new Error('not() requires boolean input');
    }
    return !value;
  }
};
```

## Special Considerations

### not() Function
- Operates on single boolean value
- Returns empty for empty input
- Should extract single value from collection
- Type checking for boolean input

### iif(condition, trueResult, [falseResult])
- **Lazy evaluation**: Only evaluates the branch that's needed
- Condition must be boolean (or convertible to boolean)
- If condition is empty, returns empty
- If falseResult is omitted and condition is false, returns empty
- Both result expressions are evaluated in the original context
- This is NOT a function call - it's a special form

#### iif() Implementation Challenges
```typescript
// src/functions/logical/iif.ts
export const iifFunction: FHIRPathFunction = {
  name: 'iif',
  category: 'logical',
  description: 'Conditional evaluation (if-then-else)',
  
  signature: {
    name: 'iif',
    parameters: [
      { name: 'condition', type: BOOLEAN_TYPE, optional: false },
      { name: 'trueResult', type: ANY_TYPE, optional: false },
      { name: 'falseResult', type: ANY_TYPE, optional: true }
    ],
    minArity: 2,
    maxArity: 3,
    isVariadic: false
  },
  
  inferReturnType: (context, contextType, paramTypes, ast) => {
    // Return type is union of both branches
    const trueType = paramTypes[1] || ANY_TYPE;
    const falseType = paramTypes[2] || EMPTY_TYPE;
    // Need type union logic here
    return ANY_TYPE; // Simplified
  },
  
  compile: (compiler, ast) => {
    // DON'T compile all branches eagerly!
    const conditionExpr = compiler.compileNode(ast.args[0]);
    
    return (data, env) => {
      const conditionResult = conditionExpr(data, env);
      const condition = getSingleBoolean(conditionResult);
      
      if (condition === null || condition === undefined) {
        return []; // empty
      }
      
      if (condition) {
        // Only compile and evaluate true branch
        const trueExpr = compiler.compileNode(ast.args[1]);
        return trueExpr(data, env);
      } else if (ast.args.length > 2) {
        // Only compile and evaluate false branch
        const falseExpr = compiler.compileNode(ast.args[2]);
        return falseExpr(data, env);
      } else {
        return []; // No false branch
      }
    };
  }
};
```

## Three-Valued Logic Truth Tables

### not()
| Input | Output |
|-------|--------|
| true  | false  |
| false | true   |
| empty | empty  |

## Testing Requirements
1. Test three-valued logic behavior
2. Test with empty collections
3. Test with null/undefined values
4. Test type checking
5. For iif():
   - Test lazy evaluation (side effects in unevaluated branch)
   - Test with missing false branch
   - Test with empty condition
   - Test that both branches see original context

## Type Inference
- not() always returns BOOLEAN_TYPE (or empty)
- iif() returns union type of both branches
- Need to handle empty type in type unions

## Performance Considerations
- Lazy evaluation for iif() is critical
- Avoid compiling unused branches
- Efficient boolean extraction from collections

## Success Criteria
- [ ] Three-valued logic implemented correctly
- [ ] Lazy evaluation works for iif()
- [ ] All existing tests pass
- [ ] Comprehensive unit tests for edge cases
- [ ] Type inference works correctly
- [ ] Clear error messages