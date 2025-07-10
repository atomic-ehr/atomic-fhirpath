import { test, expect, describe } from 'bun:test';
import { parser } from '../src/parser';
import { compile } from '../src/compiler';
import { evaluate } from '../src/evaluate';
import type { EvaluationContext } from '../src/compiler-types';

describe('FHIRPath Compiler - Basic Tests', () => {
  // Test data
  const patient = {
    resourceType: 'Patient',
    name: [
      {
        use: 'official',
        family: 'Doe',
        given: ['John', 'Q']
      },
      {
        use: 'nickname',
        family: 'Doe',
        given: ['Johnny']
      }
    ],
    age: 25,
    active: true
  };

  const observation = {
    resourceType: 'Observation',
    status: 'final',
    code: {
      text: 'Blood pressure'
    },
    valueQuantity: {
      value: 120,
      unit: 'mmHg'
    }
  };

  // Helper to compile and evaluate using the new signature
  const evaluateExpression = (expression: string, data: any, ctx?: EvaluationContext) => {
    const evaluationContext = ctx || {};
    return evaluate(evaluationContext, expression, data);
  };

  describe('Basic Navigation', () => {
    test('simple property access', () => {
      const result = evaluateExpression('resourceType', patient);
      expect(result).toEqual(['Patient']);
    });

    test('nested property access', () => {
      const result = evaluateExpression('name.use', patient);
      expect(result).toEqual(['official', 'nickname']);
    });

    test('deeply nested access', () => {
      const result = evaluateExpression('name.given', patient);
      expect(result).toEqual(['John', 'Q', 'Johnny']);
    });

    test('property that does not exist returns empty', () => {
      const result = evaluateExpression('nonExistent', patient);
      expect(result).toEqual([]);
    });

    test('navigation through null returns empty', () => {
      const data = { a: null };
      const result = evaluateExpression('a.b', data);
      expect(result).toEqual([]);
    });
  });

  describe('Indexing', () => {
    test('numeric index access', () => {
      const result = evaluateExpression('name[0]', patient);
      expect(result).toEqual([{
        use: 'official',
        family: 'Doe',
        given: ['John', 'Q']
      }]);
    });

    test('index on property', () => {
      const result = evaluateExpression('name[0].given[0]', patient);
      expect(result).toEqual(['John']);
    });

    test('out of bounds index returns empty', () => {
      const result = evaluateExpression('name[10]', patient);
      expect(result).toEqual([]);
    });
  });

  describe('Filtering with where()', () => {
    test('filter with equality', () => {
      const result = evaluateExpression("name.where(use = 'official')", patient);
      expect(result).toEqual([{
        use: 'official',
        family: 'Doe',
        given: ['John', 'Q']
      }]);
    });

    test('filter and navigate', () => {
      const result = evaluateExpression("name.where(use = 'official').family", patient);
      expect(result).toEqual(['Doe']);
    });

    test('filter and navigate to collection', () => {
      const result = evaluateExpression("name.where(use = 'official').given", patient);
      expect(result).toEqual(['John', 'Q']);
    });

    test('filter with no matches returns empty', () => {
      const result = evaluateExpression("name.where(use = 'maiden')", patient);
      expect(result).toEqual([]);
    });
  });

  describe('Operators', () => {
    test('arithmetic operators', () => {
      expect(evaluateExpression('age + 5', patient)).toEqual([30]);
      expect(evaluateExpression('age - 5', patient)).toEqual([20]);
      expect(evaluateExpression('age * 2', patient)).toEqual([50]);
      expect(evaluateExpression('age / 5', patient)).toEqual([5]);
    });

    test('comparison operators', () => {
      expect(evaluateExpression('age > 18', patient)).toEqual([true]);
      expect(evaluateExpression('age < 18', patient)).toEqual([false]);
      expect(evaluateExpression('age >= 25', patient)).toEqual([true]);
      expect(evaluateExpression('age <= 25', patient)).toEqual([true]);
      expect(evaluateExpression('age = 25', patient)).toEqual([true]);
      expect(evaluateExpression('age != 25', patient)).toEqual([false]);
    });

    test('string concatenation', () => {
      const result = evaluateExpression("name[0].given[0] + ' ' + name[0].family", patient);
      expect(result).toEqual(['John Doe']);
    });

    test('operators with empty collections', () => {
      expect(evaluateExpression('nonExistent + 5', patient)).toEqual([]);
      expect(evaluateExpression('age + nonExistent', patient)).toEqual([]);
    });
  });

  describe('Boolean Logic', () => {
    test('and operator', () => {
      expect(evaluateExpression('active and (age > 18)', patient)).toEqual([true]);
      expect(evaluateExpression('active and (age < 18)', patient)).toEqual([false]);
    });

    test('or operator', () => {
      expect(evaluateExpression('(age < 18) or active', patient)).toEqual([true]);
      expect(evaluateExpression('(age < 18) or (age > 30)', patient)).toEqual([false]);
    });

    test('boolean with empty returns empty', () => {
      expect(evaluateExpression('nonExistent and true', patient)).toEqual([]);
      expect(evaluateExpression('true and nonExistent', patient)).toEqual([]);
    });
  });

  describe('Complex Expressions', () => {
    test('Patient.name.where(use="official").family', () => {
      const result = evaluateExpression('name.where(use = \'official\').family', patient);
      expect(result).toEqual(['Doe']);
    });

    test('chained filtering and navigation', () => {
      const data = {
        contact: [
          {
            relationship: [{ text: 'mother' }],
            name: { given: ['Jane'], family: 'Doe' }
          },
          {
            relationship: [{ text: 'father' }],
            name: { given: ['Bob'], family: 'Smith' }
          }
        ]
      };
      
      const result = evaluateExpression('contact.where(relationship.text = \'mother\').name.given', data);
      expect(result).toEqual(['Jane']);
    });

    test('multiple levels of indexing and filtering', () => {
      const bundle = {
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              name: [{ use: 'official', family: 'Smith' }]
            }
          },
          {
            resource: {
              resourceType: 'Patient',
              name: [{ use: 'official', family: 'Jones' }]
            }
          },
          {
            resource: {
              resourceType: 'Patient',
              name: [{ use: 'official', family: 'Doe' }]
            }
          },
          {
            resource: {
              resourceType: 'Patient',
              name: [{ use: 'official', family: 'Doe' }]
            }
          },

        ]
      };

      const iterations = 10000;
      const start = Date.now();
      let result;
      for (let i = 0; i < iterations; i++) {
        result = evaluateExpression('entry.resource.name.where(use = \'official\').family', bundle);
      }
      const end = Date.now();
      const duration = end - start;
      const opsPerSecond = (iterations / (duration / 1000)).toFixed(2);
      console.log(`Ops/sec: ${Math.round(Number(opsPerSecond) / 1000)} k`);
      expect(result).toEqual(['Smith', 'Jones', 'Doe', 'Doe']);
    });
  });

  describe('Function Calls', () => {
    test('exists() with empty collection', () => {
      expect(evaluateExpression('nonExistent.exists()', patient)).toEqual([false]);
    });

    test('exists() with non-empty collection', () => {
      expect(evaluateExpression('name.exists()', patient)).toEqual([true]);
    });

    test('count()', () => {
      expect(evaluateExpression('name.count()', patient)).toEqual([2]);
      expect(evaluateExpression('name.given.count()', patient)).toEqual([3]);
    });

    test('first() and last()', () => {
      expect(evaluateExpression('name.first()', patient)).toEqual([patient.name[0]]);
      expect(evaluateExpression('name.last()', patient)).toEqual([patient.name[1]]);
    });
  });

  describe('Edge Cases', () => {
    test('empty context', () => {
      const result = evaluateExpression('name', {});
      expect(result).toEqual([]);
    });

    test('null data', () => {
      const ast = parser.parse('name');
      const compiled = compile(ast);
      const result = compiled.eval([null], null, {});
      expect(result).toEqual([]);
    });

    test('array at root with $this', () => {
      const data = ['a', 'b', 'c'];
      const ast = parser.parse('$this[1]');
      const compiled = compile(ast);
      const result = compiled.eval(data, data, {});
      expect(result).toEqual(['b']);
    });
  });
});