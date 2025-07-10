/**
 * FHIRPath ANTLR Parser
 * 
 * This module provides TypeScript interfaces and classes for parsing FHIRPath expressions
 * using ANTLR-generated parsers.
 */

// Export generated ANTLR components
export { default as fhirpathLexer } from './generated/fhirpathLexer.js';
export { default as fhirpathParser } from './generated/fhirpathParser.js';
export { default as fhirpathVisitor } from './generated/fhirpathVisitor.js';
export { default as fhirpathListener } from './generated/fhirpathListener.js';

// Export all context types from the parser
export * from './generated/fhirpathParser.js';

// Export custom visitor implementations and utilities
export {
    FhirpathAnalyzer,
    parseFhirpathExpression,
    demonstrateFhirpathParser
} from './FhirpathParserDemo.js';

// Export parsing utilities with error handling
export {
    parseFhirpath,
    validateFhirpath,
    parseMultipleFhirpath,
    formatParseErrors,
    createErrorReport,
    getErrorSuggestions,
    type ParseResult,
    type ParseError
} from './FhirpathParseUtils.js';

// Export error handling demonstrations
export {
    runAllDemonstrations,
    demonstrateErrorHandling,
    demonstrateDetailedErrorReporting,
    demonstrateBatchValidation,
    demonstrateSimpleValidation,
    demonstrateErrorPositions
} from './ParseErrorDemo.js';

// Export the custom visitor interfaces (if you prefer them over generated ones)
// Note: These are commented out to avoid conflicts with ANTLR generated interfaces
// export * from './FhirpathVisitor.js';
// export { FhirpathBaseVisitor } from './FhirpathBaseVisitor.js'; 