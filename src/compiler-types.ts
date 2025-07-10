import type { 
  ASTNode, 
  TokenType, 
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
} from "./types";

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
export type EvalFunction = (
  context: any[],
  data: any,
  ctx: EvaluationContext,
) => any[];

// Specific compiled node types - intersections of original types with eval function
export type CompiledLiteralNode = LiteralNode & { eval: EvalFunction };
export type CompiledIdentifierNode = IdentifierNode & { eval: EvalFunction };
export type CompiledBinaryOpNode = BinaryOpNode & { 
  eval: EvalFunction;
  left: CompiledNode;
  right: CompiledNode;
};
export type CompiledUnaryOpNode = UnaryOpNode & { 
  eval: EvalFunction;
  operand: CompiledNode;
};
export type CompiledFunctionCallNode = FunctionCallNode & { 
  eval: EvalFunction;
  args: CompiledNode[];
};
export type CompiledIndexerNode = IndexerNode & { 
  eval: EvalFunction;
  expr: CompiledNode;
  index: CompiledNode;
};
export type CompiledDotNode = DotNode & { 
  eval: EvalFunction;
  left: CompiledNode;
  right: CompiledNode;
};
export type CompiledAsTypeNode = AsTypeNode & { 
  eval: EvalFunction;
  expression: CompiledNode;
};
export type CompiledIsTypeNode = IsTypeNode & { 
  eval: EvalFunction;
  expression: CompiledNode;
};
export type CompiledVariableNode = VariableNode & { eval: EvalFunction };
export type CompiledEnvironmentVariableNode = EnvironmentVariableNode & { eval: EvalFunction };
export type CompiledNullLiteralNode = NullLiteralNode & { eval: EvalFunction };

// Base compiled node - union of all compiled node types
export type CompiledNode = 
  | CompiledLiteralNode
  | CompiledIdentifierNode
  | CompiledBinaryOpNode
  | CompiledUnaryOpNode
  | CompiledFunctionCallNode
  | CompiledIndexerNode
  | CompiledDotNode
  | CompiledAsTypeNode
  | CompiledIsTypeNode
  | CompiledVariableNode
  | CompiledEnvironmentVariableNode
  | CompiledNullLiteralNode;
