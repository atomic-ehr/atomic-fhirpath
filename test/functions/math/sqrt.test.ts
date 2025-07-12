import { describe, it, expect } from "bun:test";
import { sqrt, sqrtFunction } from "../../../src/functions/math/sqrt";
import { DECIMAL_TYPE } from "../../../src/type-system";
import type { CompilerContext } from "../../../src/functions/base";
import type { FunctionCallNode } from "../../../src/types";

describe("sqrt() function", () => {
  describe("core function", () => {
    it("should calculate square root of positive numbers", () => {
      expect(sqrt(4)).toBe(2);
      expect(sqrt(9)).toBe(3);
      expect(sqrt(16)).toBe(4);
      expect(sqrt(25)).toBe(5);
    });
    
    it("should handle decimal inputs", () => {
      expect(sqrt(2)).toBeCloseTo(1.414, 3);
      expect(sqrt(3)).toBeCloseTo(1.732, 3);
      expect(sqrt(0.25)).toBe(0.5);
    });
    
    it("should handle zero", () => {
      expect(sqrt(0)).toBe(0);
    });
    
    it("should throw for negative numbers", () => {
      expect(() => sqrt(-1)).toThrow("sqrt() cannot be applied to negative numbers");
      expect(() => sqrt(-4)).toThrow("sqrt() cannot be applied to negative numbers");
    });
    
    it("should return null for null/undefined", () => {
      expect(sqrt(null)).toBe(null);
      expect(sqrt(undefined)).toBe(null);
    });
    
    it("should throw for non-numeric input", () => {
      expect(() => sqrt("5" as any)).toThrow("sqrt() requires numeric input");
      expect(() => sqrt(true as any)).toThrow("sqrt() requires numeric input");
    });
  });
  
  describe("FHIRPath integration", () => {
    it("should handle collections", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([4, 9, 16], {});
      expect(result).toEqual([2, 3, 4]);
    });
    
    it("should skip negative numbers in collections", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([4, -1, 9, -4, 16], {});
      expect(result).toEqual([2, 3, 4]);
    });
    
    it("should throw for single negative value", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      expect(() => compiled(-4, {})).toThrow("sqrt() cannot be applied to negative numbers");
    });
    
    it("should handle single values", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled(25, {});
      expect(result).toEqual([5]);
    });
    
    it("should handle empty collections", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([], {});
      expect(result).toEqual([]);
    });
    
    it("should filter out nulls from collections", () => {
      const compiled = sqrtFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([4, null, 9, undefined, 16], {});
      expect(result).toEqual([2, 3, 4]);
    });
  });
  
  describe("type information", () => {
    it("should always return DECIMAL_TYPE", () => {
      expect(sqrtFunction.returnType).toBe(DECIMAL_TYPE);
    });
  });
});