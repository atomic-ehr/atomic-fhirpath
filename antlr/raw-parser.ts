/**
 * Raw ANTLR Parser Module
 * 
 * This module provides raw ANTLR parsing functionality without any custom visitor processing.
 * It's designed for direct performance comparison with custom parsers by providing
 * the most basic parse tree generation from ANTLR.
 */

// Import ANTLR components for raw parse tree
import { CharStream, CommonTokenStream } from 'antlr4';
import fhirpathLexer from './generated/fhirpathLexer.js';
import fhirpathParser from './generated/fhirpathParser.js';

/**
 * Parse a FHIRPath expression using raw ANTLR parser without visitor processing
 * This is the most direct comparison to a custom parser
 * 
 * @param expression - The FHIRPath expression to parse
 * @returns The raw parse tree from ANTLR or error object
 */
export function parseRawAntlr(expression: string): any {
  try {
    // Create input stream
    const input = new CharStream(expression);
    
    // Create lexer
    const lexer = new fhirpathLexer(input);
    
    // Create token stream
    const tokens = new CommonTokenStream(lexer);
    
    // Create parser
    const parser = new fhirpathParser(tokens);
    
    // Parse and return raw parse tree
    return parser.entireExpression();
  } catch (error) {
    // Return error for timing purposes
    return error;
  }
}

/**
 * Parse a FHIRPath expression and return basic information about the parse tree
 * This provides a simple way to verify that parsing succeeded
 * 
 * @param expression - The FHIRPath expression to parse
 * @returns Object with parsing success info and basic tree details
 */
export function parseAndValidate(expression: string): {
  success: boolean;
  hasParseTree: boolean;
  error?: any;
  nodeCount?: number;
} {
  try {
    const parseTree = parseRawAntlr(expression);
    
    if (parseTree && typeof parseTree === 'object' && 'getChildCount' in parseTree) {
      return {
        success: true,
        hasParseTree: true,
        nodeCount: parseTree.getChildCount?.() ?? 0
      };
    } else {
      return {
        success: false,
        hasParseTree: false,
        error: parseTree
      };
    }
  } catch (error) {
    return {
      success: false,
      hasParseTree: false,
      error
    };
  }
} 