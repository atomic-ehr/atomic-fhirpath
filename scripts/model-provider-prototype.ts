/**
 * ModelProvider Prototype
 * 
 * This file demonstrates the proposed design for the FhirR4ModelProvider
 * with example data structures and implementation patterns.
 */

import type { FHIRPathType, ResourceType, Cardinality } from '../src/type-system';

// ============================================================================
// Data Structure Definitions
// ============================================================================

/**
 * Represents a FHIR resource definition
 */
interface ResourceDefinition {
  resourceType: string;
  baseType?: string;
  url: string;
  abstract?: boolean;
  properties: Map<string, PropertyDefinition>;
  requiredProperties: Set<string>;
}

/**
 * Represents a property within a resource
 */
interface PropertyDefinition {
  path: string;
  type: PropertyType | PropertyType[]; // Array for choice types
  cardinality: Cardinality;
  isModifier?: boolean;
  isSummary?: boolean;
  binding?: ValueSetBinding;
  referenceTargets?: string[]; // For Reference types
  // Extension for choice types
  choiceGroup?: string; // e.g., "value" for value[x]
}

/**
 * Type information for a property
 */
interface PropertyType {
  code: string; // 'string', 'boolean', 'Reference', 'Quantity', etc.
  profile?: string[]; // For profiled types
  targetProfile?: string[]; // For references
}

/**
 * Value set binding information
 */
interface ValueSetBinding {
  strength: 'required' | 'extensible' | 'preferred' | 'example';
  valueSet: string;
  description?: string;
}

// ============================================================================
// Example Generated Definitions (would be auto-generated from FHIR)
// ============================================================================

const PatientDefinition: ResourceDefinition = {
  resourceType: 'Patient',
  baseType: 'DomainResource',
  url: 'http://hl7.org/fhir/StructureDefinition/Patient',
  properties: new Map([
    ['identifier', {
      path: 'Patient.identifier',
      type: { code: 'Identifier' },
      cardinality: '0..*',
      isSummary: true
    }],
    ['active', {
      path: 'Patient.active',
      type: { code: 'boolean' },
      cardinality: '0..1',
      isModifier: true,
      isSummary: true
    }],
    ['name', {
      path: 'Patient.name',
      type: { code: 'HumanName' },
      cardinality: '0..*',
      isSummary: true
    }],
    ['gender', {
      path: 'Patient.gender',
      type: { code: 'code' },
      cardinality: '0..1',
      isSummary: true,
      binding: {
        strength: 'required',
        valueSet: 'http://hl7.org/fhir/ValueSet/administrative-gender'
      }
    }],
    ['birthDate', {
      path: 'Patient.birthDate',
      type: { code: 'date' },
      cardinality: '0..1',
      isSummary: true
    }],
    ['deceasedBoolean', {
      path: 'Patient.deceased[x]',
      type: { code: 'boolean' },
      cardinality: '0..1',
      isModifier: true,
      isSummary: true,
      choiceGroup: 'deceased'
    }],
    ['deceasedDateTime', {
      path: 'Patient.deceased[x]',
      type: { code: 'dateTime' },
      cardinality: '0..1',
      isModifier: true,
      isSummary: true,
      choiceGroup: 'deceased'
    }],
    ['generalPractitioner', {
      path: 'Patient.generalPractitioner',
      type: { 
        code: 'Reference',
        targetProfile: ['Organization', 'Practitioner', 'PractitionerRole']
      },
      cardinality: '0..*'
    }]
  ]),
  requiredProperties: new Set()
};

