# Function Implementation Locations

Quick reference for where to find function implementations.

## New Modular Functions (src/functions/)

### Math Functions ✅
| Function | Location | Test Location |
|----------|----------|---------------|
| `abs()` | [`src/functions/math/abs.ts:33`](../../src/functions/math/abs.ts) | [`test/functions/math/abs.test.ts`](../../test/functions/math/abs.test.ts) |
| `ceiling()` | [`src/functions/math/ceiling.ts:33`](../../src/functions/math/ceiling.ts) | [`test/functions/math/ceiling.test.ts`](../../test/functions/math/ceiling.test.ts) |
| `floor()` | [`src/functions/math/floor.ts:33`](../../src/functions/math/floor.ts) | [`test/functions/math/floor.test.ts`](../../test/functions/math/floor.test.ts) |
| `round()` | [`src/functions/math/round.ts:44`](../../src/functions/math/round.ts) | [`test/functions/math/round.test.ts`](../../test/functions/math/round.test.ts) |
| `sqrt()` | [`src/functions/math/sqrt.ts:37`](../../src/functions/math/sqrt.ts) | [`test/functions/math/sqrt.test.ts`](../../test/functions/math/sqrt.test.ts) |
| `sum()` | [`src/functions/math/sum.ts:59`](../../src/functions/math/sum.ts) | [`test/functions/math/sum.test.ts`](../../test/functions/math/sum.test.ts) |
| `min()` | [`src/functions/math/min.ts:55`](../../src/functions/math/min.ts) | [`test/functions/math/min.test.ts`](../../test/functions/math/min.test.ts) |
| `max()` | [`src/functions/math/max.ts:55`](../../src/functions/math/max.ts) | [`test/functions/math/max.test.ts`](../../test/functions/math/max.test.ts) |
| `avg()` | [`src/functions/math/avg.ts:61`](../../src/functions/math/avg.ts) | [`test/functions/math/avg.test.ts`](../../test/functions/math/avg.test.ts) |
| `div()` | [`src/functions/math/div.ts:41`](../../src/functions/math/div.ts) | [`test/functions/math/div.test.ts`](../../test/functions/math/div.test.ts) |
| `mod()` | [`src/functions/math/mod.ts:42`](../../src/functions/math/mod.ts) | [`test/functions/math/mod.test.ts`](../../test/functions/math/mod.test.ts) |
| `value()` | [`src/functions/math/value.ts:45`](../../src/functions/math/value.ts) | [`test/functions/math/value.test.ts`](../../test/functions/math/value.test.ts) |

### Key Files
- **Interface Definition**: [`src/functions/base.ts:43`](../../src/functions/base.ts) - FHIRPathFunction interface
- **Function Registry**: [`src/functions/index.ts:40`](../../src/functions/index.ts) - Central registry
- **Function Executor**: [`src/functions/function-executor.ts`](../../src/functions/function-executor.ts) - Execution engine
- **Math Exports**: [`src/functions/math/index.ts`](../../src/functions/math/index.ts) - All math functions

## Legacy Functions (src/compiler.ts)

Most other functions are still in the monolithic switch statement:
- **Location**: [`src/compiler.ts:1018`](../../src/compiler.ts) - compileFunction() method
- **Functions**: where, select, exists, all, count, first, last, distinct, etc.

## Function Categories

### ✅ Migrated to New System
- **Math** (12/12): All mathematical operations

### 🚧 To Be Migrated
- **Collection** (0/15): where, select, exists, all, any, etc.
- **String** (0/11): substring, contains, startsWith, etc.
- **Logical** (0/4): not, iif, etc.
- **Date/Time** (0/5): now, today, etc.
- **Type** (0/8): is, as, ofType, etc.
- **Navigation** (0/4): children, descendants, etc.
- **Utility** (0/4): trace, etc.

## Adding New Functions

1. Create function file in appropriate category folder (e.g., `src/functions/string/length.ts`)
2. Implement FHIRPathFunction interface
3. Add export to category index (e.g., `src/functions/string/index.ts`)
4. Import and add to registry in `src/functions/index.ts`
5. Create test file (e.g., `test/functions/string/length.test.ts`)

## Function Patterns

### Simple Value Function
```typescript
compile: (compiler, ast) => {
  return (data, env) => {
    if (Array.isArray(data)) {
      return data.map(item => myFunc(item)).filter(v => v !== null);
    }
    const result = myFunc(data);
    return result === null ? [] : [result];
  };
}
```

### Aggregate Function
```typescript
compile: (compiler, ast) => {
  return (data, env) => {
    if (!Array.isArray(data)) {
      data = data === null || data === undefined ? [] : [data];
    }
    const result = aggregate(data);
    return result === null ? [] : [result];
  };
}
```

### Function with Parameters
```typescript
compile: (compiler, ast) => {
  const paramExpr = compiler.compileNode(ast.args[0]);
  return (data, env) => {
    const paramResult = paramExpr(data, env);
    const paramValue = Array.isArray(paramResult) ? paramResult[0] : paramResult;
    // Use paramValue in function logic
  };
}
```