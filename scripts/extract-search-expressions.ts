#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

interface SearchParameter {
  resourceType: string;
  id?: string;
  name: string;
  base?: string[];
  expression?: string;
  type?: string;
  description?: string;
}

interface ExtractedExpression {
  name: string;
  expression: string;
  base?: string[];
  type?: string;
  description?: string;
}

interface ExpressionStats {
  totalSearchParameters: number;
  withExpressions: number;
  withoutExpressions: number;
  uniqueExpressions: number;
}

async function extractSearchExpressions() {
  const inputFile = path.join(__dirname, '..', 'tmp', 'resources.ndjson.gz');
  const outputFile = path.join(__dirname, '..', 'search-expressions.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('🔍 Extracting SearchParameter expressions from FHIR resources...');

  const expressions: ExtractedExpression[] = [];
  const uniqueExpressions = new Set<string>();
  let totalSearchParameters = 0;
  let withExpressions = 0;
  let withoutExpressions = 0;

  // Create a transform stream to process NDJSON lines
  const processLine = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const resource = JSON.parse(line) as SearchParameter;
          
          if (resource.resourceType === 'SearchParameter') {
            totalSearchParameters++;
            
            if (resource.expression) {
              withExpressions++;
              uniqueExpressions.add(resource.expression);
              
              expressions.push({
                name: resource.name,
                expression: resource.expression,
                base: resource.base,
                type: resource.type,
                description: resource.description
              });
            } else {
              withoutExpressions++;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
      
      callback();
    }
  });

  // Process the file
  await pipeline(
    createReadStream(inputFile),
    zlib.createGunzip(),
    processLine
  );

  // Sort expressions by name for consistency
  expressions.sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort unique expressions alphabetically
  const sortedUniqueExpressions = Array.from(uniqueExpressions).sort();

  // Prepare output
  const output = {
    stats: {
      totalSearchParameters,
      withExpressions,
      withoutExpressions,
      uniqueExpressions: uniqueExpressions.size
    } as ExpressionStats,
    expressions,
    uniqueExpressions: sortedUniqueExpressions
  };

  // Write output file
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log('\n✅ Extraction complete!');
  console.log(`📊 Statistics:`);
  console.log(`   Total SearchParameters: ${totalSearchParameters}`);
  console.log(`   With expressions: ${withExpressions}`);
  console.log(`   Without expressions: ${withoutExpressions}`);
  console.log(`   Unique expressions: ${uniqueExpressions.size}`);
  console.log(`\n📁 Output saved to: ${outputFile}`);

  // Show sample expressions
  console.log('\n📝 Sample expressions:');
  const samples = sortedUniqueExpressions.slice(0, 10);
  samples.forEach(expr => console.log(`   - ${expr}`));
  if (sortedUniqueExpressions.length > 10) {
    console.log(`   ... and ${sortedUniqueExpressions.length - 10} more`);
  }
}

// Run the extraction
extractSearchExpressions().catch(console.error);