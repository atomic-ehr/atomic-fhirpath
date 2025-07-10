/**
 * Type Inference Engine
 * 
 * Core type inference algorithm using visitor pattern for FHIRPath expressions.
 * Provides context-aware type resolution with variable scope management.
 */

import { 
  FHIRPathType, 
  STRING_TYPE, 
  INTEGER_TYPE, 
  DECIMAL_TYPE, 
  BOOLEAN_TYPE, 
  DATE_TYPE, 
  DATETIME_TYPE, 
  TIME_TYPE, 
  QUANTITY_TYPE, 
  EMPTY_TYPE, 
  ANY_TYPE,
  createCollectionType,
  TypeCompatibility,
  CardinalityOps
} from './type-system';

import { 
  TypedASTNode, 
  TypedLiteralNode, 
  TypedIdentifierNode, 
  TypedBinaryOpNode, 
  TypedUnaryOpNode, 
  TypedFunctionCallNode, 
  TypedIndexerNode, 
  TypedDotNode, 
  TypedAsTypeNode, 
  TypedIsTypeNode, 
  TypedVariableNode, 
  TypedEnvironmentVariableNode, 
  TypedNullLiteralNode,
  TypedNodeUtils
} from './typed-nodes';

import { functionRegistry } from './function-registry';
import { ModelProvider, NullModelProvider } from './model-provider';
import { TokenType } from './types';

export interface TypeInferenceContext {
  readonly modelProvider: ModelProvider;
  readonly rootType?: FHIRPathType;
  readonly variables: Map<string, FHIRPathType>;
  readonly environmentVariables: Map<string, FHIRPathType>;
  readonly allowUnknownFunctions: boolean;
  readonly strictMode: boolean;
}

export interface TypeInferenceScope {
  readonly contextType: FHIRPathType;
  readonly parent?: TypeInferenceScope;
  readonly variables: Map<string, FHIRPathType>;
}

export class TypeInferenceEngine {
  private context: TypeInferenceContext;
  
  constructor(context: Partial<TypeInferenceContext> = {}) {
    this.context = {
      modelProvider: context.modelProvider || new NullModelProvider(),
      rootType: context.rootType,
      variables: context.variables || new Map(),
      environmentVariables: context.environmentVariables || new Map([
        ['resource', ANY_TYPE],
        ['context', ANY_TYPE],
        ['ucum', STRING_TYPE]
      ]),
      allowUnknownFunctions: context.allowUnknownFunctions ?? true,
      strictMode: context.strictMode ?? false
    };
  }
  
  /**
   * Infer types for an entire AST
   */
  inferTypes(node: TypedASTNode, rootType?: FHIRPathType): TypedASTNode {
    const scope: TypeInferenceScope = {
      contextType: rootType || this.context.rootType || ANY_TYPE,
      variables: new Map(this.context.variables)
    };
    
    return this.visitNode(node, scope);
  }
  
  /**
   * Visit a node and infer its type
   */
  private visitNode(node: TypedASTNode, scope: TypeInferenceScope): TypedASTNode {
    switch (node.kind) {
      case 'literal':
        return this.visitLiteral(node, scope);
      case 'identifier':
        return this.visitIdentifier(node, scope);
      case 'binary':
        return this.visitBinary(node, scope);
      case 'unary':
        return this.visitUnary(node, scope);
      case 'function':
        return this.visitFunction(node, scope);
      case 'indexer':
        return this.visitIndexer(node, scope);
      case 'dot':
        return this.visitDot(node, scope);
      case 'as':
        return this.visitAs(node, scope);
      case 'is':
        return this.visitIs(node, scope);
      case 'variable':
        return this.visitVariable(node, scope);
      case 'envVariable':
        return this.visitEnvironmentVariable(node, scope);
      case 'null':
        return this.visitNull(node, scope);
      default:
        throw new Error(`Unknown node kind: ${(node as any).kind}`);
    }
  }
  
  private visitLiteral(node: TypedLiteralNode, scope: TypeInferenceScope): TypedLiteralNode {
    let inferredType: FHIRPathType;
    
    switch (node.dataType) {
      case 'string':
        inferredType = STRING_TYPE;
        break;
      case 'number':
        inferredType = typeof node.value === 'number' && Number.isInteger(node.value) 
          ? INTEGER_TYPE 
          : DECIMAL_TYPE;
        break;
      case 'boolean':
        inferredType = BOOLEAN_TYPE;
        break;
      case 'date':
        inferredType = DATE_TYPE;
        break;
      case 'time':
        inferredType = TIME_TYPE;
        break;
      case 'datetime':
        inferredType = DATETIME_TYPE;
        break;
      case 'quantity':
        inferredType = QUANTITY_TYPE;
        break;
      default:
        inferredType = ANY_TYPE;
    }
    
    return TypedNodeUtils.annotateNode(node, inferredType);
  }
  
