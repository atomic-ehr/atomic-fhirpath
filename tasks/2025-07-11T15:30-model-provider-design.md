# Design Pluggable ModelProvider Architecture [updated - ready for review]

## Overview

Design a **pluggable ModelProvider architecture** that enables FHIRPath expressions to work with multiple FHIR versions (R4, R5, STU3), custom logical models, and dynamically loaded definitions. This task focuses on creating a comprehensive design document before implementation.

### Key Requirements Added
- Support multiple FHIR versions simultaneously
- Pluggable architecture with registry pattern
- Dynamic model loading and updates
- Support for logical models with namespaces
- Maintain backward compatibility

## Background

Currently, the project has only an interface definition for ModelProvider (`src/model-provider.ts`) with no concrete implementation. This is a critical gap that prevents:
- Proper navigation of FHIR resources
- Type-aware property access
- Polymorphic type handling
- Resource validation

## Design Tasks

### 1. Research & Analysis
- [x] Analyze existing ModelProvider interface in detail
- [x] Research FHIR R4 structure definitions format
- [x] Evaluate different approaches for loading FHIR definitions
- [x] Identify all resource types and their relationships
- [x] Document choice type patterns in FHIR

### 2. Design Document Sections
- [x] Architecture overview and key design decisions
- [x] Data structures for resource definitions
- [x] Algorithm for type resolution
- [x] Caching strategy for performance
- [x] Integration approach with existing type system
- [x] Extension handling strategy
- [x] Error handling and edge cases

### 3. Technical Exploration
- [x] Prototype data structure for resource definitions
- [x] Create sample mappings for common resources
- [x] Design efficient lookup mechanisms
- [x] Plan for lazy loading vs eager loading

### 4. Review Preparation
- [x] Create comprehensive design document
- [x] Include diagrams and examples
- [x] List design alternatives with pros/cons
- [x] Prepare questions for review
- [x] Identify potential risks and mitigation strategies

## Completed Work

### Design Documentation
1. **Main Design Document**: `docs/design/model-provider-design.md`
   - Executive summary and current state analysis
   - Architecture overview with component diagram
   - Three design alternatives with pros/cons
   - Recommended approach: Code generation
   - Detailed data structures and implementation strategy
   - Performance considerations and testing strategy

2. **Implementation Notes**: `docs/design/model-provider-implementation-notes.md`
   - Code generation pipeline details
   - Performance optimization strategies
   - Complex scenario handling (extensions, slicing, circular refs)
   - Testing considerations
   - Integration points with existing system
   - Migration strategy

3. **Working Prototype**: `scripts/model-provider-prototype.ts`
   - Demonstrates core data structures
   - Shows type registry implementation
   - Includes example Patient and Observation definitions
   - Demonstrates choice type handling
   - Shows inheritance and property resolution

## Design Deliverables

1. **Design Document** (`docs/design/model-provider-design.md`)
   - Architecture overview
   - Data structure designs
   - Algorithm descriptions
   - Integration strategy
   - Performance considerations

2. **Prototype Code**
   - Sample data structures
   - Proof of concept for key algorithms
   - Performance benchmarks

3. **Review Materials**
   - Presentation slides
   - Decision matrix for design alternatives
   - Risk assessment

## Key Design Updates

### New Architecture Features
1. **ModelProviderRegistry** - Central registry for managing multiple providers
2. **Dynamic vs Static Providers** - Support both runtime updates and build-time optimization
3. **Namespace Support** - For logical models to prevent naming conflicts
4. **Model Context Resolution** - Smart provider selection based on context
5. **Hybrid Approach** - Combine static baseline with dynamic extensions

### Implementation Approaches
1. **Static Providers** - Pre-compiled definitions for maximum performance
2. **Dynamic Providers** - Runtime loading with hot-reload support
3. **Hybrid Providers** - Static core with dynamic overrides

### Key Questions Addressed
1. **Multi-version support** - Registry pattern with model IDs
2. **Dynamic updates** - Version counters and cache invalidation
3. **Logical models** - Namespace-based organization
4. **Performance** - Different strategies for different use cases
5. **Backward compatibility** - Default to FHIR R4 when unspecified

## Success Criteria for Design

1. Clear, implementable architecture
2. Performance analysis showing < 10% impact
3. Handles all FHIR R4 resource types
4. Extensible for future FHIR versions
5. Approved by technical review

## Timeline

- Research & Analysis: 2-3 days
- Design Document Creation: 2-3 days
- Review & Iteration: 1-2 days
- Total: ~1 week

## Next Steps After Design Approval

1. Create implementation task with detailed subtasks
2. Set up development environment
3. Begin incremental implementation
4. Regular progress reviews