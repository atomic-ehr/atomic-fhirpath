#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

const PERF_LOG_FILE = path.join(__dirname, '..', 'performance.log');

interface PerfResult {
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

interface PerfLog {
  timestamp: string;
  version: string;
  results: PerfResult[];
}

if (!fs.existsSync(PERF_LOG_FILE)) {
  console.log('No performance logs found. Run performance tests first.');
  process.exit(1);
}

const logs: PerfLog[] = JSON.parse(fs.readFileSync(PERF_LOG_FILE, 'utf-8'));

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'latest';

function formatTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => r[i].length))
  );
  
  const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const formatRow = (row: string[]) => 
    '| ' + row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |';
  
  console.log(separator);
  console.log(formatRow(headers));
  console.log(separator);
  rows.forEach(row => console.log(formatRow(row)));
  console.log(separator);
}

switch (command) {
  case 'latest':
    const latest = logs[logs.length - 1];
    console.log(`\n📊 Performance Results - ${latest.version}`);
    console.log(`📅 ${new Date(latest.timestamp).toLocaleString()}\n`);
    
    const rows = latest.results.map(r => [
      r.name,
      r.avgUs.toFixed(2) + 'μs',
      r.minUs.toFixed(2) + 'μs',
      r.maxUs.toFixed(2) + 'μs',
      r.medianUs.toFixed(2) + 'μs',
      r.p95Us.toFixed(2) + 'μs'
    ]);
    
    formatTable(['Test', 'Avg', 'Min', 'Max', 'Median', 'P95'], rows);
    break;
    
  case 'history':
    const testName = args[1];
    if (!testName) {
      console.log('Available tests:');
      const allTests = new Set(logs.flatMap(l => l.results.map(r => r.name)));
      allTests.forEach(t => console.log(`  - ${t}`));
      break;
    }
    
    console.log(`\n📈 Performance History: ${testName}\n`);
    
    const historyRows = logs
      .filter(log => log.results.some(r => r.name === testName))
      .map(log => {
        const result = log.results.find(r => r.name === testName)!;
        return [
          log.version,
          new Date(log.timestamp).toLocaleDateString(),
          result.avgUs.toFixed(2) + 'μs',
          result.minUs.toFixed(2) + 'μs',
          result.p95Us.toFixed(2) + 'μs'
        ];
      });
    
    formatTable(['Version', 'Date', 'Avg', 'Min', 'P95'], historyRows);
    break;
    
  case 'compare':
    const v1 = args[1];
    const v2 = args[2] || logs[logs.length - 1].version;
    
    const log1 = logs.find(l => l.version === v1);
    const log2 = logs.find(l => l.version === v2);
    
    if (!log1 || !log2) {
      console.log('Version not found. Available versions:');
      logs.forEach(l => console.log(`  - ${l.version} (${new Date(l.timestamp).toLocaleDateString()})`));
      break;
    }
    
    console.log(`\n⚖️  Comparing ${v1} vs ${v2}\n`);
    
    const compareRows = log2.results.map(r2 => {
      const r1 = log1.results.find(r => r.name === r2.name);
      if (!r1) return [r2.name, 'N/A', r2.avgUs.toFixed(2) + 'μs', 'NEW'];
      
      const diff = ((r2.avgUs - r1.avgUs) / r1.avgUs) * 100;
      const sign = diff >= 0 ? '+' : '';
      const emoji = diff < -10 ? '🚀' : diff < -5 ? '✅' : diff < 5 ? '➡️' : diff < 10 ? '⚠️' : '❌';
      
      return [
        r2.name,
        r1.avgUs.toFixed(2) + 'μs',
        r2.avgUs.toFixed(2) + 'μs',
        `${emoji} ${sign}${diff.toFixed(1)}%`
      ];
    });
    
    formatTable(['Test', v1, v2, 'Change'], compareRows);
    break;
    
  default:
    console.log(`
FHIRPath Parser Performance Viewer

Usage:
  bun scripts/view-perf.ts [command] [options]

Commands:
  latest                    Show latest performance results (default)
  history <test-name>       Show history for a specific test
  compare <v1> [v2]         Compare two versions (v2 defaults to latest)

Examples:
  bun scripts/view-perf.ts latest
  bun scripts/view-perf.ts history parser-simple-nocache
  bun scripts/view-perf.ts compare v1.0.0-basic v1.0.1-optimized
    `);
}