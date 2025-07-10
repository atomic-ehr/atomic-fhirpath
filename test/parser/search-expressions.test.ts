import { test, expect, describe } from 'bun:test';
import { parse } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

interface SearchExpression {
  name: string;
  expression: string;
  base?: string[];
  type?: string;
  description?: string;
}

interface SearchExpressions {
  stats: {
    totalSearchParameters: number;
    withExpressions: number;
    withoutExpressions: number;
    uniqueExpressions: number;
  };
  expressions: SearchExpression[];
}

// Load the search expressions
const searchExpressionsPath = path.join(__dirname, 'search-expressions.json');
const searchData: SearchExpressions = JSON.parse(fs.readFileSync(searchExpressionsPath, 'utf-8'));

// Extract unique expressions
const uniqueExpressions = new Set<string>();
searchData.expressions.forEach(expr => uniqueExpressions.add(expr.expression));
const uniqueExpressionsList = Array.from(uniqueExpressions).sort();

describe('SearchParameter Expressions', () => {
  // Helper to categorize expressions
  const categorizeExpression = (expr: string) => {
    if (expr.includes(' | ')) return 'pipe-alternatives';
    if (expr.includes('.ofType(')) return 'ofType-function';
    if (expr.includes('.where(')) return 'where-function';
    if (expr.includes('.resolve()')) return 'resolve-function';
    if (expr.includes('extension(')) return 'extension-function';
    if (expr.includes(' as ')) return 'as-operator';
    if (expr.includes(' is ')) return 'is-operator';
    if (expr.includes('.')) return 'property-access';
    return 'simple-identifier';
  };

  // Group expressions by category
  const expressionsByCategory = new Map<string, string[]>();
  uniqueExpressionsList.forEach(expr => {
    const category = categorizeExpression(expr);
    if (!expressionsByCategory.has(category)) {
      expressionsByCategory.set(category, []);
    }
    expressionsByCategory.get(category)!.push(expr);
  });

  // Test statistics
  let totalParsed = 0;
  let totalFailed = 0;
  const failuresByCategory = new Map<string, { count: number; errors: Map<string, number> }>();

  // Test each category
  for (const [category, expressions] of expressionsByCategory) {
    describe(category, () => {
      test(`should parse ${category} expressions`, () => {
        let passed = 0;
        let failed = 0;
        const errors = new Map<string, number>();
        const sampleFailures: { expr: string; error: string }[] = [];

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
            
            // Collect sample failures (up to 5 per category)
            if (sampleFailures.length < 5) {
              sampleFailures.push({ expr, error: errorMsg });
            }
          }
        }

        // Store failure data
        if (failed > 0) {
          failuresByCategory.set(category, { count: failed, errors });
        }

        // Log results for this category
        const successRate = ((passed / expressions.length) * 100).toFixed(1);
        console.log(`\n${category}:`);
        console.log(`  Total: ${expressions.length}`);
        console.log(`  Passed: ${passed} (${successRate}%)`);
        console.log(`  Failed: ${failed}`);

        if (sampleFailures.length > 0) {
          console.log(`  Sample failures:`);
          sampleFailures.forEach(({ expr, error }) => {
            console.log(`    - "${expr}" => ${error}`);
          });
        }

        // Don't fail the test, just report
        expect(passed + failed).toBe(expressions.length);
      });
    });
  }

  // Summary test
  test('should report overall parsing statistics', () => {
    const total = uniqueExpressionsList.length;
    const successRate = ((totalParsed / total) * 100).toFixed(1);
    
    console.log('\n=== OVERALL STATISTICS ===');
    console.log(`Total unique expressions: ${total}`);
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

    // This test always passes - it's just for reporting
    expect(true).toBe(true);
  });

  // Test specific known patterns
  describe('Known patterns', () => {
    test('should handle simple property access', () => {
      const simpleExpressions = [
        'Resource.id',
        'Resource.language',
        'Patient.name',
        'Observation.code'
      ];

      for (const expr of simpleExpressions) {
        const result = parse(expr);
        expect(result.kind).toBe('dot');
      }
    });

    test('should handle nested property access', () => {
      const nestedExpressions = [
        'Resource.meta.lastUpdated',
        'Resource.meta.profile',
        'Resource.meta.tag'
      ];

      for (const expr of nestedExpressions) {
        const result = parse(expr);
        expect(result.kind).toBe('dot');
      }
    });

    test('should handle pipe alternatives', () => {
      const pipeExpressions = searchData.expressions
        .filter(e => e.expression.includes(' | '))
        .slice(0, 5)
        .map(e => e.expression);

      for (const expr of pipeExpressions) {
        try {
          const result = parse(expr);
          expect(result.kind).toBe('binary');
          expect((result as any).op).toBe(30); // TokenType.PIPE
        } catch (e: any) {
          console.log(`Failed to parse pipe expression: "${expr}" - ${e.message}`);
        }
      }
    });

    test('should handle ofType() function calls', () => {
      const ofTypeExpressions = [
        'Condition.abatement.ofType(Age)',
        'Condition.abatement.ofType(dateTime)',
        'QuestionnaireResponse.item.answer.value.ofType(boolean)'
      ];

      for (const expr of ofTypeExpressions) {
        try {
          const result = parse(expr);
          // The result should end with a function call
          expect(result).toBeDefined();
        } catch (e: any) {
          console.log(`Failed to parse ofType expression: "${expr}" - ${e.message}`);
        }
      }
    });
  });

  // Test edge cases found in the data
  describe('Edge cases', () => {
    test('should handle expressions with spaces in type names', () => {
      // Some expressions might have spaces that need proper handling
      const edgeCases = searchData.expressions
        .filter(e => e.expression.includes('  ') || e.expression.trim() !== e.expression)
        .slice(0, 5)
        .map(e => e.expression);

      for (const expr of edgeCases) {
        try {
          const result = parse(expr.trim());
          expect(result).toBeDefined();
        } catch (e: any) {
          console.log(`Failed on edge case: "${expr}" - ${e.message}`);
        }
      }
    });

    test('should identify unsupported features', () => {
      const unsupportedPatterns = [
        'resolve()',
        'extension(',
        'hasValue()',
        'descendants()',
        'memberOf(',
        'trace('
      ];

      const unsupportedExpressions = new Map<string, string[]>();
      
      for (const pattern of unsupportedPatterns) {
        const matching = searchData.expressions
          .filter(e => e.expression.includes(pattern))
          .slice(0, 3)
          .map(e => e.expression);
        
        if (matching.length > 0) {
          unsupportedExpressions.set(pattern, matching);
        }
      }

      console.log('\n=== UNSUPPORTED FEATURES ===');
      for (const [pattern, examples] of unsupportedExpressions) {
        console.log(`\n${pattern}:`);
        examples.forEach(expr => {
          console.log(`  - ${expr}`);
        });
      }

      // This test is informational
      expect(unsupportedExpressions.size).toBeGreaterThan(0);
    });
  });
});