import { type Token, TokenType, ParseError } from "./types";

/**
 * Tokenizer (Lexer) for FHIRPath expressions
 *
 * This tokenizer converts a FHIRPath expression string into a stream of tokens.
 * It handles various FHIRPath constructs including:
 * - Literals (numbers, strings, booleans, dates, quantities)
 * - Identifiers and keywords
 * - Operators (arithmetic, comparison, logical)
 * - Special characters (parentheses, brackets, dots)
 * - Variables ($this) and environment variables (%resource)
 * - Backtick-quoted identifiers for reserved words
 *
 * The tokenizer uses character codes for efficient comparison and
 * implements a single-pass scan with lookahead for multi-character tokens.
 */

// Character codes for fast comparison - using numeric codes is more efficient
// than string comparisons in hot paths
const enum CharCode {
  TAB = 9,
  LF = 10,
  CR = 13,
  SPACE = 32,
  BANG = 33, // !
  QUOTE = 34, // "
  DOLLAR = 36, // $
  PERCENT = 37, // %
  AMPERSAND = 38, // &
  APOSTROPHE = 39, // '
  LPAREN = 40, // (
  RPAREN = 41, // )
  ASTERISK = 42, // *
  PLUS = 43, // +
  COMMA = 44, // ,
  MINUS = 45, // -
  DOT = 46, // .
  SLASH = 47, // /
  ZERO = 48, // 0
  NINE = 57, // 9
  LT = 60, // <
  EQUALS = 61, // =
  GT = 62, // >
  AT = 64, // @
  A_UPPER = 65, // A
  Z_UPPER = 90, // Z
  LBRACKET = 91, // [
  BACKSLASH = 92, // \
  RBRACKET = 93, // ]
  UNDERSCORE = 95, // _
  BACKTICK = 96, // `
  A_LOWER = 97, // a
  Z_LOWER = 122, // z
  LBRACE = 123, // {
  PIPE = 124, // |
  RBRACE = 125, // }
  TILDE = 126, // ~
}

export class Tokenizer {
  private input: string = ""; // The input FHIRPath expression
  private position: number = 0; // Current position in the input string
  private line: number = 1; // Current line number (for error reporting)
  private column: number = 1; // Current column number (for error reporting)
  private tokenStartLine: number = 1; // Line where current token starts
  private tokenStartColumn: number = 1; // Column where current token starts

  // PERFORMANCE OPTIMIZATION: Lookup tables for O(1) character classification
  // Using static lookup tables avoids multiple conditional checks in hot paths
  // and provides better CPU cache locality compared to if-else chains

  // Whitespace lookup table - indexed by character code for O(1) access
  // 1 = whitespace, 0 = non-whitespace
  private static readonly WHITESPACE_TABLE = new Uint8Array(256);

  // Hex digit value lookup table - indexed by character code
  // -1 = not a hex digit, 0-15 = hex value
  // This eliminates 6 comparisons per hex digit in Unicode escape sequences
  private static readonly HEX_VALUES = new Int8Array(256);

  // String interning map for common tokens to reduce memory allocations
  // Most FHIRPath expressions use the same operators and keywords repeatedly
  private static readonly INTERNED_STRINGS = new Map<string, string>();

  // Static initializer block to populate lookup tables once at startup
  static {
    // Initialize whitespace table
    Tokenizer.WHITESPACE_TABLE[CharCode.SPACE] = 1;
    Tokenizer.WHITESPACE_TABLE[CharCode.TAB] = 1;
    Tokenizer.WHITESPACE_TABLE[CharCode.CR] = 1;
    Tokenizer.WHITESPACE_TABLE[CharCode.LF] = 1;

    // Initialize hex values table
    Tokenizer.HEX_VALUES.fill(-1);
    // Digits 0-9
    for (let i = CharCode.ZERO; i <= CharCode.NINE; i++) {
      Tokenizer.HEX_VALUES[i] = i - CharCode.ZERO;
    }
    // Letters a-f (lowercase)
    for (let i = CharCode.A_LOWER; i <= 102; i++) {
      // 102 = 'f'
      Tokenizer.HEX_VALUES[i] = i - CharCode.A_LOWER + 10;
    }
    // Letters A-F (uppercase)
    for (let i = CharCode.A_UPPER; i <= 70; i++) {
      // 70 = 'F'
      Tokenizer.HEX_VALUES[i] = i - CharCode.A_UPPER + 10;
    }

    // Initialize string interning for common tokens
    // These strings appear frequently in FHIRPath expressions
    const commonTokens = [
      "(",
      ")",
      "[",
      "]",
      "{",
      "}",
      ".",
      ",",
      "+",
      "-",
      "*",
      "/",
      "=",
      "!=",
      "<",
      ">",
      "<=",
      ">=",
      "~",
      "!~",
      "|",
      "and",
      "or",
      "xor",
      "implies",
      "true",
      "false",
      "null",
      "is",
      "as",
      "in",
      "contains",
      "div",
      "mod",
      "where",
      "select",
      "all",
      "exists",
      "empty",
      "first",
      "last",
      "tail",
      "skip",
      "take",
      "union",
      "combine",
      "intersect",
      "exclude",
      "$this",
      "%resource",
      "%context",
      "%ucum",
      "%sct",
      "%loinc",
      "%rxnorm",
    ];

    for (const token of commonTokens) {
      Tokenizer.INTERNED_STRINGS.set(token, token);
    }
  }

  // Getters and setters for position management - used by the parser for lookahead
  get currentPosition(): number {
    return this.position;
  }

  set currentPosition(pos: number) {
    this.position = pos;
  }

