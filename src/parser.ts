import { Tokenizer } from './tokenizer';
import {
  type Token,
  TokenType,
  type ASTNode,
  type LiteralNode,
  type IdentifierNode,
  type BinaryOpNode,
  type UnaryOpNode,
  type FunctionCallNode,
  type IndexerNode,
  type DotNode,
  type AsTypeNode,
  type IsTypeNode,
  type VariableNode,
  type EnvironmentVariableNode,
  type NullLiteralNode,
  ParseError,
  Precedence,
  PRECEDENCE_MAP,
  isIdentifierNode
} from './types';

// PERFORMANCE OPTIMIZATION: Array-based lookups for token type checks
// Using arrays for dense token type ranges provides better cache locality
// and faster access compared to Set or Map lookups in hot paths

// Postfix operator lookup array - indexed by TokenType for O(1) access
// 1 = is postfix operator, 0 = not postfix operator
const IS_POSTFIX_OPERATOR = new Uint8Array(128);
IS_POSTFIX_OPERATOR[TokenType.DOT] = 1;
IS_POSTFIX_OPERATOR[TokenType.LBRACKET] = 1;
IS_POSTFIX_OPERATOR[TokenType.LPAREN] = 1;

// Token to function name mapping for O(1) lookups
const TOKEN_TO_FUNCTION_NAME: Partial<Record<TokenType, string>> = {
  [TokenType.WHERE]: 'where',
  [TokenType.SELECT]: 'select',
  [TokenType.EXISTS]: 'exists',
  [TokenType.EMPTY]: 'empty',
  [TokenType.AS_TYPE]: 'as',
  [TokenType.IS_TYPE]: 'is',
  [TokenType.CONTAINS]: 'contains',
  [TokenType.ALL]: 'all',
  [TokenType.ANY]: 'any',
  [TokenType.MATCHES]: 'matches',
  [TokenType.SUBSTRING]: 'substring',
  [TokenType.REPLACE_MATCHES]: 'replaceMatches',
  [TokenType.DESCENDANTS]: 'descendants',
  [TokenType.TRACE]: 'trace',
  [TokenType.COMBINE]: 'combine',
  [TokenType.INTERSECT]: 'intersect',
  [TokenType.IS_DISTINCT]: 'isDistinct',
  [TokenType.DISTINCT]: 'distinct',
  [TokenType.REPEAT]: 'repeat',
  [TokenType.DEFINE_VARIABLE]: 'defineVariable',
  [TokenType.RESOLVE]: 'resolve',
  [TokenType.EXTENSION]: 'extension',
  [TokenType.HAS_VALUE]: 'hasValue',
  [TokenType.CHILDREN]: 'children',
  [TokenType.MEMBER_OF]: 'memberOf',
  [TokenType.HTML_CHECKS]: 'htmlChecks',
  [TokenType.TO_INTEGER]: 'toInteger',
  [TokenType.TO_STRING]: 'toString',
  [TokenType.TO_DATE_TIME]: 'toDateTime',
  [TokenType.LENGTH]: 'length',
  [TokenType.STARTS_WITH]: 'startsWith',
  [TokenType.ENDS_WITH]: 'endsWith',
  [TokenType.TAIL]: 'tail',
  [TokenType.TAKE]: 'take',
  [TokenType.SKIP]: 'skip',
  [TokenType.TRIM]: 'trim',
  [TokenType.SPLIT]: 'split',
  [TokenType.JOIN]: 'join',
  [TokenType.TO_CHARS]: 'toChars',
  [TokenType.INDEX_OF]: 'indexOf',
  [TokenType.LAST_INDEX_OF]: 'lastIndexOf',
  [TokenType.REPLACE]: 'replace',
  [TokenType.ENCODE]: 'encode',
  [TokenType.DECODE]: 'decode',
  [TokenType.ESCAPE]: 'escape',
  [TokenType.UNESCAPE]: 'unescape',
  [TokenType.LOWER]: 'lower',
  [TokenType.UPPER]: 'upper',
  // Keywords that can also be identifiers
  [TokenType.AND]: 'and',
  [TokenType.OR]: 'or',
  [TokenType.IMPLIES]: 'implies',
  [TokenType.DIV]: 'div',
  [TokenType.MOD]: 'mod',
  // BOOLEAN is handled specially in parseIdentifierOrFunction
  [TokenType.XOR]: 'xor'
};

