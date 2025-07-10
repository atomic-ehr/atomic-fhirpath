# FHIRPath Compiler Documentation

## 1. Top Level Summary

The FHIRPath compiler transforms parsed Abstract Syntax Trees (ASTs) into executable code with comprehensive type inference and semantic validation. It provides a complete compilation pipeline from source code to optimized, type-safe execution units.

**Key Features:**
- **Type Inference System** - Complete FHIRPath type system with cardinality constraints
- **Semantic Validation** - Comprehensive error detection and warning system
- **Pluggable Architecture** - ModelProvider interface for FHIR schema integration
- **Clean Compilation** - Type-aware code generation with performance optimization
- **Developer Experience** - Detailed error reporting with precise location information
- **Flexible Configuration** - Multiple compilation modes (strict, permissive, validation-only)

The compiler serves as the bridge between parsed FHIRPath expressions and efficient runtime execution, enabling advanced features like IDE support, static analysis, and optimization.

## 2. Structure and Responsibilities

### Compilation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Parser    │───▶│   Type      │───▶│  Semantic   │───▶│   Code      │
│    AST      │    │ Inference   │    │ Validation  │    │ Generation  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
   Syntax Tree         Typed AST          Validated AST        Executable
```

### Core Components

#### **Type System** (`src/type-system.ts`)
- **Purpose**: Define FHIRPath type hierarchy and compatibility rules
- **Features**:
  - Complete primitive type system (string, integer, decimal, boolean, date, time, quantity)
  - Complex types (resources, collections, backbone elements)
  - Cardinality constraints (0..0, 0..1, 1..1, 0..*, 1..*)
  - Type compatibility and coercion rules
  - Common supertype calculation

#### **Typed Nodes** (`src/typed-nodes.ts`)
- **Purpose**: Enhanced AST nodes with type information
- **Features**:
  - Backward-compatible extension of base AST
  - Type annotation for all node types
  - Error tracking and aggregation
  - Conversion utilities between typed and untyped ASTs

#### **Function Registry** (`src/function-registry.ts`)
- **Purpose**: Function signature database with type inference
- **Features**:
  - Complete built-in function definitions
  - Parameter validation and return type inference
  - Extensible architecture for custom functions
  - Category-based function organization

#### **Type Inference Engine** (`src/type-inference.ts`)
- **Purpose**: Infer types throughout the expression tree
- **Algorithm**: Visitor pattern with context-aware resolution
- **Features**:
  - Context-sensitive property resolution
  - Variable scope management
  - Function return type calculation
  - Model provider integration

#### **Semantic Validator** (`src/semantic-validator.ts`)
- **Purpose**: Validate expressions for semantic correctness
- **Features**:
  - Type compatibility checking
  - Function parameter validation
  - Operator usage validation
  - Variable scope verification
  - Detailed error categorization (errors, warnings, info)

#### **Typed Compiler** (`src/typed-compiler.ts`)
- **Purpose**: Orchestrate compilation with type checking
- **Features**:
  - Integrated type inference and validation
  - Configurable compilation options
  - Performance-optimized code generation
  - Comprehensive error reporting

#### **Model Provider** (`src/model-provider.ts`)
- **Purpose**: Pluggable interface for FHIR schema information
- **Design**: Interface-only implementation (concrete providers plugged in later)
- **Features**:
  - Resource type resolution
  - Property type information
  - Inheritance hierarchy support
  - Choice type handling (value[x])

### Compilation Flow

```typescript
// Complete compilation pipeline
const source = "Patient.name.where(use = 'official').given[0]";

// 1. Parse to AST
const ast = parse(source);

// 2. Convert to typed AST  
const typedAST = TypedNodeUtils.convertToTyped(ast);

// 3. Perform type inference
const inferrer = new TypeInferenceEngine(context);
const inferredAST = inferrer.inferTypes(typedAST, rootType);

// 4. Validate semantics
const validator = new SemanticValidator(options);
const validation = validator.validate(inferredAST);

// 5. Generate executable code
const compiledNode = compileTypedNode(inferredAST);
```

## 3. Examples and Explanations

### Basic Type Inference

```typescript
import { compileWithTypes } from './src/index';

// Simple literal inference
const result = compileWithTypes("'hello world'");
console.log(result.typedAST.inferredType?.name); // "string"

// Arithmetic with type promotion
const result2 = compileWithTypes("1 + 2.5");
console.log(result2.typedAST.inferredType?.name); // "decimal"

// Function return type inference
const result3 = compileWithTypes("name.exists()");
console.log(result3.typedAST.inferredType?.name); // "boolean"
```

### Context-Aware Type Resolution

```typescript
import { createResourceType, STRING_TYPE, INTEGER_TYPE } from './src/type-system';

