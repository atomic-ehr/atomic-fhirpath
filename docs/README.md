# FHIRPath Parser & Compiler Documentation

Welcome to the FHIRPath implementation documentation. This parser provides a complete, high-performance implementation of the FHIRPath expression language with advanced type inference and semantic validation capabilities.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[Getting Started Guide](GETTING-STARTED.md)** - Quick start with installation and basic usage
- **[API Reference](API-REFERENCE.md)** - Complete API documentation
- **[Architecture Overview](architecture.md)** - System design and project structure

### 📊 Overview
- **[Feature Support](overview/fhirpath-support.md)** - What's implemented (operators, functions, etc.)
- **[Performance Guide](overview/performance.md)** - Performance characteristics and benchmarks
- **[Roadmap](overview/roadmap.md)** - Future plans and upcoming features

### 🔧 Component Documentation
- **[Parser](components/parser.md)** - Expression parsing and AST generation
- **[Compiler](components/compiler.md)** - AST compilation and type checking
- **[Type System](components/type-system.md)** - FHIRPath type hierarchy
- **[Type Inference](components/type-inference.md)** - Context-aware type resolution
- **[Semantic Validator](components/semantic-validator.md)** - Expression validation
- **[Function Registry](components/function-registry.md)** - Built-in function library
- **[Evaluator](components/evaluator.md)** - Runtime expression evaluation

### 📖 Guides
- **[User-Defined Functions](guides/user-defined-functions.md)** - Creating custom functions
- **[Custom Functions Guide](guides/custom-functions-guide.md)** - Implementation examples

### 🔬 Internals
- **[Parser Internals](internals/parser-internals.md)** - Deep dive into parser implementation
- **[Gap Analysis](internals/gap-analysis.md)** - Known limitations and gaps

### 🧠 For AI Assistants
- **[Quick Reference](memory/quick-reference.md)** - Common patterns and file locations
- **[CLAUDE.md](../CLAUDE.md)** - Instructions for AI assistants

### 📖 Specification
- **[FHIRPath Spec Reference](spec/index.md)** - Concise specification chapters
- **[Full Specification](../refs/FHIRPath/spec/2019May/index.adoc)** - Complete official spec

### 🔗 External Resources
- **[FHIR Documentation](https://www.hl7.org/fhir/)** - FHIR standard documentation
- **[GitHub Repository](https://github.com/atomic-ehr/atomic-fhirpath)** - Source code

## 🎯 Quick Links

| I want to... | Go to... |
|-------------|----------|
| Install and use the parser | [Getting Started](GETTING-STARTED.md) |
| Understand the architecture | [Architecture](architecture.md) |
| Check what's supported | [Feature Support](overview/fhirpath-support.md) |
| Read the API docs | [API Reference](API-REFERENCE.md) |
| Understand the type system | [Type System](components/type-system.md) |
| Add custom functions | [User-Defined Functions](guides/user-defined-functions.md) |
| Contribute to the project | [Architecture](architecture.md) + Component docs |
| Debug an issue | [Quick Reference](memory/quick-reference.md) |

## 📝 Key Concepts

### FHIRPath Collections
- All expressions return collections (arrays)
- Empty collection `[]` differs from `[null]`
- Single values are wrapped: `42` → `[42]`

### Type System
- **Primitive Types**: string, integer, decimal, boolean, date, datetime, time, quantity
- **Complex Types**: Resource, Collection, BackboneElement
- **Cardinality**: 0..1, 1..1, 0..*, 1..*

### Three-valued Logic
Boolean operations can return:
- `true` - Definitely true
- `false` - Definitely false
- `[]` (empty) - Unknown/undefined

## 🛠️ Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Build
bun run build
```

## 📄 License

This project is part of the Atomic EHR ecosystem. See LICENSE for details.