// Set of tokens valid after dot operator
const VALID_DOT_TOKENS = new Set<TokenType>([
  TokenType.IDENTIFIER,
  TokenType.EXISTS,
  TokenType.EMPTY,
  TokenType.WHERE,
  TokenType.SELECT,
  TokenType.AS_TYPE,
  TokenType.IS_TYPE,
  TokenType.IN,
  TokenType.CONTAINS,
  TokenType.ALL,
  TokenType.ANY,
  TokenType.MATCHES,
  TokenType.SUBSTRING,
  TokenType.REPLACE_MATCHES,
  TokenType.DESCENDANTS,
  TokenType.TRACE,
  TokenType.COMBINE,
  TokenType.INTERSECT,
  TokenType.IS_DISTINCT,
  TokenType.DISTINCT,
  TokenType.REPEAT,
  TokenType.DEFINE_VARIABLE,
  TokenType.RESOLVE,
  TokenType.EXTENSION,
  TokenType.HAS_VALUE,
  TokenType.CHILDREN,
  TokenType.MEMBER_OF,
  TokenType.HTML_CHECKS,
  TokenType.TO_INTEGER,
  TokenType.TO_STRING,
  TokenType.TO_DATE_TIME,
  TokenType.LENGTH,
  TokenType.STARTS_WITH,
  TokenType.ENDS_WITH,
  TokenType.TAIL,
  TokenType.TAKE,
  TokenType.SKIP,
  TokenType.TRIM,
  TokenType.SPLIT,
  TokenType.JOIN,
  TokenType.TO_CHARS,
  TokenType.INDEX_OF,
  TokenType.LAST_INDEX_OF,
  TokenType.REPLACE,
  TokenType.ENCODE,
  TokenType.DECODE,
  TokenType.ESCAPE,
  TokenType.UNESCAPE,
  TokenType.LOWER,
  TokenType.UPPER,
  // Additional keywords that can be property names
  TokenType.AND,
  TokenType.OR,
  TokenType.IMPLIES,
  TokenType.DIV,
  TokenType.MOD,
  TokenType.BOOLEAN,
  TokenType.XOR
]);

/**
 * NodeBuilder class for consistent AST node creation
 * Provides type-safe factory methods for all node types
 */
class NodeBuilder {
  static literal(value: any, dataType: LiteralNode['dataType'], start: number, end: number): LiteralNode {
    return { kind: 'literal', value, dataType, start, end };
  }
  
  static identifier(name: string, start: number, end: number): IdentifierNode {
    return { kind: 'identifier', name, start, end };
  }
  
  static binary(op: TokenType, left: ASTNode, right: ASTNode): BinaryOpNode {
    return { kind: 'binary', op, left, right, start: left.start, end: right.end };
  }
  
  static unary(op: TokenType, operand: ASTNode, start: number): UnaryOpNode {
    return { kind: 'unary', op, operand, start, end: operand.end };
  }
  
  static function(name: string, args: ASTNode[], start: number, end: number): FunctionCallNode {
    return { kind: 'function', name, args, start, end };
  }
  
  static indexer(expr: ASTNode, index: ASTNode, end: number): IndexerNode {
    return { kind: 'indexer', expr, index, start: expr.start, end };
  }
  
  static dot(left: ASTNode, right: ASTNode): DotNode {
    return { kind: 'dot', left, right, start: left.start, end: right.end };
  }
  
  static asType(expression: ASTNode, targetType: string, end: number): AsTypeNode {
    return { kind: 'as', expression, targetType, start: expression.start, end };
  }
  
  static isType(expression: ASTNode, targetType: string, end: number): IsTypeNode {
    return { kind: 'is', expression, targetType, start: expression.start, end };
  }
  
  static variable(name: string, start: number, end: number): VariableNode {
    return { kind: 'variable', name, start, end };
  }
  
  static environmentVariable(name: string, start: number, end: number): EnvironmentVariableNode {
    return { kind: 'envVariable', name, start, end };
  }
  
  static nullLiteral(start: number, end: number): NullLiteralNode {
    return { kind: 'null', start, end };
  }
}

/**
 * Recursive Descent Parser for FHIRPath expressions
 * 
 * This parser converts a stream of tokens into an Abstract Syntax Tree (AST).
 * It uses a combination of recursive descent for overall structure and
 * Pratt parsing (precedence climbing) for handling operator precedence.
 * 
 * Key parsing techniques:
 * - Recursive descent for statements and prefix expressions
 * - Pratt parsing for infix operators with correct precedence
 *   Pratt parsing is a top-down operator precedence parsing technique.
 * - Lookahead for disambiguation (e.g., not() function vs not operator)
 * - Left-to-right associativity for most operators
 * 
 * The parser maintains a current token and implements various parsing
 * methods for different expression types (literals, operators, functions, etc.)
 */


export class Parser {
  private tokenizer: Tokenizer;      // Source of tokens
  private current: Token;            // Current token being examined
  private previous: Token;           // Previously consumed token
  private expression: string = '';   // Original expression for error reporting
  
  // Dispatch table for prefix expressions - O(1) lookup
  private readonly prefixParsers: Map<TokenType, () => ASTNode>;

