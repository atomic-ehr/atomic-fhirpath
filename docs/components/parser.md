# Parser Component

## Overview
The parser component implements a high-performance two-stage parsing approach for FHIRPath expressions.

## Files
- `src/parser.ts` - Main parser implementation
- `src/tokenizer.ts` - Lexical analysis
- `src/types.ts` - AST node definitions

## Architecture

### Tokenizer
- Character-based dispatch table for optimal performance
- Support for all FHIRPath tokens including operators, literals, and keywords
- Position tracking for error reporting

### Parser
- Hybrid recursive descent + Pratt parsing
- Operator precedence handling
- Expression caching with LRU cache
- Detailed error messages with location info

## Key Features
- Complete FHIRPath syntax support
- O(n) parsing performance
- Expression caching for repeated parses
- Comprehensive error reporting

## API
```typescript
parse(expression: string): ASTNode
```

## Testing
- `test/parser/` - Parser-specific tests
- Grammar completeness validation
- Performance benchmarks
- Edge case coverage