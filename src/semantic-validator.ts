/**
 * Semantic Validator
 * 
 * Validates FHIRPath expressions for semantic correctness including type compatibility,
 * function parameter validation, resource property existence, and cardinality constraints.
 */

import { 
  type FHIRPathType, 
  TypeCompatibility, 
  CardinalityOps 
} from './type-system';

import { 
  type TypedASTNode, 
  type TypedLiteralNode, 
  type TypedIdentifierNode, 
  type TypedBinaryOpNode, 
  type TypedUnaryOpNode, 
  type TypedFunctionCallNode, 
  type TypedIndexerNode, 
  type TypedDotNode, 
  type TypedAsTypeNode, 
  type TypedIsTypeNode, 
  type TypedVariableNode, 
  type TypedEnvironmentVariableNode, 
  type TypedNullLiteralNode,
  TypedNodeUtils
} from './typed-nodes';

import { functionRegistry } from './function-registry';
import { type ModelProvider, NullModelProvider } from './model-provider';
import { type TypeInferenceContext } from './type-inference';
import { TokenType } from './types';

export interface ValidationError {
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly node: TypedASTNode;
  readonly position?: { start: number; end: number };
}

export interface ValidationContext {
  readonly modelProvider: ModelProvider;
  readonly strictMode: boolean;
  readonly allowUnknownFunctions: boolean;
  readonly allowUntypedProperties: boolean;
  readonly maxDepth: number;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationError[];
  readonly info: ValidationError[];
}

export class SemanticValidator {
  private context: ValidationContext;
  private errors: ValidationError[] = [];
  private currentDepth = 0;
  
  constructor(context: Partial<ValidationContext> = {}) {
    this.context = {
      modelProvider: context.modelProvider || new NullModelProvider(),
      strictMode: context.strictMode ?? false,
      allowUnknownFunctions: context.allowUnknownFunctions ?? true,
      allowUntypedProperties: context.allowUntypedProperties ?? true,
      maxDepth: context.maxDepth ?? 100
    };
  }
  
  /**
   * Validate a typed AST
   */
  validate(node: TypedASTNode): ValidationResult {
    this.errors = [];
    this.currentDepth = 0;
    
    this.visitNode(node);
    
    const errors = this.errors.filter(e => e.severity === 'error');
    const warnings = this.errors.filter(e => e.severity === 'warning');
    const info = this.errors.filter(e => e.severity === 'info');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }
  
  /**
   * Visit a node for validation
   */
  private visitNode(node: TypedASTNode): void {
    if (this.currentDepth > this.context.maxDepth) {
      this.addError(node, 'Maximum expression depth exceeded', 'error', 'DEPTH_EXCEEDED');
      return;
    }
    
    this.currentDepth++;
    
    try {
      switch (node.kind) {
        case 'literal':
          this.validateLiteral(node);
          break;
        case 'identifier':
          this.validateIdentifier(node);
          break;
        case 'binary':
          this.validateBinary(node);
          break;
        case 'unary':
          this.validateUnary(node);
          break;
        case 'function':
          this.validateFunction(node);
          break;
        case 'indexer':
          this.validateIndexer(node);
          break;
        case 'dot':
          this.validateDot(node);
          break;
        case 'as':
          this.validateAs(node);
          break;
        case 'is':
          this.validateIs(node);
          break;
        case 'variable':
          this.validateVariable(node);
          break;
        case 'envVariable':
          this.validateEnvironmentVariable(node);
          break;
        case 'null':
          this.validateNull(node);
          break;
        default:
          this.addError(node, `Unknown node kind: ${(node as any).kind}`, 'error', 'UNKNOWN_NODE');
      }
    } finally {
      this.currentDepth--;
    }
  }
  
  private validateLiteral(node: TypedLiteralNode): void {
    // Validate literal values are well-formed
    if (node.dataType === 'quantity' && typeof node.value === 'string') {
      const match = node.value.match(/^(\d+(?:\.\d+)?)\s+(?:'([^']+)'|(\w+))$/);
      if (!match) {
        this.addError(node, 'Invalid quantity format', 'error', 'INVALID_QUANTITY');
      }
    }
    
    if (node.dataType === 'date' || node.dataType === 'datetime' || node.dataType === 'time') {
      // Basic date/time format validation could be added here
      if (typeof node.value !== 'string') {
        this.addError(node, `Invalid ${node.dataType} value`, 'error', 'INVALID_DATE_TIME');
      }
    }
  }
  
  private validateIdentifier(node: TypedIdentifierNode): void {
    // Check if property exists on context type
    if (node.contextType?.isResource && !this.context.allowUntypedProperties) {
      const resourceType = node.contextType as any;
      const resourceName = resourceType.resourceType || resourceType.name;
      
      if (!this.context.modelProvider.isValidProperty(resourceName, node.name)) {
        this.addError(
          node, 
          `Property '${node.name}' does not exist on resource '${resourceName}'`, 
          'error', 
          'UNKNOWN_PROPERTY'
        );
      }
    }
  }
  