  constructor() {
    this.tokenizer = new Tokenizer();
    this.current = { type: TokenType.EOF, value: '', start: 0, end: 0 };
    this.previous = { type: TokenType.EOF, value: '', start: 0, end: 0 };
    
    // Initialize prefix parser dispatch table
    this.prefixParsers = new Map([
      // Literals
      [TokenType.NUMBER, () => this.parseNumber()],
      [TokenType.STRING, () => this.parseString()],
      [TokenType.BOOLEAN, () => this.parseBoolean()],
      [TokenType.DATE, () => this.parseDate()],
      [TokenType.TIME, () => this.parseTime()],
      [TokenType.DATETIME, () => this.parseDateTime()],
      [TokenType.QUANTITY, () => this.parseQuantity()],
      [TokenType.LONG_NUMBER, () => this.parseLongNumber()],
      [TokenType.NULL_LITERAL, () => this.parseNullLiteral()],
      
      // Identifiers and functions
      [TokenType.IDENTIFIER, () => this.parseIdentifierOrFunction()],
      [TokenType.WHERE, () => this.parseIdentifierOrFunction()],
      [TokenType.SELECT, () => this.parseIdentifierOrFunction()],
      [TokenType.EXISTS, () => this.parseIdentifierOrFunction()],
      [TokenType.EMPTY, () => this.parseIdentifierOrFunction()],
      [TokenType.AS_TYPE, () => this.parseIdentifierOrFunction()],
      [TokenType.IS_TYPE, () => this.parseIdentifierOrFunction()],
      [TokenType.CONTAINS, () => this.parseIdentifierOrFunction()],
      [TokenType.ALL, () => this.parseIdentifierOrFunction()],
      [TokenType.ANY, () => this.parseIdentifierOrFunction()],
      [TokenType.MATCHES, () => this.parseIdentifierOrFunction()],
      [TokenType.SUBSTRING, () => this.parseIdentifierOrFunction()],
      [TokenType.REPLACE_MATCHES, () => this.parseIdentifierOrFunction()],
      [TokenType.DESCENDANTS, () => this.parseIdentifierOrFunction()],
      [TokenType.TRACE, () => this.parseIdentifierOrFunction()],
      [TokenType.COMBINE, () => this.parseIdentifierOrFunction()],
      [TokenType.INTERSECT, () => this.parseIdentifierOrFunction()],
      [TokenType.IS_DISTINCT, () => this.parseIdentifierOrFunction()],
      [TokenType.DISTINCT, () => this.parseIdentifierOrFunction()],
      [TokenType.REPEAT, () => this.parseIdentifierOrFunction()],
      [TokenType.DEFINE_VARIABLE, () => this.parseIdentifierOrFunction()],
      [TokenType.RESOLVE, () => this.parseIdentifierOrFunction()],
      [TokenType.EXTENSION, () => this.parseIdentifierOrFunction()],
      [TokenType.HAS_VALUE, () => this.parseIdentifierOrFunction()],
      [TokenType.CHILDREN, () => this.parseIdentifierOrFunction()],
      [TokenType.MEMBER_OF, () => this.parseIdentifierOrFunction()],
      [TokenType.HTML_CHECKS, () => this.parseIdentifierOrFunction()],
      [TokenType.TO_INTEGER, () => this.parseIdentifierOrFunction()],
      [TokenType.TO_STRING, () => this.parseIdentifierOrFunction()],
      [TokenType.TO_DATE_TIME, () => this.parseIdentifierOrFunction()],
      [TokenType.LENGTH, () => this.parseIdentifierOrFunction()],
      [TokenType.STARTS_WITH, () => this.parseIdentifierOrFunction()],
      [TokenType.ENDS_WITH, () => this.parseIdentifierOrFunction()],
      [TokenType.TAIL, () => this.parseIdentifierOrFunction()],
      [TokenType.TAKE, () => this.parseIdentifierOrFunction()],
      [TokenType.SKIP, () => this.parseIdentifierOrFunction()],
      [TokenType.TRIM, () => this.parseIdentifierOrFunction()],
      [TokenType.SPLIT, () => this.parseIdentifierOrFunction()],
      [TokenType.JOIN, () => this.parseIdentifierOrFunction()],
      [TokenType.TO_CHARS, () => this.parseIdentifierOrFunction()],
      [TokenType.INDEX_OF, () => this.parseIdentifierOrFunction()],
      [TokenType.LAST_INDEX_OF, () => this.parseIdentifierOrFunction()],
      [TokenType.REPLACE, () => this.parseIdentifierOrFunction()],
      [TokenType.ENCODE, () => this.parseIdentifierOrFunction()],
      [TokenType.DECODE, () => this.parseIdentifierOrFunction()],
      [TokenType.ESCAPE, () => this.parseIdentifierOrFunction()],
      [TokenType.UNESCAPE, () => this.parseIdentifierOrFunction()],
      [TokenType.LOWER, () => this.parseIdentifierOrFunction()],
      [TokenType.UPPER, () => this.parseIdentifierOrFunction()],
      // Keywords that can also be identifiers in certain contexts
      [TokenType.AND, () => this.parseIdentifierOrFunction()],
      [TokenType.OR, () => this.parseIdentifierOrFunction()],
      [TokenType.IMPLIES, () => this.parseIdentifierOrFunction()],
      [TokenType.DIV, () => this.parseIdentifierOrFunction()],
      [TokenType.MOD, () => this.parseIdentifierOrFunction()],
      [TokenType.XOR, () => this.parseIdentifierOrFunction()],
      
      // Grouped expressions
      [TokenType.LPAREN, () => this.parseGroupedExpression()],
      
      // Unary operators
      [TokenType.MINUS, () => this.parseUnaryExpression()],
      [TokenType.PLUS, () => this.parseUnaryExpression()],
      
      // Variables
      [TokenType.DOLLAR, () => this.parseVariable()],
      [TokenType.PERCENT, () => this.parseEnvironmentVariable()],
      [TokenType.TOTAL, () => this.parseTotalVariable()]
    ]);
  }

