# FHIRPath Implementation Documentation

## Overview
- [Project Overview](overview.md) - High-level introduction to the FHIRPath implementation
- [Architecture](architecture.md) - System architecture and design decisions
- [Feature Support](FHIRPATH-SUPPORT.md) - Current implementation status

## Component Documentation
- [Parser](components/parser.md) - Expression parsing and AST generation
- [Type System](components/type-system.md) - FHIRPath type hierarchy
- [Type Inference](components/type-inference.md) - Context-aware type resolution
- [Compiler](components/compiler.md) - AST to executable transformation
- [Semantic Validator](components/semantic-validator.md) - Expression validation
- [Function Registry](components/function-registry.md) - Built-in function library
- [Evaluator](components/evaluator.md) - Runtime expression evaluation

## Deep Dives
- [Parser Implementation](parser.md) - Detailed parser algorithm
- [Compiler Implementation](compiler.md) - Compilation pipeline details
- [User-Defined Functions](user-defined-functions.md) - Extension mechanism
- [Performance Guide](PERFORMANCE.md) - Performance characteristics

## Reference
- [Grammar](fhirpath.g4) - FHIRPath grammar specification

## For Developers
- See [Architecture](architecture.md) for project structure
- Check component docs for specific subsystems
- Review test files for usage examples