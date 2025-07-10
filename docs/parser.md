# FHIRPath Parser Documentation

## 1. Top Level Summary

The FHIRPath parser is a high-performance, two-stage language processor that converts FHIRPath expressions into Abstract Syntax Trees (ASTs). It provides complete support for the FHIRPath specification with optimized algorithms for speed and accuracy.

**Key Features:**
- **Complete FHIRPath Support** - All operators, functions, literals, and language constructs
- **High Performance** - Optimized tokenization and parsing with O(n) time complexity
- **Detailed Error Reporting** - Precise error positions with helpful context messages
- **Type Safety** - Full TypeScript support with discriminated union AST nodes
- **Expression Caching** - Built-in LRU cache for frequently parsed expressions
- **Position Tracking** - Line/column information for IDE integration

The parser serves as the foundation for the FHIRPath compiler and evaluation engine, enabling type inference, semantic validation, and code generation.

## 2. Structure and Responsibilities

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tokenizer     │───▶│     Parser      │───▶│   AST Nodes     │
│  (Lexical)      │    │   (Syntax)      │    │  (Structure)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  Token Stream              Parse Tree              Typed AST
```

### Component Responsibilities

#### **Tokenizer** (`src/tokenizer.ts`)
- **Purpose**: Converts character stream into tokens
- **Algorithm**: Single-pass scan with lookahead
- **Features**: 
  - Character code optimization for performance
  - Multi-character operator recognition (`<=`, `!=`, `!~`)
  - Context-sensitive literal parsing (strings, numbers, dates, quantities)
  - Keyword vs identifier disambiguation
  - Position tracking for error reporting

#### **Parser** (`src/parser.ts`)
- **Purpose**: Converts token stream into AST
- **Algorithm**: Hybrid recursive descent + Pratt parsing
- **Features**:
  - Operator precedence handling via precedence climbing
  - Dispatch tables for O(1) parsing decisions
  - Left-associativity enforcement
  - Complex expression handling (function calls, indexing, type operators)

#### **AST Types** (`src/types.ts`)
- **Purpose**: Define the Abstract Syntax Tree structure
- **Design**: TypeScript discriminated unions for type safety
- **Nodes**: 11 distinct node types covering all FHIRPath constructs

#### **Expression Cache** (`src/index.ts`)
- **Purpose**: Cache parsed expressions to avoid re-parsing
- **Algorithm**: LRU (Least Recently Used) cache
- **Benefits**: Significant performance improvement for repeated expressions

### Parser Architecture

```typescript
// Two-stage processing pipeline
Input String → Tokenizer → Token Stream → Parser → AST

// Example flow:
"Patient.name[0]" → [ID, DOT, ID, LBRACKET, NUM, RBRACKET] → DotNode(...)
```

## 3. Examples and Explanations

### Basic Parsing Example

```typescript
import { parse } from './src/index';

// Simple property access
const ast1 = parse('Patient.name');
// Result: DotNode { 
//   left: IdentifierNode { name: "Patient" },
//   right: IdentifierNode { name: "name" }
// }

// Complex expression with operators and functions
const ast2 = parse('Patient.name.where(use = "official").given[0]');
// Result: IndexerNode {
//   expr: DotNode {
//     left: FunctionCallNode {
//       name: "where",
//       args: [BinaryOpNode { op: EQUALS, ... }]
//     },
//     right: IdentifierNode { name: "given" }
//   },
//   index: LiteralNode { value: 0 }
// }
```

### Tokenization Process

```typescript
// Input processing step by step
const input = "Patient.name[0] + 'John'";

// Tokenization result:
[
  { type: IDENTIFIER, value: "Patient", start: 0, end: 7 },
  { type: DOT, value: ".", start: 7, end: 8 },
  { type: IDENTIFIER, value: "name", start: 8, end: 12 },
  { type: LBRACKET, value: "[", start: 12, end: 13 },
  { type: NUMBER, value: "0", start: 13, end: 14 },
  { type: RBRACKET, value: "]", start: 14, end: 15 },
  { type: PLUS, value: "+", start: 16, end: 17 },
  { type: STRING, value: "John", start: 18, end: 24 }
]
```

### Operator Precedence

The parser handles operator precedence correctly through Pratt parsing:

```typescript
// Expression: "a + b * c"
// Precedence: + (6), * (7)
// Result: a + (b * c) - multiplication binds tighter

const ast = parse('a + b * c');
// BinaryOpNode {
//   op: PLUS,
//   left: IdentifierNode { name: "a" },
//   right: BinaryOpNode {
//     op: MULTIPLY,
//     left: IdentifierNode { name: "b" },
//     right: IdentifierNode { name: "c" }
//   }
// }
```

### Function Call Parsing

```typescript
// Complex function with nested expressions
const ast = parse('name.where(use = "official" and period.start > @2020-01-01)');

