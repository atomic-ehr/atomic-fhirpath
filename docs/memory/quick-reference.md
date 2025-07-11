# Quick Reference for AI Assistants

This document provides quick access to common patterns, file locations, and key information for working with the FHIRPath codebase.

## Key File Locations

### Core Implementation
- **Parser**: `src/parser.ts`, `src/tokenizer.ts`
- **Compiler**: `src/compiler.ts` (basic), `src/typed-compiler.ts` (type-aware)
- **Type System**: `src/type-system.ts`, `src/type-inference.ts`
- **Evaluation**: `src/evaluate.ts`
- **Public API**: `src/index.ts`

### Test Files
- **Parser Tests**: `test/parser/*.test.ts`
- **Operator Tests**: `test/*-operators-*.test.ts`
- **Function Tests**: `test/*-functions-*.test.ts`
- **Type System Tests**: `test/type-*.test.ts`

### Documentation
- **Architecture Overview**: `docs/architecture.md`
- **Feature Support**: `docs/FHIRPATH-SUPPORT.md`
- **Task Tracking**: `tasks/*.md`
- **FHIRPath Spec**: `refs/FHIRPath/spec/2019May/index.adoc`

## Common Commands

```bash
# Run all tests
bun test

# Run specific test file
bun test test/12-operators-collection.test.ts

# Type check
bun run typecheck

# Build
bun run build

# Run a script
bun run scripts/my-script.ts
```

## Task Workflow

1. **Check for tasks**: Look in `tasks/` folder
2. **Read task**: Open task file, check requirements
3. **Update task status**: Mark as `[in-progress]` then `[completed]`
4. **Run tests**: Always run related tests after changes
5. **Update docs**: Keep documentation in sync

## Common Patterns

### Adding a New Operator

1. **Update tokenizer** if new token needed: `src/tokenizer.ts`
2. **Add to parser**: Handle in `parseBinaryExpression()` in `src/parser.ts`
3. **Implement in compiler**: Add case in `compileBinary()` in `src/compiler.ts`
4. **Add tests**: Create/update test file in `test/`

### Adding a New Function

1. **Register in function registry**: `src/function-registry.ts`
   ```typescript
   this.register('newFunc', {
     signature: { ... },
     inferReturnType: (paramTypes, contextType) => ...,
     category: 'collection',
     description: 'Description'
   });
   ```

2. **Implement in compiler**: Add case in `compileFunction()` in `src/compiler.ts`
3. **Add tests**: Create test cases

### Fixing Type Issues

1. **Check error location**: Line number in error message
2. **Common fixes**:
   - Add optional chaining: `value?.property`
   - Add null checks: `if (value !== undefined)`
   - Use type assertions carefully: `value as Type`
   - Export types separately: `export type { ... }`

## Key Concepts

### FHIRPath Collections
- Everything returns a collection (array)
- Empty collection `[]` is different from `[null]`
- Single values are wrapped: `42` → `[42]`

### Three-valued Logic
- Boolean operations can return: `true`, `false`, or empty `[]`
- Empty propagates through logical operations
- Used in: `and`, `or`, `xor`, `implies`, `not()`

### Type System
- **Cardinality**: `0..1`, `1..1`, `0..*`, `1..*`
- **Primitive Types**: string, integer, decimal, boolean, date, datetime, time, quantity
- **Complex Types**: Resource, Collection, BackboneElement

### Operator Precedence (low to high)
1. `implies`
2. `or`, `xor`
3. `and`
4. `=`, `!=`, `~`, `!~`, `in`, `contains`
5. `<`, `>`, `<=`, `>=`, `is`
6. `|` (union)
7. `+`, `-`, `&`
8. `*`, `/`, `div`, `mod`
9. unary `-`, `not`
10. `.`, `[]`, `()`

## Testing Patterns

### Check FHIRPath Spec Compliance
```bash
# When tests conflict with spec, spec wins!
# Check spec at: refs/FHIRPath/spec/2019May/index.adoc
```

### Debug Test Failures
1. Create debug script in `tmp/`
2. Use `console.log()` to inspect values
3. Run with: `bun run tmp/debug-script.ts`

### Common Test Utilities
```typescript
import { fhirpath } from "../src/index";
import { parse } from "../src/index";

// Test expression evaluation
const result = fhirpath(data, expression, environment);

// Test parsing
const ast = parse(expression);
```

## Performance Considerations

- Parser uses expression caching (LRU)
- Tokenizer uses character dispatch tables
- Compiler can optimize based on types
- Use `compileWithTypes` for better optimization

## Error Handling

### Parse Errors
- Include position, line, column
- User-friendly messages
- Example: "Expected ] at position 15"

### Compilation Errors
- Type mismatches
- Unknown functions/properties
- Cardinality violations

### Runtime Errors
- Division by zero → empty
- Invalid operations → throw
- Type coercion failures → empty

## Git Workflow

```bash
# Check status
git status

# Stage changes
git add src/compiler.ts test/new-test.ts

# Commit with message
git commit -m "Implement feature X

- Add implementation
- Update tests
- Fix edge cases

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Run tests before pushing
bun test
bun run typecheck
```

## Debugging Tips

1. **Use AST printer**: `printAST(parse(expression))`
2. **Check token stream**: Add logging in tokenizer
3. **Trace evaluation**: Add console.log in eval functions
4. **Type inference**: Check inferred types in typed compiler
5. **Use debugger**: `debugger;` statements work with Bun

## Remember

- **Always follow FHIRPath spec** - When in doubt, check the spec
- **Test first** - Write/run tests before implementing
- **Update docs** - Keep documentation current
- **Type safety** - Fix TypeScript errors immediately
- **Clean commits** - One feature per commit