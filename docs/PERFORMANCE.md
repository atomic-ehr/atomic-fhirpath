# FHIRPath Parser Performance

## Current Performance (v1.0.0-basic)

### Key Metrics
- **Simple identifier parsing**: 0.24μs (no cache) / 0.07μs (cached)
- **Complex path expression**: 1.36μs
- **Large expression (100 terms)**: 14.18μs
- **Memory allocation stress test**: 2.74μs per 5 expressions

### Baseline Performance Table

| Test Case | Average | Median | P95 | Description |
|-----------|---------|--------|-----|-------------|
| tokenizer-simple-identifier | 0.17μs | 0.12μs | 0.38μs | Tokenizing a single identifier |
| tokenizer-complex-expression | 1.16μs | 0.88μs | 2.17μs | Tokenizing complex FHIRPath expression |
| parser-simple-nocache | 0.24μs | 0.21μs | 0.37μs | Parsing single identifier without cache |
| parser-simple-cached | 0.07μs | 0.04μs | 0.12μs | Parsing single identifier with cache |
| parser-arithmetic | 1.09μs | 0.62μs | 2.04μs | Parsing arithmetic expression |
| parser-complex-path | 1.36μs | 1.17μs | 1.87μs | Parsing complex path with operators |
| parser-deeply-nested | 2.97μs | 2.38μs | 4.88μs | Parsing 10-level nested expression |
| parser-large-expression | 14.18μs | 12.88μs | 15.58μs | Parsing 100-term addition |
| parser-memory-stress | 2.74μs | 2.54μs | 3.46μs | Parsing 5 different expressions |

## Optimizations Applied

### v1.0.0-basic (Baseline)
- Zero regex usage - all tokenization uses direct character comparisons
- Single token object reuse in tokenizer
- String slicing instead of substring copying
- Direct character code checks for performance
- Operator precedence climbing instead of pure recursive descent
- Simple LRU cache for parsed expressions
- No try-catch in parser hot paths

## Running Performance Tests

```bash
# Run all performance tests
bun test test/performance.test.ts

# View latest results
bun scripts/view-perf.ts latest

# View history for specific test
bun scripts/view-perf.ts history parser-simple-nocache

# Compare versions
bun scripts/view-perf.ts compare v1.0.0-basic v1.0.1-optimized
```

## Performance Goals

### Short-term (v1.1)
- [ ] Sub-0.5μs simple expression parsing (no cache)
- [ ] Sub-1μs complex path expression parsing
- [ ] Sub-10μs for 100-term expressions

### Long-term
- [ ] SIMD tokenization for bulk operations
- [ ] WebAssembly module for critical paths
- [ ] Zero-allocation parsing for common patterns
- [ ] Compile-time expression optimization

## Optimization Ideas for Next Version

1. **Character lookup tables** - Replace isDigit/isIdentifier with Uint8Array lookups
2. **String interning** - Pool common identifiers and keywords
3. **Preallocated AST node pool** - Reuse AST nodes from a pool
4. **Inline caching** - Cache parser state for common patterns
5. **Perfect hashing** - For keyword and operator lookups
6. **Streaming tokenizer** - Process while reading for large expressions
7. **SIMD string scanning** - For modern browsers/Node.js
8. **Compact AST representation** - Use typed arrays for AST storage