// Results in:
// FunctionCallNode {
//   name: "where",
//   args: [
//     BinaryOpNode {
//       op: AND,
//       left: BinaryOpNode { /* use = "official" */ },
//       right: BinaryOpNode { /* period.start > @2020-01-01 */ }
//     }
//   ]
// }
```

### Error Handling

```typescript
try {
  const ast = parse('Patient.name[');  // Missing closing bracket
} catch (error) {
  console.log(error.message);
  // "Expected ] after index expression at position 13"
  console.log(error.position); // 13
  console.log(error.line);     // 1
  console.log(error.column);   // 14
}
```

## 4. Technical Details

### Tokenization Algorithm

The tokenizer uses a state machine approach with character code optimization:

```typescript
class Tokenizer {
  // Performance optimization: O(1) character classification
  private static readonly WHITESPACE_TABLE = new Uint8Array(256);
  private static readonly HEX_VALUES = new Int8Array(256);
  
  nextToken(): Token {
    // Skip whitespace
    this.skipWhitespace();
    
    // Single character dispatch
    switch (this.currentChar()) {
      case CharCode.LPAREN: return this.makeToken(TokenType.LPAREN);
      case CharCode.DOT: return this.makeDotOrNumber();
      // ... 30+ more cases
    }
    
    // Multi-character analysis
    if (this.isLetter()) return this.readIdentifierOrKeyword();
    if (this.isDigit()) return this.readNumber();
    // ...
  }
}
```

### Parsing Algorithm Details

#### Pratt Parsing Implementation

```typescript
parseExpression(minPrecedence: Precedence = Precedence.LOWEST): ASTNode {
  // Parse prefix expression (literals, identifiers, unary operators)
  let left = this.parsePrefixExpression();
  
  // Handle infix and postfix operators
  while (this.hasMoreTokens()) {
    const currentPrec = this.getCurrentPrecedence();
    
    if (currentPrec >= minPrecedence) {
      // Parse binary operator
      left = this.parseBinaryExpression(left, currentPrec);
    } else if (this.isPostfixOperator()) {
      // Parse postfix operator (., [], ())
      left = this.parsePostfixExpression(left);
    } else {
      break; // End of expression
    }
  }
  
  return left;
}
```

#### Precedence Levels

```typescript
const enum Precedence {
  LOWEST = 0,
  IMPLIES = 1,        // implies
  OR = 2,             // or, xor  
  AND = 3,            // and
  EQUALITY = 4,       // =, !=, ~, !~, in, contains
  COMPARISON = 5,     // <, >, <=, >=, is
  UNION = 6,          // |
  ADDITIVE = 7,       // +, -, &
  MULTIPLICATIVE = 8, // *, /, div, mod
  UNARY = 9,          // unary +, -, not
  POSTFIX = 10,       // ., [], ()
}
```

### Performance Optimizations

#### 1. Dispatch Tables
Replace 40+ case statements with O(1) map lookups:

```typescript
private readonly prefixParsers = new Map<TokenType, () => ASTNode>([
  [TokenType.NUMBER, () => this.parseNumber()],
  [TokenType.STRING, () => this.parseString()],
  [TokenType.IDENTIFIER, () => this.parseIdentifier()],
  // ... all token types
]);

// O(1) lookup instead of switch statement
const parser = this.prefixParsers.get(this.currentToken.type);
```

#### 2. Valid Token Sets
Replace compound boolean conditions with Set lookups:

```typescript
private static readonly VALID_DOT_TOKENS = new Set([
  TokenType.IDENTIFIER, TokenType.WHERE, TokenType.SELECT,
  // ... 40+ valid tokens
]);

// Fast validation
if (Parser.VALID_DOT_TOKENS.has(tokenType)) {
  // Parse property access
}
```

#### 3. String Interning
Cache common token values to reduce memory allocations:

```typescript
private static readonly INTERNED_STRINGS = new Map<string, string>();

private internString(value: string): string {
  const existing = Parser.INTERNED_STRINGS.get(value);
  if (existing) return existing;
  
  Parser.INTERNED_STRINGS.set(value, value);
  return value;
}
```

### AST Node Structure

All AST nodes follow a consistent interface:

```typescript
interface BaseNode {
  kind: string;    // Discriminator for type checking
  start: number;   // Character position in source
  end: number;     // End position for error reporting
}

// Example: Binary operation node
interface BinaryOpNode extends BaseNode {
  kind: 'binary';
  op: TokenType;     // Operator type (PLUS, MINUS, etc.)
  left: ASTNode;     // Left operand
  right: ASTNode;    // Right operand
}
```

### Error Recovery

The parser provides detailed error information:

```typescript
class ParseError extends Error {
  constructor(
    message: string,
    public position: number,  // Character offset
    public line: number,      // Line number
    public column: number     // Column number
  ) {
    super(message);
  }
}

// Enhanced error messages with context
throw new ParseError(
  `Expected ')' after function arguments, got '${token.value}'`,
  token.start,
  token.line, 
  token.column
);
```

### Memory Management

The parser is designed for minimal memory allocation:

- **Token Reuse**: Single mutable token object
- **String Interning**: Common strings cached
- **Object Pooling**: Node builders reuse objects where possible
- **LRU Cache**: Automatic cleanup of old parsed expressions

### Integration Points

The parser integrates with other system components:

```typescript
// Parser → Compiler
const ast = parse(expression);
const compiled = compile(ast);

// Parser → Type System  
const ast = parse(expression);
const typed = inferTypes(ast, context);

// Parser → Evaluator
const ast = parse(expression);
const result = evaluate(ast, data, context);
```

This parser design provides the foundation for a complete FHIRPath processing pipeline with optimal performance and developer experience.