  private visitIdentifier(node: TypedIdentifierNode, scope: TypeInferenceScope): TypedIdentifierNode {
    // Try to resolve property type from context
    let inferredType: FHIRPathType = ANY_TYPE;
    
    if (scope.contextType.isResource) {
      const resourceType = scope.contextType as any;
      const propertyType = this.context.modelProvider.getPropertyType(
        resourceType.resourceType || resourceType.name,
        node.name
      );
      if (propertyType) {
        inferredType = propertyType;
      }
    } else if (scope.contextType.isPrimitive === false && 'properties' in scope.contextType) {
      const complexType = scope.contextType as any;
      const propertyType = complexType.properties?.get(node.name);
      if (propertyType) {
        inferredType = propertyType;
      }
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, inferredType),
      contextType: scope.contextType
    };
  }
  
  private visitBinary(node: TypedBinaryOpNode, scope: TypeInferenceScope): TypedBinaryOpNode {
    // First infer types of operands
    const left = this.visitNode(node.left, scope);
    const right = this.visitNode(node.right, scope);
    
    let inferredType: FHIRPathType;
    let operatorType: 'arithmetic' | 'comparison' | 'logical' | 'collection';
    
    switch (node.op) {
      case TokenType.PLUS:
      case TokenType.MINUS:
      case TokenType.MULTIPLY:
      case TokenType.DIVIDE:
      case TokenType.MOD:
      case TokenType.DIV:
        operatorType = 'arithmetic';
        inferredType = this.inferArithmeticType(left.inferredType!, right.inferredType!);
        break;
        
      case TokenType.EQUALS:
      case TokenType.NOT_EQUALS:
      case TokenType.LESS_THAN:
      case TokenType.GREATER_THAN:
      case TokenType.LESS_EQUALS:
      case TokenType.GREATER_EQUALS:
      case TokenType.EQUIVALENCE:
      case TokenType.NOT_EQUIVALENCE:
        operatorType = 'comparison';
        inferredType = BOOLEAN_TYPE;
        break;
        
      case TokenType.AND:
      case TokenType.OR:
      case TokenType.XOR:
      case TokenType.IMPLIES:
        operatorType = 'logical';
        inferredType = BOOLEAN_TYPE;
        break;
        
      case TokenType.PIPE:
        operatorType = 'collection';
        inferredType = TypeCompatibility.getCommonSupertype(left.inferredType!, right.inferredType!);
        if (!inferredType.isCollection) {
          inferredType = createCollectionType(inferredType);
        }
        break;
        
      case TokenType.IN:
      case TokenType.CONTAINS:
        operatorType = 'collection';
        inferredType = BOOLEAN_TYPE;
        break;
        
      case TokenType.AMPERSAND:
        operatorType = 'arithmetic';
        inferredType = STRING_TYPE; // String concatenation
        break;
        
      default:
        operatorType = 'comparison';
        inferredType = ANY_TYPE;
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, inferredType),
      left,
      right,
      operatorType
    };
  }
  
  private visitUnary(node: TypedUnaryOpNode, scope: TypeInferenceScope): TypedUnaryOpNode {
    const operand = this.visitNode(node.operand, scope);
    
    let inferredType: FHIRPathType;
    
    switch (node.op) {
      case TokenType.PLUS:
      case TokenType.MINUS:
        inferredType = operand.inferredType!;
        break;
      case TokenType.NOT:
        inferredType = BOOLEAN_TYPE;
        break;
      default:
        inferredType = operand.inferredType!;
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, inferredType),
      operand
    };
  }
  
  private visitFunction(node: TypedFunctionCallNode, scope: TypeInferenceScope): TypedFunctionCallNode {
    // Infer types of arguments first
    const args = node.args.map(arg => this.visitNode(arg, scope));
    const argTypes = args.map(arg => arg.inferredType!);
    
    // Get function signature
    const functionEntry = functionRegistry.get(node.name);
    let inferredType: FHIRPathType;
    let functionSignature;
    
    if (functionEntry) {
      functionSignature = functionEntry.signature;
      inferredType = functionEntry.inferReturnType(argTypes, scope.contextType);
    } else {
      if (this.context.strictMode) {
        inferredType = EMPTY_TYPE;
      } else {
        inferredType = ANY_TYPE;
      }
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, inferredType),
      args,
      functionSignature
    };
  }
  
  private visitIndexer(node: TypedIndexerNode, scope: TypeInferenceScope): TypedIndexerNode {
    const expr = this.visitNode(node.expr, scope);
    const index = this.visitNode(node.index, scope);
    
    // Indexing a collection returns element type
    let inferredType: FHIRPathType;
    
    if (expr.inferredType?.isCollection) {
      const collectionType = expr.inferredType as any;
      inferredType = collectionType.elementType || ANY_TYPE;
    } else {
      inferredType = expr.inferredType || ANY_TYPE;
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, inferredType),
      expr,
      index
    };
  }
  
  private visitDot(node: TypedDotNode, scope: TypeInferenceScope): TypedDotNode {
    const left = this.visitNode(node.left, scope);
    
    // Create new scope with left type as context
    const newScope: TypeInferenceScope = {
      contextType: left.inferredType || ANY_TYPE,
      parent: scope,
      variables: scope.variables
    };
    
    const right = this.visitNode(node.right, newScope);
    
    return {
      ...TypedNodeUtils.annotateNode(node, right.inferredType!),
      left,
      right
    };
  }
  
  private visitAs(node: TypedAsTypeNode, scope: TypeInferenceScope): TypedAsTypeNode {
    const expression = this.visitNode(node.expression, scope);
    
    // Resolve target type from string
    const targetType = this.resolveTypeFromString(node.targetType);
    
    return {
      ...TypedNodeUtils.annotateNode(node, targetType),
      expression,
      targetFHIRType: targetType
    };
  }
  
  private visitIs(node: TypedIsTypeNode, scope: TypeInferenceScope): TypedIsTypeNode {
    const expression = this.visitNode(node.expression, scope);
    
    // 'is' always returns boolean
    const targetType = this.resolveTypeFromString(node.targetType);
    
    return {
      ...TypedNodeUtils.annotateNode(node, BOOLEAN_TYPE),
      expression,
      targetFHIRType: targetType
    };
  }
  
  private visitVariable(node: TypedVariableNode, scope: TypeInferenceScope): TypedVariableNode {
    // Look up variable type in scope hierarchy
    let variableType = this.lookupVariable(node.name, scope);
    
    if (!variableType) {
      variableType = this.context.variables.get(node.name) || ANY_TYPE;
    }
    
    return {
      ...TypedNodeUtils.annotateNode(node, variableType),
      scopeType: variableType
    };
  }
  
  private visitEnvironmentVariable(node: TypedEnvironmentVariableNode, scope: TypeInferenceScope): TypedEnvironmentVariableNode {
    const variableType = this.context.environmentVariables.get(node.name) || ANY_TYPE;
    
    return TypedNodeUtils.annotateNode(node, variableType);
  }
  
  private visitNull(node: TypedNullLiteralNode, scope: TypeInferenceScope): TypedNullLiteralNode {
    return TypedNodeUtils.annotateNode(node, EMPTY_TYPE);
  }
  
  /**
   * Helper methods
   */
  
  private inferArithmeticType(leftType: FHIRPathType, rightType: FHIRPathType): FHIRPathType {
    // Numeric promotion rules
    if (leftType === DECIMAL_TYPE || rightType === DECIMAL_TYPE) {
      return DECIMAL_TYPE;
    }
    if (leftType === INTEGER_TYPE && rightType === INTEGER_TYPE) {
      return INTEGER_TYPE;
    }
    if (leftType === QUANTITY_TYPE || rightType === QUANTITY_TYPE) {
      return QUANTITY_TYPE;
    }
    return DECIMAL_TYPE; // Default for arithmetic
  }
  
  private resolveTypeFromString(typeName: string): FHIRPathType {
    // Map common type names to FHIRPath types
    switch (typeName.toLowerCase()) {
      case 'string': return STRING_TYPE;
      case 'integer': return INTEGER_TYPE;
      case 'decimal': return DECIMAL_TYPE;
      case 'boolean': return BOOLEAN_TYPE;
      case 'date': return DATE_TYPE;
      case 'datetime': return DATETIME_TYPE;
      case 'time': return TIME_TYPE;
      case 'quantity': return QUANTITY_TYPE;
      default:
        // Try to resolve as resource type
        const resourceType = this.context.modelProvider.getResourceType(typeName);
        return resourceType || ANY_TYPE;
    }
  }
  
  private lookupVariable(name: string, scope: TypeInferenceScope): FHIRPathType | undefined {
    // Look in current scope
    const type = scope.variables.get(name);
    if (type) return type;
    
    // Look in parent scopes
    if (scope.parent) {
      return this.lookupVariable(name, scope.parent);
    }
    
    return undefined;
  }
}