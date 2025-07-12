# Chapter 1: Introduction

## Overview

FHIRPath is a path based navigation and extraction language, somewhat like XPath. Operations are expressed in terms of the logical content of hierarchical data models, and support traversal, selection and filtering of data. Its design was influenced by the needs for path navigation, selection and formulation of invariants in both HL7 Fast Healthcare Interoperability Resources (FHIR) and HL7 Clinical Quality Language (CQL).

**Version**: 1.3.0 (3rd Normative Ballot)  
**License**: Public Domain (Creative Commons 0)

## Background

In Information Systems in general, and Healthcare Information Systems in particular, the need for formal representation of logic is both pervasive and critical. From low-level technical specifications, through intermediate logical architectures, up to the high-level conceptual descriptions of requirements and behavior, the ability to formally represent knowledge in terms of expressions and information models is essential to the specification and implementation of these systems.

### Requirements

Of particular importance is the ability to easily and precisely express conditions of basic logic, such as those found in:

- Requirements constraints (e.g., "Patients must have a name")
- Decision support (e.g., "if the patient has diabetes and has not had a recent comprehensive foot exam")
- Cohort definitions (e.g., "All male patients aged 60-75")
- Protocol descriptions (e.g., "if the specimen has tested positive for the presence of sodium")

Precisely because the need for such expressions is so pervasive, there is no shortage of existing languages for representing them. However, these languages tend to be tightly coupled to the data structures, and even the information models on which they operate, XPath being a typical example. To ensure that the knowledge captured by the representation of these expressions can survive technological drift, a representation that can be used independent of any underlying physical implementation is required.

Languages meeting these additional requirements also exist, such as OCL, Java, JavaScript, C#, and others. However, these languages are both tightly coupled to the platforms in which they operate, and, because they are general-purpose development languages, come with much heavier tooling and technology dependencies than is warranted or desirable.

Given these constraints, and the lack of a specific language that meets all of these requirements, there is a need for a simple, lightweight, platform- and structure-independent graph traversal language. FHIRPath meets these requirements, and can be used within various environments to provide for simple but effective formal representation of expressions.

## Key Features

1. **Graph-traversal**: Express navigation through hierarchical models (FHIR, HL7 V3, vMR, CIMI, QDM)
2. **Fluent syntax**: Based on the Fluent Interface pattern for readable expressions
3. **Collection-centric**: All values are collections, handling repeating elements naturally
4. **Platform-independent**: Conceptual specification implementable in any language
5. **Model-independent**: Works with abstract data models, not tied to specific formats

## Usage in Healthcare

### FHIR
- Validation invariants
- Search parameter paths
- Formal constraint definitions

### Clinical Quality Language (CQL)
- Simplified graph traversal
- Model-independent expressions

In both FHIR and CQL, the model independence of FHIRPath means that expressions can be written that deal with the contents of the resources and data types as described in the Logical views, or the UML diagrams, rather than against the physical representation of those resources. JSON and XML specific features are not visible to the FHIRPath language (such as comments and the split representation of primitives (i.e. `value[x]`)).

The expressions can in theory be converted to equivalent expressions in XPath, OCL, or another similarly expressive language.

FHIRPath can be used against many other graphs as well. For example, Appendix B describes how FHIRPath is used in HL7 V2.

## Conventions

Throughout this documentation, `monospace font` is used to delineate expressions of FHIRPath.

Optional parameters to functions are enclosed in square brackets in the definition of a function. Note that the brackets are only used to indicate optionality in the signature, they are not part of the actual syntax of FHIRPath.

All operations and functions return a collection, but if the operation or function will always produce a collection containing a single item of a predefined type, the description of the operation or function will specify its output type explicitly, instead of just stating `collection`, e.g. `all(...) : Boolean`

Formatting strings for Date, Time, and DateTime values are described using the following markers:

- `YYYY` - A full four digit year, padded with leading zeroes if necessary
- `MM` - A full two digit month value, padded with leading zeroes if necessary
- `DD` - A full two digit day value, padded with leading zeroes if necessary
- `HH` - A full two digit hour value (00..24), padded with leading zeroes if necessary
- `mm` - A full two digit minute value (00..59), padded with leading zeroes if necessary
- `ss` - A full two digit second value (00..59), padded with leading zeroes if necessary
- `fff` - A fractional millisecond value (0..999)

## Standard for Trial Use (STU) Features

Note: The following sections of this specification have not received significant implementation experience and are marked for Standard for Trial Use (STU):

- Aggregates
- Types - Reflection
- Functions - Math

In addition, the appendices are included as additional documentation and are informative content.

## Next: [Core Concepts →](02-core-concepts.md)