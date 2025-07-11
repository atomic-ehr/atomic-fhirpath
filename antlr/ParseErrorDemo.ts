import {
    parseFhirpath,
    validateFhirpath,
    parseMultipleFhirpath,
    formatParseErrors,
    createErrorReport,
    getErrorSuggestions
} from './FhirpathParseUtils.js';

/**
 * Demonstrate parsing with error handling
 */
export function demonstrateErrorHandling() {
    console.log("=== FHIRPath Parser Error Handling Demonstration ===\n");

    // Test cases: valid and invalid expressions
    const testCases = [
        // Valid expressions
        { expr: "Patient.name.given", desc: "Valid: Simple member access" },
        { expr: "Patient.name[0].family", desc: "Valid: Array indexing" },
        { expr: "Patient.age > 18 and Patient.active = true", desc: "Valid: Complex logical expression" },
        { expr: "(Patient.birthDate + 18 'years') <= today()", desc: "Valid: Date arithmetic with function" },
        
        // Invalid expressions - lexer errors
        { expr: "Patient.name.@invalid", desc: "Invalid: Unexpected character @" },
        { expr: "Patient.'incomplete string", desc: "Invalid: Unterminated string literal" },
        { expr: "Patient.name.`incomplete identifier", desc: "Invalid: Unterminated delimited identifier" },
        
        // Invalid expressions - parser errors
        { expr: "Patient.", desc: "Invalid: Incomplete member access" },
        { expr: "Patient..name", desc: "Invalid: Double dot" },
        { expr: "Patient.name[", desc: "Invalid: Unclosed bracket" },
        { expr: "Patient.name[]", desc: "Invalid: Empty brackets" },
        { expr: "Patient.name)", desc: "Invalid: Unmatched closing parenthesis" },
        { expr: "Patient.name + ", desc: "Invalid: Incomplete arithmetic expression" },
        { expr: "Patient.name and", desc: "Invalid: Incomplete logical expression" },
        { expr: "Patient.name.function(", desc: "Invalid: Unclosed function call" },
        { expr: "= Patient.name", desc: "Invalid: Starting with operator" },
        
        // Edge cases
        { expr: "", desc: "Edge case: Empty string" },
        { expr: "   ", desc: "Edge case: Whitespace only" },
        { expr: "Patient.name extra tokens", desc: "Edge case: Extra tokens after valid expression" }
    ];

    testCases.forEach((testCase, index) => {
        console.log(`${index + 1}. ${testCase.desc}`);
        console.log(`Expression: "${testCase.expr}"`);
        
        const result = parseFhirpath(testCase.expr);
        
        if (result.success) {
            console.log("✅ SUCCESS");
            if (result.warnings.length > 0) {
                console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
            }
            if (result.tokens) {
                console.log(`📊 Tokens: ${result.tokens.length - 1} generated`);
            }
        } else {
            console.log("❌ FAILED");
            console.log(`🔍 Errors: ${formatParseErrors(result.errors)}`);
            
            // Show suggestions for the first error
            if (result.errors.length > 0 && result.errors[0]) {
                const suggestions = getErrorSuggestions(result.errors[0]);
                if (suggestions.length > 0) {
                    console.log(`💡 Suggestions: ${suggestions.join('; ')}`);
                }
            }
        }
        
        console.log("─".repeat(60));
    });
}

/**
 * Demonstrate detailed error reporting
 */
export function demonstrateDetailedErrorReporting() {
    console.log("\n=== Detailed Error Reports ===\n");

    const problematicExpressions = [
        "Patient.name[",
        "Patient.name and or Patient.age",
        "function(",
        "Patient..name.given"
    ];

    problematicExpressions.forEach((expr, index) => {
        console.log(`Report ${index + 1}:`);
        console.log("=".repeat(50));
        
        const result = parseFhirpath(expr);
        const report = createErrorReport(expr, result);
        console.log(report);
        console.log();
    });
}

/**
 * Demonstrate batch validation
 */
export function demonstrateBatchValidation() {
    console.log("\n=== Batch Validation ===\n");

    const expressions = [
        "Patient.name.given",
        "Patient.age >",  // Invalid
        "Patient.active = true",
        "Patient.name[0",  // Invalid
        "Observation.value as Quantity"
    ];

    console.log("Validating multiple expressions:");
    expressions.forEach((expr, index) => {
        console.log(`${index + 1}. "${expr}"`);
    });
    console.log();

    const results = parseMultipleFhirpath(expressions);
    
    console.log("Results:");
    results.forEach((result, index) => {
        const status = result.success ? "✅ Valid" : "❌ Invalid";
        const errorCount = result.errors.length;
        const warningCount = result.warnings.length;
        
        console.log(`${index + 1}. ${status} (${errorCount} errors, ${warningCount} warnings)`);
        
        if (!result.success) {
            console.log(`   📝 ${formatParseErrors(result.errors)}`);
        }
    });

    // Summary
    const validCount = results.filter(r => r.success).length;
    const invalidCount = results.length - validCount;
    console.log(`\n📊 Summary: ${validCount} valid, ${invalidCount} invalid out of ${results.length} expressions`);
}

/**
 * Demonstrate simple validation function
 */
export function demonstrateSimpleValidation() {
    console.log("\n=== Simple Validation ===\n");

    const expressions = [
        "Patient.name.given",
        "Patient.age > 18 and",
        "Patient.telecom.where(system = 'phone').value"
    ];

    expressions.forEach((expr, index) => {
        console.log(`${index + 1}. Validating: "${expr}"`);
        
        const validation = validateFhirpath(expr);
        
        if (validation.valid) {
            console.log("   ✅ Valid expression");
        } else {
            console.log("   ❌ Invalid expression");
            console.log(`   📝 ${formatParseErrors(validation.errors)}`);
        }
        
        if (validation.warnings.length > 0) {
            console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
        }
        
        console.log();
    });
}

/**
 * Demonstrate error position information
 */
export function demonstrateErrorPositions() {
    console.log("\n=== Error Position Information ===\n");

    const expr = "Patient.name.given[0 + Patient.age > 18";
    console.log(`Expression: "${expr}"`);
    console.log("Position:    " + "0".repeat(10) + "1".repeat(10) + "2".repeat(10) + "3".repeat(10));
    console.log("             " + "0123456789".repeat(4));
    console.log();

    const result = parseFhirpath(expr);
    
    if (!result.success) {
        result.errors.forEach((error, index) => {
            console.log(`Error ${index + 1}:`);
            console.log(`  Type: ${error.type}`);
            console.log(`  Position: Line ${error.line}, Column ${error.column}`);
            console.log(`  Range: ${error.startIndex}-${error.endIndex}`);
            console.log(`  Message: ${error.message}`);
            if (error.offendingSymbol) {
                console.log(`  Offending symbol: "${error.offendingSymbol}"`);
            }
            
            // Visual indicator
            const indicator = " ".repeat(error.column) + "^";
            console.log(`  Location: ${expr}`);
            console.log(`            ${indicator}`);
            console.log();
        });
    }
}

/**
 * Run all demonstrations
 */
export function runAllDemonstrations() {
    demonstrateErrorHandling();
    demonstrateDetailedErrorReporting();
    demonstrateBatchValidation();
    demonstrateSimpleValidation();
    demonstrateErrorPositions();
    
    console.log("🎉 All demonstrations completed!");
}

// Functions are already exported individually above 