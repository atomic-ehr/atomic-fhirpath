/**
 * ModelProvider Interface
 * 
 * Pluggable interface for FHIR resource schema information.
 * This interface will be implemented later with actual FHIR schema data.
 */

import { FHIRPathType, ResourceType } from './type-system';

export interface ModelProvider {
  /**
   * Get type information for a FHIR resource
   */
  getResourceType(name: string): ResourceType | null;
  
  /**
   * Get type information for a property of a resource
   */
  getPropertyType(resource: string, property: string): FHIRPathType | null;
  
  /**
   * Check if a property exists on a resource
   */
  isValidProperty(resource: string, property: string): boolean;
  
  /**
   * Get all properties of a resource
   */
  getResourceProperties(resource: string): Map<string, FHIRPathType> | null;
  
  /**
   * Check if a resource type exists
   */
  hasResourceType(name: string): boolean;
  
  /**
   * Get all available resource types
   */
  getAllResourceTypes(): string[];
  
  /**
   * Get inheritance hierarchy for a resource type
   */
  getResourceHierarchy(resource: string): string[];
  
  /**
   * Check if one resource type is assignable to another
   */
  isResourceAssignable(source: string, target: string): boolean;
  
  /**
   * Get choice type alternatives for a property (e.g., value[x])
   */
  getChoiceTypes(resource: string, property: string): FHIRPathType[] | null;
  
  /**
   * Resolve reference types
   */
  resolveReferenceType(resource: string, property: string): string[] | null;
}

/**
 * Null model provider that returns no type information
 * Used as default when no model provider is configured
 */
export class NullModelProvider implements ModelProvider {
  getResourceType(name: string): ResourceType | null {
    return null;
  }
  
  getPropertyType(resource: string, property: string): FHIRPathType | null {
    return null;
  }
  
  isValidProperty(resource: string, property: string): boolean {
    return true; // Allow all properties when no model is available
  }
  
  getResourceProperties(resource: string): Map<string, FHIRPathType> | null {
    return null;
  }
  
  hasResourceType(name: string): boolean {
    return false;
  }
  
  getAllResourceTypes(): string[] {
    return [];
  }
  
  getResourceHierarchy(resource: string): string[] {
    return [];
  }
  
  isResourceAssignable(source: string, target: string): boolean {
    return source === target;
  }
  
  getChoiceTypes(resource: string, property: string): FHIRPathType[] | null {
    return null;
  }
  
  resolveReferenceType(resource: string, property: string): string[] | null {
    return null;
  }
}