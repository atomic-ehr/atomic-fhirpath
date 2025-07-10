import * as fs from 'fs';
import * as path from 'path';
import { parse, clearParserCache } from '../../src';

// Performance log file
const PERF_LOG_FILE = path.join(__dirname, '..', 'performance.log');

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

export interface PerfLog {
  timestamp: string;
  version: string;
  results: PerfResult[];
}

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
  const minUs = times[0] ?? 0;
  const maxUs = times[times.length - 1] ?? 0;
  const medianUs = times[Math.floor(iterations / 2)] ?? 0;
  const p95Us = times[Math.floor(iterations * 0.95)] ?? 0;
  const p99Us = times[Math.floor(iterations * 0.99)] ?? 0;

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

function formatOpsPerSecond(opsPerSecond: number): string {
  if (opsPerSecond >= 1000000) {
    return `${(opsPerSecond / 1000000).toFixed(opsPerSecond >= 10000000 ? 0 : 1)}M`;
  } else if (opsPerSecond >= 1000) {
    return `${(opsPerSecond / 1000).toFixed(opsPerSecond >= 10000 ? 0 : 1)}K`;
  }
  return opsPerSecond.toString();
}

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

export function reportParsePerformance(result: PerfResult, expression: string): void {
  console.log(`\n[${result.name}] "${expression}"`);
  console.log(`  Length: ${expression.length} chars`);
  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Total time: ${result.totalMs.toFixed(2)}ms`);
  console.log(`  Average: ${result.avgUs.toFixed(2)}μs`);
  console.log(`  Min: ${result.minUs.toFixed(2)}μs, Max: ${result.maxUs.toFixed(2)}μs`);
  console.log(`  Median: ${result.medianUs.toFixed(2)}μs`);
  console.log(`  P95: ${result.p95Us.toFixed(2)}μs, P99: ${result.p99Us.toFixed(2)}μs`);
  
  const opsPerSecond = Math.round(1000000 / result.avgUs);
  const rpsPerChar = Math.round(opsPerSecond / expression.length);
  console.log(`  Ops/sec: ${formatOpsPerSecond(opsPerSecond)}`);
  console.log(`  RPS/char: ${formatOpsPerSecond(rpsPerChar)}`);
}

export function reportParsePerformanceComparison(nonCached: PerfResult, cached: PerfResult, expression: string): void {
  console.log(`\n"${expression}"`);
  console.log(`  Length: ${expression.length} chars`);
  console.log(`  Iterations: ${nonCached.iterations}`);
  console.log();
  
  // Calculate metrics
  const nonCachedOps = Math.round(1000000 / nonCached.avgUs);
  const cachedOps = Math.round(1000000 / cached.avgUs);
  const nonCachedRps = Math.round(nonCachedOps / expression.length);
  const cachedRps = Math.round(cachedOps / expression.length);
  const speedup = (nonCached.avgUs / cached.avgUs);
  
  // Column headers
  const col1Width = 15;
  const col2Width = 15;
  const col3Width = 15;
  
  console.log(`  ${'Metric'.padEnd(col1Width)} ${'No Cache'.padEnd(col2Width)} ${'Cached'.padEnd(col3Width)} Speedup`);
  console.log(`  ${'─'.repeat(col1Width)} ${'─'.repeat(col2Width)} ${'─'.repeat(col3Width)} ${'─'.repeat(8)}`);
  
  // Data rows
  console.log(`  ${'Average'.padEnd(col1Width)} ${(nonCached.avgUs.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.avgUs.toFixed(2) + 'μs').padEnd(col3Width)} ${speedup.toFixed(1)}x`);
  console.log(`  ${'Min'.padEnd(col1Width)} ${(nonCached.minUs.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.minUs.toFixed(2) + 'μs').padEnd(col3Width)}`);
  console.log(`  ${'Max'.padEnd(col1Width)} ${(nonCached.maxUs.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.maxUs.toFixed(2) + 'μs').padEnd(col3Width)}`);
  console.log(`  ${'Median'.padEnd(col1Width)} ${(nonCached.medianUs.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.medianUs.toFixed(2) + 'μs').padEnd(col3Width)}`);
  console.log(`  ${'P95'.padEnd(col1Width)} ${(nonCached.p95Us.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.p95Us.toFixed(2) + 'μs').padEnd(col3Width)}`);
  console.log(`  ${'P99'.padEnd(col1Width)} ${(nonCached.p99Us.toFixed(2) + 'μs').padEnd(col2Width)} ${(cached.p99Us.toFixed(2) + 'μs').padEnd(col3Width)}`);
  console.log(`  ${'Ops/sec'.padEnd(col1Width)} ${formatOpsPerSecond(nonCachedOps).padEnd(col2Width)} ${formatOpsPerSecond(cachedOps).padEnd(col3Width)}`);
  console.log(`  ${'RPS/char'.padEnd(col1Width)} ${formatOpsPerSecond(nonCachedRps).padEnd(col2Width)} ${formatOpsPerSecond(cachedRps).padEnd(col3Width)}`);
}

export function writePerfLog(results: PerfResult[]): void {
  const log: PerfLog = {
    timestamp: new Date().toISOString(),
    version: 'v1.0.0-basic', // Update this when making optimizations
    results
  };

  // Read existing logs
  let logs: PerfLog[] = [];
  if (fs.existsSync(PERF_LOG_FILE)) {
    const content = fs.readFileSync(PERF_LOG_FILE, 'utf-8');
    logs = JSON.parse(content);
  }

  // Append new log
  logs.push(log);

  // Write back
  fs.writeFileSync(PERF_LOG_FILE, JSON.stringify(logs, null, 2));
}

// Convenience function for quick performance measurement and reporting
export function measureAndReport(name: string, iterations: number, fn: () => void, expression?: string): PerfResult {
  const result = measurePerformance(name, iterations, fn);
  reportPerformance(result, expression);
  return result;
}

// Specialized function for parsing performance
export function measureParsePerformance(name: string, expression: string, iterations: number, useCache: boolean = false): PerfResult {
  // Setup function based on cache usage
  const parseFn = () => {
    if (!useCache) {
      clearCache();
    }
    parse(expression, useCache);
  };
  
  const result = measurePerformance(name, iterations, parseFn);
  reportParsePerformance(result, expression);
  return result;
}

// Measure both cached and non-cached performance for comparison
export function measureParsePerformanceComparison(name: string, expression: string, iterations: number): { cached: PerfResult, nonCached: PerfResult } {
  // Measure non-cached performance
  const nonCachedFn = () => {
    clearParserCache();
    parse(expression, false);
  };
  const nonCached = measurePerformance(`${expression}-nocache`, iterations, nonCachedFn);
  
  // Prime cache and measure cached performance
  clearParserCache();
  parse(expression, true); // Prime the cache
  const cachedFn = () => {
    parse(expression, true);
  };
  const cached = measurePerformance(`${expression}-cached`, iterations, cachedFn);
  
  reportParsePerformanceComparison(nonCached, cached, expression);
  return { cached, nonCached };
} 