# Chapter 2: Core Concepts

## Navigation Model

FHIRPath navigates and selects nodes from a tree that abstracts away and is independent of the actual underlying implementation of the source against which the FHIRPath query is run. This way, FHIRPath can be used on in-memory Java POJOs, Xml data or any other physical representation, so long as that representation can be viewed as classes that have properties. In somewhat more formal terms, FHIRPath operates on a directed acyclic graph of classes as defined by a MOF-equivalent type system.

### Tree Structure

Data are represented as a tree of labelled nodes, where each node may optionally carry a primitive value and have child nodes. Nodes need not have a unique label, and leaf nodes must carry a primitive value.

Key characteristics:
- **Nodes**: Labeled elements in the tree
- **Values**: Primitive data carried by nodes (leaf nodes must carry a value)
- **Hierarchy**: Parent-child relationships
- **Repeating elements**: Multiple nodes with same label
- **Internal node values**: Internal nodes can carry values (e.g., FHIR primitives with extensions)

Example tree structure:
```
Patient
├── active: true              // Internal node with value
├── name[0]
│   ├── use: "official"
│   ├── family: "Smith"
│   └── given[0]: "John"
└── name[1]
    ├── use: "nickname"
    └── given[0]: "Johnny"
```

The diagram shows a tree with a repeating `name` node, which represents repeating members of the object model. Leaf nodes such as `use` and `family` carry a (string) value. The node labelled `active` is an internal node that carries a value, allowing the tree to represent primitives that may still have child extension data.

### Context

FHIRPath expressions are evaluated with respect to a specific instance. This instance is referred to as the _context_ (also called the _root_) and paths within the expression are evaluated in terms of this instance.

## Path Selection

FHIRPath allows navigation through the tree by composing a path of concatenated labels, e.g.

```
name.given
```

This would result in a collection of nodes, for example one with the value 'Wouter' and one with the value 'Gert'. In fact, each step in such a path results in a collection of nodes by selecting nodes with the given label from the step before it. The input collection at the beginning of the evaluation contained all elements from Patient, and the path `name` selected just those named `name`. Since the `name` element repeats, the next step `given` along the path, will contain all nodes labeled `given` from all nodes `name` in the preceding step.

### Type Prefixes

The path may start with the type of the root node (which otherwise does not have a name), but this is optional. To illustrate this point, the path `name.given` above can be evaluated as an expression on a set of data of any type. However the expression may be prefixed with the name of the type of the root:

```
Patient.name.given
```

The two expressions have the same outcome, but when evaluating the second, the evaluation will only produce results when used on data of type `Patient`. When resolving an identifier that is also the root of a FHIRPath expression, it is resolved as a type name first, and if it resolves to a type, it must resolve to the type of the context (or a supertype). Otherwise, it is resolved as a path on the context. If the identifier cannot be resolved, an error is raised.

### Identifiers and Delimited Identifiers

Syntactically, FHIRPath defines identifiers as any sequence of characters consisting only of letters, digits, and underscores, beginning with a letter or underscore. Paths may use backticks to include characters in path parts that would otherwise be interpreted as keywords or operators, e.g.:

```
Message.`PID-1`
```

## Collections

Collections are fundamental to FHIRPath, in that the result of every expression is a collection, even if that expression only results in a single element. This approach allows paths to be specified without having to care about the cardinality of any particular element, and is therefore ideally suited to graph traversal.

Within FHIRPath, a collection is:

- **Ordered** - The order of items in the collection is important and is preserved through operations as much as possible. Operators and functions that do not preserve order will note that in their documentation.
- **Non-Unique** - Duplicate elements are allowed within a collection. Some operations and functions, such as `distinct()` and the union operator `|` produce collections of unique elements, but in general, duplicate elements are allowed.
- **Indexed** - Each item in a collection can be addressed by its index, i.e. ordinal position within the collection.
- Unless specified otherwise by the underlying Object Model, the first item in a collection has index 0. Note that if the underlying model specifies that a collection is 1-based (the only reasonable alternative to 0-based collections), _any collections generated from operations on the 1-based list are 0-based_.
- **Countable** - The number of items in a given collection can always be determined using the `count()` function

### Important Notes
Note that the outcome of functions like `children()` and `descendants()` cannot be assumed to be in any meaningful order, and `first()`, `last()`, `tail()`, `skip()` and `take()` should not be used on collections derived from these paths. Note that some implementations may follow the logical order implied by the data model, and some may not, and some may be different depending on the underlying source. Implementations may decide to return an error if an attempt is made to perform an order-dependent operation on an unordered list.

### Collection Operations
```
first()     // First item
last()      // Last item
tail()      // All except first
skip(n)     // Skip n items
take(n)     // Take first n items
[n]         // Item at index n
```

## Paths and polymorphic items

In the underlying representation of data, nodes may be typed and represent polymorphic items. Paths may either ignore the type of a node, and continue along the path or may be explicit about the expected node and filter the set of nodes by type before navigating down child nodes:

```
Observation.value.unit                    // all kinds of value
Observation.value.ofType(Quantity).unit   // only values that are of type Quantity
```

The `is` operator can be used to determine whether or not a given value is of a given type:

```
Observation.value is Quantity  // returns true if the value is of type Quantity
```

The `as` operator can be used to treat a value as a specific type:

```
Observation.value as Quantity  // returns value as a Quantity if it is of type Quantity, and an empty result otherwise
```

The list of available types that can be passed as a parameter to the `ofType()` function and `is` and `as` operators is determined by the underlying data model. Within FHIRPath, they are just identifiers, either delimited or simple.

## Key Principles

1. **Everything is a collection** - Simplifies cardinality handling
2. **Path-based navigation** - Intuitive traversal syntax
3. **Type-aware but flexible** - Optional type safety
4. **Order matters** - Except where explicitly noted
5. **Model-independent** - Works with any hierarchical data

## Next: [Expressions →](03-expressions.md)