# Semantic Validator Component

## Overview
Validates FHIRPath expressions for semantic correctness beyond syntax, checking type compatibility and proper usage.

## Files
- `src/semantic-validator.ts` - Validation implementation

## Validation Rules

### Type Compatibility
- Arithmetic operations require numeric types
- String operations require string types
- Comparison operators check type compatibility
- Function parameters match expected types

### Function Validation
- Parameter count verification
- Parameter type checking
- Return type validation
- Context type requirements

### Operator Validation
- Binary operator type requirements
- Unary operator constraints
- Collection operator rules
- Type operator usage

## Error Categories
- `error` - Must be fixed for valid execution
- `warning` - Potentially problematic but allowed
- `info` - Informational messages

## Error Codes
- `INVALID_ARITHMETIC_OPERANDS`
- `UNKNOWN_FUNCTION`
- `UNDEFINED_VARIABLE`
- `INVALID_TYPE_CAST`
- `INCOMPATIBLE_COMPARISON`
- `INVALID_PARAMETER_COUNT`
- `INVALID_PARAMETER_TYPE`

## API
```typescript
class SemanticValidator {
  validate(node: TypedASTNode): ValidationResult;
}

interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  hasErrors: boolean;
  isValid: boolean;
}
```

## Testing
- `test/semantic-validator.test.ts` - Validation tests