  private validateBinary(node: TypedBinaryOpNode): void {
    // Validate operands first
    this.visitNode(node.left);
    this.visitNode(node.right);
    
    const leftType = node.left.inferredType;
    const rightType = node.right.inferredType;
    
    if (!leftType || !rightType) return;
    
    // Validate operator compatibility
    switch (node.op) {
      case TokenType.PLUS:
      case TokenType.MINUS:
      case TokenType.MULTIPLY:
      case TokenType.DIVIDE:
      case TokenType.MOD:
      case TokenType.DIV:
        this.validateArithmeticOperation(node, leftType, rightType);
        break;
        
      case TokenType.EQUALS:
      case TokenType.NOT_EQUALS:
      case TokenType.EQUIVALENCE:
      case TokenType.NOT_EQUIVALENCE:
        this.validateEqualityOperation(node, leftType, rightType);
        break;
        
      case TokenType.LESS_THAN:
      case TokenType.GREATER_THAN:
      case TokenType.LESS_EQUALS:
      case TokenType.GREATER_EQUALS:
        this.validateComparisonOperation(node, leftType, rightType);
        break;
        
      case TokenType.AND:
      case TokenType.OR:
      case TokenType.XOR:
      case TokenType.IMPLIES:
        this.validateLogicalOperation(node, leftType, rightType);
        break;
        
      case TokenType.IN:
      case TokenType.CONTAINS:
        this.validateMembershipOperation(node, leftType, rightType);
        break;
        
      case TokenType.AMPERSAND:
        this.validateStringConcatenation(node, leftType, rightType);
        break;
    }
  }
  
  private validateUnary(node: TypedUnaryOpNode): void {
    this.visitNode(node.operand);
    
    const operandType = node.operand.inferredType;
    if (!operandType) return;
    
    switch (node.op) {
      case TokenType.PLUS:
      case TokenType.MINUS:
        if (!TypeCompatibility.isArithmeticCompatible(operandType)) {
          this.addError(
            node, 
            `Unary ${node.op === TokenType.PLUS ? '+' : '-'} operator requires numeric type, got ${operandType.name}`, 
            'error', 
            'INVALID_UNARY_OPERAND'
          );
        }
        break;
        
      case TokenType.NOT:
        if (!TypeCompatibility.isBooleanCompatible(operandType)) {
          this.addError(
            node, 
            `Logical NOT operator requires boolean-compatible type, got ${operandType.name}`, 
            'warning', 
            'BOOLEAN_CONVERSION'
          );
        }
        break;
    }
  }
  
  private validateFunction(node: TypedFunctionCallNode): void {
    // Validate arguments first
    node.args.forEach(arg => this.visitNode(arg));
    
    const functionEntry = functionRegistry.get(node.name);
    
    if (!functionEntry) {
      if (!this.context.allowUnknownFunctions) {
        this.addError(node, `Unknown function: ${node.name}`, 'error', 'UNKNOWN_FUNCTION');
      } else {
        this.addError(node, `Unknown function: ${node.name}`, 'warning', 'UNKNOWN_FUNCTION');
      }
      return;
    }
    
    // Validate parameter types
    const argTypes = node.args.map(arg => arg.inferredType!).filter(Boolean);
    const validationErrors = functionRegistry.validateParameters(node.name, argTypes);
    
    validationErrors.forEach(error => {
      this.addError(node, error, 'error', 'INVALID_FUNCTION_PARAMS');
    });
  }
  
  private validateIndexer(node: TypedIndexerNode): void {
    this.visitNode(node.expr);
    this.visitNode(node.index);
    
    const exprType = node.expr.inferredType;
    const indexType = node.index.inferredType;
    
    if (!exprType || !indexType) return;
    
    // Index must be integer
    if (!TypeCompatibility.isAssignable(indexType, { name: 'integer', cardinality: '1..1', isCollection: false, isPrimitive: true, isResource: false })) {
      this.addError(node, `Array index must be integer, got ${indexType.name}`, 'error', 'INVALID_INDEX_TYPE');
    }
  }
  
  private validateDot(node: TypedDotNode): void {
    this.visitNode(node.left);
    this.visitNode(node.right);
    
    // Dot navigation validation is handled in identifier validation
    // through context type checking
  }
  
  private validateAs(node: TypedAsTypeNode): void {
    this.visitNode(node.expression);
    
    const exprType = node.expression.inferredType;
    const targetType = node.targetFHIRType;
    
    if (exprType && targetType && !this.isValidTypeCast(exprType, targetType)) {
      this.addError(
        node, 
        `Cannot cast ${exprType.name} to ${targetType.name}`, 
        'warning', 
        'INVALID_TYPE_CAST'
      );
    }
  }
  
