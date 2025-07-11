import type { ParseError } from './types';

/**
 * Enhanced error formatter that shows the expression with error position highlighted
 * 
 * Example output:
 * ParseError: Unexpected token ')'
 *   at line 1, column 8:
 *   
 *   Patient.name(
 *          ^^^^^
 *   
 * This formatter improves error messages by:
 * 1. Showing the exact position in the expression
 * 2. Underlining the problematic area
 * 3. Providing context around the error
 */

export interface FormattedError {
  message: string;
  line: number;
  column: number;
  position: number;
  context: string;
  formattedMessage: string;
}

/**
 * Formats a ParseError with visual context showing the error position
 * @param error The ParseError to format
 * @param expression The original expression being parsed
 * @param contextLines Number of lines to show before/after error (default: 2)
 * @returns Formatted error with visual context
 */
export function formatError(
  error: ParseError,
  expression: string,
  contextLines: number = 2
): FormattedError {
  const lines = expression.split('\n');
  const errorLine = error.line - 1; // Convert to 0-indexed
  
  // Calculate the actual position in the line
  let currentPos = 0;
  let lineStartPos = 0;
  
  for (let i = 0; i < errorLine && i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      currentPos += line.length + 1; // +1 for newline
    }
  }
  lineStartPos = currentPos;
  
  // Build context lines
  const contextStart = Math.max(0, errorLine - contextLines);
  const contextEnd = Math.min(lines.length, errorLine + contextLines + 1);
  const contextBuilder: string[] = [];
  
  // Add line numbers and content
  for (let i = contextStart; i < contextEnd; i++) {
    const lineNum = (i + 1).toString().padStart(4, ' ');
    const isErrorLine = i === errorLine;
    const prefix = isErrorLine ? '>' : ' ';
    contextBuilder.push(`${prefix} ${lineNum} | ${lines[i]}`);
    
    // Add error indicator on the error line
    if (isErrorLine && error.column > 0) {
      // The caret line should align with the source line
      // Source line format: "> NNNN | expression"
      // Caret line format: "       | spaces^^^^^"
      const spaces = ' '.repeat(error.column - 1); // -1 because column is 1-based
      const currentLine = lines[i] || '';
      const carets = '^'.repeat(Math.min(5, Math.max(1, currentLine.length - error.column + 1)));
      contextBuilder.push(`       | ${spaces}${carets}`);
    }
  }
  
  // Build the formatted message
  const header = `${error.name}: ${error.message}`;
  const location = `  at line ${error.line}, column ${error.column}:`;
  const context = contextBuilder.join('\n');
  
  const formattedMessage = `${header}\n${location}\n\n${context}`;
  
  return {
    message: error.message,
    line: error.line,
    column: error.column,
    position: error.position,
    context: context,
    formattedMessage: formattedMessage
  };
}

/**
 * Creates a descriptive error message based on the token type and context
 * @param tokenType The type of token that caused the error
 * @param tokenValue The value of the token
 * @param context What was being parsed when the error occurred
 * @returns A descriptive error message
 */
export function createDescriptiveMessage( tokenType: string, tokenValue: string, context: string): string {
  const tokenDesc = tokenValue ? `'${tokenValue}'` : tokenType;
  
  switch (context) {
    case 'expression':
      return `Unexpected ${tokenDesc} in expression. Expected an operand, function, or identifier.`;
    
    case 'function-args':
      return `Unexpected ${tokenDesc} in function arguments. Expected an expression or closing parenthesis.`;
    
    case 'after-dot':
      return `Unexpected ${tokenDesc} after dot operator. Expected an identifier or function name.`;
    
    case 'binary-operator':
      return `Unexpected ${tokenDesc}. Expected an expression after binary operator.`;
    
    case 'indexer':
      return `Unexpected ${tokenDesc} in indexer. Expected an expression or closing bracket.`;
    
    case 'string':
      return `Unterminated string literal. Expected closing quote.`;
    
    case 'comment':
      return `Unterminated comment. Expected closing '*/'.`;
    
    case 'unicode-escape':
      return `Invalid Unicode escape sequence. Expected 4 hexadecimal digits after '\\u'.`;
    
    case 'quoted-identifier':
      return `Unterminated quoted identifier. Expected closing backtick.`;
    
    default:
      return `Unexpected ${tokenDesc}`;
  }
}

/**
 * Gets a suggestion for fixing common errors
 * @param error The ParseError
 * @param expression The expression being parsed
 * @returns A suggestion string or null if no suggestion available
 */
export function getErrorSuggestion(error: ParseError, expression: string): string | null {
  const message = error.message.toLowerCase();
  
  if (message.includes('unterminated string')) {
    return 'Add a closing quote to terminate the string literal.';
  }
  
  if (message.includes('unterminated comment')) {
    return 'Add */ to close the comment block.';
  }
  
  if (message.includes('expected )')) {
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      return `Add ${openCount - closeCount} closing parenthes${openCount - closeCount > 1 ? 'es' : 'is'} to balance the expression.`;
    }
  }
  
  if (message.includes('expected ]')) {
    const openCount = (expression.match(/\[/g) || []).length;
    const closeCount = (expression.match(/\]/g) || []).length;
    if (openCount > closeCount) {
      return `Add ${openCount - closeCount} closing bracket${openCount - closeCount > 1 ? 's' : ''} to balance the expression.`;
    }
  }
  
  if (message.includes('unexpected token') && message.includes('at end')) {
    return 'The expression appears to be incomplete. Check if you meant to add more.';
  }
  
  if (message.includes('after dot')) {
    return 'After a dot operator, you need an identifier or function name.';
  }
  
  if (message.includes('unicode escape')) {
    return 'Unicode escapes must be in the format \\uXXXX where X is a hexadecimal digit.';
  }
  
  return null;
}