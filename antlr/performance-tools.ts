import { performance } from 'perf_hooks';

/**
 * Performance measurement result interface
 */
export interface PerfResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgUs: number;
  minUs: number;
  maxUs: number;
  medianUs: number;
  p95Us: number;
  p99Us: number;
}

/**
 * Configuration for performance measurement
 */
export interface PerfConfig {
  iterations: number;
  warmupIterations?: number;
  verbose?: boolean;
}

/**
 * Benchmark configuration for a parser
 */
export interface ParserBenchmark {
  name: string;
  parseFunction: (expression: string) => any;
  warmupFn?: () => void;
  setupFn?: () => void;
  teardownFn?: () => void;
}

/**
 * Measure performance of a function with multiple iterations
 */
export function measurePerformance(name: string, iterations: number, fn: () => void): PerfResult {
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn();
  }

  // Measure individual runs
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push((end - start) * 1000); // Convert to microseconds
  }

  // Sort for percentiles
  times.sort((a, b) => a - b);

  const totalMs = times.reduce((sum, t) => sum + t, 0) / 1000;
  const avgUs = times.reduce((sum, t) => sum + t, 0) / iterations;
  const minUs = times[0] || 0;
  const maxUs = times[times.length - 1] || 0;
  const medianUs = times[Math.floor(iterations / 2)] || 0;
  const p95Us = times[Math.floor(iterations * 0.95)] || 0;
  const p99Us = times[Math.floor(iterations * 0.99)] || 0;

  return {
    name,
    iterations,
    totalMs,
    avgUs,
    minUs,
    maxUs,
    medianUs,
    p95Us,
    p99Us
  };
}

/**
 * Format operations per second with appropriate unit suffix
 */
export function formatOpsPerSecond(opsPerSecond: number): string {
  if (opsPerSecond >= 1000000) {
    return `${(opsPerSecond / 1000000).toFixed(opsPerSecond >= 10000000 ? 0 : 1)}M`;
  } else if (opsPerSecond >= 1000) {
    return `${(opsPerSecond / 1000).toFixed(opsPerSecond >= 10000 ? 0 : 1)}K`;
  }
  return opsPerSecond.toString();
}

/**
 * Report performance results to console
 */
export function reportPerformance(result: PerfResult, expression?: string): void {
  if (expression) {
    console.log(`\n[${result.name}] "${expression}"`);
  } else {
    console.log(`\n[${result.name}]`);
  }
  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Total time: ${result.totalMs.toFixed(2)}ms`);
  console.log(`  Average: ${result.avgUs.toFixed(2)}μs`);
  console.log(`  Min: ${result.minUs.toFixed(2)}μs, Max: ${result.maxUs.toFixed(2)}μs`);
  console.log(`  Median: ${result.medianUs.toFixed(2)}μs`);
  console.log(`  P95: ${result.p95Us.toFixed(2)}μs, P99: ${result.p99Us.toFixed(2)}μs`);
  console.log(`  Ops/sec: ${formatOpsPerSecond(Math.round(1000000 / result.avgUs))}`);
}

/**
 * Compare multiple parser benchmarks on a single expression
 */
export function compareParserPerformance(
  expression: string,
  parsers: ParserBenchmark[],
  config: PerfConfig
): { parser: string; result: PerfResult }[] {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PERFORMANCE COMPARISON: "${expression}"`);
  console.log(`Expression length: ${expression.length} characters`);
  console.log(`Iterations: ${config.iterations}`);
  console.log(`${'='.repeat(80)}`);

  const results: { parser: string; result: PerfResult }[] = [];

  for (const parser of parsers) {
    if (config.verbose) {
      console.log(`\nTesting ${parser.name}...`);
    }
    
    try {
      // Setup if needed
      parser.setupFn?.();
      
      // Warmup
      if (parser.warmupFn) {
        if (config.verbose) {
          console.log('  Warming up...');
        }
        parser.warmupFn();
      }
      
      // Run benchmark
      const result = measurePerformance(
        parser.name,
        config.iterations,
        () => {
          try {
            parser.parseFunction(expression);
          } catch (error) {
            // Some parsers might throw on complex expressions
            // We'll count this as a valid attempt for timing purposes
          }
        }
      );
      
      results.push({ parser: parser.name, result });
      
      if (config.verbose) {
        reportPerformance(result, expression);
      }
      
      // Teardown if needed
      parser.teardownFn?.();
      
    } catch (error) {
      console.error(`  Error testing ${parser.name}: ${error}`);
    }
  }

  return results;
}

/**
 * Print comparison summary of benchmark results
 */
export function printComparisonSummary(results: { parser: string; result: PerfResult }[]): void {
  console.log(`\n${'─'.repeat(80)}`);
  console.log('SUMMARY COMPARISON');
  console.log(`${'─'.repeat(80)}`);
  
  if (results.length === 0) {
    console.log('No results to compare');
    return;
  }

  // Sort by average time (fastest first)
  results.sort((a, b) => a.result.avgUs - b.result.avgUs);
  
  const fastest = results[0];
  const slowest = results[results.length - 1];
  
  if (fastest && slowest) {
    console.log(`\nFastest: ${fastest.parser} (${fastest.result.avgUs.toFixed(2)}μs avg)`);
    console.log(`Slowest: ${slowest.parser} (${slowest.result.avgUs.toFixed(2)}μs avg)`);
    
    console.log('\nRelative Performance (vs slowest):');
    for (const { parser, result } of results) {
      const speedup = slowest.result.avgUs / result.avgUs;
      const opsPerSec = Math.round(1000000 / result.avgUs);
      console.log(`  ${parser.padEnd(25)} ${result.avgUs.toFixed(2).padStart(8)}μs  ${speedup.toFixed(2).padStart(5)}x  ${opsPerSec.toLocaleString().padStart(10)} ops/sec`);
    }
  }
}

/**
 * Test parser correctness before benchmarking
 */
export function testParserCorrectness(
  expressions: string[],
  parsers: ParserBenchmark[],
  maxExpressions: number = 3
): boolean {
  console.log('Testing parser correctness...\n');
  
  let allCorrect = true;
  
  for (const expression of expressions.slice(0, maxExpressions)) {
    console.log(`Testing: "${expression}"`);
    
    for (const parser of parsers) {
      try {
        parser.setupFn?.();
        const result = parser.parseFunction(expression);
        console.log(`  ✓ ${parser.name}: ${result ? 'Parsed successfully' : 'Returned null/undefined'}`);
      } catch (error) {
        console.log(`  ✗ ${parser.name}: Error - ${error}`);
        allCorrect = false;
      }
    }
    console.log();
  }
  
  return allCorrect;
} 