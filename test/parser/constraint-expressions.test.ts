import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

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

interface ConstraintData {
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

// Load the constraint expressions
const constraintExpressionsPath = path.join(__dirname, 'constraint-expressions.json');
const constraintData: ConstraintData = JSON.parse(fs.readFileSync(constraintExpressionsPath, 'utf-8'));

describe('FHIR Constraint Expressions', () => {
  // Helper to categorize expressions by complexity
  const categorizeExpression = (expr: string) => {
    if (expr.includes('descendants()')) return 'descendants-function';
    if (expr.includes('trace(')) return 'trace-function';
    if (expr.includes('%context') || expr.includes('%resource')) return 'fhirpath-variables';
    if (expr.includes('.all(') || expr.includes('.any(')) return 'collection-functions';
    if (expr.includes('implies')) return 'implies-operator';
    if (expr.includes('matches(')) return 'regex-function';
    if (expr.includes(' or ') && expr.includes(' and ')) return 'complex-boolean';
    if (expr.includes('.where(')) return 'where-function';
    if (expr.includes('.select(')) return 'select-function';
    if (expr.includes(' is ') || expr.includes(' as ')) return 'type-operators';
    if (expr.includes('exists()') || expr.includes('empty()')) return 'existence-checks';
    if (expr.includes('.')) return 'property-access';
    return 'simple-expression';
  };

  // Group expressions by category
  const expressionsByCategory = new Map<string, string[]>();
  constraintData.uniqueExpressions.forEach(expr => {
    const category = categorizeExpression(expr);
    if (!expressionsByCategory.has(category)) {
      expressionsByCategory.set(category, []);
    }
    expressionsByCategory.get(category)!.push(expr);
  });

  // Test statistics
  let totalParsed = 0;
  let totalFailed = 0;
  const failuresByCategory = new Map<string, { count: number; errors: Map<string, number>; examples: string[] }>();

  // Test each category
  for (const [category, expressions] of expressionsByCategory) {
    describe(category, () => {
      test(`should parse ${category} expressions`, () => {
        let passed = 0;
        let failed = 0;
        const errors = new Map<string, number>();
        const failedExamples: string[] = [];

        for (const expr of expressions) {
          try {
            const result = parse(expr);
            expect(result).toBeDefined();
            passed++;
            totalParsed++;
          } catch (e: any) {
            failed++;
            totalFailed++;
            const errorMsg = e.message || 'Unknown error';
            errors.set(errorMsg, (errors.get(errorMsg) || 0) + 1);
            
            // Collect failed examples (up to 5 per category)
            if (failedExamples.length < 5) {
              failedExamples.push(expr);
            }
          }
        }

        // Store failure data
        if (failed > 0) {
          failuresByCategory.set(category, { count: failed, errors, examples: failedExamples });
        }

        // Log results for this category
        const successRate = expressions.length > 0 ? ((passed / expressions.length) * 100).toFixed(1) : '0.0';
        console.log(`\n${category}:`);
        console.log(`  Total: ${expressions.length}`);
        console.log(`  Passed: ${passed} (${successRate}%)`);
        console.log(`  Failed: ${failed}`);

        if (failedExamples.length > 0) {
          console.log(`  Failed expressions:`);
          failedExamples.forEach((expr, i) => {
            console.log(`    ${i + 1}. ${expr.length > 80 ? expr.substring(0, 77) + '...' : expr}`);
          });
        }

        // Don't fail the test, just report
        expect(passed + failed).toBe(expressions.length);
      });
    });
  }

  // Test specific known patterns
  describe('Known patterns', () => {
    test('should handle simple existence checks', () => {
      const existenceExpressions = constraintData.uniqueExpressions
        .filter(expr => expr === 'exists()' || expr === 'empty()' || expr.match(/^\w+\.(exists\(\)|empty\(\))$/))
        .slice(0, 10);

      for (const expr of existenceExpressions) {
        try {
          const result = parse(expr);
          expect(result).toBeDefined();
        } catch (e: any) {
          console.log(`Failed simple existence check: "${expr}" - ${e.message}`);
        }
      }
    });

    test('should handle implies operator', () => {
      const impliesExpressions = constraintData.uniqueExpressions
        .filter(expr => expr.includes(' implies '))
        .slice(0, 5);

      for (const expr of impliesExpressions) {
        try {
          const result = parse(expr);
          expect(result).toBeDefined();
        } catch (e: any) {
          console.log(`Failed implies expression: "${expr.substring(0, 60)}..." - ${e.message}`);
        }
      }
    });

    test('should identify unsupported FHIRPath features', () => {
      const unsupportedPatterns = [
        'descendants()',
        'trace(',
        '%context',
        '%resource',
        '%ucum',
        'all(',
        'any(',
        'aggregate(',
        'combine(',
        'union(',
        'intersect(',
        'exclude(',
        'subsetOf(',
        'supersetOf(',
        'isDistinct(',
        'distinct(',
        'repeat(',
        'matches(',
        'replaceMatches(',
        'toChars(',
        'substring(',
        'indexOf(',
        'lastIndexOf(',
        'replace(',
        'trim(',
        'split(',
        'join(',
        'encode(',
        'decode(',
        'escape(',
        'unescape(',
        'htmlChecks'
      ];

      const unsupportedExpressions = new Map<string, string[]>();
      
      for (const pattern of unsupportedPatterns) {
        const matching = constraintData.uniqueExpressions
          .filter(expr => expr.includes(pattern))
          .slice(0, 3);
        
        if (matching.length > 0) {
          unsupportedExpressions.set(pattern, matching);
        }
      }

      console.log('\n=== POTENTIALLY UNSUPPORTED FEATURES ===');
      for (const [pattern, examples] of unsupportedExpressions) {
        console.log(`\n${pattern}:`);
        examples.forEach(expr => {
          const truncated = expr.length > 100 ? expr.substring(0, 97) + '...' : expr;
          console.log(`  - ${truncated}`);
        });
      }

      // This test is informational
      expect(unsupportedExpressions.size).toBeGreaterThan(0);
    });
  });

  // Summary test
  test('should report overall parsing statistics', () => {
    const total = constraintData.uniqueExpressions.length;
    const successRate = ((totalParsed / total) * 100).toFixed(1);
    
    console.log('\n=== OVERALL STATISTICS ===');
    console.log(`Total unique constraint expressions: ${total}`);
    console.log(`Successfully parsed: ${totalParsed} (${successRate}%)`);
    console.log(`Failed to parse: ${totalFailed} (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
    
    if (failuresByCategory.size > 0) {
      console.log('\n=== FAILURES BY CATEGORY ===');
      const sortedFailures = Array.from(failuresByCategory.entries())
        .sort((a, b) => b[1].count - a[1].count);
      
      for (const [category, { count, errors }] of sortedFailures) {
        console.log(`\n${category}: ${count} failures`);
        const sortedErrors = Array.from(errors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3); // Top 3 errors
        
        sortedErrors.forEach(([error, errorCount]) => {
          console.log(`  - ${error}: ${errorCount} times`);
        });
      }
    }

    // Most complex successfully parsed expressions
    const successfulComplex = constraintData.uniqueExpressions
      .filter(expr => {
        try {
          parse(expr);
          return expr.length > 100;
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);

    if (successfulComplex.length > 0) {
      console.log('\n=== MOST COMPLEX SUCCESSFULLY PARSED ===');
      successfulComplex.forEach((expr, i) => {
        console.log(`\n${i + 1}. Length: ${expr.length} chars`);
        console.log(`   ${expr.substring(0, 80)}...`);
      });
    }

    // This test always passes - it's just for reporting
    expect(true).toBe(true);
  });

  // Test constraints by resource
  describe('Constraints by resource', () => {
    test('should report parsing success by resource type', () => {
      const resourceStats = new Map<string, { total: number; passed: number; failed: number }>();
      
      // Test a sample of constraints from each resource
      const resourceSample = new Map<string, ConstraintExpression[]>();
      constraintData.constraints.forEach(constraint => {
        const resourceName = constraint.structureDefinitionName;
        if (!resourceSample.has(resourceName)) {
          resourceSample.set(resourceName, []);
        }
        if (resourceSample.get(resourceName)!.length < 10) {
          resourceSample.get(resourceName)!.push(constraint);
        }
      });

      // Test each resource's constraints
      for (const [resourceName, constraints] of resourceSample) {
        let passed = 0;
        let failed = 0;

        for (const constraint of constraints) {
          try {
            parse(constraint.expression);
            passed++;
          } catch {
            failed++;
          }
        }

        resourceStats.set(resourceName, {
          total: constraints.length,
          passed,
          failed
        });
      }

      // Report top resources with failures
      const resourcesWithFailures = Array.from(resourceStats.entries())
        .filter(([_, stats]) => stats.failed > 0)
        .sort((a, b) => b[1].failed - a[1].failed)
        .slice(0, 10);

      if (resourcesWithFailures.length > 0) {
        console.log('\n=== TOP RESOURCES WITH PARSING FAILURES ===');
        resourcesWithFailures.forEach(([name, stats]) => {
          const failureRate = ((stats.failed / stats.total) * 100).toFixed(1);
          console.log(`${name}: ${stats.failed}/${stats.total} failed (${failureRate}%)`);
        });
      }

      expect(resourceStats.size).toBeGreaterThan(0);
    });
  });

  // Test specific constraint patterns from real FHIR validation
  describe('Common FHIR validation patterns', () => {
    test('should handle common constraint patterns', () => {
      const commonPatterns = [
        // Element constraints
        "hasValue() or (children().count() > id.count())",
        "contained.contained.empty()",
        "contained.meta.versionId.empty() and contained.meta.lastUpdated.empty()",
        
        // Reference constraints
        "reference.exists() or identifier.exists() or display.exists()",
        "reference.exists() implies reference.contains('#').not()",
        
        // Extension constraints
        "extension.exists() != value.exists()",
        "children().count() > id.count() and (children() - id).where(mustSupport).exists()",
        
        // Coding constraints
        "code.exists() or display.exists()",
        "(system.exists() and code.exists()) xor display.exists()",
        
        // Common value constraints
        "value.empty() or code.empty()",
        "start.exists() implies start < end"
      ];

      console.log('\n=== COMMON CONSTRAINT PATTERNS ===');
      commonPatterns.forEach(pattern => {
        try {
          const result = parse(pattern);
          console.log(`✅ ${pattern}`);
        } catch (e: any) {
          console.log(`❌ ${pattern}`);
          console.log(`   Error: ${e.message}`);
        }
      });
    });
  });
});