  /**
   * Parse a FHIRPath expression string into an AST
   * 
   * This is the main entry point for parsing. It:
   * 1. Resets the tokenizer with the input
   * 2. Advances to the first token
   * 3. Parses the complete expression
   * 4. Ensures all input was consumed
   * 
   * @param input The FHIRPath expression to parse
   * @returns The root node of the AST
   * @throws ParseError if the expression is invalid
   */
  parse(input: string): ASTNode {
    this.expression = input;  // Store for error reporting
    this.tokenizer.reset(input);
    this.cachedNext = null; // Reset cache for new parse
    this.advance();
    
    // Empty expressions are not valid in FHIRPath
    if (this.current.type === TokenType.EOF) {
      const error = new ParseError('Empty expression. Please provide a valid FHIRPath expression.', 0, 1, 1);
      (error as any).expression = this.expression;
      throw error;
    }
    
    // Parse with lowest precedence to capture the entire expression
    const expr = this.parseExpression(Precedence.LOWEST);
    
    // Ensure we've consumed all input
    if ((this.current.type as TokenType) !== TokenType.EOF) {
      throw this.error(`Unexpected ${this.current.value || 'token'} at end of expression. The expression appears to be incomplete or has extra tokens.`);
    }
    
    return expr;
  }

  /**
   * Move to the next token in the stream
   * Updates both current and previous token references
   */
  private advance(): void {
    this.previous = { ...this.current };
    this.current = this.tokenizer.nextToken();
    // Clear cached next token since we've advanced
    this.cachedNext = null;
  }

  /**
   * Check if the current token matches the given type
   * Does not consume the token
   */
  private check(type: TokenType): boolean {
    return this.current.type === type;
  }

  /**
   * Get the current token without consuming it
   */
  private peek(): Token {
    return this.current;
  }

  /**
   * Look ahead to the next token without consuming any tokens
   * 
   * This is used for disambiguation when needed.
   * 
   * Optimized version that caches the next token to avoid repeated
   * tokenizer state saves/restores.
   */
  private cachedNext: Token | null = null;
  
