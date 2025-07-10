import { CharStream, CommonTokenStream, RecognitionException, Token } from 'antlr4';
import fhirpathLexer from './generated/fhirpathLexer.js';
import fhirpathParser, { EntireExpressionContext } from './generated/fhirpathParser.js';

/**
 * Represents a parsing error with detailed information
 */
export interface ParseError {
    type: 'lexer' | 'parser' | 'unknown';
    message: string;
    line: number;
    column: number;
    startIndex: number;
    endIndex: number;
    offendingSymbol?: string;
    originalError?: any;
}

/**
 * Result of parsing a FHIRPath expression
 */
export interface ParseResult {
    success: boolean;
    parseTree?: EntireExpressionContext;
    errors: ParseError[];
    warnings: string[];
    input: string;
    tokens?: Token[];
}

/**
 * Custom error listener for capturing parsing errors
 */
class FhirpathErrorListener {
    private errors: ParseError[] = [];

    syntaxError(recognizer: any, offendingSymbol: any, line: number, column: number, message: string, e: any) {
        const error: ParseError = {
            type: recognizer.constructor.name.includes('Lexer') ? 'lexer' : 'parser',
            message: this.cleanErrorMessage(message),
            line: line,
            column: column,
            startIndex: offendingSymbol?.start || 0,
            endIndex: offendingSymbol?.stop || 0,
            offendingSymbol: offendingSymbol?.text,
            originalError: e
        };
        
        this.errors.push(error);
    }

    private cleanErrorMessage(message: string): string {
        // Clean up ANTLR's verbose error messages
        return message
            .replace(/^line \d+:\d+ /, '') // Remove redundant position info
            .replace(/token recognition error at: '([^']*)'/, "unexpected character '$1'")
            .replace(/mismatched input '([^']*)' expecting (.+)/, "unexpected '$1', expected $2")
            .replace(/no viable alternative at input '([^']*)'/, "invalid syntax at '$1'")
            .replace(/extraneous input '([^']*)' expecting (.+)/, "unexpected '$1', expected $2")
            .replace(/missing (\w+) at '([^']*)'/, "missing $1 before '$2'");
    }

    getErrors(): ParseError[] {
        return [...this.errors];
    }

    clear() {
        this.errors = [];
    }
}

/**
 * Parse a FHIRPath expression with comprehensive error handling
 */
export function parseFhirpath(expression: string): ParseResult {
    const result: ParseResult = {
        success: false,
        errors: [],
        warnings: [],
        input: expression
    };

    try {
        // Validate input
        if (typeof expression !== 'string') {
            result.errors.push({
                type: 'unknown',
                message: 'Input must be a string',
                line: 1,
                column: 0,
                startIndex: 0,
                endIndex: 0
            });
            return result;
        }

        if (expression.trim().length === 0) {
            result.errors.push({
                type: 'unknown',
                message: 'Input cannot be empty',
                line: 1,
                column: 0,
                startIndex: 0,
                endIndex: 0
            });
            return result;
        }

        // Create input stream
        const input = new CharStream(expression);
        
        // Create lexer with error handling
        const lexer = new fhirpathLexer(input);
        const lexerErrorListener = new FhirpathErrorListener();
        lexer.removeErrorListeners();
        lexer.addErrorListener(lexerErrorListener);

        // Create token stream
        const tokens = new CommonTokenStream(lexer);
        
        try {
            tokens.fill(); // Force tokenization to catch lexer errors
            result.tokens = tokens.tokens;
        } catch (error) {
            result.errors.push({
                type: 'lexer',
                message: `Tokenization failed: ${error}`,
                line: 1,
                column: 0,
                startIndex: 0,
                endIndex: expression.length,
                originalError: error
            });
            result.errors.push(...lexerErrorListener.getErrors());
            return result;
        }

        // Add lexer errors to result
        result.errors.push(...lexerErrorListener.getErrors());

        // Create parser with error handling
        const parser = new fhirpathParser(tokens);
        const parserErrorListener = new FhirpathErrorListener();
        parser.removeErrorListeners();
        parser.addErrorListener(parserErrorListener);

        // Configure parser for better error recovery
        // parser.errorHandler.reportMatch = function(recognizer) {
        //     // Custom error recovery logic can be added here
        // };

        // Parse the expression
        let parseTree: EntireExpressionContext;
        try {
            parseTree = parser.entireExpression();
            result.parseTree = parseTree;
        } catch (error) {
            result.errors.push({
                type: 'parser',
                message: `Parsing failed: ${error}`,
                line: 1,
                column: 0,
                startIndex: 0,
                endIndex: expression.length,
                originalError: error
            });
            result.errors.push(...parserErrorListener.getErrors());
            return result;
        }

        // Add parser errors to result
        result.errors.push(...parserErrorListener.getErrors());

        // Check for incomplete parsing
        if (tokens.index < tokens.size - 1) { // -1 for EOF token
            const remainingTokens = tokens.tokens.slice(tokens.index, -1);
            if (remainingTokens.length > 0) {
                const firstRemaining = remainingTokens[0];
                result.warnings.push(
                    `Unexpected content after valid expression: '${remainingTokens.map(t => t.text).join('')}'`
                );
            }
        }

        // Validate parse tree
        if (!parseTree || !parseTree.expression()) {
            result.errors.push({
                type: 'parser',
                message: 'Failed to create valid parse tree',
                line: 1,
                column: 0,
                startIndex: 0,
                endIndex: expression.length
            });
            return result;
        }

        // Success if no errors
        result.success = result.errors.length === 0;

        return result;

    } catch (error) {
        // Catch-all for unexpected errors
        result.errors.push({
            type: 'unknown',
            message: `Unexpected error: ${error}`,
            line: 1,
            column: 0,
            startIndex: 0,
            endIndex: expression.length,
            originalError: error
        });
        return result;
    }
}

