import { test, expect, describe } from 'bun:test';
import { parse, astToString } from '../../src';

describe('Type Operators', () => {
  describe('is operator', () => {
    test('should parse simple is expressions', () => {
      const expressions = [
        'value is Quantity',
        'resource is Patient',
        'value is string',
        'observation is Observation',
      ];

      for (const expr of expressions) {
        const ast = parse(expr);
        expect(ast.kind).toBe('is');
        expect((ast as any).targetType).toBeDefined();
      }
    });

    test('should parse is expressions in complex contexts', () => {
      const ast = parse('value.where(this is Quantity)');
      expect(ast.kind).toBe('dot');
      
      const ast2 = parse('resource is Patient and active');
      expect(ast2.kind).toBe('binary');
      expect((ast2 as any).left.kind).toBe('is');
    });

    test('should parse is with resolve()', () => {
      const expressions = [
        'resolve() is Patient',
        'actor.where(resolve() is Practitioner)',
        'subject.where(resolve() is Group)',
      ];

      for (const expr of expressions) {
        expect(() => parse(expr)).not.toThrow();
      }
    });
  });

  describe('as operator', () => {
    test('should parse simple as expressions', () => {
      const expressions = [
        'value as Quantity',
        'resource as Patient',
        'sourceScope as canonical',
        'targetScope as uri',
      ];

      for (const expr of expressions) {
        const ast = parse(expr);
        expect(ast.kind).toBe('as');
        expect((ast as any).targetType).toBeDefined();
      }
    });

    test('should parse as in parentheses', () => {
      const expressions = [
        '(value as Quantity)',
        '(resource as Patient).name',
        '(sourceScope as canonical)',
      ];

      for (const expr of expressions) {
        expect(() => parse(expr)).not.toThrow();
      }
    });

    test('should parse as with property access', () => {
      const ast = parse('(resource as Patient).name.given');
      expect(ast.kind).toBe('dot');
      expect((ast as any).left.kind).toBe('dot');
      expect((ast as any).left.left.kind).toBe('as');
    });
  });

  describe('Real SearchParameter expressions', () => {
    test('should parse all failing expressions from before', () => {
      const expressions = [
        '(ConceptMap.sourceScope as canonical)',
        '(ConceptMap.targetScope as canonical)',
        '(ConceptMap.targetScope as uri)',
        '(NutritionIntake.reported as Reference)',
        'ActivityDefinition.subject as CodeableConcept',
        'ActivityDefinition.subject as Reference',
        'ActivityDefinition.subject as canonical',
        'Appointment.participant.actor.where(resolve() is Group) | Appointment.subject.where(resolve() is Group)',
        'Appointment.participant.actor.where(resolve() is Location)',
        'Appointment.participant.actor.where(resolve() is Practitioner)',
        'AppointmentResponse.actor.where(resolve() is Group)',
        'AppointmentResponse.actor.where(resolve() is Location)',
        'AppointmentResponse.actor.where(resolve() is Practitioner)',
        'Bundle.entry[0].resource as Composition',
        'Bundle.entry[0].resource as MessageHeader',
        'ClinicalAssessment.subject.where(resolve() is Patient)',
        'ClinicalUseDefinition.subject.where(resolve() is MedicinalProductDefinition)',
        'DeviceAlert.subject.where(resolve() is Patient)',
        'DeviceDispense.subject.where(resolve() is Patient)',
        'Encounter.participant.actor.where(resolve() is Practitioner)',
      ];

      for (const expr of expressions) {
        expect(() => parse(expr)).not.toThrow();
      }
    });
  });

  describe('AST string representation', () => {
    test('should correctly stringify is expressions', () => {
      const ast = parse('value is Quantity');
      expect(astToString(ast)).toBe('(value is Quantity)');
    });

    test('should correctly stringify as expressions', () => {
      const ast = parse('value as Quantity');
      expect(astToString(ast)).toBe('(value as Quantity)');
    });

    test('should correctly stringify complex expressions', () => {
      const ast = parse('(resource as Patient).name');
      expect(astToString(ast)).toBe('(resource as Patient).name');
    });
  });
});