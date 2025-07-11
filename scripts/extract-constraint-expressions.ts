#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as readline from 'readline';

interface Constraint {
  key: string;
  severity: string;
  human: string;
  expression: string;
  source?: string;
}

interface Element {
  id?: string;
  path: string;
  constraint?: Constraint[];
}

interface StructureDefinition {
  resourceType: string;
  id: string;
  url: string;
  name: string;
  title?: string;
  status: string;
  kind: string;
  abstract?: boolean;
  type?: string;
  baseDefinition?: string;
  differential?: {
    element: Element[];
  };
  snapshot?: {
    element: Element[];
  };
}

interface ConstraintExpression {
  structureDefinitionId: string;
  structureDefinitionUrl: string;
  structureDefinitionName: string;
  elementPath: string;
  constraintKey: string;
  severity: string;
  human: string;
  expression: string;
  source: 'differential' | 'snapshot';
}

interface ExtractedData {
  stats: {
    totalStructureDefinitions: number;
    structureDefinitionsWithConstraints: number;
    totalConstraints: number;
    totalUniqueExpressions: number;
    constraintsBySeverity: {
      error: number;
      warning: number;
    };
  };
  constraints: ConstraintExpression[];
  uniqueExpressions: string[];
}

async function extractConstraintExpressions() {
  const inputFile = path.join(__dirname, '..', 'tmp', 'resources.ndjson.gz');
  const outputFile = path.join(__dirname, '..', 'test', 'constraint-expressions.json');
  
  console.log('📂 Extracting constraint expressions from StructureDefinition resources...\n');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    console.error('   Please ensure resources.ndjson.gz exists in the tmp directory.');
    process.exit(1);
  }

  const constraints: ConstraintExpression[] = [];
  const uniqueExpressions = new Set<string>();
  let totalStructureDefinitions = 0;
  let structureDefinitionsWithConstraints = 0;
  const constraintsBySeverity = {
    error: 0,
    warning: 0
  };

  // Create read stream
  const readStream = fs.createReadStream(inputFile);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({
    input: readStream.pipe(gunzip),
    crlfDelay: Infinity
  });

  // Process each line
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const resource = JSON.parse(line);
      
      // Only process StructureDefinition resources
      if (resource.resourceType !== 'StructureDefinition') continue;
      
      totalStructureDefinitions++;
      const sd = resource as StructureDefinition;
      let foundConstraints = false;

      // Extract constraints from differential
      if (sd.differential?.element) {
        for (const element of sd.differential.element) {
          if (element.constraint && element.constraint.length > 0) {
            foundConstraints = true;
            for (const constraint of element.constraint) {
              if (constraint.expression) {
                constraints.push({
                  structureDefinitionId: sd.id,
                  structureDefinitionUrl: sd.url,
                  structureDefinitionName: sd.name,
                  elementPath: element.path,
                  constraintKey: constraint.key,
                  severity: constraint.severity || 'error',
                  human: constraint.human,
                  expression: constraint.expression,
                  source: 'differential'
                });
                
                uniqueExpressions.add(constraint.expression);
                
                if (constraint.severity === 'warning') {
                  constraintsBySeverity.warning++;
                } else {
                  constraintsBySeverity.error++;
                }
              }
            }
          }
        }
      }

      // Extract constraints from snapshot (but mark them differently)
      if (sd.snapshot?.element) {
        for (const element of sd.snapshot.element) {
          if (element.constraint && element.constraint.length > 0) {
            foundConstraints = true;
            for (const constraint of element.constraint) {
              if (constraint.expression) {
                // Check if this constraint is already in differential
                const isDuplicate = constraints.some(c => 
                  c.structureDefinitionId === sd.id &&
                  c.elementPath === element.path &&
                  c.constraintKey === constraint.key &&
                  c.source === 'differential'
                );
                
                if (!isDuplicate) {
                  constraints.push({
                    structureDefinitionId: sd.id,
                    structureDefinitionUrl: sd.url,
                    structureDefinitionName: sd.name,
                    elementPath: element.path,
                    constraintKey: constraint.key,
                    severity: constraint.severity || 'error',
                    human: constraint.human,
                    expression: constraint.expression,
                    source: 'snapshot'
                  });
                  
                  uniqueExpressions.add(constraint.expression);
                  
                  if (constraint.severity === 'warning') {
                    constraintsBySeverity.warning++;
                  } else {
                    constraintsBySeverity.error++;
                  }
                }
              }
            }
          }
        }
      }
      
      if (foundConstraints) {
        structureDefinitionsWithConstraints++;
      }
      
    } catch (e) {
      console.error(`Error parsing line: ${e}`);
    }
  }

  // Sort constraints for consistent output
  constraints.sort((a, b) => {
    if (a.structureDefinitionName !== b.structureDefinitionName) {
      return a.structureDefinitionName.localeCompare(b.structureDefinitionName);
    }
    if (a.elementPath !== b.elementPath) {
      return a.elementPath.localeCompare(b.elementPath);
    }
    return a.constraintKey.localeCompare(b.constraintKey);
  });

  // Sort unique expressions
  const sortedUniqueExpressions = Array.from(uniqueExpressions).sort();

  // Prepare output data
  const outputData: ExtractedData = {
    stats: {
      totalStructureDefinitions,
      structureDefinitionsWithConstraints,
      totalConstraints: constraints.length,
      totalUniqueExpressions: uniqueExpressions.size,
      constraintsBySeverity
    },
    constraints,
    uniqueExpressions: sortedUniqueExpressions
  };

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

  // Display results
  console.log('📊 Extraction Complete!\n');
  console.log(`📁 Output written to: ${outputFile}\n`);
  console.log('📈 Statistics:');
  console.log(`   Total StructureDefinitions: ${totalStructureDefinitions}`);
  console.log(`   StructureDefinitions with constraints: ${structureDefinitionsWithConstraints}`);
  console.log(`   Total constraints extracted: ${constraints.length}`);
  console.log(`   Unique expressions: ${uniqueExpressions.size}`);
  console.log(`   Error constraints: ${constraintsBySeverity.error}`);
  console.log(`   Warning constraints: ${constraintsBySeverity.warning}`);
  
  // Sample complex expressions
  console.log('\n🔍 Sample complex constraint expressions:');
  const complexExpressions = sortedUniqueExpressions
    .filter(expr => expr.length > 100)
    .slice(0, 5);
  
  complexExpressions.forEach((expr, i) => {
    console.log(`\n${i + 1}. ${expr.substring(0, 80)}...`);
    console.log(`   (Length: ${expr.length} characters)`);
  });
  
  // Most common patterns
  console.log('\n📋 Common patterns in constraint expressions:');
  const patterns: Record<string, number> = {
    'hasValue()': 0,
    'exists()': 0,
    'empty()': 0,
    'count()': 0,
    'where(': 0,
    'or ': 0,
    'and ': 0,
    'implies': 0,
    'xor': 0,
    '.all(': 0,
    '.select(': 0,
    '.ofType(': 0,
    'matches(': 0,
    'contains(': 0,
    'startsWith(': 0,
    'length()': 0,
    'toString()': 0,
    'toDateTime()': 0
  };
  
  for (const expr of uniqueExpressions) {
    for (const pattern of Object.keys(patterns)) {
      if (expr.includes(pattern)) {
        patterns[pattern] = patterns[pattern]! + 1;
      }
    }
  }
  
  const sortedPatterns = Object.entries(patterns)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  sortedPatterns.forEach(([pattern, count]) => {
    const percentage = ((count / uniqueExpressions.size) * 100).toFixed(1);
    console.log(`   "${pattern}": ${count} expressions (${percentage}%)`);
  });
  
  // Find constraints by resource type
  console.log('\n🏥 Top resources with constraints:');
  const resourceCounts = new Map<string, number>();
  constraints.forEach(c => {
    const count = resourceCounts.get(c.structureDefinitionName) || 0;
    resourceCounts.set(c.structureDefinitionName, count + 1);
  });
  
  const topResources = Array.from(resourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  topResources.forEach(([name, count]) => {
    console.log(`   ${name}: ${count} constraints`);
  });
}

// Run the extraction
extractConstraintExpressions().catch(console.error);