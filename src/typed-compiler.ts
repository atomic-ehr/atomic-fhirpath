/**
 * Typed Compiler
 * 
 * Type-aware compilation with semantic validation. Replaces the existing compiler
 * with type inference and validation integrated into the compilation process.
 */

import { ASTNode } from './types';
import { 
  TypedASTNode, 
  TypedNodeUtils 
} from './typed-nodes';
import { 
  TypeInferenceEngine, 
  TypeInferenceContext 
} from './type-inference';
import { 
  SemanticValidator, 
  ValidationContext, 
  ValidationResult 
} from './semantic-validator';
import { 
  CompiledNode, 
  EvalFunction, 
  EvaluationContext 
} from './compiler-types';
import { 
  FHIRPathType, 
  ANY_TYPE 
} from './type-system';
import { 
  ModelProvider, 
  NullModelProvider 
} from './model-provider';

export interface TypedCompilerOptions {
  readonly modelProvider?: ModelProvider;
  readonly rootType?: FHIRPathType;
  readonly strictMode?: boolean;
  readonly allowUnknownFunctions?: boolean;
  readonly performValidation?: boolean;
  readonly variables?: Map<string, FHIRPathType>;
  readonly environmentVariables?: Map<string, FHIRPathType>;
}

export interface TypedCompilationResult {
  readonly compiledNode: CompiledNode;
  readonly typedAST: TypedASTNode;
  readonly validationResult?: ValidationResult;
  readonly hasErrors: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

export class TypedCompiler {
  private typeInferrer: TypeInferenceEngine;
  private validator: SemanticValidator;
  private options: Required<TypedCompilerOptions>;
  
  constructor(options: TypedCompilerOptions = {}) {
    this.options = {
      modelProvider: options.modelProvider || new NullModelProvider(),
      rootType: options.rootType || ANY_TYPE,
      strictMode: options.strictMode ?? false,
      allowUnknownFunctions: options.allowUnknownFunctions ?? true,
      performValidation: options.performValidation ?? true,
      variables: options.variables || new Map(),
      environmentVariables: options.environmentVariables || new Map([
        ['resource', ANY_TYPE],
        ['context', ANY_TYPE],
        ['ucum', { name: 'string', cardinality: '1..1', isCollection: false, isPrimitive: true, isResource: false }]
      ])
    };
    
    const inferenceContext: TypeInferenceContext = {
      modelProvider: this.options.modelProvider,
      rootType: this.options.rootType,
      variables: this.options.variables,
      environmentVariables: this.options.environmentVariables,
      allowUnknownFunctions: this.options.allowUnknownFunctions,
      strictMode: this.options.strictMode
    };
    
    const validationContext: ValidationContext = {
      modelProvider: this.options.modelProvider,
      strictMode: this.options.strictMode,
      allowUnknownFunctions: this.options.allowUnknownFunctions,
      allowUntypedProperties: !this.options.strictMode,
      maxDepth: 100
    };
    
    this.typeInferrer = new TypeInferenceEngine(inferenceContext);
    this.validator = new SemanticValidator(validationContext);
  }
  
  /**
   * Compile AST with type inference and validation
   */
  compile(ast: ASTNode, rootType?: FHIRPathType): TypedCompilationResult {
    // Convert to typed AST
    const typedAST = TypedNodeUtils.convertToTyped(ast);
    
    // Perform type inference
    const inferredAST = this.typeInferrer.inferTypes(typedAST, rootType || this.options.rootType);
    
    // Perform semantic validation if enabled
    let validationResult: ValidationResult | undefined;
    if (this.options.performValidation) {
      validationResult = this.validator.validate(inferredAST);
    }
    
    // Compile to executable node
    const compiledNode = this.compileTypedNode(inferredAST);
    
    // Collect errors and warnings
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (validationResult) {
      errors.push(...validationResult.errors.map(e => e.message));
      warnings.push(...validationResult.warnings.map(w => w.message));
    }
    
    // Add type errors from nodes
    const typeErrors = TypedNodeUtils.getAllTypeErrors(inferredAST);
    errors.push(...typeErrors);
    
    return {
      compiledNode,
      typedAST: inferredAST,
      validationResult,
      hasErrors: errors.length > 0,
      errors,
      warnings
    };
  }
  
