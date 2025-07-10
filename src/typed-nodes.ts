/**
 * Typed AST Nodes
 * 
 * Extends the existing AST nodes with type information for semantic analysis
 * and validation. Maintains backward compatibility while adding type inference.
 */

import { 
  ASTNode, 
  LiteralNode, 
  IdentifierNode, 
  BinaryOpNode, 
  UnaryOpNode, 
  FunctionCallNode, 
  IndexerNode, 
  DotNode, 
  AsTypeNode, 
  IsTypeNode, 
  VariableNode, 
  EnvironmentVariableNode, 
  NullLiteralNode,
  TokenType
} from './types';

import { FHIRPathType } from './type-system';

// Base typed node interface
export interface TypedNode {
  readonly inferredType?: FHIRPathType;
  readonly typeChecked?: boolean;
  readonly typeErrors?: string[];
}

// Typed AST node union type
export type TypedASTNode = 
  | TypedLiteralNode
  | TypedIdentifierNode
  | TypedBinaryOpNode
  | TypedUnaryOpNode
  | TypedFunctionCallNode
  | TypedIndexerNode
  | TypedDotNode
  | TypedAsTypeNode
  | TypedIsTypeNode
  | TypedVariableNode
  | TypedEnvironmentVariableNode
  | TypedNullLiteralNode;

// Typed literal node
export interface TypedLiteralNode extends LiteralNode, TypedNode {
  kind: 'literal';
}

// Typed identifier node
export interface TypedIdentifierNode extends IdentifierNode, TypedNode {
  kind: 'identifier';
  // Context-dependent type resolution
  readonly contextType?: FHIRPathType;
}

// Typed binary operation node
export interface TypedBinaryOpNode extends Omit<BinaryOpNode, 'left' | 'right'>, TypedNode {
  kind: 'binary';
  left: TypedASTNode;
  right: TypedASTNode;
  readonly operatorType?: 'arithmetic' | 'comparison' | 'logical' | 'collection';
}

// Typed unary operation node
export interface TypedUnaryOpNode extends Omit<UnaryOpNode, 'operand'>, TypedNode {
  kind: 'unary';
  operand: TypedASTNode;
}

// Typed function call node
export interface TypedFunctionCallNode extends Omit<FunctionCallNode, 'args'>, TypedNode {
  kind: 'function';
  args: TypedASTNode[];
  readonly functionSignature?: FunctionSignature;
}

// Typed indexer node
export interface TypedIndexerNode extends Omit<IndexerNode, 'expr' | 'index'>, TypedNode {
  kind: 'indexer';
  expr: TypedASTNode;
  index: TypedASTNode;
}

// Typed dot node
export interface TypedDotNode extends Omit<DotNode, 'left' | 'right'>, TypedNode {
  kind: 'dot';
  left: TypedASTNode;
  right: TypedASTNode;
}

// Typed as type node
export interface TypedAsTypeNode extends Omit<AsTypeNode, 'expression'>, TypedNode {
  kind: 'as';
  expression: TypedASTNode;
  readonly targetFHIRType?: FHIRPathType;
}

// Typed is type node
export interface TypedIsTypeNode extends Omit<IsTypeNode, 'expression'>, TypedNode {
  kind: 'is';
  expression: TypedASTNode;
  readonly targetFHIRType?: FHIRPathType;
}

// Typed variable node
export interface TypedVariableNode extends VariableNode, TypedNode {
  kind: 'variable';
  readonly scopeType?: FHIRPathType;
}

// Typed environment variable node
export interface TypedEnvironmentVariableNode extends EnvironmentVariableNode, TypedNode {
  kind: 'envVariable';
}

// Typed null literal node
export interface TypedNullLiteralNode extends NullLiteralNode, TypedNode {
  kind: 'null';
}

// Function signature for type inference
export interface FunctionSignature {
  readonly name: string;
  readonly parameters: FunctionParameter[];
  readonly returnType: FHIRPathType | ((paramTypes: FHIRPathType[]) => FHIRPathType);
  readonly minArity: number;
  readonly maxArity: number;
  readonly isVariadic: boolean;
}

// Function parameter definition
export interface FunctionParameter {
  readonly name: string;
  readonly type: FHIRPathType;
  readonly optional: boolean;
  readonly description?: string;
}

/**
 * Type annotation utilities
 */
export class TypedNodeUtils {
  /**
   * Add type information to an AST node
   */
  static annotateNode<T extends ASTNode>(node: T, type: FHIRPathType, typeChecked: boolean = true): T & TypedNode {
    return {
      ...node,
      inferredType: type,
      typeChecked,
      typeErrors: []
    };
  }
  
  /**
   * Add type error to a node
   */
  static addTypeError<T extends TypedNode>(node: T, error: string): T {
    return {
      ...node,
      typeErrors: [...(node.typeErrors || []), error]
    };
  }
  
  /**
   * Check if a node has type errors
   */
  static hasTypeErrors(node: TypedNode): boolean {
    return (node.typeErrors?.length || 0) > 0;
  }
  
