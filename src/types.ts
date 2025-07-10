// Token types - using const enum for zero runtime overhead
export const enum TokenType {
  // Literals
  NUMBER = 0,
  STRING = 1,
  BOOLEAN = 2,
  DATE = 3,
  TIME = 4,
  DATETIME = 5,
  QUANTITY = 6,
  
  // Identifiers and keywords
  IDENTIFIER = 7,
  
  // Operators
  DOT = 8,              // .
  PLUS = 9,             // +
  MINUS = 10,           // -
  MULTIPLY = 11,        // *
  DIVIDE = 12,          // /
  MOD = 13,             // mod
  DIV = 14,             // div
  
  // Comparison
  EQUALS = 15,          // =
  NOT_EQUALS = 16,      // !=
  LESS_THAN = 17,       // <
  GREATER_THAN = 18,    // >
  LESS_EQUALS = 19,     // <=
  GREATER_EQUALS = 20,  // >=
  
  // Logical
  AND = 21,             // and
  OR = 22,              // or
  IMPLIES = 23,         // implies
  XOR = 24,             // xor
  
  // Special
  LPAREN = 25,          // (
  RPAREN = 26,          // )
  LBRACKET = 27,        // [
  RBRACKET = 28,        // ]
  COMMA = 29,           // ,
  PIPE = 30,            // |
  
  // Control
  EOF = 31,
  
  // Functions (as keywords)
  WHERE = 32,
  SELECT = 33,
  EXISTS = 34,
  EMPTY = 35,
  NOT = 36,
  IN = 37,
  
  // Type operators (separate from AS/IS keywords)
  AS_TYPE = 38,  // 'as' type operator
  IS_TYPE = 39,  // 'is' type operator
  
  // Additional operators
  AMPERSAND = 40,    // & (concatenation)
  DOLLAR = 41,       // $ (variable prefix)
  PERCENT = 42,      // % (environment variable prefix)
  CONTAINS = 43,     // contains keyword
  
  // Collection functions
  ALL = 44,          // all
  ANY = 45,          // any
  
  // String functions
  MATCHES = 46,      // matches
  SUBSTRING = 47,    // substring
  REPLACE_MATCHES = 48, // replaceMatches
  
  // Advanced functions
  DESCENDANTS = 49,  // descendants
  TRACE = 50,        // trace
  COMBINE = 51,      // combine
  INTERSECT = 52,    // intersect
  IS_DISTINCT = 53,  // isDistinct
  DISTINCT = 54,     // distinct
  REPEAT = 55,       // repeat
  DEFINE_VARIABLE = 56, // defineVariable
  
  // Other functions
  RESOLVE = 57,      // resolve
  EXTENSION = 58,    // extension
  HAS_VALUE = 59,    // hasValue
  CHILDREN = 60,     // children
  MEMBER_OF = 61,    // memberOf
  HTML_CHECKS = 62,  // htmlChecks
  TO_INTEGER = 63,   // toInteger
  TO_STRING = 64,    // toString
  TO_DATE_TIME = 65, // toDateTime
  LENGTH = 66,       // length
  STARTS_WITH = 67,  // startsWith
  ENDS_WITH = 68,    // endsWith
  TAIL = 69,         // tail
  TAKE = 70,         // take
  SKIP = 71,         // skip
  TRIM = 72,         // trim
  SPLIT = 73,        // split
  JOIN = 74,         // join
  TO_CHARS = 75,     // toChars
  INDEX_OF = 76,     // indexOf
  LAST_INDEX_OF = 77, // lastIndexOf
  REPLACE = 78,      // replace
  ENCODE = 79,       // encode
  DECODE = 80,       // decode
  ESCAPE = 81,       // escape
  UNESCAPE = 82,     // unescape
  LOWER = 83,        // lower
  UPPER = 84,        // upper
  
  // Missing tokens from ANTLR grammar
  EQUIVALENCE = 85,      // ~ (equivalence operator)
  NOT_EQUIVALENCE = 86,  // !~ (not equivalent)
  LONG_NUMBER = 87,      // Long integer with L suffix
  NULL_LITERAL = 88,     // {} (empty set)
  TOTAL = 89,            // $total special variable
  LBRACE = 90,           // {
  RBRACE = 91,           // }
  TILDE = 92,            // ~ (for equivalence)
}

// Token structure - minimal fields for performance
// Now includes line and column for better error reporting
export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

// AST Node types using discriminated unions
export type ASTNode = 
  | LiteralNode
  | IdentifierNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionCallNode
  | IndexerNode
  | DotNode
  | AsTypeNode
  | IsTypeNode
  | VariableNode
  | EnvironmentVariableNode
  | NullLiteralNode;

export interface LiteralNode {
  kind: 'literal';
  value: string | number | boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime' | 'quantity';
  start: number;
  end: number;
}

export interface IdentifierNode {
  kind: 'identifier';
  name: string;
  start: number;
  end: number;
}

export interface BinaryOpNode {
  kind: 'binary';
  op: TokenType;
  left: ASTNode;
  right: ASTNode;
  start: number;
  end: number;
}

export interface UnaryOpNode {
  kind: 'unary';
  op: TokenType;
  operand: ASTNode;
  start: number;
  end: number;
}