  /**
   * Compile a typed AST node into an executable node
   */
  private compileTypedNode(node: TypedASTNode): CompiledNode {
    const baseCompiled = this.createBaseCompiledNode(node);
    
    switch (node.kind) {
      case 'literal':
        return this.compileLiteral(node, baseCompiled);
      case 'identifier':
        return this.compileIdentifier(node, baseCompiled);
      case 'binary':
        return this.compileBinary(node, baseCompiled);
      case 'unary':
        return this.compileUnary(node, baseCompiled);
      case 'function':
        return this.compileFunction(node, baseCompiled);
      case 'indexer':
        return this.compileIndexer(node, baseCompiled);
      case 'dot':
        return this.compileDot(node, baseCompiled);
      case 'as':
        return this.compileAs(node, baseCompiled);
      case 'is':
        return this.compileIs(node, baseCompiled);
      case 'variable':
        return this.compileVariable(node, baseCompiled);
      case 'envVariable':
        return this.compileEnvironmentVariable(node, baseCompiled);
      case 'null':
        return this.compileNull(node, baseCompiled);
      default:
        throw new Error(`Unknown node kind: ${(node as any).kind}`);
    }
  }
  
  private createBaseCompiledNode(node: TypedASTNode): CompiledNode {
    return {
      ...node,
      eval: () => { throw new Error('Base eval function should be overridden'); }
    };
  }
  