const ObservationDefinition: ResourceDefinition = {
  resourceType: 'Observation',
  baseType: 'DomainResource',
  url: 'http://hl7.org/fhir/StructureDefinition/Observation',
  properties: new Map([
    ['status', {
      path: 'Observation.status',
      type: { code: 'code' },
      cardinality: '1..1',
      isModifier: true,
      isSummary: true,
      binding: {
        strength: 'required',
        valueSet: 'http://hl7.org/fhir/ValueSet/observation-status'
      }
    }],
    ['code', {
      path: 'Observation.code',
      type: { code: 'CodeableConcept' },
      cardinality: '1..1',
      isSummary: true
    }],
    ['subject', {
      path: 'Observation.subject',
      type: { 
        code: 'Reference',
        targetProfile: ['Patient', 'Group', 'Device', 'Location']
      },
      cardinality: '0..1',
      isSummary: true
    }],
    // Choice type example: value[x]
    ['valueQuantity', {
      path: 'Observation.value[x]',
      type: { code: 'Quantity' },
      cardinality: '0..1',
      isSummary: true,
      choiceGroup: 'value'
    }],
    ['valueCodeableConcept', {
      path: 'Observation.value[x]',
      type: { code: 'CodeableConcept' },
      cardinality: '0..1',
      isSummary: true,
      choiceGroup: 'value'
    }],
    ['valueString', {
      path: 'Observation.value[x]',
      type: { code: 'string' },
      cardinality: '0..1',
      isSummary: true,
      choiceGroup: 'value'
    }],
    ['valueBoolean', {
      path: 'Observation.value[x]',
      type: { code: 'boolean' },
      cardinality: '0..1',
      isSummary: true,
      choiceGroup: 'value'
    }]
  ]),
  requiredProperties: new Set(['status', 'code'])
};

// Base types
const DomainResourceDefinition: ResourceDefinition = {
  resourceType: 'DomainResource',
  baseType: 'Resource',
  url: 'http://hl7.org/fhir/StructureDefinition/DomainResource',
  abstract: true,
  properties: new Map([
    ['text', {
      path: 'DomainResource.text',
      type: { code: 'Narrative' },
      cardinality: '0..1'
    }],
    ['contained', {
      path: 'DomainResource.contained',
      type: { code: 'Resource' },
      cardinality: '0..*'
    }],
    ['extension', {
      path: 'DomainResource.extension',
      type: { code: 'Extension' },
      cardinality: '0..*'
    }],
    ['modifierExtension', {
      path: 'DomainResource.modifierExtension',
      type: { code: 'Extension' },
      cardinality: '0..*',
      isModifier: true
    }]
  ]),
  requiredProperties: new Set()
};

// ============================================================================
// Type Registry Implementation
// ============================================================================

class TypeRegistry {
  private resources: Map<string, ResourceDefinition>;
  private typeHierarchy: Map<string, string[]>; // type -> [parent, grandparent, ...]
  private propertyIndex: Map<string, Map<string, PropertyDefinition>>;
  private choiceTypeIndex: Map<string, Map<string, PropertyDefinition[]>>;
  
  constructor() {
    this.resources = new Map();
    this.typeHierarchy = new Map();
    this.propertyIndex = new Map();
    this.choiceTypeIndex = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
    this.buildIndices();
  }
  
  private initializeSampleData() {
    // Add definitions
    this.resources.set('Patient', PatientDefinition);
    this.resources.set('Observation', ObservationDefinition);
    this.resources.set('DomainResource', DomainResourceDefinition);
    
    // Build type hierarchy
    this.typeHierarchy.set('Patient', ['DomainResource', 'Resource']);
    this.typeHierarchy.set('Observation', ['DomainResource', 'Resource']);
    this.typeHierarchy.set('DomainResource', ['Resource']);
  }
  
  private buildIndices() {
    // Build property index for fast lookups
    for (const [resourceType, definition] of this.resources) {
      const propMap = new Map<string, PropertyDefinition>();
      const choiceMap = new Map<string, PropertyDefinition[]>();
      
      // Add own properties
      for (const [propName, propDef] of definition.properties) {
        propMap.set(propName, propDef);
        
        // Index choice types
        if (propDef.choiceGroup) {
          const group = choiceMap.get(propDef.choiceGroup) || [];
          group.push(propDef);
          choiceMap.set(propDef.choiceGroup, group);
        }
      }
      
      // Inherit properties from base types
      const hierarchy = this.typeHierarchy.get(resourceType) || [];
      for (const parentType of hierarchy) {
        const parentDef = this.resources.get(parentType);
        if (parentDef) {
          for (const [propName, propDef] of parentDef.properties) {
            if (!propMap.has(propName)) {
              propMap.set(propName, propDef);
            }
          }
        }
      }
      
      this.propertyIndex.set(resourceType, propMap);
      this.choiceTypeIndex.set(resourceType, choiceMap);
    }
  }
  
