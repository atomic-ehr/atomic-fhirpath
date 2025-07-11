import { describe, it, expect } from "bun:test";
import { fhirpath } from "../src/index";

// Tests for FHIRPath quantity comparison operators
// These tests require quantity literal parsing and unit-aware comparison

describe("Quantity Comparison Operators", () => {
  describe("operators", () => {
    it("Quantity comparison with same units", () => {
      const fixture = {
        "weight": "70 'kg'"
      };
      // Test comparison with quantity values
      const result = fhirpath({}, `weight > 60 'kg'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity comparison with different units", () => {
      const fixture = {
        "weight": "70 'kg'"
      };
      // Test comparison with different units (requires UCUM conversion)
      const result = fhirpath({}, `weight > 60000 'g'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity equality", () => {
      const fixture = {
        "dose": "5 'mg'"
      };
      const result = fhirpath({}, `dose = 5 'mg'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity inequality", () => {
      const fixture = {
        "dose": "5 'mg'"
      };
      const result = fhirpath({}, `dose != 10 'mg'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity less than", () => {
      const fixture = {
        "height": "170 'cm'"
      };
      const result = fhirpath({}, `height < 200 'cm'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity greater than or equal", () => {
      const fixture = {
        "temperature": "37.5 'Cel'"
      };
      const result = fhirpath({}, `temperature >= 37 'Cel'`, fixture);
      expect(result).toEqual([true]);
    });
    
    it("Quantity in collection", () => {
      const fixture = {
        "measurements": ["10 'mg'", "20 'mg'", "30 'mg'"]
      };
      const result = fhirpath({}, `measurements > 15 'mg'`, fixture);
      expect(result).toEqual([false, true, true]);
    });
  });
});