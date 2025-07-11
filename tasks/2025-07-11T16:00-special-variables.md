# Implement FHIRPath Special Variables ($this, $index, $total)

## Overview

Implement support for FHIRPath special variables that provide context during expression evaluation. These variables are essential for complex FHIRPath expressions and are currently missing from the implementation.

## Background

FHIRPath defines three special variables that are available in specific contexts:
- `$this` - The current item being processed in a collection
- `$index` - The current position (0-based) when iterating over a collection
- `$total` - The total number of items in the collection being processed

These variables are crucial for:
- Filtering based on position
- Conditional logic based on collection size
- Self-referential expressions
- Complex collection manipulations

## Current State

Based on the gap analysis:
- Special variables are **not implemented**
- Parser likely doesn't recognize these tokens
- Type inference doesn't handle these variables
- No evaluation context for tracking these values

## Requirements

### 1. Parser Support
- Recognize `$this`, `$index`, and `$total` as special variable tokens
- Parse them as valid identifiers in expressions
- Distinguish from regular identifiers

### 2. Type System Support
- `$this` - Type depends on the collection being processed
- `$index` - Always Integer type
- `$total` - Always Integer type
- Update TypeInferenceEngine to handle special variables

### 3. Evaluation Context
- Track current item, index, and total during evaluation
- Make these values available in the correct scopes
- Handle nested contexts correctly

### 4. Semantic Validation
- Ensure special variables are used in valid contexts
- `$index` and `$total` only valid within collection operations
- Validate type compatibility

## Examples to Support

```fhirpath
# Using $this
Patient.name.where($this.use = 'official')

# Using $index
Patient.name[$index < 2]  # First two names

# Using $total
Patient.name.where($index = $total - 1)  # Last item

# Nested contexts
Patient.contact.where(
  $this.telecom.where($index = 0).value = '555-1234'
)

# Complex filtering
Observation.component.where(
  $index < 3 and $this.code.coding.exists(system = 'loinc')
)
```

## Implementation Plan

### Phase 1: Parser Updates
1. Add special variable tokens to lexer
2. Update parser grammar to recognize special variables
3. Create AST nodes for special variables
4. Add parser tests

### Phase 2: Type System Integration
1. Update TypeInferenceEngine to handle special variables
2. Add context tracking for variable types
3. Implement type resolution based on context
4. Add type inference tests

### Phase 3: Evaluation Implementation
1. Enhance EvaluationContext to track special variables
2. Update evaluator to provide variable values
3. Handle nested contexts correctly
4. Add evaluation tests

### Phase 4: Semantic Validation
1. Add validation rules for special variable usage
2. Check context requirements
3. Validate type compatibility
4. Add validation tests

## Technical Considerations

### Context Management
```typescript
interface SpecialVariableContext {
  thisValue: any;
  indexValue: number;
  totalValue: number;
  parentContext?: SpecialVariableContext;
}

interface EnhancedEvaluationContext extends EvaluationContext {
  specialVars: SpecialVariableContext;
}
```

### AST Node Structure
```typescript
interface SpecialVariableNode extends ASTNode {
  type: 'SpecialVariable';
  name: '$this' | '$index' | '$total';
}
```

### Type Inference
```typescript
// In TypeInferenceEngine
private inferSpecialVariableType(
  node: SpecialVariableNode,
  context: TypeInferenceContext
): FHIRPathType {
  switch (node.name) {
    case '$this':
      return context.currentCollectionType || ANY_TYPE;
    case '$index':
    case '$total':
      return INTEGER_TYPE;
  }
}
```

## Testing Strategy

### Parser Tests
- Parsing special variables in various contexts
- Error cases for invalid syntax
- Integration with other expressions

### Type Inference Tests
- Correct type resolution for $this
- Integer types for $index and $total
- Nested context type resolution

### Evaluation Tests
- Correct values in simple iterations
- Nested context handling
- Edge cases (empty collections, single items)

### Semantic Validation Tests
- Valid vs invalid contexts
- Type compatibility checks
- Error messages for misuse

## Success Criteria

1. All three special variables parse correctly
2. Type inference works properly in all contexts
3. Evaluation produces correct values
4. Semantic validation catches invalid usage
5. Comprehensive test coverage
6. Documentation updated

## Estimated Effort

- Parser updates: 0.5 days
- Type system integration: 1 day
- Evaluation implementation: 1.5 days
- Semantic validation: 0.5 days
- Testing and documentation: 0.5 days
- **Total: ~4 days**

## Dependencies

- None - can be implemented independently
- Will enhance overall FHIRPath compliance
- Required for many complex FHIRPath expressions

## Next Steps

1. Review and approve implementation plan
2. Start with parser updates
3. Proceed through phases sequentially
4. Regular testing at each phase