export interface FunctionCallNode {
  kind: 'function';
  name: string;
  args: ASTNode[];
  start: number;
  end: number;
}

export interface IndexerNode {
  kind: 'indexer';
  expr: ASTNode;
  index: ASTNode;
  start: number;
  end: number;
}

export interface DotNode {
  kind: 'dot';
  left: ASTNode;
  right: ASTNode;
  start: number;
  end: number;
}

export interface AsTypeNode {
  kind: 'as';
  expression: ASTNode;
  targetType: string;
  start: number;
  end: number;
}

export interface IsTypeNode {
  kind: 'is';
  expression: ASTNode;
  targetType: string;
  start: number;
  end: number;
}

export interface VariableNode {
  kind: 'variable';
  name: string;  // e.g., "this" for $this
  start: number;
  end: number;
}

export interface EnvironmentVariableNode {
  kind: 'envVariable';
  name: string;  // e.g., "resource", "context", "ucum"
  start: number;
  end: number;
}

export interface NullLiteralNode {
  kind: 'null';
  start: number;
  end: number;
}

// Type guards for AST nodes
export function isLiteralNode(node: ASTNode): node is LiteralNode {
  return node.kind === 'literal';
}

export function isIdentifierNode(node: ASTNode): node is IdentifierNode {
  return node.kind === 'identifier';
}

export function isBinaryOpNode(node: ASTNode): node is BinaryOpNode {
  return node.kind === 'binary';
}

export function isUnaryOpNode(node: ASTNode): node is UnaryOpNode {
  return node.kind === 'unary';
}

export function isFunctionCallNode(node: ASTNode): node is FunctionCallNode {
  return node.kind === 'function';
}

export function isIndexerNode(node: ASTNode): node is IndexerNode {
  return node.kind === 'indexer';
}

export function isDotNode(node: ASTNode): node is DotNode {
  return node.kind === 'dot';
}

export function isAsTypeNode(node: ASTNode): node is AsTypeNode {
  return node.kind === 'as';
}

export function isIsTypeNode(node: ASTNode): node is IsTypeNode {
  return node.kind === 'is';
}

export function isVariableNode(node: ASTNode): node is VariableNode {
  return node.kind === 'variable';
}

export function isEnvironmentVariableNode(node: ASTNode): node is EnvironmentVariableNode {
  return node.kind === 'envVariable';
}

export function isNullLiteralNode(node: ASTNode): node is NullLiteralNode {
  return node.kind === 'null';
}

// Parser error for clean error handling
export class ParseError extends Error {
  constructor(
    message: string,
    public position: number,
    public line: number,
    public column: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// Operator precedence levels
export const enum Precedence {
  LOWEST = 0,
  IMPLIES = 1,      // implies has lowest precedence
  OR = 2,           // or, xor
  AND = 3,          // and
  EQUALITY = 4,     // =, !=, ~, !~, in, contains
  COMPARISON = 5,   // <, >, <=, >=, is
  UNION = 6,        // |
  ADDITIVE = 7,     // +, -, &
  MULTIPLICATIVE = 8, // *, /, div, mod
  UNARY = 9,        // unary +, -, not
  POSTFIX = 10,     // ., [], ()
}

// Map token types to precedence
export const PRECEDENCE_MAP: Partial<Record<TokenType, Precedence>> = {
  [TokenType.IMPLIES]: Precedence.IMPLIES,  // Lowest precedence
  [TokenType.OR]: Precedence.OR,
  [TokenType.XOR]: Precedence.OR,
  [TokenType.AND]: Precedence.AND,
  [TokenType.EQUALS]: Precedence.EQUALITY,
  [TokenType.NOT_EQUALS]: Precedence.EQUALITY,
  [TokenType.EQUIVALENCE]: Precedence.EQUALITY,      // ~ operator
  [TokenType.NOT_EQUIVALENCE]: Precedence.EQUALITY,  // !~ operator
  [TokenType.IN]: Precedence.EQUALITY,  // 'in' operator for containment
  [TokenType.CONTAINS]: Precedence.EQUALITY,  // 'contains' operator
  [TokenType.LESS_THAN]: Precedence.COMPARISON,
  [TokenType.GREATER_THAN]: Precedence.COMPARISON,
  [TokenType.LESS_EQUALS]: Precedence.COMPARISON,
  [TokenType.GREATER_EQUALS]: Precedence.COMPARISON,
  [TokenType.IS_TYPE]: Precedence.COMPARISON,  // 'is' has same precedence as comparisons
  [TokenType.PIPE]: Precedence.UNION,
  [TokenType.PLUS]: Precedence.ADDITIVE,
  [TokenType.MINUS]: Precedence.ADDITIVE,
  [TokenType.AMPERSAND]: Precedence.ADDITIVE,  // & for concatenation
  [TokenType.MULTIPLY]: Precedence.MULTIPLICATIVE,
  [TokenType.DIVIDE]: Precedence.MULTIPLICATIVE,
  [TokenType.DIV]: Precedence.MULTIPLICATIVE,
  [TokenType.MOD]: Precedence.MULTIPLICATIVE,
  [TokenType.AS_TYPE]: Precedence.POSTFIX,  // 'as' is a postfix operator
};