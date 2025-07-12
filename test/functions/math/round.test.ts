import { describe, it, expect } from "bun:test";
import { round, roundFunction } from "../../../src/functions/math/round";
import { INTEGER_TYPE, DECIMAL_TYPE } from "../../../src/type-system";
import type { CompilerContext } from "../../../src/functions/base";
import type { FunctionCallNode } from "../../../src/types";

describe("round() function", () => {
  describe("core function", () => {
    it("should round to nearest integer by default", () => {
      expect(round(3.2)).toBe(3);
      expect(round(3.5)).toBe(4);
      expect(round(3.7)).toBe(4);
      expect(round(4.5)).toBe(5); // Half away from zero
    });
    
    it("should round negative numbers correctly", () => {
      expect(round(-3.2)).toBe(-3);
      expect(round(-3.5)).toBe(-4); // Half away from zero
      expect(round(-3.7)).toBe(-4);
    });
    
    it("should handle precision parameter", () => {
      expect(round(3.14159, 0)).toBe(3);
      expect(round(3.14159, 1)).toBe(3.1);
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.14159, 3)).toBe(3.142);
      expect(round(3.14159, 4)).toBe(3.1416);
    });
    
    it("should handle negative precision", () => {
      expect(round(1234, -1)).toBe(1230);
      expect(round(1234, -2)).toBe(1200);
      expect(round(1250, -2)).toBe(1300);
      expect(round(1234, -3)).toBe(1000);
    });
    
    it("should handle edge cases", () => {
      expect(round(0)).toBe(0);
      expect(round(0.5)).toBe(1);
      expect(round(-0.5)).toBe(-1);
    });
    
    it("should return null for null/undefined", () => {
      expect(round(null)).toBe(null);
      expect(round(undefined)).toBe(null);
    });
    
    it("should throw for non-numeric input", () => {
      expect(() => round("5" as any)).toThrow("round() requires numeric input");
      expect(() => round(true as any)).toThrow("round() requires numeric input");
    });
    
    it("should throw for non-integer precision", () => {
      expect(() => round(3.14, 1.5)).toThrow("round() precision must be an integer");
    });
  });
  
  describe("FHIRPath integration", () => {
    it("should handle collections without precision", () => {
      const compiled = roundFunction.compile({} as CompilerContext, { args: [] } as FunctionCallNode);
      const result = compiled([1.1, 2.5, 3.9], {});
      expect(result).toEqual([1, 3, 4]);
    });
    
    it("should handle single values", () => {
      const compiled = roundFunction.compile({} as CompilerContext, { args: [] } as FunctionCallNode);
      const result = compiled(4.6, {});
      expect(result).toEqual([5]);
    });
    
    it("should handle empty collections", () => {
      const compiled = roundFunction.compile({} as CompilerContext, { args: [] } as FunctionCallNode);
      const result = compiled([], {});
      expect(result).toEqual([]);
    });
    
    it("should filter out nulls from collections", () => {
      const compiled = roundFunction.compile({} as CompilerContext, { args: [] } as FunctionCallNode);
      const result = compiled([1.5, null, 2.7, undefined, 3.1], {});
      expect(result).toEqual([2, 3, 3]);
    });
  });
  
  describe("type inference", () => {
    it("should return INTEGER_TYPE when no precision", () => {
      const returnType = roundFunction.inferReturnType!(
        {} as any,
        DECIMAL_TYPE,
        [],
        { args: [] } as FunctionCallNode
      );
      expect(returnType).toBe(INTEGER_TYPE);
    });
    
    it("should return DECIMAL_TYPE when precision is provided", () => {
      const returnType = roundFunction.inferReturnType!(
        {} as any,
        DECIMAL_TYPE,
        [INTEGER_TYPE],
        { args: [{}] } as FunctionCallNode
      );
      expect(returnType).toBe(DECIMAL_TYPE);
    });
  });
});