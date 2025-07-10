import { ASTNode, TokenType } from './types';

// Evaluation context interface - can be extended later
export interface EvaluationContext {
  // Cache for compiled expressions
  _cache?: Map<string, CompiledNode>;
  
  // User-defined variables (future extension)
  variables?: Record<string, any>;
  
  // Custom functions (future extension)
  functions?: Record<string, Function>;
  
  // Cache for now() function to ensure consistency within expression
  _nowCache?: string;
  
  // Cache for today() function to ensure consistency within expression
  _todayCache?: string;
  
  // Cache for timeOfDay() function to ensure consistency within expression
  _timeOfDayCache?: string;
}

// Base evaluation function type
export type EvalFunction = (context: any[], data: any, ctx: EvaluationContext) => any[];

// Base compiled node - extends the original AST node with eval function
export type CompiledNode = ASTNode & { eval: EvalFunction };

// Specific compiled node types with properly typed children
export interface CompiledLiteralNode extends CompiledNode {
  kind: 'literal';
}

export interface CompiledIdentifierNode extends CompiledNode {
  kind: 'identifier';
}

export interface CompiledBinaryOpNode extends CompiledNode {
  kind: 'binary';
  left: CompiledNode;
  right: CompiledNode;
}

export interface CompiledUnaryOpNode extends CompiledNode {
  kind: 'unary';
  operand: CompiledNode;
}

export interface CompiledFunctionCallNode extends CompiledNode {
  kind: 'function';
  args: CompiledNode[];
}

export interface CompiledIndexerNode extends CompiledNode {
  kind: 'indexer';
  expr: CompiledNode;
  index: CompiledNode;
}

export interface CompiledDotNode extends CompiledNode {
  kind: 'dot';
  left: CompiledNode;
  right: CompiledNode;
}

export interface CompiledAsTypeNode extends CompiledNode {
  kind: 'as';
  expression: CompiledNode;
}

export interface CompiledIsTypeNode extends CompiledNode {
  kind: 'is';
  expression: CompiledNode;
}

export interface CompiledVariableNode extends CompiledNode {
  kind: 'variable';
}

export interface CompiledEnvironmentVariableNode extends CompiledNode {
  kind: 'envVariable';
}

export interface CompiledNullLiteralNode extends CompiledNode {
  kind: 'null';
}