  // Save and restore state for lookahead - allows parser to peek ahead
  // without consuming tokens
  saveState(): { position: number; line: number; column: number } {
    return {
      position: this.position,
      line: this.line,
      column: this.column,
    };
  }

  restoreState(state: {
    position: number;
    line: number;
    column: number;
  }): void {
    this.position = state.position;
    this.line = state.line;
    this.column = state.column;
  }

  // Reusable token object to minimize allocations - improves performance
  // by avoiding creating new objects for each token
  private token: Token = {
    type: TokenType.EOF,
    value: "",
    start: 0,
    end: 0,
    line: 1,
    column: 1,
  };

  /**
   * Reset the tokenizer with a new input string
   */
  reset(input: string): void {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  /**
   * Get the next token from the input stream
   * This is the main entry point for the tokenizer
   */
  nextToken(): Token {
    // Skip any whitespace before the next token
    this.skipWhitespace();

    // Check for end of input
    if (this.position >= this.input.length) {
      return this.makeToken(TokenType.EOF, "");
    }

    // Track the start position of this token for accurate error reporting
    const start = this.position;
    this.tokenStartLine = this.line;
    this.tokenStartColumn = this.column;
    const ch = this.input.charCodeAt(this.position);

    // Single character tokens - handled first for efficiency
    switch (ch) {
      case CharCode.LPAREN:
        this.advance();
        return this.makeToken(TokenType.LPAREN, "(");
      case CharCode.RPAREN:
        this.advance();
        return this.makeToken(TokenType.RPAREN, ")");
      case CharCode.LBRACKET:
        this.advance();
        return this.makeToken(TokenType.LBRACKET, "[");
      case CharCode.RBRACKET:
        this.advance();
        return this.makeToken(TokenType.RBRACKET, "]");
      case CharCode.COMMA:
        this.advance();
        return this.makeToken(TokenType.COMMA, ",");
      case CharCode.DOT:
        this.advance();
        return this.makeToken(TokenType.DOT, ".");
      case CharCode.PIPE:
        this.advance();
        return this.makeToken(TokenType.PIPE, "|");
      case CharCode.PLUS:
        this.advance();
        return this.makeToken(TokenType.PLUS, "+");
      case CharCode.MINUS:
        this.advance();
        return this.makeToken(TokenType.MINUS, "-");
      case CharCode.ASTERISK:
        this.advance();
        return this.makeToken(TokenType.MULTIPLY, "*");
      case CharCode.SLASH:
        this.advance();
        return this.makeToken(TokenType.DIVIDE, "/");
      case CharCode.AMPERSAND:
        this.advance();
        return this.makeToken(TokenType.AMPERSAND, "&");
      case CharCode.DOLLAR:
        // $ prefix for variables like $this, $value
        // FHIRPath uses $ to reference the current context
        return this.readVariable();
      case CharCode.PERCENT:
        // % prefix for environment variables like %resource, %context, %ucum
        // These are predefined variables in the FHIRPath execution environment
        return this.readEnvironmentVariable();
      case CharCode.LBRACE:
        // Check for null literal {}
        if (this.peek(1) === CharCode.RBRACE) {
          this.advance(); // consume {
          this.advance(); // consume }
          return this.makeToken(TokenType.NULL_LITERAL, "{}", start);
        }
        this.advance();
        return this.makeToken(TokenType.LBRACE, "{");
      case CharCode.RBRACE:
        this.advance();
        return this.makeToken(TokenType.RBRACE, "}");
      case CharCode.TILDE:
        this.advance();
        return this.makeToken(TokenType.EQUIVALENCE, "~");
    }

    // Multi-character tokens - require lookahead
    if (ch === CharCode.BANG) {
      this.advance();
      if (this.peek() === CharCode.EQUALS) {
        this.advance();
        return this.makeToken(TokenType.NOT_EQUALS, "!=");
      } else if (this.peek() === CharCode.TILDE) {
        this.advance();
        return this.makeToken(TokenType.NOT_EQUIVALENCE, "!~");
      }
      throw this.error("Unexpected character: !");
    }

    if (ch === CharCode.EQUALS) {
      this.advance();
      return this.makeToken(TokenType.EQUALS, "=");
    }

    if (ch === CharCode.LT) {
      this.advance();
      if (this.peek() === CharCode.EQUALS) {
        this.advance();
        return this.makeToken(TokenType.LESS_EQUALS, "<=");
      }
      return this.makeToken(TokenType.LESS_THAN, "<");
    }

    if (ch === CharCode.GT) {
      this.advance();
      if (this.peek() === CharCode.EQUALS) {
        this.advance();
        return this.makeToken(TokenType.GREATER_EQUALS, ">=");
      }
      return this.makeToken(TokenType.GREATER_THAN, ">");
    }

    // String literals - only single quotes allowed in FHIRPath
    if (ch === CharCode.APOSTROPHE) {
      return this.readString(ch);
    }

    // Double quotes are not allowed in FHIRPath
    if (ch === CharCode.QUOTE) {
      throw this.error(
        "Double-quoted strings are not allowed in FHIRPath. Use single quotes instead.",
      );
    }

    // Date/Time literals - FHIRPath supports @2023-01-01 syntax
    if (ch === CharCode.AT) {
      return this.readDateTime();
    }

    // Numbers - including decimals and quantities (e.g., 5.0 'mg')
    if (this.isDigit(ch)) {
      return this.readNumber();
    }

    // Identifiers and keywords
    // Identifiers start with a letter or underscore
    if (this.isIdentifierStart(ch)) {
      return this.readIdentifier();
    }

    // Backtick-quoted identifiers (e.g., `div`)
    // Used to escape reserved words or include special characters
    if (ch === CharCode.BACKTICK) {
      return this.readQuotedIdentifier();
    }

    // If we get here, we have an unexpected character
    throw this.error(`Unexpected character: ${String.fromCharCode(ch)}`);
  }

  /**
   * Create a token with the given type and value
   * Reuses the same token object to avoid allocations
   * PERFORMANCE OPTIMIZATION: Apply string interning for common tokens
   * This reduces memory usage and improves string comparison performance
   * since identical strings will share the same reference
   *
   * Now includes line and column information for better error reporting
   */
  private makeToken(type: TokenType, value: string, start?: number): Token {
    // OPTIMIZATION: Apply string interning for common tokens
    // This is especially beneficial for operators and keywords
    const interned = Tokenizer.INTERNED_STRINGS.get(value);
    if (interned !== undefined) {
      value = interned;
    }

    this.token.type = type;
    this.token.value = value;
    this.token.start = start ?? this.position - value.length;
    this.token.end = this.position;

    // Use the tracked token start position for accurate line/column
    this.token.line = this.tokenStartLine;
    this.token.column = this.tokenStartColumn;

    return this.token;
  }

  /**
   * Advance to the next character, updating line/column tracking
   */
  private advance(): void {
    if (this.input.charCodeAt(this.position) === CharCode.LF) {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  /**
   * Peek at the character at the given offset without consuming it
   */
  private peek(offset: number = 0): number {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input.charCodeAt(pos) : -1;
  }

  /**
   * Skip whitespace characters (space, tab, CR, LF) and comments
   * PERFORMANCE OPTIMIZATION: This method is called before every token and is one of the hottest
   * paths in the tokenizer. Several optimizations have been applied:
   * 1. Use lookup table for O(1) whitespace checking instead of 4 comparisons
   * 2. Minimize method calls by inlining position/line/column updates
   * 3. Cache input string and length in local variables to avoid property access
   * 4. Use a single bounds check per iteration where possible
   */
  private skipWhitespace(): void {
    // OPTIMIZATION: Cache frequently accessed values in local variables
    // This avoids repeated property access which can be slower
    const input = this.input;
    const len = input.length;
    let pos = this.position;
    let line = this.line;
    let column = this.column;

    while (pos < len) {
      const ch = input.charCodeAt(pos);

      // OPTIMIZATION: Use lookup table for whitespace check
      // This replaces 4 comparisons with 1 array lookup + 1 range check
      // The range check ensures we don't access outside the lookup table
      if (ch < 256 && Tokenizer.WHITESPACE_TABLE[ch]) {
        // OPTIMIZATION: Inline advance() logic to avoid method call overhead
        if (ch === CharCode.LF) {
          line++;
          column = 1;
        } else {
          column++;
        }
        pos++;
        continue;
      }

      // Check for comments
      if (ch === CharCode.SLASH && pos + 1 < len) {
        const nextCh = input.charCodeAt(pos + 1);

        // Single-line comment //
        if (nextCh === CharCode.SLASH) {
          pos += 2; // Skip both slashes at once
          column += 2;

          // OPTIMIZATION: Tight loop with minimal checks
          while (pos < len) {
            const commentCh = input.charCodeAt(pos);
            if (commentCh === CharCode.LF) {
              // Don't advance past the newline, let main loop handle it
              break;
            } else if (commentCh === CharCode.CR) {
              break;
            }
            pos++;
            column++;
          }
          continue;
        }

        // Multi-line comment /* */
        if (nextCh === CharCode.ASTERISK) {
          pos += 2; // Skip /* at once
          column += 2;

          // OPTIMIZATION: Look for */ pattern efficiently
          while (pos < len - 1) {
            // -1 because we need to check pos+1
            const commentCh = input.charCodeAt(pos);

            // Track line/column for multi-line comments
            if (commentCh === CharCode.LF) {
              line++;
              column = 1;
            } else {
              column++;
            }

            if (
              commentCh === CharCode.ASTERISK &&
              input.charCodeAt(pos + 1) === CharCode.SLASH
            ) {
              pos += 2; // Skip */ at once
              column++;
              break;
            }
            pos++;
          }

          // Handle case where we might have a trailing * without /
          if (pos === len - 1) {
            pos++;
            column++;
          }

          // Check if we reached end without closing
          if (
            pos >= len &&
            (pos < 2 ||
              input.charCodeAt(pos - 2) !== CharCode.ASTERISK ||
              input.charCodeAt(pos - 1) !== CharCode.SLASH)
          ) {
            // Update instance variables before throwing
            this.position = pos;
            this.line = line;
            this.column = column;
            throw this.error("Unterminated comment");
          }
          continue;
        }
      }

      // Not whitespace or comment, stop
      break;
    }

    // OPTIMIZATION: Update instance variables only once at the end
    // This reduces memory writes during the loop
    this.position = pos;
    this.line = line;
    this.column = column;
  }

  private isDigit(ch: number): boolean {
    return ch >= CharCode.ZERO && ch <= CharCode.NINE;
  }

  private isIdentifierStart(ch: number): boolean {
    return (
      (ch >= CharCode.A_LOWER && ch <= CharCode.Z_LOWER) ||
      (ch >= CharCode.A_UPPER && ch <= CharCode.Z_UPPER) ||
      ch === CharCode.UNDERSCORE
    );
  }

  private isIdentifierPart(ch: number): boolean {
    return this.isIdentifierStart(ch) || this.isDigit(ch);
  }

  /**
   * Read a string literal enclosed in quotes (' or ")
   * Handles escape sequences like \n, \t, \r, \\, \', \"
   * PERFORMANCE OPTIMIZATION: String concatenation creates intermediate string objects
   * which causes memory allocations and garbage collection pressure. This optimized version:
   * 1. Collects character codes in an array instead of concatenating strings
   * 2. Builds the final string once at the end using String.fromCharCode
   * 3. Pre-allocates the array with an estimated size to minimize array growth
   * 4. Uses the optimized hex lookup table for Unicode escapes
   */
  private readString(quote: number): Token {
    const start = this.position;
    this.advance(); // skip opening quote

    // OPTIMIZATION: Pre-allocate array for characters
    // Most strings in FHIRPath are relatively short (< 64 chars)
    // Using an array avoids creating many intermediate string objects
    const chars: number[] = new Array(64);
    let charCount = 0;

    while (this.position < this.input.length) {
      const ch = this.input.charCodeAt(this.position);

      if (ch === quote) {
        // Check for escaped quote ('' in FHIRPath)
        if (
          quote === CharCode.APOSTROPHE &&
          this.position + 1 < this.input.length &&
          this.input.charCodeAt(this.position + 1) === CharCode.APOSTROPHE
        ) {
          // This is an escaped single quote
          this.advance(); // skip first quote
          this.advance(); // skip second quote

          // OPTIMIZATION: Grow array if needed
          if (charCount >= chars.length) {
            chars.length *= 2;
          }
          chars[charCount++] = CharCode.APOSTROPHE;
          continue;
        }

        this.advance(); // skip closing quote

        // OPTIMIZATION: Build string once at the end
        // For small strings, we can use the spread operator
        // For larger strings, we should use a different approach to avoid stack overflow
        let value: string;
        if (charCount <= 1024) {
          // Safe to use spread operator for small strings
          value = String.fromCharCode(...chars.slice(0, charCount));
        } else {
          // For large strings, build in chunks to avoid stack overflow
          value = "";
          for (let i = 0; i < charCount; i += 1024) {
            value += String.fromCharCode(
              ...chars.slice(i, Math.min(i + 1024, charCount)),
            );
          }
        }

        // OPTIMIZATION: Apply string interning for common strings
        const interned = Tokenizer.INTERNED_STRINGS.get(value);
        if (interned) {
          value = interned;
        }

        // Create token with proper start/end positions
        this.token.type = TokenType.STRING;
        this.token.value = value;
        this.token.start = start;
        this.token.end = this.position;
        return this.token;
      }

      // Handle escape sequences
      if (ch === CharCode.BACKSLASH) {
        this.advance();
        if (this.position >= this.input.length) {
          throw this.error("Unterminated string escape");
        }

        const escaped = this.input.charCodeAt(this.position);

        // OPTIMIZATION: Grow array if needed (double the size)
        if (charCount >= chars.length) {
          chars.length *= 2;
        }

        switch (escaped) {
          case CharCode.BACKSLASH:
          case CharCode.APOSTROPHE:
          case CharCode.QUOTE: // \" - double quote escape
          case CharCode.BACKTICK:
            chars[charCount++] = escaped;
            this.advance();
            break;
          case 110: // n
            chars[charCount++] = CharCode.LF;
            this.advance();
            break;
          case 114: // r
            chars[charCount++] = CharCode.CR;
            this.advance();
            break;
          case 116: // t
            chars[charCount++] = CharCode.TAB;
            this.advance();
            break;
          case 102: // f (form feed)
            chars[charCount++] = 12; // \f
            this.advance();
            break;
          case CharCode.SLASH: // / (forward slash)
            chars[charCount++] = CharCode.SLASH;
            this.advance();
            break;
          case 117: // u (Unicode escape)
            this.advance(); // skip 'u'
            // Read 4 hex digits
            let codePoint = 0;
            for (let i = 0; i < 4; i++) {
              if (this.position >= this.input.length) {
                throw this.error("Incomplete Unicode escape sequence");
              }
              const hex = this.input.charCodeAt(this.position);

              // OPTIMIZATION: Use lookup table for hex digit validation
              const hexValue = Tokenizer.HEX_VALUES[hex];
              if (hexValue === -1) {
                throw this.error(
                  "Invalid hex digit in Unicode escape sequence",
                );
              }

              codePoint = (codePoint << 4) | hexValue;
              this.advance();
            }
            chars[charCount++] = codePoint;
            break;
          default:
            // Unknown escape sequence - throw error
            throw this.error(
              `Invalid escape sequence: \\${String.fromCharCode(escaped)}`,
            );
        }
      } else {
        // OPTIMIZATION: Grow array if needed
        if (charCount >= chars.length) {
          chars.length *= 2;
        }

        chars[charCount++] = ch;
        this.advance();
      }
    }

    throw this.error("Unterminated string literal");
  }

  /**
   * Read a numeric literal, including decimals and quantities with units
   *
   * Supports:
   * - Integers: 42, 0, 123
   * - Decimals: 3.14, 0.5
   * - Quantities with quoted units: 4.5 'mg', 100 'ml'
   * - Quantities with time units: 18 years, 5 minutes, 2 hours
   *
   * The method uses backtracking to check if a number is followed by
   * a unit specifier, making it a quantity literal.
   */
  private readNumber(): Token {
    const start = this.position;

    // Read integer part - consume all consecutive digits
    while (
      this.position < this.input.length &&
      this.isDigit(this.input.charCodeAt(this.position))
    ) {
      this.advance();
    }

    // Check for decimal point followed by digits
    // We need lookahead here to ensure the dot is part of a decimal,
    // not a method call (e.g., "5.toString()" vs "5.5")
    if (
      this.position < this.input.length &&
      this.input.charCodeAt(this.position) === CharCode.DOT &&
      this.position + 1 < this.input.length &&
      this.isDigit(this.input.charCodeAt(this.position + 1))
    ) {
      this.advance(); // skip dot
    } else {
      // No decimal part, process as integer
      const value = this.input.substring(start, this.position);
      
      // Check for long number suffix (L) before checking for quantity units
      if (
        this.position < this.input.length &&
        (this.input.charCodeAt(this.position) === 76 ||
          this.input.charCodeAt(this.position) === 108)
      ) {
        // L or l
        this.advance(); // consume L
        this.token.type = TokenType.LONG_NUMBER;
        this.token.value = value + "L";
        this.token.start = start;
        this.token.end = this.position;
        return this.token;
      }
      
      // Process as a regular number token (not decimal)
      this.token.type = TokenType.NUMBER;
      this.token.value = value;
      this.token.start = start;
      this.token.end = this.position;

      // But still check if it's followed by a unit (making it a quantity)
      return this.checkForQuantityUnit(start);
    }

    // Read fractional part
    while (
      this.position < this.input.length &&
      this.isDigit(this.input.charCodeAt(this.position))
    ) {
      this.advance();
    }

    const numberValue = this.input.slice(start, this.position);

    // Check for long number suffix (L)
    if (
      this.position < this.input.length &&
      (this.input.charCodeAt(this.position) === 76 ||
        this.input.charCodeAt(this.position) === 108)
    ) {
      // L or l
      this.advance(); // consume L
      this.token.type = TokenType.LONG_NUMBER;
      this.token.value = numberValue + "L";
      this.token.start = start;
      this.token.end = this.position;
      return this.token;
    }

    // Process the number and check for quantity units
    this.token.type = TokenType.NUMBER;
    this.token.value = numberValue;
    this.token.start = start;
    this.token.end = this.position;

    return this.checkForQuantityUnit(start);
  }

  /**
   * Check if a number token is followed by a unit, making it a quantity
   */
  private checkForQuantityUnit(start: number): Token {
    // Check for quantity units (e.g., "18 years", "5 minutes", "4.5 'mg'")
    // FHIRPath supports physical quantities with units
    if (this.position < this.input.length && this.peek() === CharCode.SPACE) {
      // Save current position for potential backtracking
      const savePos = this.position;
      const saveLine = this.line;
      const saveCol = this.column;

      this.skipWhitespace();

      // Check if next token is a quoted unit (e.g., 'mg', 'ml', 'cm')
      // UCUM units are typically quoted in FHIRPath
      if (this.peek() === CharCode.APOSTROPHE) {
        // Save the number value before reading the unit
        const numberValue = this.token.value;
        const savedToken = { ...this.token }; // Save the entire token state
        const unitToken = this.readString(CharCode.APOSTROPHE);
        if (unitToken.type === TokenType.STRING) {
          // Restore the saved token and create quantity
          this.token = savedToken;
          this.token.type = TokenType.QUANTITY;
          this.token.value = numberValue + " '" + unitToken.value + "'";
          this.token.start = start;
          this.token.end = this.position;
          return this.token;
        }
        // If not a valid string, restore token state
        this.token = savedToken;
      }
      // Check if next token is an unquoted time unit
      // FHIRPath allows certain time units without quotes
      else if (this.isIdentifierStart(this.peek())) {
        const unitStart = this.position;
        // Read the potential unit identifier
        while (
          this.position < this.input.length &&
          this.isIdentifierPart(this.peek())
        ) {
          this.advance();
        }
        const unit = this.input.slice(unitStart, this.position);

        // List of valid time units in FHIRPath according to ANTLR grammar
        // dateTimePrecision: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'
        // pluralDateTimePrecision: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
        const timeUnits = [
          "year",
          "years",
          "month",
          "months",
          "week",
          "weeks",
          "day",
          "days",
          "hour",
          "hours",
          "minute",
          "minutes",
          "second",
          "seconds",
          "millisecond",
          "milliseconds",
        ];

        if (timeUnits.includes(unit)) {
          // Valid time unit - create quantity token
          const numberValue = this.token.value; // Get the number value from the token
          this.token.type = TokenType.QUANTITY;
          this.token.value = numberValue + " " + unit;
          this.token.start = start;
          this.token.end = this.position;
          return this.token;
        } else {
          // Not a recognized time unit - backtrack
          // This might be something like "5 someMethod()"
          this.position = savePos;
          this.line = saveLine;
          this.column = saveCol;
        }
      } else {
        // Not an identifier or quote after space - backtrack
        this.position = savePos;
        this.line = saveLine;
        this.column = saveCol;
      }
    }

    // Return the token as-is (already set in checkForQuantityUnit)
    return this.token;
  }

  /**
   * Read date/time literals starting with @
   *
   * FHIRPath supports three temporal literal formats:
   * - @T12:30:45.123 - Time only
   * - @2023-01-15 - Date only
   * - @2023-01-15T12:30:45.123Z - Full datetime with optional timezone
   *
   * The @ prefix distinguishes temporal literals from other values.
   * This method determines the type based on the presence of time components.
   */
  private readDateTime(): Token {
    const start = this.position;
    this.advance(); // skip @

    // Check if this is a time-only literal (@T...)
    if (this.peek() === 84) {
      // 'T' character code
      this.advance();
      // Time literal format: @THH:MM:SS.sss
      // Read time components (digits, colons, dots)
      while (this.position < this.input.length) {
        const ch = this.peek();
        if (this.isDigit(ch) || ch === 58 /* : */ || ch === 46 /* . */) {
          this.advance();
        } else {
          break;
        }
      }
      const value = this.input.slice(start + 2, this.position); // skip @T
      this.token.type = TokenType.TIME;
      this.token.value = value;
      this.token.start = start;
      this.token.end = this.position;
      return this.token;
    }

    // Date or DateTime literal
    // Format: @YYYY-MM-DD or @YYYY-MM-DDTHH:MM:SS.sss[Z|+/-HH:MM]
    let hasTime = false;
    while (this.position < this.input.length) {
      const ch = this.peek();
      // Valid characters in date/time literals:
      // - Digits for year, month, day, hour, minute, second
      // - Hyphen (-) for date separators
      // - Colon (:) for time separators (presence indicates datetime)
      // - Dot (.) for fractional seconds
      // - Plus (+) for positive timezone offset
      // - Z for UTC timezone
      if (
        this.isDigit(ch) ||
        ch === 45 /* - */ ||
        ch === 58 /* : */ ||
        ch === 46 /* . */ ||
        ch === 43 /* + */ ||
        ch === 90 /* Z */
      ) {
        if (ch === 58) hasTime = true; // Colon indicates time component
        this.advance();
      } else if (ch === 84 /* T */) {
        // T separator between date and time
        hasTime = true;
        this.advance();
      } else {
        break;
      }
    }

    const value = this.input.slice(start + 1, this.position); // skip @
    // Determine token type based on presence of time components
    this.token.type = hasTime ? TokenType.DATETIME : TokenType.DATE;
    this.token.value = value;
    this.token.start = start;
    this.token.end = this.position;
    return this.token;
  }

  /**
   * Read an identifier or keyword
   *
   * Identifiers in FHIRPath:
   * - Start with letter or underscore
   * - Can contain letters, digits, underscores
   * - Case-sensitive
   *
   * This method also recognizes keywords and returns appropriate token types.
   * Keywords are reserved words with special meaning in FHIRPath expressions.
   * Some keywords like 'div' have special handling when used as identifiers.
   */
  private readIdentifier(): Token {
    const start = this.position;

    // Read all valid identifier characters
    while (
      this.position < this.input.length &&
      this.isIdentifierPart(this.input.charCodeAt(this.position))
    ) {
      this.advance();
    }

    const value = this.input.slice(start, this.position);

    // Check if the identifier is actually a keyword
    // Keywords have special token types for parser recognition
    switch (value) {
      case "true":
      case "false":
        return this.makeToken(TokenType.BOOLEAN, value, start);
      case "and":
        return this.makeToken(TokenType.AND, value, start);
      case "or":
        return this.makeToken(TokenType.OR, value, start);
      case "xor":
        return this.makeToken(TokenType.XOR, value, start);
      case "implies":
        return this.makeToken(TokenType.IMPLIES, value, start);
      case "div":
        // Special handling for 'div' - it can be both an operator and identifier
        // In FHIR resources, 'div' is commonly used as a property name (e.g., text.div)
        // We treat it as an identifier if followed by a dot, otherwise as the division operator
        if (
          this.position < this.input.length &&
          this.input.charCodeAt(this.position) === CharCode.DOT
        ) {
          return this.makeToken(TokenType.IDENTIFIER, value, start);
        }
        return this.makeToken(TokenType.DIV, value, start);
      case "mod":
        return this.makeToken(TokenType.MOD, value, start);
      case "where":
        return this.makeToken(TokenType.WHERE, value, start);
      case "select":
        return this.makeToken(TokenType.SELECT, value, start);
      case "exists":
        return this.makeToken(TokenType.EXISTS, value, start);
      case "empty":
        return this.makeToken(TokenType.EMPTY, value, start);
      case "as":
        return this.makeToken(TokenType.AS_TYPE, value, start);
      case "is":
        return this.makeToken(TokenType.IS_TYPE, value, start);
      case "in":
        return this.makeToken(TokenType.IN, value, start);
      case "contains":
        return this.makeToken(TokenType.CONTAINS, value, start);
      case "all":
        return this.makeToken(TokenType.ALL, value, start);
      case "any":
        return this.makeToken(TokenType.ANY, value, start);
      case "matches":
        return this.makeToken(TokenType.MATCHES, value, start);
      case "substring":
        return this.makeToken(TokenType.SUBSTRING, value, start);
      case "replaceMatches":
        return this.makeToken(TokenType.REPLACE_MATCHES, value, start);
      case "descendants":
        return this.makeToken(TokenType.DESCENDANTS, value, start);
      case "trace":
        return this.makeToken(TokenType.TRACE, value, start);
      case "combine":
        return this.makeToken(TokenType.COMBINE, value, start);
      case "intersect":
        return this.makeToken(TokenType.INTERSECT, value, start);
      case "isDistinct":
        return this.makeToken(TokenType.IS_DISTINCT, value, start);
      case "distinct":
        return this.makeToken(TokenType.DISTINCT, value, start);
      case "repeat":
        return this.makeToken(TokenType.REPEAT, value, start);
      case "defineVariable":
        return this.makeToken(TokenType.DEFINE_VARIABLE, value, start);
      case "hasValue":
        return this.makeToken(TokenType.HAS_VALUE, value, start);
      case "children":
        return this.makeToken(TokenType.CHILDREN, value, start);
      case "memberOf":
        return this.makeToken(TokenType.MEMBER_OF, value, start);
      case "htmlChecks":
        return this.makeToken(TokenType.HTML_CHECKS, value, start);
      case "toInteger":
        return this.makeToken(TokenType.TO_INTEGER, value, start);
      case "toString":
        return this.makeToken(TokenType.TO_STRING, value, start);
      case "toDateTime":
        return this.makeToken(TokenType.TO_DATE_TIME, value, start);
      case "length":
        return this.makeToken(TokenType.LENGTH, value, start);
      case "startsWith":
        return this.makeToken(TokenType.STARTS_WITH, value, start);
      case "endsWith":
        return this.makeToken(TokenType.ENDS_WITH, value, start);
      case "tail":
        return this.makeToken(TokenType.TAIL, value, start);
      case "take":
        return this.makeToken(TokenType.TAKE, value, start);
      case "skip":
        return this.makeToken(TokenType.SKIP, value, start);
      case "trim":
        return this.makeToken(TokenType.TRIM, value, start);
      case "split":
        return this.makeToken(TokenType.SPLIT, value, start);
      case "join":
        return this.makeToken(TokenType.JOIN, value, start);
      case "toChars":
        return this.makeToken(TokenType.TO_CHARS, value, start);
      case "indexOf":
        return this.makeToken(TokenType.INDEX_OF, value, start);
      case "lastIndexOf":
        return this.makeToken(TokenType.LAST_INDEX_OF, value, start);
      case "replace":
        return this.makeToken(TokenType.REPLACE, value, start);
      case "encode":
        return this.makeToken(TokenType.ENCODE, value, start);
      case "decode":
        return this.makeToken(TokenType.DECODE, value, start);
      case "escape":
        return this.makeToken(TokenType.ESCAPE, value, start);
      case "unescape":
        return this.makeToken(TokenType.UNESCAPE, value, start);
      case "lower":
        return this.makeToken(TokenType.LOWER, value, start);
      case "upper":
        return this.makeToken(TokenType.UPPER, value, start);
      case "resolve":
        return this.makeToken(TokenType.RESOLVE, value, start);
      case "extension":
        return this.makeToken(TokenType.EXTENSION, value, start);
      // FHIR type names and resource types
      // These are treated as identifiers, not keywords, because they represent
      // FHIR data types and resource types that can appear in expressions
      case "canonical":
      case "uri":
      case "Reference":
      case "Group":
      case "Patient":
      case "Practitioner":
      case "Location":
      case "Quantity":
      case "Range":
      case "Coding":
      case "CodeableConcept":
      case "Observation":
      case "MessageHeader":
      case "Composition":
      case "MedicinalProductDefinition":
        return this.makeToken(TokenType.IDENTIFIER, value, start);
      default:
        // Check for quantity (number followed by string)
        if (this.position > start && this.peek() === CharCode.SPACE) {
          const savePos = this.position;
          const saveLine = this.line;
          const saveCol = this.column;

          this.skipWhitespace();
          if (this.peek() === CharCode.APOSTROPHE) {
            // This might be a quantity
            const unit = this.readString(CharCode.APOSTROPHE);
            if (unit.type === TokenType.STRING) {
              this.token.type = TokenType.QUANTITY;
              this.token.value = value + " " + unit.value;
              this.token.start = start;
              this.token.end = this.position;
              return this.token;
            }
          } else {
            // Restore position
            this.position = savePos;
            this.line = saveLine;
            this.column = saveCol;
          }
        }

        return this.makeToken(TokenType.IDENTIFIER, value, start);
    }
  }

  private error(message: string): ParseError {
    return new ParseError(message, this.position, this.line, this.column);
  }

  /**
   * Read a variable reference starting with $
   *
   * Variables in FHIRPath:
   * - $this: The current context item
   * - $index: Current position in a collection (within repeat())
   * - $total: Total items in a collection (within certain functions)
   * - User-defined variables from defineVariable()
   *
   * Format: $identifier
   */
  private readVariable(): Token {
    const start = this.position;
    this.advance(); // skip $

    // Variable name must start with a valid identifier character
    if (!this.isIdentifierStart(this.peek())) {
      throw this.error("Expected identifier after $");
    }

    // Read the complete variable name
    while (
      this.position < this.input.length &&
      this.isIdentifierPart(this.input.charCodeAt(this.position))
    ) {
      this.advance();
    }

    // Include the $ prefix in the token value for easier processing
    const value = this.input.slice(start, this.position);

    // Check if this is the special $total variable
    if (value === "$total") {
      return this.makeToken(TokenType.TOTAL, value, start);
    }

    return this.makeToken(TokenType.DOLLAR, value, start);
  }

  /**
   * Read an environment variable reference starting with %
   *
   * Environment variables in FHIRPath:
   * - %resource: The root resource being evaluated
   * - %context: The context resource (e.g., in search parameters)
   * - %ucum: Unit conversion context
   * - %sct: SNOMED CT context
   * - %loinc: LOINC context
   * - %vs: ValueSet context
   *
   * External constants can also be quoted strings:
   * - %'my constant': String constant with spaces
   * - %"quoted value": Alternative quote style
   * - %'http://example.com': URLs or special characters
   *
   * These provide access to external context during evaluation.
   * Format: %identifier or %'string' or %"string"
   */
  private readEnvironmentVariable(): Token {
    const start = this.position;
    this.advance(); // skip %

    // Check if this is a quoted external constant
    const nextChar = this.peek();
    if (nextChar === CharCode.APOSTROPHE || nextChar === CharCode.QUOTE) {
      // For quoted external constants, we need to preserve the raw string
      // including escape sequences, so we read it manually
      const quoteStart = this.position;
      this.advance(); // skip opening quote

      let rawContent = "";
      while (this.position < this.input.length) {
        const ch = this.input.charCodeAt(this.position);

        if (ch === nextChar) {
          // Found closing quote
          const value = `%${this.input.slice(quoteStart, this.position + 1)}`;
          this.advance(); // skip closing quote
          return this.makeToken(TokenType.PERCENT, value, start);
        }

        if (ch === CharCode.BACKSLASH) {
          // Include the backslash and the next character as-is
          rawContent += this.input.charAt(this.position);
          this.advance();
          if (this.position < this.input.length) {
            rawContent += this.input.charAt(this.position);
            this.advance();
          }
        } else {
          rawContent += this.input.charAt(this.position);
          this.advance();
        }
      }

      throw this.error("Unterminated quoted external constant");
    }

    // Otherwise, environment variable name must be a valid identifier
    if (!this.isIdentifierStart(this.peek())) {
      throw this.error("Expected identifier or quoted string after %");
    }

    // Read the complete variable name
    while (
      this.position < this.input.length &&
      this.isIdentifierPart(this.input.charCodeAt(this.position))
    ) {
      this.advance();
    }

    // Include the % prefix in the token value
    const value = this.input.slice(start, this.position);
    return this.makeToken(TokenType.PERCENT, value, start);
  }

  /**
   * Read a backtick-quoted identifier
   *
   * Quoted identifiers in FHIRPath allow:
   * - Using reserved keywords as identifiers (e.g., `where`, `div`)
   * - Including special characters in identifiers
   * - Preserving exact casing and spacing
   *
   * Format: `identifier`
   * Escape sequences: \` for backtick, \\ for backslash
   *
   * Common use case: Accessing properties named after keywords
   * Example: text.`div` accesses the 'div' property without invoking division
   *
   * PERFORMANCE OPTIMIZATION: Same as readString, avoid string concatenation:
   * 1. Collect characters in an array
   * 2. Build string once at the end
   * 3. Use hex lookup table for Unicode escapes
   * 4. Apply string interning for common identifiers
   */
  private readQuotedIdentifier(): Token {
    const start = this.position;
    this.advance(); // skip opening backtick

    // OPTIMIZATION: Pre-allocate array for identifier characters
    // Most identifiers are short (< 32 chars)
    const chars: number[] = new Array(32);
    let charCount = 0;

    while (this.position < this.input.length) {
      const ch = this.input.charCodeAt(this.position);

      if (ch === CharCode.BACKTICK) {
        this.advance(); // skip closing backtick

        // OPTIMIZATION: Build string once at the end
        let value: string;
        if (charCount === 0) {
          value = "";
        } else if (charCount <= 1024) {
          value = String.fromCharCode(...chars.slice(0, charCount));
        } else {
          // Handle very long identifiers
          value = "";
          for (let i = 0; i < charCount; i += 1024) {
            value += String.fromCharCode(
              ...chars.slice(i, Math.min(i + 1024, charCount)),
            );
          }
        }

        // OPTIMIZATION: Apply string interning for common identifiers
        const interned = Tokenizer.INTERNED_STRINGS.get(value);
        if (interned) {
          value = interned;
        }

        // Return as IDENTIFIER token - the backticks are just syntax
        return this.makeToken(TokenType.IDENTIFIER, value, start);
      }

      // Handle escape sequences
      if (ch === CharCode.BACKSLASH) {
        this.advance();
        if (this.position >= this.input.length) {
          throw this.error("Unterminated quoted identifier escape");
        }

        const escaped = this.input.charCodeAt(this.position);

        // OPTIMIZATION: Grow array if needed
        if (charCount >= chars.length) {
          chars.length *= 2;
        }

        switch (escaped) {
          case CharCode.BACKSLASH:
          case CharCode.BACKTICK:
            chars[charCount++] = escaped;
            this.advance();
            break;
          case 110: // n
            chars[charCount++] = CharCode.LF;
            this.advance();
            break;
          case 114: // r
            chars[charCount++] = CharCode.CR;
            this.advance();
            break;
          case 116: // t
            chars[charCount++] = CharCode.TAB;
            this.advance();
            break;
          case 102: // f (form feed)
            chars[charCount++] = 12; // \f
            this.advance();
            break;
          case CharCode.SLASH: // / (forward slash)
            chars[charCount++] = CharCode.SLASH;
            this.advance();
            break;
          case 117: // u (Unicode escape)
            this.advance(); // skip 'u'
            // Read 4 hex digits
            let codePoint = 0;
            for (let i = 0; i < 4; i++) {
              if (this.position >= this.input.length) {
                throw this.error("Incomplete Unicode escape sequence");
              }
              const hex = this.input.charCodeAt(this.position);

              // OPTIMIZATION: Use lookup table for hex validation
              const hexValue = Tokenizer.HEX_VALUES[hex];
              if (hexValue === -1) {
                throw this.error(
                  "Invalid hex digit in Unicode escape sequence",
                );
              }

              codePoint = (codePoint << 4) | hexValue;
              this.advance();
            }
            chars[charCount++] = codePoint;
            break;
          default:
            // For delimited identifiers, unknown escapes are taken literally
            chars[charCount++] = escaped;
            this.advance();
        }
      } else {
        // OPTIMIZATION: Grow array if needed
        if (charCount >= chars.length) {
          chars.length *= 2;
        }

        // Regular character - add to identifier value
        chars[charCount++] = ch;
        this.advance();
      }
    }

    throw this.error("Unterminated quoted identifier");
  }
}
