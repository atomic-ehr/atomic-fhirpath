# API Reference

Complete API documentation for the FHIRPath parser and compiler.

## Core Functions

### fhirpath

Evaluate a FHIRPath expression against data.

```typescript
function fhirpath(
  data: any,
  expression: string,
  environment?: Record<string, any>
): any[]
```

**Parameters:**
- `data` - The input data (typically a FHIR resource)
- `expression` - FHIRPath expression string
- `environment` - Optional environment variables

**Returns:** Array of results (always returns an array per FHIRPath spec)

**Example:**
```typescript
const result = fhirpath(patient, 'name.given[0]');
```

### parse

Parse a FHIRPath expression into an Abstract Syntax Tree.

```typescript
function parse(
  expression: string,
  useCache: boolean = true
): ASTNode
```

**Parameters:**
- `expression` - FHIRPath expression string
- `useCache` - Whether to use expression cache (default: true)

**Returns:** AST root node

**Throws:** ParseError with position information

### compile

Compile a FHIRPath expression into executable code.

```typescript
function compile(expression: string): CompiledExpression

interface CompiledExpression {
  eval(context: any[], data: any, environment: EvaluationContext): any[]
}
```

**Parameters:**
- `expression` - FHIRPath expression string

**Returns:** Compiled expression object

### compileWithTypes

Compile with type checking and validation.

```typescript
function compileWithTypes(
  expression: string,
  options?: TypedCompilerOptions
): CompilationResult

interface TypedCompilerOptions {
  strictMode?: boolean;
  allowUnknownFunctions?: boolean;
  modelProvider?: ModelProvider;
  rootType?: FHIRPathType;
}

interface CompilationResult {
  hasErrors: boolean;
  errors: CompilerError[];
  warnings: CompilerWarning[];
  typedAST?: TypedNode;
  compiledNode?: CompiledNode;
}
```

**Parameters:**
- `expression` - FHIRPath expression string
- `options` - Compilation options

**Returns:** Compilation result with errors/warnings

## Type System

### Type Creation Functions

```typescript
// Create primitive types
const STRING_TYPE: FHIRPathType;
const INTEGER_TYPE: FHIRPathType;
const DECIMAL_TYPE: FHIRPathType;
const BOOLEAN_TYPE: FHIRPathType;
const DATE_TYPE: FHIRPathType;
const DATETIME_TYPE: FHIRPathType;
const TIME_TYPE: FHIRPathType;
const QUANTITY_TYPE: FHIRPathType;

// Create complex types
function createResourceType(
  name: string,
  properties: Map<string, FHIRPathType>
): ResourceType

function createCollectionType(
  elementType: FHIRPathType
): CollectionType

function createBackboneElementType(
  name: string,
  properties: Map<string, FHIRPathType>
): BackboneElementType
```

### Type Interfaces

```typescript
interface FHIRPathType {
  name: string;
  kind: 'primitive' | 'resource' | 'collection' | 'backbone' | 'any' | 'empty';
  cardinality: Cardinality;
  isCollection?: boolean;
}

interface Cardinality {
  min: number;  // 0 or 1
  max: number | '*';  // number or '*' for unbounded
}
```

## AST Node Types

### Base Node Interface

```typescript
interface BaseNode {
  kind: string;
  start: number;
  end: number;
}
```

### Node Types

```typescript
interface LiteralNode extends BaseNode {
  kind: 'literal';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime' | 'quantity';
}

interface IdentifierNode extends BaseNode {
  kind: 'identifier';
  name: string;
}

interface BinaryOpNode extends BaseNode {
  kind: 'binary';
  op: TokenType;
  left: ASTNode;
  right: ASTNode;
}

interface FunctionCallNode extends BaseNode {
  kind: 'function';
  name: string;
  args: ASTNode[];
}

interface DotNode extends BaseNode {
  kind: 'dot';
  left: ASTNode;
  right: ASTNode;
}

interface IndexerNode extends BaseNode {
  kind: 'indexer';
  expr: ASTNode;
  index: ASTNode;
}

// ... and more node types
```

## Error Types

```typescript
class ParseError extends Error {
  position: number;
  line: number;
  column: number;
}

interface CompilerError {
  message: string;
  start: number;
  end: number;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}
```

## Model Provider Interface

```typescript
interface ModelProvider {
  // Get type information for a resource
  getResourceType(name: string): FHIRPathType | null;
  
  // Get property type
  getPropertyType(
    resourceType: string,
    propertyPath: string
  ): FHIRPathType | null;
  
  // Get choice types for properties like value[x]
  getChoiceTypes(
    resourceType: string,
    propertyName: string
  ): string[] | null;
  
  // Check type compatibility
  isResourceTypeCompatible(
    sourceType: string,
    targetType: string
  ): boolean;
}
```

## Function Registry

### Getting Function Information

```typescript
import { functionRegistry } from 'atomic-fhirpath';

// Check if function exists
functionRegistry.has('where'); // true

// Get function entry
const whereFunc = functionRegistry.get('where');

// Get all function names
const allFunctions = functionRegistry.getAllNames();

// Get functions by category
const stringFuncs = functionRegistry.getByCategory('string');
```

### Function Categories

- `collection` - Collection manipulation (where, select, first, etc.)
- `string` - String operations (substring, contains, etc.)
- `math` - Mathematical functions (abs, round, etc.)
- `logical` - Logical operations (not, etc.)
- `existence` - Existence checking (exists, empty)
- `navigation` - Navigation helpers
- `date` - Date/time functions (now, today)
- `type` - Type operations (toString, toInteger)
- `utility` - Utility functions

## Utilities

### AST Printer

```typescript
import { printAST } from 'atomic-fhirpath';

const ast = parse('Patient.name[0]');
console.log(printAST(ast));
// Outputs formatted AST structure
```

### Error Formatter

```typescript
import { formatError } from 'atomic-fhirpath';

try {
  parse('invalid expression[');
} catch (error) {
  console.log(formatError(error, expression));
  // Outputs user-friendly error with context
}
```

## Configuration

### Parser Configuration

```typescript
const parser = new Parser({
  cacheSize: 1000,  // LRU cache size
  strict: false     // Strict parsing mode
});
```

### Compiler Configuration

```typescript
const compiler = new FHIRPathCompiler({
  optimize: true,           // Enable optimizations
  targetVersion: '4.0.1'    // FHIR version
});
```

## Advanced Features

### Custom Functions

```typescript
// Register a custom function
functionRegistry.register('customFunc', {
  signature: {
    name: 'customFunc',
    parameters: [
      { name: 'param1', type: STRING_TYPE, optional: false }
    ],
    returnType: BOOLEAN_TYPE,
    minArity: 1,
    maxArity: 1,
    isVariadic: false
  },
  inferReturnType: (paramTypes, contextType) => BOOLEAN_TYPE,
  category: 'utility',
  description: 'Custom function description'
});
```

### Expression Caching

```typescript
// Clear expression cache
clearExpressionCache();

// Set cache size
setExpressionCacheSize(500);
```

## See Also

- [Getting Started](GETTING-STARTED.md) - Quick start guide
- [FHIRPath Spec Reference](spec/index.md) - Concise specification reference
- [Type System](components/type-system.md) - Type system details
- [Parser](components/parser.md) - Parser internals
- [Compiler](components/compiler.md) - Compiler architecture