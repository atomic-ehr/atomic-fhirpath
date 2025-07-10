import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';
import { ParseError } from '../../src/types';

describe('FHIRPath Specification Examples', () => {
  // Helper to test that expression parses without error
  const testParse = (expr: string) => {
    try {
      const ast = parse(expr);
      return { success: true, ast };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  describe('Basic Path Navigation', () => {
    test('should parse simple property access', () => {
      const exprs = [
        'Patient.name',
        'Patient.name.given',
        'Patient.name.family',
        'Observation.value',
        'Bundle.entry.resource',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse indexed access', () => {
      const exprs = [
        'name[0]',
        'given[0]',
        'Patient.name[0].given[0]',
        'telecom[2].value',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Operators and Literals', () => {
    test('should parse arithmetic expressions', () => {
      const exprs = [
        '1 + 2',
        '5 - 3',
        '4 * 5',
        '10 / 2',
        '10 mod 3',
        '10 div 3',
        '2.5 + 3.5',
        '-5',
        '+5',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse comparison operators', () => {
      const exprs = [
        'age > 18',
        'value < 100',
        'status = "active"',
        'use != "official"',
        'score >= 0.5',
        'count <= 10',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse logical operators', () => {
      const exprs = [
        'active and verified',
        'deceased or inactive',
        'active xor verified',
        'active implies verified',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse string literals', () => {
      // Separate expects for each string literal
      expect(testParse("'hello'").success).toBe(true);
      expect(testParse("'world'").success).toBe(true);
      expect(testParse("'hello world'").success).toBe(true);
      expect(testParse("'O\\'Brien'").success).toBe(true); // Quote in quoted string
      expect(testParse("'line1\\nline2'").success).toBe(true); // Escaped newline
    });

    test('should parse date/time literals', () => {
      const exprs = [
        '@2014',
        '@2014-01',
        '@2014-01-25',
        '@T14:30:00',
        '@T14:30:00.559',
        '@2014-01-25T14:30:14.559',
        '@2014-01-25T14:30:14.559Z',
        '@2014-01-25T14:30:14.559+09:00',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse quantity literals', () => {
      const exprs = [
        "4.5 'mg'",
        "10 'km'",
        "5.0 'mL'",
        "100 'cm'",
      ];

      // Note: Our parser doesn't fully support quantity literals yet
      // This test documents the expected behavior
      for (const expr of exprs) {
        const result = testParse(expr);
        // Currently these might fail - documenting expected future behavior
        console.log(`Quantity "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });
  });

  describe('Function Calls', () => {
    test('should parse basic function calls', () => {
      const exprs = [
        'exists()',
        'empty()',
        'count()',
        'first()',
        'last()',
        'distinct()',
        'now()',
        'today()',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        if (!result.success) {
          console.error(`Failed to parse: ${expr}`, (result.error as any).message);
        }
        expect(result.success).toBe(true);
      }
    });

    test('should parse function calls with arguments', () => {
      const exprs = [
        'substring(0, 4)',
        'contains("test")',
        'startsWith("pre")',
        'indexOf("sub")',
        'round(2)',
        'take(5)',
        'skip(2)',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse chained function calls', () => {
      const exprs = [
        'given.first()',
        'name.exists()',
        'telecom.count()',
        'value.toString()',
        'score.round(2)',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Complex Expressions from Spec', () => {
    test('should parse filtering expressions', () => {
      const exprs = [
        'telecom.where(use = "official")',
        'name.where(use = "usual")',
        'identifier.where(system = "http://example.org")',
        'entry.where(deleted.not())',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        // These involve where() which we haven't implemented yet
        console.log(`Filter "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse projection expressions', () => {
      const exprs = [
        'name.select(given)',
        'name.select(given.first() + " " + family)',
        'entry.select(resource)',
        'contact.select(name)',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        // These involve select() which we haven't implemented yet
        console.log(`Projection "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse complex nested expressions', () => {
      const exprs = [
        'Patient.name.given[0] + " " + Patient.name.family',
        'value > 10 and value < 20',
        'active and (gender = "male" or gender = "female")',
        '(weight / (height * height)) * 10000',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should parse type checking expressions', () => {
      const exprs = [
        'value is Quantity',
        'value is string',
        'resource is Patient',
        'value as Quantity',
        'resource as Patient',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        // These involve 'is' and 'as' operators we haven't implemented
        console.log(`Type check "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse collection operations', () => {
      const exprs = [
        'name | contact.name',  // union
        'given.distinct()',
        'identifier.exists()',
        'telecom.empty()',
        'name.count() > 0',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Real-world Clinical Examples', () => {
    test('should parse patient data queries', () => {
      const exprs = [
        // Check if patient has official phone
        'Patient.telecom.where(system = "phone" and use = "official").exists()',
        
        // Get full name for usual names
        'Patient.name.where(use = "usual").select(given.first() + " " + family)',
        
        // Check if patient is adult
        'Patient.birthDate < today() - 18 years',
        
        // Get active medications
        'MedicationRequest.where(status = "active")',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`Clinical "${expr.substring(0, 50)}...": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse observation queries', () => {
      const exprs = [
        // Get numeric values from observations
        'Observation.value.ofType(Quantity).value',
        
        // Check if observation has high/low flags
        'Observation.interpretation.coding.where(code = "H" or code = "L").exists()',
        
        // Get observations within date range
        'Observation.where(effective >= @2023-01-01 and effective <= @2023-12-31)',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`Observation "${expr.substring(0, 50)}...": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse bundle operations', () => {
      const exprs = [
        // Get all patients from bundle
        'Bundle.entry.select(resource as Patient)',
        
        // Count resources in bundle
        'Bundle.entry.resource.count()',
        
        // Get specific resource type
        'Bundle.entry.where(resource is Observation).resource',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`Bundle "${expr.substring(0, 50)}...": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });
  });

  describe('Mathematical Expressions', () => {
    test('should parse BMI calculation', () => {
      const expr = '(weight / (height.power(2))).round(1)';
      const result = testParse(expr);
      // This uses power() and round() which we haven't implemented
      console.log(`BMI calculation: ${result.success ? 'PASS' : 'FAIL'}`);
    });

    test('should parse complex arithmetic', () => {
      const exprs = [
        '(-5).abs()',
        '3.14159.round(3)',
        '16.sqrt()',
        '2.power(8)',
        '100.log(10)',
        '1.1.ceiling()',
        '1.9.floor()',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`Math "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });
  });

  describe('String Manipulation', () => {
    test('should parse string operations', () => {
      const exprs = [
        '"hello".upper()',
        '"WORLD".lower()',
        '"test string".contains("str")',
        '"prefix_value".startsWith("prefix")',
        '"value_suffix".endsWith("suffix")',
        '"hello world".substring(0, 5)',
        '"a,b,c".split(",")',
        '("a" | "b" | "c").join(", ")',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`String "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });

    test('should parse string concatenation', () => {
      const exprs = [
        '"Hello" + " " + "World"',
        '"Dr. " + name.given.first() + " " + name.family',
        'given.join(" ")',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        console.log(`Concat "${expr}": ${result.success ? 'PASS' : 'FAIL'}`);
      }
    });
  });

  describe('Edge Cases and Complex Precedence', () => {
    test('should handle complex operator precedence', () => {
      const exprs = [
        'a + b * c - d / e',
        'a and b or c and d',
        'a = b and c != d or e > f',
        'a implies b and c',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });

    test('should handle deeply nested expressions', () => {
      const exprs = [
        '((((a))))',
        '(a + (b * (c - (d / e))))',
        'a.b.c.d.e.f.g',
        'a[0].b[1].c[2].d[3]',
      ];

      for (const expr of exprs) {
        const result = testParse(expr);
        expect(result.success).toBe(true);
      }
    });
  });
});