  /**
   * Get all type errors from a node and its children
   */
  static getAllTypeErrors(node: TypedASTNode): string[] {
    const errors: string[] = [...(node.typeErrors || [])];
    
    // Recursively collect errors from children
    switch (node.kind) {
      case 'binary':
        errors.push(...this.getAllTypeErrors(node.left));
        errors.push(...this.getAllTypeErrors(node.right));
        break;
      
      case 'unary':
        errors.push(...this.getAllTypeErrors(node.operand));
        break;
      
      case 'function':
        node.args.forEach(arg => errors.push(...this.getAllTypeErrors(arg)));
        break;
      
      case 'indexer':
        errors.push(...this.getAllTypeErrors(node.expr));
        errors.push(...this.getAllTypeErrors(node.index));
        break;
      
      case 'dot':
        errors.push(...this.getAllTypeErrors(node.left));
        errors.push(...this.getAllTypeErrors(node.right));
        break;
      
      case 'as':
      case 'is':
        errors.push(...this.getAllTypeErrors(node.expression));
        break;
    }
    
    return errors;
  }
  
  /**
   * Convert untyped AST to typed AST (without type inference)
   */
  static convertToTyped(node: ASTNode): TypedASTNode {
    switch (node.kind) {
      case 'literal':
        return { ...node, inferredType: undefined, typeChecked: false };
      
      case 'identifier':
        return { ...node, inferredType: undefined, typeChecked: false };
      
      case 'binary':
        return {
          ...node,
          left: this.convertToTyped(node.left),
          right: this.convertToTyped(node.right),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'unary':
        return {
          ...node,
          operand: this.convertToTyped(node.operand),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'function':
        return {
          ...node,
          args: node.args.map(arg => this.convertToTyped(arg)),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'indexer':
        return {
          ...node,
          expr: this.convertToTyped(node.expr),
          index: this.convertToTyped(node.index),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'dot':
        return {
          ...node,
          left: this.convertToTyped(node.left),
          right: this.convertToTyped(node.right),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'as':
        return {
          ...node,
          expression: this.convertToTyped(node.expression),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'is':
        return {
          ...node,
          expression: this.convertToTyped(node.expression),
          inferredType: undefined,
          typeChecked: false
        };
      
      case 'variable':
        return { ...node, inferredType: undefined, typeChecked: false };
      
      case 'envVariable':
        return { ...node, inferredType: undefined, typeChecked: false };
      
      case 'null':
        return { ...node, inferredType: undefined, typeChecked: false };
      
      default:
        throw new Error(`Unknown node kind: ${(node as any).kind}`);
    }
  }
  
  /**
   * Check if a node is fully type-checked
   */
  static isFullyTyped(node: TypedASTNode): boolean {
    if (!node.typeChecked || !node.inferredType) return false;
    
    // Recursively check children
    switch (node.kind) {
      case 'binary':
        return this.isFullyTyped(node.left) && this.isFullyTyped(node.right);
      
      case 'unary':
        return this.isFullyTyped(node.operand);
      
      case 'function':
        return node.args.every(arg => this.isFullyTyped(arg));
      
      case 'indexer':
        return this.isFullyTyped(node.expr) && this.isFullyTyped(node.index);
      
      case 'dot':
        return this.isFullyTyped(node.left) && this.isFullyTyped(node.right);
      
      case 'as':
      case 'is':
        return this.isFullyTyped(node.expression);
      
      default:
        return true;
    }
  }
}

// Type guards for typed nodes
export function isTypedLiteralNode(node: TypedASTNode): node is TypedLiteralNode {
  return node.kind === 'literal';
}

export function isTypedIdentifierNode(node: TypedASTNode): node is TypedIdentifierNode {
  return node.kind === 'identifier';
}

export function isTypedBinaryOpNode(node: TypedASTNode): node is TypedBinaryOpNode {
  return node.kind === 'binary';
}

export function isTypedUnaryOpNode(node: TypedASTNode): node is TypedUnaryOpNode {
  return node.kind === 'unary';
}

export function isTypedFunctionCallNode(node: TypedASTNode): node is TypedFunctionCallNode {
  return node.kind === 'function';
}

export function isTypedIndexerNode(node: TypedASTNode): node is TypedIndexerNode {
  return node.kind === 'indexer';
}

export function isTypedDotNode(node: TypedASTNode): node is TypedDotNode {
  return node.kind === 'dot';
}

export function isTypedAsTypeNode(node: TypedASTNode): node is TypedAsTypeNode {
  return node.kind === 'as';
}

export function isTypedIsTypeNode(node: TypedASTNode): node is TypedIsTypeNode {
  return node.kind === 'is';
}

export function isTypedVariableNode(node: TypedASTNode): node is TypedVariableNode {
  return node.kind === 'variable';
}

export function isTypedEnvironmentVariableNode(node: TypedASTNode): node is TypedEnvironmentVariableNode {
  return node.kind === 'envVariable';
}

export function isTypedNullLiteralNode(node: TypedASTNode): node is TypedNullLiteralNode {
  return node.kind === 'null';
}