  private peekNext(): Token {
    // If we already have a cached next token, return it
    if (this.cachedNext) {
      return this.cachedNext;
    }
    
    // Save minimal state needed
    const savedState = this.tokenizer.saveState();
    const savedCurrent = this.current;
    
    // Get next token
    this.current = this.tokenizer.nextToken();
    this.cachedNext = this.current;
    
    // Restore state
    this.tokenizer.restoreState(savedState);
    this.current = savedCurrent;
    
    return this.cachedNext;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      const token = this.current;
      this.advance();
      return token;
    }
    throw this.error(message);
  }

  private error(message: string): ParseError {
    // Use tokenizer's position info for accurate error reporting
    const error = new ParseError(
      message,
      this.current.start,
      this.current.line,
      this.current.column
    );
    // Add the expression as a property for formatting
    (error as any).expression = this.expression;
    return error;
  }

  /**
   * Parse an expression using Pratt parsing (precedence climbing)
   * 
   * This is the core of the expression parser that implements operator precedence parsing.
   * It converts infix expressions into a properly structured AST with correct precedence
   * and associativity rules.
   * 
   * ## Algorithm Overview:
   * 1. Parse a prefix expression (literal, identifier, unary op, etc.)
   * 2. Repeatedly check for infix/postfix operators
   * 3. Parse operators based on precedence rules
   * 4. Build expression tree from left to right
   * 
   * ## How Precedence Works:
   * The minPrecedence parameter controls which operators can be parsed at this level.
   * Higher precedence operators bind tighter than lower precedence ones.
   * 
   * Example: `a + b * c`
   * 1. Parse `a` (prefix)
   * 2. See `+` (precedence 6), call parseBinaryExpression(a, 6)
   * 3. In parseBinaryExpression, parse right side with precedence 6
   * 4. See `*` (precedence 7), since 7 > 6, it gets parsed first
   * 5. Results in `a + (b * c)` instead of `(a + b) * c`
   * 
   * ## Left-Associativity:
   * For operators of equal precedence, ensures left-to-right evaluation.
   * 
   * Example: `a + b + c`
   * 1. Parse `a`
   * 2. See first `+`, create `(a + b)`
   * 3. See second `+`, create `((a + b) + c)`
   * 
   * This happens because parseBinaryExpression calls parseExpression with the
   * same precedence, not precedence + 1.
   * 
   * ## Expression Types Handled:
   * - **Literals**: `42`, `"hello"`, `true` → parsePrefixExpression()
   * - **Identifiers**: `Patient`, `name` → parsePrefixExpression()
   * - **Binary Ops**: `a + b`, `x = y` → parseBinaryExpression()
   * - **Unary Ops**: `-x`, `+x` → parsePrefixExpression()
   * - **Dot Access**: `Patient.name` → parsePostfixExpression()
   * - **Indexing**: `name[0]` → parsePostfixExpression()
   * - **Functions**: `exists()`, `where(x > 5)` → parsePostfixExpression()
   * 
   * @param minPrecedence Minimum precedence level to parse
   * @returns The parsed expression AST node with correct precedence and associativity
   */
  private parseExpression(minPrecedence: Precedence): ASTNode {
    // Start with a prefix expression (literal, identifier, parentheses, etc.)
    let left = this.parsePrefixExpression();

    // PERFORMANCE OPTIMIZATION: Cache current token type to avoid repeated property access
    // Property access can be slower than local variable access in hot loops
    let currentType = this.current.type;

    // Continue parsing while we have tokens
    while (currentType !== TokenType.EOF) {
      // OPTIMIZATION: Single precedence lookup using cached token type
      // Avoids method call overhead and property access
      const precedence = PRECEDENCE_MAP[currentType] ?? Precedence.LOWEST;
      
      // Check for infix operators (binary operators)
      if (precedence > Precedence.LOWEST && precedence > minPrecedence) {
        // Parse binary operator with appropriate precedence
        left = this.parseBinaryExpression(left, precedence);
      } 
      // OPTIMIZATION: Direct postfix operator check
      // Avoids method call overhead for this hot path check
      else if (currentType === TokenType.DOT || 
               currentType === TokenType.LBRACKET || 
               currentType === TokenType.LPAREN) {
        // These have highest precedence and are left-associative
        left = this.parsePostfixExpression(left);
      } else {
        // No applicable operator - we're done with this expression
        break;
      }
      
      // OPTIMIZATION: Update cached token type after parsing
      currentType = this.current.type;
    }

    return left;
  }

  /**
   * Parse a prefix expression (appears at the start of an expression)
   * 
   * Prefix expressions include:
   * - Literals (numbers, strings, booleans, dates, quantities)
   * - Identifiers and function calls
   * - Unary operators (+, -)
   * - Grouped expressions in parentheses
   * - Variables ($this) and environment variables (%resource)
   * 
   * This method uses a dispatch table for O(1) lookup performance.
   */
  private parsePrefixExpression(): ASTNode {
    const parser = this.prefixParsers.get(this.current.type);
    if (!parser) {
      throw this.error(`Unexpected ${this.current.value || 'token'} in expression. Expected an operand, function, or identifier.`);
    }
    return parser();
  }
  


  /**
   * Parse a postfix expression (operators that come after their operand)
   * 
   * Postfix operators in FHIRPath have the **highest precedence** and are processed
   * from left to right, enabling natural method chaining and property access.
   * 
   * ## The 3 Postfix Operators:
   * 
   * ### 1. DOT (`.`) - Property Access & Method Calls
   * - **Property access**: `Patient.name` - access the `name` property of `Patient`
   * - **Method calls**: `name.exists()` - call the `exists()` method on `name`
   * - **Chained operations**: `Patient.name.given.first()` - chain multiple operations
   * - **Environment variables**: `defineVariable('x', name).%resource`
   * 
   * ### 2. LBRACKET (`[`) - Indexing & Filtering
   * - **Numeric indexing**: `name[0]` - get the first element of `name` array
   * - **Dynamic indexing**: `items[index + 1]` - use expressions as indices
   * - **Boolean filtering**: `Patient.name[use = 'official']` - filter with conditions
   * - **Complex expressions**: `data[value > 10 and active = true]`
   * 
   * ### 3. LPAREN (`(`) - Function Calls
   * - **No arguments**: `exists()` - call function with no parameters
   * - **Single argument**: `where(condition)` - call function with one parameter
   * - **Multiple arguments**: `substring(1, 3)` - call function with multiple parameters
   * - **Nested expressions**: `select(name.given.first())`
   * 
   * ## Precedence & Associativity:
   * 
   * **Highest Precedence**: Postfix operators bind tighter than any other operator type.
   * This means they are evaluated first in complex expressions.
   * 
   * **Left-Associative**: Multiple postfix operators are processed left to right.
   * 
   * ### Example: `Patient.name.given[0].exists()`
   * 1. `Patient.name` (dot)
   * 2. `(Patient.name).given` (dot)
   * 3. `((Patient.name).given)[0]` (bracket)
   * 4. `(((Patient.name).given)[0]).exists()` (function call)
   * 
   * ## Method Chaining:
   * The left-to-right evaluation enables natural method chaining:
   * ```
   * Patient.name
   *   .where(use = 'official')
   *   .given
   *   .first()
   * ```
   * 
   * Each postfix operation uses the result of the previous operation as its
   * left operand, creating a fluent interface for building complex queries.
   * 
   * @param left The left operand (already parsed expression)
   * @returns The postfix expression AST node (dot, indexer, or function call)
   * @throws ParseError if the postfix operator is invalid or malformed
   */
  private parsePostfixExpression(left: ASTNode): ASTNode {
    switch (this.current.type) {
      case TokenType.DOT:
        return this.parseDotExpression(left);
      case TokenType.LBRACKET:
        return this.parseIndexerExpression(left);
      case TokenType.LPAREN:
        // Function call on identifier
        if (isIdentifierNode(left)) {
          return this.parseFunctionCall(left.name, left.start);
        }
        throw this.error('Invalid function call. Function calls must have the format: functionName() or functionName(arguments).');
      default:
        throw this.error(`Unexpected postfix operator '${this.current.value}'. Valid postfix operators are: . (dot), [ (indexer), and ( (function call)`);
    }
  }

  /**
   * Generic literal parser factory to reduce code duplication
   * Handles all literal types with consistent pattern
   */
  private parseLiteral(dataType: LiteralNode['dataType'], valueTransform?: (value: string) => any): LiteralNode {
    const rawValue = this.current.value;
    const start = this.current.start;
    const end = this.current.end;
    this.advance();
    
    const value = valueTransform ? valueTransform(rawValue) : rawValue;
    
    return NodeBuilder.literal(value, dataType, start, end);
  }

  private parseNumber(): LiteralNode {
    return this.parseLiteral('number', parseFloat);
  }

  private parseString(): LiteralNode {
    return this.parseLiteral('string');
  }

  private parseBoolean(): LiteralNode {
    return this.parseLiteral('boolean', value => value === 'true');
  }

  private parseDate(): LiteralNode {
    return this.parseLiteral('date');
  }

  private parseTime(): LiteralNode {
    return this.parseLiteral('time');
  }

  private parseDateTime(): LiteralNode {
    return this.parseLiteral('datetime');
  }

  private parseQuantity(): LiteralNode {
    return this.parseLiteral('quantity');
  }

  private parseLongNumber(): LiteralNode {
    return this.parseLiteral('number', (value) => {
      // Remove the L suffix and parse as number
      return parseInt(value.slice(0, -1), 10);
    });
  }

  private parseNullLiteral(): NullLiteralNode {
    const start = this.current.start;
    const end = this.current.end;
    this.advance();
    return NodeBuilder.nullLiteral(start, end);
  }

  /**
   * Parse an identifier or function call
   * 
   * This method handles both:
   * - Simple identifiers: Patient, name, value
   * - Function calls: exists(), where(condition), select(expr)
   * 
   * Many FHIRPath functions are keywords but can still be used as:
   * - Function names: where(...), exists()
   * - Property names after dots: name.exists()
   * 
   * The method converts keyword tokens back to their string names
   * for consistent AST representation.
   */
  private parseIdentifierOrFunction(): ASTNode {
    const name = this.current.value;
    const start = this.current.start;
    const type = this.current.type;
    const end = this.current.end;
    this.advance();

    // Special handling for boolean tokens when used as identifiers
    let functionName: string;
    if (type === TokenType.BOOLEAN) {
      functionName = name; // 'true' or 'false'
    } else {
      // Use O(1) lookup for function name mapping
      functionName = TOKEN_TO_FUNCTION_NAME[type] ?? name;
    }

    // Check if this identifier is followed by parentheses (function call)
    if (this.check(TokenType.LPAREN)) {
      return this.parseFunctionCall(functionName, start);
    }

    // Just an identifier (property access, type name, etc.)
    return NodeBuilder.identifier(functionName, start, end);
  }

  /**
   * Parse a function call expression
   * 
   * Function calls in FHIRPath:
   * - Can have zero arguments: exists(), empty(), not()
   * - Can have one argument: where(condition), select(expr)
   * - Can have multiple arguments: substring(start, length)
   * - Arguments are full expressions, allowing complex nesting
   * 
   * @param name The function name (already parsed)
   * @param start Start position of the function name
   * @returns Function call AST node with name and arguments
   */
  private parseFunctionCall(name: string, start: number): FunctionCallNode {
    this.consume(TokenType.LPAREN, 'Expected opening parenthesis "(" for function call');
    
    // PERFORMANCE OPTIMIZATION: Pre-size argument array based on common patterns
    // Most FHIRPath functions have 0-2 arguments:
    // - 0 args: exists(), empty(), not(), first(), last()
    // - 1 arg: where(expr), select(expr), all(expr), repeat(expr)
    // - 2 args: substring(start, length), combine(other), union(other)
    // Pre-sizing avoids array growth/reallocation for common cases
    let args: ASTNode[];
    
    // Parse arguments if present
    // Empty argument list is valid for many FHIRPath functions
    if (!this.check(TokenType.RPAREN)) {
      // OPTIMIZATION: Start with capacity for 2 arguments (covers ~95% of cases)
      args = new Array(2);
      let argCount = 0;
      
      do {
        // OPTIMIZATION: Grow array exponentially if needed
        if (argCount >= args.length) {
          // Double the array size to minimize reallocations
          const newArgs = new Array(args.length * 2);
          for (let i = 0; i < argCount; i++) {
            newArgs[i] = args[i];
          }
          args = newArgs;
        }
        
        // Each argument is a full expression
        // This allows complex expressions as arguments
        args[argCount++] = this.parseExpression(Precedence.LOWEST);
      } while (this.match(TokenType.COMMA)); // Continue if comma found
      
      // OPTIMIZATION: Trim array to actual size to save memory
      args.length = argCount;
    } else {
      // OPTIMIZATION: Use empty array singleton for no-argument functions
      args = [];
    }
    
    const rparen = this.consume(TokenType.RPAREN, 'Expected closing parenthesis ")" to match opening parenthesis');
    
    return NodeBuilder.function(name, args, start, rparen.end);
  }

  private parseGroupedExpression(): ASTNode {
    this.advance(); // consume (
    const expr = this.parseExpression(Precedence.LOWEST);
    this.consume(TokenType.RPAREN, 'Expected closing parenthesis ")" after function arguments');
    return expr;
  }

  private parseUnaryExpression(): UnaryOpNode {
    const op = this.current.type;
    const start = this.current.start;
    this.advance();
    
    const operand = this.parseExpression(Precedence.UNARY);
    
    return NodeBuilder.unary(op, operand, start);
  }

  /**
   * Parse a binary expression (infix operator)
   * 
   * Handles operators like +, -, *, /, =, !=, and, or, etc.
   * Special handling for type operators (is, as) which have
   * different parsing rules.
   * 
   * The precedence parameter ensures correct binding strength.
   * Left associativity is achieved by passing the same precedence
   * to the recursive call (not precedence + 1).
   * 
   * @param left The left operand (already parsed)
   * @param precedence The precedence of the current operator
   * @returns Binary operation AST node
   */
  private parseBinaryExpression(left: ASTNode, precedence: Precedence): ASTNode {
    const op = this.current.type;
    const start = left.start;
    
    // Type operators have special syntax - they expect a type name, not an expression
    if (op === TokenType.IS_TYPE) {
      return this.parseIsExpression(left);
    }
    if (op === TokenType.AS_TYPE) {
      return this.parseAsExpression(left);
    }
    
    this.advance(); // consume the operator
    
    // Parse the right operand with the same precedence
    // This ensures left-to-right associativity for operators of equal precedence
    // For example: a + b + c parses as (a + b) + c, not a + (b + c)
    const right = this.parseExpression(precedence);
    
    return NodeBuilder.binary(op, left, right);
  }

  /**
   * Parse a dot expression (property access or method call)
   * 
   * The dot operator in FHIRPath:
   * - Accesses properties: Patient.name
   * - Calls methods: name.exists()
   * - Chains operations: Patient.name.given.first()
   * - Can access environment variables: defineVariable('x', name).%resource
   * 
   * After a dot, we can have:
   * - Regular identifiers
   * - Keywords used as method names (exists, where, select, etc.)
   * - Environment variables (%resource, %context)
   * 
   * @param left The expression before the dot
   * @returns Dot expression AST node
   */
  private parseDotExpression(left: ASTNode): DotNode {
    const start = left.start;
    this.advance(); // consume .
    
    // Special case: environment variables after dot
    // Example: defineVariable('x', value).%resource
    if (this.check(TokenType.PERCENT)) {
      const right = this.parseEnvironmentVariable();
      return NodeBuilder.dot(left, right);
    }
    
    // After dot, we expect an identifier or a keyword that can act as a method
    // Use O(1) Set lookup instead of multiple checks
    if (!VALID_DOT_TOKENS.has(this.current.type)) {
      throw this.error('Expected identifier after dot operator. The dot operator must be followed by a property name or function name.');
    }
    
    // Parse the identifier or function call
    const right = this.parseIdentifierOrFunction();
    
    return NodeBuilder.dot(left, right);
  }

  /**
   * Parse an indexer expression (array/collection access)
   * 
   * Indexer syntax in FHIRPath:
   * - Numeric index: name[0], identifier[1]
   * - Expression index: items[index + 1]
   * - Filtering: Patient.name[use = 'official']
   * 
   * The index can be any expression, not just a number.
   * When the index is a boolean expression, it acts as a filter.
   * 
   * @param left The expression being indexed
   * @returns Indexer AST node
   */
  private parseIndexerExpression(left: ASTNode): IndexerNode {
    const start = left.start;
    this.advance(); // consume [
    
    // The index can be any expression
    // This includes numbers, boolean filters, calculations, etc.
    const index = this.parseExpression(Precedence.LOWEST);
    const rbracket = this.consume(TokenType.RBRACKET, 'Expected closing bracket "]" to match opening bracket');
    
    return NodeBuilder.indexer(left, index, rbracket.end);
  }

  private getPrecedence(): Precedence {
    return PRECEDENCE_MAP[this.current.type] ?? Precedence.LOWEST;
  }

  private isBinaryOperator(type: TokenType): boolean {
    return type in PRECEDENCE_MAP;
  }

  private isPostfixOperator(type: TokenType): boolean {
    return type === TokenType.DOT || type === TokenType.LBRACKET || type === TokenType.LPAREN;
  }

  private parseIsExpression(left: ASTNode): IsTypeNode {
    const start = left.start;
    this.advance(); // consume 'is'
    
    // Parse qualified type specifier (e.g., FHIR.Observation or just Observation)
    const typeName = this.parseQualifiedIdentifier();
    const end = this.previous.end;
    
    return NodeBuilder.isType(left, typeName, end);
  }

  private parseAsExpression(left: ASTNode): AsTypeNode {
    const start = left.start;
    this.advance(); // consume 'as'
    
    // Parse qualified type specifier (e.g., FHIR.Observation or just Observation)
    const typeName = this.parseQualifiedIdentifier();
    const end = this.previous.end;
    
    return NodeBuilder.asType(left, typeName, end);
  }

  /**
   * Parse a variable reference ($this, $index, etc.)
   * 
   * Variables in FHIRPath provide access to:
   * - $this: Current context item
   * - $index: Current index in repeat() or other iterations
   * - $total: Total count in certain contexts
   * - User-defined variables from defineVariable()
   * 
   * @returns Variable AST node with the variable name (without $)
   */
  private parseVariable(): VariableNode {
    const value = this.current.value; // e.g., "$this"
    const start = this.current.start;
    const end = this.current.end;
    this.advance();
    
    // Extract variable name without $ prefix
    const name = value.substring(1);
    
    return NodeBuilder.variable(name, start, end);
  }

  /**
   * Parse an environment variable reference (%resource, %context, etc.)
   * 
   * Environment variables provide access to execution context:
   * - %resource: The root resource being evaluated
   * - %context: The context resource (in search parameters)
   * - %ucum: UCUM unit definitions
   * - %sct: SNOMED CT context
   * - %loinc: LOINC context
   * - %vs: ValueSet context
   * 
   * @returns Environment variable AST node with the variable name (without %)
   */
  private parseEnvironmentVariable(): EnvironmentVariableNode {
    const value = this.current.value; // e.g., "%resource" or "%'quoted'"
    const start = this.current.start;
    const end = this.current.end;
    this.advance();
    
    // Extract variable name without % prefix
    const name = value.substring(1);
    
    return NodeBuilder.environmentVariable(name, start, end);
  }

  /**
   * Parse $total special variable
   * 
   * $total provides the total count in certain contexts,
   * such as within aggregation functions.
   */
  private parseTotalVariable(): VariableNode {
    const start = this.current.start;
    const end = this.current.end;
    this.advance();
    
    // Return as a variable node with name "total"
    return NodeBuilder.variable('total', start, end);
  }

  /**
   * Parse a qualified identifier (e.g., FHIR.Observation.component)
   * Used for type specifiers in 'is' and 'as' expressions
   */
  private parseQualifiedIdentifier(): string {
    if (!this.check(TokenType.IDENTIFIER)) {
      throw this.error('Expected identifier in qualified identifier. Format should be: namespace:identifier');
    }
    
    let qualifiedName = this.current.value;
    this.advance();
    
    // Parse additional dot-separated components
    while (this.check(TokenType.DOT)) {
      this.advance(); // consume dot
      
      if (!this.check(TokenType.IDENTIFIER)) {
        throw this.error('Expected identifier after dot in qualified type. Format should be: namespace.Type or namespace.Type.SubType');
      }
      
      qualifiedName += '.' + this.current.value;
      this.advance();
    }
    
    return qualifiedName;
  }
}

/**
 * Export a singleton parser instance for reuse
 * 
 * Using a singleton avoids the overhead of creating new parser instances
 * and allows the parser to be used as a simple function-like interface:
 * 
 * import { parser } from './parser';
 * const ast = parser.parse('Patient.name.given');
 */
export const parser = new Parser();