  private validateIs(node: TypedIsTypeNode): void {
    this.visitNode(node.expression);
    
    // Type checking with 'is' is always valid syntactically
    // Runtime behavior depends on actual values
  }
  
  private validateVariable(node: TypedVariableNode): void {
    if (!node.scopeType && this.context.strictMode) {
      this.addError(node, `Undefined variable: $${node.name}`, 'error', 'UNDEFINED_VARIABLE');
    }
  }
  
  private validateEnvironmentVariable(node: TypedEnvironmentVariableNode): void {
    // Standard environment variables are always valid
    // Custom ones depend on context
  }
  
  private validateNull(node: TypedNullLiteralNode): void {
    // Null literals are always valid
  }
  
  /**
   * Operator-specific validation methods
   */
  
  private validateArithmeticOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    if (!TypeCompatibility.isArithmeticCompatible(leftType) || !TypeCompatibility.isArithmeticCompatible(rightType)) {
      this.addError(
        node, 
        `Arithmetic operation requires numeric types, got ${leftType.name} and ${rightType.name}`, 
        'error', 
        'INVALID_ARITHMETIC_OPERANDS'
      );
    }
  }
  
  private validateEqualityOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    // Equality can be checked between most types, but warn about potential issues
    if (!TypeCompatibility.isComparableType(leftType) || !TypeCompatibility.isComparableType(rightType)) {
      this.addError(
        node, 
        `Equality comparison between ${leftType.name} and ${rightType.name} may not work as expected`, 
        'warning', 
        'QUESTIONABLE_EQUALITY'
      );
    }
  }
  
  private validateComparisonOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    if (!TypeCompatibility.isComparableType(leftType) || !TypeCompatibility.isComparableType(rightType)) {
      this.addError(
        node, 
        `Comparison operation requires comparable types, got ${leftType.name} and ${rightType.name}`, 
        'error', 
        'INVALID_COMPARISON_OPERANDS'
      );
    }
    
    // Check type compatibility
    if (!TypeCompatibility.isAssignable(leftType, rightType) && !TypeCompatibility.isAssignable(rightType, leftType)) {
      this.addError(
        node, 
        `Cannot compare ${leftType.name} with ${rightType.name}`, 
        'warning', 
        'INCOMPATIBLE_COMPARISON'
      );
    }
  }
  
  private validateLogicalOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    if (!TypeCompatibility.isBooleanCompatible(leftType)) {
      this.addError(
        node, 
        `Left operand of logical operation should be boolean-compatible, got ${leftType.name}`, 
        'warning', 
        'LOGICAL_OPERAND_TYPE'
      );
    }
    
    if (!TypeCompatibility.isBooleanCompatible(rightType)) {
      this.addError(
        node, 
        `Right operand of logical operation should be boolean-compatible, got ${rightType.name}`, 
        'warning', 
        'LOGICAL_OPERAND_TYPE'
      );
    }
  }
  
  private validateMembershipOperation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    // For 'in' and 'contains', right operand should be a collection
    if (!rightType.isCollection) {
      this.addError(
        node, 
        `Membership operation requires collection on right side, got ${rightType.name}`, 
        'error', 
        'INVALID_MEMBERSHIP_OPERANDS'
      );
    }
  }
  
  private validateStringConcatenation(node: TypedBinaryOpNode, leftType: FHIRPathType, rightType: FHIRPathType): void {
    if (!TypeCompatibility.isStringCompatible(leftType) || !TypeCompatibility.isStringCompatible(rightType)) {
      this.addError(
        node, 
        `String concatenation requires string types, got ${leftType.name} and ${rightType.name}`, 
        'error', 
        'INVALID_CONCATENATION_OPERANDS'
      );
    }
  }
  
  /**
   * Helper methods
   */
  
  private isValidTypeCast(sourceType: FHIRPathType, targetType: FHIRPathType): boolean {
    // Allow casts between compatible types
    if (TypeCompatibility.isAssignable(sourceType, targetType)) return true;
    
    // Allow primitive conversions
    if (sourceType.isPrimitive && targetType.isPrimitive) return true;
    
    // Allow resource type casts (checked at runtime)
    if (sourceType.isResource && targetType.isResource) return true;
    
    return false;
  }
  
  private addError(node: TypedASTNode, message: string, severity: 'error' | 'warning' | 'info', code: string): void {
    this.errors.push({
      message,
      severity,
      code,
      node,
      position: { start: node.start, end: node.end }
    });
  }
}

/**
 * Convenience function to validate a typed AST
 */
export function validateSemantics(node: TypedASTNode, context?: Partial<ValidationContext>): ValidationResult {
  const validator = new SemanticValidator(context);
  return validator.validate(node);
}