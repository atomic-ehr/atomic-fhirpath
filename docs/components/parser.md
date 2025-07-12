# Parser Component

## Overview

The FHIRPath parser is a high-performance, two-stage language processor that converts FHIRPath expressions into Abstract Syntax Trees (ASTs). It provides complete support for the FHIRPath specification with optimized algorithms for speed and accuracy.

**Key Features:**
- **Complete FHIRPath Support** - All operators, functions, literals, and language constructs
- **High Performance** - Optimized tokenization and parsing with O(n) time complexity
- **Detailed Error Reporting** - Precise error positions with helpful context messages
- **Type Safety** - Full TypeScript support with discriminated union AST nodes
- **Expression Caching** - Built-in LRU cache for frequently parsed expressions
- **Position Tracking** - Line/column information for IDE integration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tokenizer     │───▶│     Parser      │───▶│   AST Nodes     │
│  (Lexical)      │    │   (Syntax)      │    │  (Structure)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  Token Stream              Parse Tree              Typed AST
```

### Component Files
- **[`src/parser.ts`](../../src/parser.ts)** - Main parser implementation with Pratt parsing
- **[`src/tokenizer.ts`](../../src/tokenizer.ts)** - Lexical analysis with character dispatch tables
- **[`src/types.ts`](../../src/types.ts)** - AST node type definitions
- **[`src/index.ts`](../../src/index.ts)** - Public API and expression cache

## API Reference

### Main Functions

```typescript
// Parse a FHIRPath expression into an AST
parse(expression: string, useCache: boolean = true): ASTNode

// Create a parser instance (for advanced usage)
const parser = new Parser();
const ast = parser.parse(expression);
```

**Key entry points:**
- [`parse()` function](../../src/parser.ts#L113) - Main public API
- [`Parser` class](../../src/parser.ts#L150) - Parser implementation
- [`Tokenizer` class](../../src/tokenizer.ts#L157) - Lexical analysis

### AST Node Types

All nodes extend `BaseNode`:
```typescript
interface BaseNode {
  kind: string;    // Node type discriminator
  start: number;   // Start position in source
  end: number;     // End position in source
}
```

**Node Types:**
- `LiteralNode` - Numbers, strings, booleans, dates
- `IdentifierNode` - Property names and identifiers
- `BinaryOpNode` - Binary operations (+, -, =, etc.)
- `UnaryOpNode` - Unary operations (-, not)
- `FunctionCallNode` - Function invocations
- `IndexerNode` - Array/collection indexing
- `DotNode` - Property access
- `AsTypeNode` - Type casting (as)
- `IsTypeNode` - Type checking (is)
- `VariableNode` - Variables ($this, $index)
- `EnvironmentVariableNode` - Environment vars (%resource)

## Usage Examples

### Basic Parsing

```typescript
import { parse } from './src/index';

// Simple property access
const ast1 = parse('Patient.name');
// Result: DotNode { 
//   left: IdentifierNode { name: "Patient" },
//   right: IdentifierNode { name: "name" }
// }

// Complex expression
const ast2 = parse('Patient.name.where(use = "official").given[0]');
// Results in nested AST structure
```

### Error Handling

```typescript
try {
  const ast = parse('Patient.name[');  // Missing ]
} catch (error) {
  console.log(error.message);   // "Expected ] after index expression"
  console.log(error.position);  // Character position
  console.log(error.line);      // Line number
  console.log(error.column);    // Column number
}
```

## Technical Details

### Tokenization Process

The tokenizer uses optimized character dispatch:

1. **Character Classification** - O(1) lookup tables for whitespace, digits, etc.
2. **Keyword Recognition** - Reserved words vs identifiers
3. **Multi-character Operators** - Lookahead for `<=`, `!=`, etc.
4. **Context-sensitive Parsing** - Different rules for strings, dates, quantities

### Parsing Algorithm

**Pratt Parsing** with precedence climbing:

```typescript
Precedence Levels (0-10):
- LOWEST (0)     - Base level
- IMPLIES (1)    - implies
- OR (2)         - or, xor  
- AND (3)        - and
- EQUALITY (4)   - =, !=, ~, !~, in, contains
- COMPARISON (5) - <, >, <=, >=, is
- UNION (6)      - |
- ADDITIVE (7)   - +, -, &
- MULTIPLICATIVE (8) - *, /, div, mod
- UNARY (9)      - unary +, -, not
- POSTFIX (10)   - ., [], ()
```

### Performance Optimizations

1. **Dispatch Tables** - O(1) parser selection instead of switch statements
2. **Token Sets** - Fast validation using Set lookups
3. **String Interning** - Cache common strings to reduce allocations
4. **Expression Cache** - LRU cache avoids re-parsing common expressions

### Memory Management

- **Token Reuse** - Single mutable token object
- **Object Pooling** - Reuse node objects where possible
- **LRU Cache** - Automatic cleanup of old expressions

## Testing

Test files in `test/parser/`:
- **Grammar Tests** - Complete FHIRPath syntax coverage
- **Error Tests** - Invalid syntax handling
- **Performance Tests** - Benchmarks for large expressions
- **Edge Cases** - Unicode, special characters, etc.

## Integration

The parser integrates with:
- **Compiler** - Converts AST to executable code
- **Type System** - Type inference and validation
- **Semantic Validator** - Expression validation
- **Error Formatter** - User-friendly error messages

## See Also
- [Compiler Documentation](compiler.md)
- [Type System Documentation](type-system.md)
- [FHIRPath Specification](../../refs/FHIRPath/spec/2019May/index.adoc)