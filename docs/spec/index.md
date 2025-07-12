# FHIRPath Specification Reference

This is a concise reference extracted from the official FHIRPath v1.3.0 specification.

> **Note**: This is a condensed version. For the complete specification, see [refs/FHIRPath/spec/2019May/index.adoc](../../refs/FHIRPath/spec/2019May/index.adoc)

## 📚 Chapters

### Core Language
1. **[Introduction](01-introduction.md)** - Background, requirements, and conventions
2. **[Core Concepts](02-core-concepts.md)** - Navigation model and path selection
3. **[Expressions](03-expressions.md)** - Literals, operators, and null handling
4. **[Functions](04-functions.md)** - Built-in function reference
5. **[Operations](05-operations.md)** - Operators and precedence

### Advanced Topics
6. **[Advanced Features](06-advanced-features.md)** - Aggregates, type system, and reflection
7. **[Grammar Reference](07-grammar.md)** - Lexical elements and formal syntax
8. **[Appendices](08-appendices.md)** - HL7 V2 usage and implementation notes

## 🎯 Quick Links

| Topic | Chapter | Section |
|-------|---------|---------|
| Path navigation | [Core Concepts](02-core-concepts.md) | Navigation model |
| Collections | [Core Concepts](02-core-concepts.md) | Collections |
| Literals | [Expressions](03-expressions.md) | All literal types |
| Where clause | [Functions](04-functions.md) | Filtering |
| Operators | [Operations](05-operations.md) | All operators |
| Type system | [Advanced Features](06-advanced-features.md) | Types |
| Environment variables | [Advanced Features](06-advanced-features.md) | Environment |
| Formal grammar | [Grammar Reference](07-grammar.md) | Syntax |

## 📝 Key Points

- **Version**: FHIRPath 1.3.0
- **License**: Public Domain (Creative Commons 0)
- **STU Sections**: Aggregates, Type Reflection, Math Functions
- **Collection-centric**: All operations return collections
- **Three-valued logic**: true, false, empty (unknown)
- **Model-independent**: Works with any hierarchical data

## 🔗 Related Documentation

- [Architecture Overview](../architecture.md)
- [API Reference](../API-REFERENCE.md)
- [Feature Support Matrix](../overview/fhirpath-support.md)
- [Parser Implementation](../components/parser.md)
- [Compiler Implementation](../components/compiler.md)