# FHIRPath Glossary

This glossary defines key terms and concepts used in FHIRPath and this implementation.

## A

**AST (Abstract Syntax Tree)**
: A tree representation of the syntactic structure of a FHIRPath expression. Each node represents a construct in the expression.

**Arithmetic Operators**
: Mathematical operators: `+`, `-`, `*`, `/`, `div`, `mod`

## B

**BackboneElement**
: A complex type that represents a nested structure within a FHIR resource, like `Patient.contact`.

**Binary Operator**
: An operator that takes two operands, such as `+`, `=`, `and`.

## C

**Cardinality**
: The number of values allowed for a property:
- `0..0` - No values allowed (empty)
- `0..1` - Optional single value
- `1..1` - Required single value
- `0..*` - Optional collection
- `1..*` - Required collection

**Collection**
: In FHIRPath, all values are collections (arrays). A single value is a collection of one item.

**Comparison Operators**
: Operators that compare values: `<`, `>`, `<=`, `>=`, `=`, `!=`

**Compiler**
: Component that transforms parsed AST into executable code.

## D

**Date Literal**
: A date value in the format `@YYYY-MM-DD`, e.g., `@2023-01-01`

**DateTime Literal**
: A date and time value in the format `@YYYY-MM-DDThh:mm:ss`, e.g., `@2023-01-01T10:30:00`

## E

**Empty Collection**
: A collection with no items, represented as `[]` or `{}` in expressions.

**Environment Variable**
: Variables prefixed with `%`, like `%resource` or `%context`.

**Equivalence**
: Loose equality that ignores certain differences. Uses `~` operator.

**Expression**
: A FHIRPath statement that can be evaluated to produce a result.

## F

**FHIR (Fast Healthcare Interoperability Resources)**
: A standard for exchanging healthcare information electronically.

**FHIRPath**
: A path-based navigation and extraction language designed for use with FHIR.

**Function**
: A named operation that can be called with parentheses, e.g., `where()`, `exists()`.

## I

**Identifier**
: A name that refers to a property or type, e.g., `Patient`, `name`.

**Indexer**
: Square bracket notation for accessing collection items by position, e.g., `[0]`.

**Infix Operator**
: An operator that appears between its operands, like `+` in `a + b`.

## L

**Literal**
: A direct value in an expression: string (`'text'`), number (`42`), boolean (`true`).

**Logical Operators**
: Boolean operators: `and`, `or`, `xor`, `implies`, `not()`

## M

**ModelProvider**
: Interface that provides FHIR schema information to the compiler for type checking.

**Membership Operator**
: The `in` operator that tests if a value is in a collection.

## N

**Navigation**
: Moving through the structure of FHIR resources using dot notation, e.g., `Patient.name.given`.

## O

**Operator Precedence**
: The order in which operators are evaluated. Higher precedence operators are evaluated first.

## P

**Parser**
: Component that converts FHIRPath expression strings into AST.

**Path Expression**
: An expression that navigates through data structures, e.g., `Patient.name[0].given`.

**Primitive Type**
: Basic data types: string, integer, decimal, boolean, date, dateTime, time, quantity.

**Pratt Parsing**
: A parsing technique used for handling operator precedence efficiently.

## Q

**Quantity**
: A numeric value with a unit, e.g., `80 'kg'`, `37.5 'Cel'`.

## R

**Resource**
: A FHIR data structure representing healthcare information, e.g., Patient, Observation.

**Resource Type**
: The type of a FHIR resource, indicated by the `resourceType` field.

## S

**Semantic Validation**
: Checking that an expression is meaningful and follows FHIRPath rules beyond syntax.

**Singleton**
: A collection with exactly one item.

**String Literal**
: Text enclosed in single or double quotes, e.g., `'hello'` or `"world"`.

## T

**Three-valued Logic**
: Logic system where expressions can be true, false, or empty (unknown).

**Time Literal**
: A time value in the format `@Thh:mm:ss`, e.g., `@T14:30:00`

**Token**
: A basic unit of syntax identified by the tokenizer, like a keyword, operator, or literal.

**Type Inference**
: The process of determining the type of an expression automatically.

**Type System**
: The set of types and rules for type compatibility in FHIRPath.

## U

**Unary Operator**
: An operator that takes one operand, such as `-` (negation) or `not`.

**Union Operator**
: The `|` operator that combines two collections, eliminating duplicates.

## V

**Variable**
: A named value reference, prefixed with `$`, like `$this` or `$index`.

## W

**Where Clause**
: A function that filters a collection based on a condition, e.g., `where(use = 'official')`.

## Symbols

**`.` (Dot)**
: Property navigation operator

**`[]` (Square Brackets)**
: Indexer for accessing collection items

**`()` (Parentheses)**
: Function call or grouping operator

**`|` (Pipe)**
: Union operator for combining collections

**`$` (Dollar)**
: Variable prefix, e.g., `$this`

**`%` (Percent)**
: Environment variable prefix, e.g., `%resource`

**`@` (At)**
: Date/time literal prefix, e.g., `@2023-01-01`