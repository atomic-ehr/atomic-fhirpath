#!/usr/bin/env bun

/**
 * Performance Comparison: Custom Parser vs ANTLR Parser
 * 
 * This script compares the performance of two FHIRPath parsing implementations:
 * 1. Custom recursive descent parser from ../src/index
 * 2. ANTLR-generated parser from this directory
 * 
 * Test expression: Patient.name.where(use='official').given
 */

// Import performance tools
import {
  type ParserBenchmark,
  type PerfConfig,
  compareParserPerformance,
  printComparisonSummary,
  testParserCorrectness
} from './performance-tools.js';

// Import ANTLR parser (local to this directory)
import { parseFhirpath as antlrParse } from './FhirpathParseUtils.js';
import { parseFhirpathExpression as antlrParseDemo } from './FhirpathParserDemo.js';

// Import raw ANTLR parser
import { parseRawAntlr } from './raw-parser.js';

// Import custom parser functions  
import { parse as customParse, clearCache } from '../src/index';



// Configuration for performance testing
interface ComparisonConfig {
  iterations: number;
  quickIterations: number;
  verbose: boolean;
  testCorrectness: boolean;
}



/**
 * Test expression - complex FHIRPath with function calls and filtering
 */
const TEST_EXPRESSION = "Patient.name.where(use='official').given";

/**
 * Additional test expressions for comprehensive comparison
 */
const TEST_EXPRESSIONS = [
  "Patient.name.where(use='official').given",
  "Patient.telecom.where(system='phone').value",
  "Observation.component.where(code.coding.code='8480-6').value as Quantity",
  "Bundle.entry.resource.where($this is Patient).name.given",
  "Patient.extension.where(url='http://example.org/birthPlace').value as string"
];



/**
 * Benchmark configurations for different parsers
 */
const PARSERS: ParserBenchmark[] = [
  {
    name: "Custom Parser (no cache)",
    parseFunction: (expr: string) => {
      clearCache();
      return customParse(expr, false);
    },
    warmupFn: () => {
      // Warmup the custom parser
      for (let i = 0; i < 50; i++) {
        clearCache();
        customParse(TEST_EXPRESSION, false);
      }
    }
  },
  {
    name: "Custom Parser (cached)",
    parseFunction: (expr: string) => customParse(expr, true),
    setupFn: () => {
      // Prime the cache
      clearCache();
      customParse(TEST_EXPRESSION, true);
    },
    warmupFn: () => {
      // Warmup with caching
      clearCache();
      customParse(TEST_EXPRESSION, true); // Prime cache
      for (let i = 0; i < 50; i++) {
        customParse(TEST_EXPRESSION, true);
      }
    }
  },
  {
    name: "ANTLR Parser (Utils)",
    parseFunction: (expr: string) => antlrParse(expr),
    warmupFn: () => {
      // Warmup ANTLR parser
      for (let i = 0; i < 50; i++) {
        antlrParse(TEST_EXPRESSION);
      }
    }
  },
  {
    name: "ANTLR Parser (Demo)",
    parseFunction: (expr: string) => antlrParseDemo(expr),
    warmupFn: () => {
      // Warmup ANTLR demo parser
      for (let i = 0; i < 50; i++) {
        antlrParseDemo(TEST_EXPRESSION);
      }
    }
  },
  {
    name: "ANTLR Parser (Raw Tree)",
    parseFunction: (expr: string) => parseRawAntlr(expr),
    warmupFn: () => {
      // Warmup raw ANTLR parser
      for (let i = 0; i < 50; i++) {
        parseRawAntlr(TEST_EXPRESSION);
      }
    }
  }
];

/**
 * Default configuration for performance comparison
 */
const DEFAULT_CONFIG: ComparisonConfig = {
  iterations: 100000,
  quickIterations: 1000,
  verbose: true,
  testCorrectness: true
};

/**
 * Parse command line arguments to get configuration
 */
function getConfig(): ComparisonConfig {
  const config = { ...DEFAULT_CONFIG };
  
  if (process.argv.includes('--quick')) {
    config.iterations = config.quickIterations;
  }
  
  if (process.argv.includes('--silent')) {
    config.verbose = false;
  }
  
  if (process.argv.includes('--no-correctness')) {
    config.testCorrectness = false;
  }
  
  // Check for custom iteration count
  const iterIndex = process.argv.findIndex(arg => arg === '--iterations');
  if (iterIndex !== -1 && iterIndex + 1 < process.argv.length) {
    const customIterations = parseInt(process.argv[iterIndex + 1], 10);
    if (!isNaN(customIterations) && customIterations > 0) {
      config.iterations = customIterations;
    }
  }
  
  return config;
}

/**
 * Run comprehensive performance comparison
 */
function runComprehensiveComparison(): void {
  const config = getConfig();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('FHIRPATH PARSER PERFORMANCE COMPARISON');
  console.log('Custom Recursive Descent Parser vs ANTLR Generated Parser');
  console.log(`${'='.repeat(80)}`);
  
  // Test correctness first
  if (config.testCorrectness) {
    if (!testParserCorrectness(TEST_EXPRESSIONS, PARSERS)) {
      console.log('⚠️  Some parsers failed correctness tests. Results may not be comparable.');
    }
  }
  
  // Run performance tests
  console.log(`\nRunning performance comparison with ${config.iterations} iterations per test...`);
  
  const perfConfig: PerfConfig = {
    iterations: config.iterations,
    verbose: config.verbose
  };
  
  // Test main expression
  const mainResults = compareParserPerformance(TEST_EXPRESSION, PARSERS, perfConfig);
  printComparisonSummary(mainResults);
  
  // Test additional expressions if not in quick mode
  if (config.iterations > config.quickIterations) {
    const additionalPerfConfig: PerfConfig = {
      iterations: Math.floor(config.iterations / 2),
      verbose: config.verbose
    };
    
    for (const expression of TEST_EXPRESSIONS.slice(1)) {
      const results = compareParserPerformance(expression, PARSERS, additionalPerfConfig);
      printComparisonSummary(results);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('PERFORMANCE COMPARISON COMPLETE');
  console.log(`${'='.repeat(80)}`);
}

/**
 * Main execution
 */
if (import.meta.main) {
  console.log('FHIRPath Parser Performance Comparison');
  console.log('Usage: bun performance-comparison.ts [options]');
  console.log('Options:');
  console.log('  --quick                      Run with fewer iterations for faster results');
  console.log('  --iterations <num>           Set custom number of iterations (default: 1000000)');
  console.log('  --silent                     Reduce output verbosity');
  console.log('  --no-correctness             Skip correctness testing');
  console.log('');
  
  runComprehensiveComparison();
}

// Export functions for use in other scripts
export {
  runComprehensiveComparison,
  TEST_EXPRESSION,
  TEST_EXPRESSIONS,
  PARSERS,
  DEFAULT_CONFIG,
  getConfig
}; 