// Define a Patient resource type
const patientType = createResourceType("Patient", new Map([
  ["name", createCollectionType(STRING_TYPE)],
  ["birthDate", DATE_TYPE],
  ["active", BOOLEAN_TYPE]
]));

// Compile with context
const result = compileWithTypes("name.first()", {
  rootType: patientType
});

// Type inference knows name is Collection<string>
// So first() returns string
console.log(result.typedAST.inferredType?.name); // "string"
```

### Semantic Validation

```typescript
// Expression with type error
const result = compileWithTypes("'hello' + 42");

console.log(result.hasErrors); // true
console.log(result.errors); 
// ["Arithmetic operation requires numeric types, got string and integer"]

// Expression with warning
const result2 = compileWithTypes("'text' < 123");
console.log(result2.warnings);
// ["Cannot compare string with integer"]
```

### Function Validation

```typescript
// Wrong parameter count
const result = compileWithTypes("substring()");
console.log(result.errors);
// ["Function substring requires at least 1 arguments, got 0"]

// Wrong parameter type
const result2 = compileWithTypes("startsWith(123)");
console.log(result2.errors);
// ["Function startsWith parameter 1 expects string, got integer"]
```

### Custom Model Provider Integration

```typescript
class MyModelProvider implements ModelProvider {
  getResourceType(name: string): ResourceType | null {
    if (name === "Patient") {
      return createResourceType("Patient", new Map([
        ["identifier", createCollectionType(IDENTIFIER_TYPE)],
        ["name", createCollectionType(HUMAN_NAME_TYPE)],
        ["birthDate", DATE_TYPE]
      ]));
    }
    return null;
  }
  
  getPropertyType(resource: string, property: string): FHIRPathType | null {
    // Implement property resolution logic
    return null;
  }
  
  // ... other methods
}

// Use custom model provider
const result = compileWithTypes("Patient.name.family", {
  modelProvider: new MyModelProvider(),
  rootType: patientType
});
```

### Compilation Modes

```typescript
// Strict mode - reject unknown functions and properties
const strict = compileWithTypes("unknownFunction()", {
  strictMode: true,
  allowUnknownFunctions: false
});
console.log(strict.hasErrors); // true

// Permissive mode - allow unknown constructs
const permissive = compileWithTypes("unknownFunction()", {
  strictMode: false,
  allowUnknownFunctions: true
});
console.log(permissive.hasErrors); // false
console.log(permissive.warnings); // ["Unknown function: unknownFunction"]

// Validation-only mode - skip code generation
const validationOnly = compileWithTypes("Patient.name", {
  performValidation: true,
  // Code generation still happens but focus is on validation
});
```

## 4. Technical Details

### Type System Architecture

The type system implements a complete hierarchy for FHIRPath types:

```typescript
// Base type interface
interface FHIRPathType {
  readonly name: string;
  readonly cardinality: Cardinality;
  readonly isCollection: boolean;
  readonly isPrimitive: boolean;
  readonly isResource: boolean;
}

// Cardinality constraints
type Cardinality = '0..0' | '0..1' | '1..1' | '0..*' | '1..*';

// Type compatibility matrix
class TypeCompatibility {
  static isAssignable(source: FHIRPathType, target: FHIRPathType): boolean {
    // Integer can be assigned to decimal (numeric promotion)
    if (source === INTEGER_TYPE && target === DECIMAL_TYPE) return true;
    
    // Collection element type checking
    if (source.isCollection && target.isCollection) {
      return this.isAssignable(source.elementType, target.elementType);
    }
    
    // Same type assignment
    if (source.name === target.name) return true;
    
    return false;
  }
}
```

### Type Inference Algorithm

The type inference engine uses a visitor pattern with contextual information:

```typescript
class TypeInferenceEngine {
  inferTypes(node: TypedASTNode, rootType?: FHIRPathType): TypedASTNode {
    const scope = {
      contextType: rootType || ANY_TYPE,
      variables: new Map(this.context.variables)
    };
    
    return this.visitNode(node, scope);
  }
  
  private visitNode(node: TypedASTNode, scope: TypeInferenceScope): TypedASTNode {
    switch (node.kind) {
      case 'dot':
        // Property access: context.property
        const left = this.visitNode(node.left, scope);
        const newScope = { ...scope, contextType: left.inferredType };
        const right = this.visitNode(node.right, newScope);
        return { ...node, left, right, inferredType: right.inferredType };
        
      case 'function':
        // Function call type inference
        const args = node.args.map(arg => this.visitNode(arg, scope));
        const argTypes = args.map(arg => arg.inferredType);
        const returnType = this.inferFunctionReturnType(node.name, argTypes, scope.contextType);
        return { ...node, args, inferredType: returnType };
        
      // ... other node types
    }
  }
}
```

### Function Type Registry

The function registry provides complete type information for all built-in functions:

```typescript
interface FunctionRegistryEntry {
  signature: FunctionSignature;
  inferReturnType: (paramTypes: FHIRPathType[], contextType?: FHIRPathType) => FHIRPathType;
  category: 'collection' | 'string' | 'math' | 'logical' | 'existence' | 'navigation';
}