  private compileLiteral(node: TypedASTNode, base: CompiledNode): CompiledNode {
    const value = node.kind === 'literal' ? (node as any).value : null;
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        return [value];
      }
    };
  }
  
  private compileIdentifier(node: TypedASTNode, base: CompiledNode): CompiledNode {
    const name = node.kind === 'identifier' ? (node as any).name : '';
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        // Simple property access implementation
        const results: any[] = [];
        
        for (const item of context) {
          if (item && typeof item === 'object' && name in item) {
            const value = item[name];
            if (Array.isArray(value)) {
              results.push(...value);
            } else if (value !== undefined) {
              results.push(value);
            }
          }
        }
        
        return results;
      }
    };
  }
  
  private compileBinary(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'binary') throw new Error('Expected binary node');
    const binaryNode = node as any;
    
    const leftCompiled = this.compileTypedNode(binaryNode.left);
    const rightCompiled = this.compileTypedNode(binaryNode.right);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const leftResults = leftCompiled.eval(context, data, ctx);
        const rightResults = rightCompiled.eval(context, data, ctx);
        
        // Basic binary operation implementation
        // This would need to be expanded based on operator type
        return this.evaluateBinaryOperation(binaryNode.op, leftResults, rightResults);
      }
    };
  }
  
  private compileUnary(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'unary') throw new Error('Expected unary node');
    const unaryNode = node as any;
    
    const operandCompiled = this.compileTypedNode(unaryNode.operand);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const operandResults = operandCompiled.eval(context, data, ctx);
        return this.evaluateUnaryOperation(unaryNode.op, operandResults);
      }
    };
  }
  
  private compileFunction(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'function') throw new Error('Expected function node');
    const funcNode = node as any;
    
    const argCompiled = funcNode.args.map((arg: TypedASTNode) => this.compileTypedNode(arg));
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const argResults = argCompiled.map(arg => arg.eval(context, data, ctx));
        return this.evaluateFunctionCall(funcNode.name, context, argResults, ctx);
      }
    };
  }
  
  private compileIndexer(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'indexer') throw new Error('Expected indexer node');
    const indexerNode = node as any;
    
    const exprCompiled = this.compileTypedNode(indexerNode.expr);
    const indexCompiled = this.compileTypedNode(indexerNode.index);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const exprResults = exprCompiled.eval(context, data, ctx);
        const indexResults = indexCompiled.eval(exprResults, data, ctx);
        
        if (indexResults.length === 0) return [];
        const index = indexResults[0];
        
        if (typeof index === 'number' && index >= 0 && index < exprResults.length) {
          return [exprResults[index]];
        }
        
        return [];
      }
    };
  }
  
  private compileDot(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'dot') throw new Error('Expected dot node');
    const dotNode = node as any;
    
    const leftCompiled = this.compileTypedNode(dotNode.left);
    const rightCompiled = this.compileTypedNode(dotNode.right);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const leftResults = leftCompiled.eval(context, data, ctx);
        return rightCompiled.eval(leftResults, data, ctx);
      }
    };
  }
  
  private compileAs(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'as') throw new Error('Expected as node');
    const asNode = node as any;
    
    const exprCompiled = this.compileTypedNode(asNode.expression);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        // Type casting - for now just return the expression results
        return exprCompiled.eval(context, data, ctx);
      }
    };
  }
  
  private compileIs(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'is') throw new Error('Expected is node');
    const isNode = node as any;
    
    const exprCompiled = this.compileTypedNode(isNode.expression);
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        const results = exprCompiled.eval(context, data, ctx);
        // Type checking - simplified implementation
        return [results.length > 0];
      }
    };
  }
  
  private compileVariable(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'variable') throw new Error('Expected variable node');
    const varNode = node as any;
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        // Variable resolution
        if (ctx.variables && ctx.variables[varNode.name] !== undefined) {
          return [ctx.variables[varNode.name]];
        }
        return [];
      }
    };
  }
  
  private compileEnvironmentVariable(node: TypedASTNode, base: CompiledNode): CompiledNode {
    if (node.kind !== 'envVariable') throw new Error('Expected envVariable node');
    const envVarNode = node as any;
    
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        // Environment variable resolution
        switch (envVarNode.name) {
          case 'resource':
            return data ? [data] : [];
          case 'context':
            return [ctx];
          case 'ucum':
            return ['http://unitsofmeasure.org'];
          default:
            return [];
        }
      }
    };
  }
  
  private compileNull(node: TypedASTNode, base: CompiledNode): CompiledNode {
    return {
      ...base,
      eval: (context: any[], data: any, ctx: EvaluationContext): any[] => {
        return [];
      }
    };
  }
  
  /**
   * Helper methods for evaluation
   */
  
  private evaluateBinaryOperation(op: any, left: any[], right: any[]): any[] {
    // Basic implementation - would need full operator logic
    if (left.length === 0 || right.length === 0) return [];
    
    const leftVal = left[0];
    const rightVal = right[0];
    
    // Simplified operation handling
    switch (op) {
      case 15: // EQUALS
        return [leftVal === rightVal];
      case 16: // NOT_EQUALS
        return [leftVal !== rightVal];
      case 17: // LESS_THAN
        return [leftVal < rightVal];
      case 18: // GREATER_THAN
        return [leftVal > rightVal];
      default:
        return [leftVal];
    }
  }
  
  private evaluateUnaryOperation(op: any, operand: any[]): any[] {
    if (operand.length === 0) return [];
    
    const value = operand[0];
    
    switch (op) {
      case 10: // MINUS
        return [-value];
      case 36: // NOT
        return [!value];
      default:
        return operand;
    }
  }
  
  private evaluateFunctionCall(name: string, context: any[], args: any[][], ctx: EvaluationContext): any[] {
    // Basic function implementations
    switch (name) {
      case 'exists':
        return [context.length > 0];
      case 'empty':
        return [context.length === 0];
      case 'count':
        return [context.length];
      case 'first':
        return context.length > 0 ? [context[0]] : [];
      case 'last':
        return context.length > 0 ? [context[context.length - 1]] : [];
      default:
        return [];
    }
  }
}

/**
 * Convenience function to compile with type checking
 */
export function compileWithTypes(ast: ASTNode, options?: TypedCompilerOptions): TypedCompilationResult {
  const compiler = new TypedCompiler(options);
  return compiler.compile(ast);
}