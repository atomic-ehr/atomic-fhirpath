# Evaluator Component

## Overview
Runtime evaluation engine that executes compiled FHIRPath expressions against data.

## Files
- `src/evaluate.ts` - Expression evaluation
- `src/context.ts` - Evaluation context management

## Evaluation Process

### Context Management
- Current data context
- Variable bindings
- Environment variables
- Function dispatch

### Execution Flow
1. Receive compiled expression
2. Set up evaluation context
3. Execute node evaluation
4. Handle collections
5. Return results

## Evaluation Context
```typescript
interface EvaluationContext {
  variables: Map<string, any>;
  environment: Map<string, any>;
  rootData: any;
}
```

## Key Features
- Collection handling
- Variable resolution
- Function execution
- Error propagation
- Result aggregation

## Node Evaluation
- Literals return constant values
- Identifiers resolve properties
- Functions dispatch to implementations
- Operators perform calculations
- Collections handle multiple values

## Testing
- Integration tests across test suite
- Evaluation scenarios in function tests