/**
 * Validate a FHIRPath expression and return only success/failure with errors
 */
export function validateFhirpath(expression: string): { valid: boolean; errors: ParseError[]; warnings: string[] } {
    const result = parseFhirpath(expression);
    return {
        valid: result.success,
        errors: result.errors,
        warnings: result.warnings
    };
}

/**
 * Parse multiple FHIRPath expressions and return results
 */
export function parseMultipleFhirpath(expressions: string[]): ParseResult[] {
    return expressions.map(expr => parseFhirpath(expr));
}

/**
 * Format error messages for display
 */
export function formatParseErrors(errors: ParseError[]): string {
    if (errors.length === 0) {
        return 'No errors';
    }

    return errors.map(error => {
        let message = `[${error.type.toUpperCase()}] Line ${error.line}, Column ${error.column}: ${error.message}`;
        
        if (error.offendingSymbol) {
            message += ` (at '${error.offendingSymbol}')`;
        }
        
        return message;
    }).join('\n');
}

/**
 * Get suggestions for common parsing errors
 */
export function getErrorSuggestions(error: ParseError): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('expecting')) {
        suggestions.push("Check for missing operators, parentheses, or identifiers");
    }

    if (message.includes('unexpected')) {
        if (message.includes("'.'")) {
            suggestions.push("Ensure proper member access syntax (e.g., Patient.name)");
        }
        if (message.includes("'('") || message.includes("')'")) {
            suggestions.push("Check parentheses balance and function call syntax");
        }
        if (message.includes("'['") || message.includes("']'")) {
            suggestions.push("Check array indexer syntax (e.g., name[0])");
        }
    }

    if (message.includes('token recognition error')) {
        suggestions.push("Check for invalid characters or escape sequences");
        suggestions.push("Ensure string literals are properly quoted");
    }

    if (message.includes('no viable alternative')) {
        suggestions.push("Check expression syntax and operator precedence");
        suggestions.push("Verify function names and parameter lists");
    }

    if (error.offendingSymbol) {
        const symbol = error.offendingSymbol.toLowerCase();
        if (['and', 'or', 'xor'].includes(symbol)) {
            suggestions.push("Ensure both sides of logical operators have valid expressions");
        }
        if (['=', '!=', '<', '>', '<=', '>='].includes(symbol)) {
            suggestions.push("Ensure both sides of comparison operators have valid expressions");
        }
    }

    if (suggestions.length === 0) {
        suggestions.push("Check FHIRPath specification for correct syntax");
        suggestions.push("Verify all identifiers, functions, and operators are valid");
    }

    return suggestions;
}

/**
 * Create a detailed error report
 */
export function createErrorReport(expression: string, result: ParseResult): string {
    const lines = [
        `FHIRPath Expression: "${expression}"`,
        `Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
        ''
    ];

    if (result.errors.length > 0) {
        lines.push('ERRORS:');
        result.errors.forEach((error, index) => {
            lines.push(`  ${index + 1}. ${formatParseErrors([error])}`);
            
            const suggestions = getErrorSuggestions(error);
            if (suggestions.length > 0) {
                lines.push('     Suggestions:');
                suggestions.forEach(suggestion => {
                    lines.push(`     - ${suggestion}`);
                });
            }
            lines.push('');
        });
    }

    if (result.warnings.length > 0) {
        lines.push('WARNINGS:');
        result.warnings.forEach((warning, index) => {
            lines.push(`  ${index + 1}. ${warning}`);
        });
        lines.push('');
    }

    if (result.success && result.parseTree) {
        lines.push('Parse tree created successfully');
        
        if (result.tokens) {
            lines.push(`Tokens generated: ${result.tokens.length - 1} (excluding EOF)`); // -1 for EOF
        }
    }

    return lines.join('\n');
} 