  getResource(name: string): ResourceDefinition | null {
    return this.resources.get(name) || null;
  }
  
  getProperty(resourceType: string, propertyName: string): PropertyDefinition | null {
    return this.propertyIndex.get(resourceType)?.get(propertyName) || null;
  }
  
  getChoiceTypes(resourceType: string, choiceGroup: string): PropertyDefinition[] {
    return this.choiceTypeIndex.get(resourceType)?.get(choiceGroup) || [];
  }
  
  getHierarchy(resourceType: string): string[] {
    return this.typeHierarchy.get(resourceType) || [];
  }
  
  getAllResourceTypes(): string[] {
    return Array.from(this.resources.keys());
  }
}

// ============================================================================
// FhirR4ModelProvider Implementation (Simplified)
// ============================================================================

class FhirR4ModelProvider {
  private registry: TypeRegistry;
  
  constructor() {
    this.registry = new TypeRegistry();
  }
  
  getPropertyType(resource: string, property: string): string | null {
    const propDef = this.registry.getProperty(resource, property);
    if (!propDef) return null;
    
    // Handle simple types
    if (!Array.isArray(propDef.type)) {
      return propDef.type.code;
    }
    
    // For choice types, return first option (simplified)
    return propDef.type[0].code;
  }
  
  getChoiceTypes(resource: string, property: string): string[] | null {
    // Handle value[x] notation
    if (!property.endsWith('[x]')) {
      return null;
    }
    
    const choiceGroup = property.slice(0, -3); // Remove [x]
    const choices = this.registry.getChoiceTypes(resource, choiceGroup);
    
    if (choices.length === 0) return null;
    
    return choices.map(choice => {
      const type = Array.isArray(choice.type) ? choice.type[0] : choice.type;
      return type.code;
    });
  }
  
  isResourceAssignable(source: string, target: string): boolean {
    if (source === target) return true;
    
    const hierarchy = this.registry.getHierarchy(source);
    return hierarchy.includes(target);
  }
  
  getAllResourceTypes(): string[] {
    return this.registry.getAllResourceTypes();
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

function demonstrateUsage() {
  const provider = new FhirR4ModelProvider();
  
  console.log('=== ModelProvider Prototype Demo ===\n');
  
  // Example 1: Get property type
  console.log('1. Get property types:');
  console.log(`Patient.name type: ${provider.getPropertyType('Patient', 'name')}`);
  console.log(`Patient.birthDate type: ${provider.getPropertyType('Patient', 'birthDate')}`);
  console.log(`Observation.status type: ${provider.getPropertyType('Observation', 'status')}`);
  
  // Example 2: Handle choice types
  console.log('\n2. Handle choice types:');
  const valueTypes = provider.getChoiceTypes('Observation', 'value[x]');
  console.log(`Observation.value[x] types: ${valueTypes?.join(', ')}`);
  
  const deceasedTypes = provider.getChoiceTypes('Patient', 'deceased[x]');
  console.log(`Patient.deceased[x] types: ${deceasedTypes?.join(', ')}`);
  
  // Example 3: Type hierarchy
  console.log('\n3. Type hierarchy:');
  console.log(`Is Patient assignable to DomainResource? ${provider.isResourceAssignable('Patient', 'DomainResource')}`);
  console.log(`Is Patient assignable to Resource? ${provider.isResourceAssignable('Patient', 'Resource')}`);
  console.log(`Is Patient assignable to Observation? ${provider.isResourceAssignable('Patient', 'Observation')}`);
  
  // Example 4: All resource types
  console.log('\n4. All resource types:');
  console.log(`Available types: ${provider.getAllResourceTypes().join(', ')}`);
  
  // Example 5: Inherited properties
  console.log('\n5. Inherited properties:');
  console.log(`Patient.text type (inherited): ${provider.getPropertyType('Patient', 'text')}`);
  console.log(`Patient.extension type (inherited): ${provider.getPropertyType('Patient', 'extension')}`);
}

// Run the demo
demonstrateUsage();

export { FhirR4ModelProvider, TypeRegistry, ResourceDefinition, PropertyDefinition };