// Example: where() function
functionRegistry.register('where', {
  signature: {
    name: 'where',
    parameters: [{ name: 'criteria', type: BOOLEAN_TYPE, optional: false }],
    returnType: (paramTypes) => createCollectionType(ANY_TYPE),
    minArity: 1,
    maxArity: 1
  },
  inferReturnType: (paramTypes, contextType) => {
    // where() returns collection of same element type as input
    return contextType?.isCollection ? contextType : createCollectionType(contextType || ANY_TYPE);
  },
  category: 'collection'
});
```

### Semantic Validation Rules

The validator implements comprehensive checking rules:

```typescript
class SemanticValidator {
  private validateBinaryOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    switch (node.op) {
      case TokenType.PLUS:
      case TokenType.MINUS:
        // Arithmetic requires numeric types
        if (!TypeCompatibility.isArithmeticCompatible(leftType) || 
            !TypeCompatibility.isArithmeticCompatible(rightType)) {
          this.addError(node, 
            `Arithmetic operation requires numeric types, got ${leftType.name} and ${rightType.name}`,
            'error', 'INVALID_ARITHMETIC_OPERANDS');
        }
        break;
        
      case TokenType.AMPERSAND:
        // String concatenation requires string types
        if (!TypeCompatibility.isStringCompatible(leftType) || 
            !TypeCompatibility.isStringCompatible(rightType)) {
          this.addError(node,
            `String concatenation requires string types, got ${leftType.name} and ${rightType.name}`,
            'error', 'INVALID_CONCATENATION_OPERANDS');
        }
        break;
        
      // ... other operators
    }
  }
}
```

### Code Generation

The typed compiler generates optimized executable code:

```typescript
class TypedCompiler {
  private compileFunction(node: TypedFunctionCallNode, base: CompiledNode): CompiledNode {
    const argCompiled = node.args.map(arg => this.compileTypedNode(arg));
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const argResults = argCompiled.map(arg => arg.eval(context, data, ctx));
        
        // Optimized function dispatch based on type information
        return this.evaluateFunctionCall(node.name, context, argResults, ctx);
      }
    };
  }
  
  private evaluateFunctionCall(name: string, context: any[], args: any[][], ctx: EvaluationContext): any[] {
    // Use type information for optimized evaluation
    switch (name) {
      case 'exists':
        return [context.length > 0];
      case 'count':
        return [context.length];
      case 'first':
        return context.length > 0 ? [context[0]] : [];
      // ... other functions
    }
  }
}
```

### Error Reporting System

The compiler provides detailed error information with categorization:

```typescript
interface ValidationError {
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly node: TypedASTNode;
  readonly position?: { start: number; end: number };
}

// Example error codes:
// - INVALID_ARITHMETIC_OPERANDS
// - UNKNOWN_FUNCTION  
// - UNDEFINED_VARIABLE
// - INVALID_TYPE_CAST
// - INCOMPATIBLE_COMPARISON
```

### Performance Optimizations

The compiler includes several performance optimizations:

1. **Type-Guided Optimization**: Use type information to generate more efficient code
2. **Function Specialization**: Optimize common function calls based on parameter types
3. **Early Validation**: Catch errors at compile time rather than runtime
4. **Memory Management**: Reuse objects and minimize allocations
5. **Caching**: Cache compilation results for repeated expressions

### Integration Architecture

The compiler integrates seamlessly with the broader FHIRPath ecosystem:

```typescript
// Complete processing pipeline
const pipeline = {
  // 1. Parse source code
  parse: (source: string) => parse(source),
  
  // 2. Compile with types
  compile: (ast: ASTNode, options?: TypedCompilerOptions) => compileWithTypes(ast, options),
  
  // 3. Validate semantics
  validate: (expression: string, context?: ValidationContext) => validateExpression(expression, context),
  
  // 4. Execute compiled code
  execute: (compiled: CompiledNode, data: any, context: EvaluationContext) => compiled.eval([data], data, context)
};
```

This compiler design provides a robust foundation for advanced FHIRPath tooling including IDEs, static analyzers, and optimization frameworks while maintaining high performance and developer experience.