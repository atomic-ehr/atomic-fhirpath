import { describe, it, expect } from "bun:test";
import { floor, floorFunction } from "../../../src/functions/math/floor";
import { INTEGER_TYPE } from "../../../src/type-system";
import type { CompilerContext } from "../../../src/functions/base";
import type { FunctionCallNode } from "../../../src/types";

describe("floor() function", () => {
  describe("core function", () => {
    it("should round down positive decimals", () => {
      expect(floor(3.2)).toBe(3);
      expect(floor(3.7)).toBe(3);
      expect(floor(3.0)).toBe(3);
    });
    
    it("should round down negative decimals", () => {
      expect(floor(-3.2)).toBe(-4);
      expect(floor(-3.7)).toBe(-4);
      expect(floor(-3.0)).toBe(-3);
    });
    
    it("should handle integers", () => {
      expect(floor(5)).toBe(5);
      expect(floor(-5)).toBe(-5);
      expect(floor(0)).toBe(0);
    });
    
    it("should return null for null/undefined", () => {
      expect(floor(null)).toBe(null);
      expect(floor(undefined)).toBe(null);
    });
    
    it("should throw for non-numeric input", () => {
      expect(() => floor("5" as any)).toThrow("floor() requires numeric input");
      expect(() => floor(true as any)).toThrow("floor() requires numeric input");
    });
  });
  
  describe("FHIRPath integration", () => {
    it("should handle collections", () => {
      const compiled = floorFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([1.1, 2.5, 3.9], {});
      expect(result).toEqual([1, 2, 3]);
    });
    
    it("should handle single values", () => {
      const compiled = floorFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled(4.7, {});
      expect(result).toEqual([4]);
    });
    
    it("should handle empty collections", () => {
      const compiled = floorFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([], {});
      expect(result).toEqual([]);
    });
    
    it("should filter out nulls from collections", () => {
      const compiled = floorFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([1.5, null, 2.7, undefined, 3.1], {});
      expect(result).toEqual([1, 2, 3]);
    });
  });
  
  describe("type information", () => {
    it("should always return INTEGER_TYPE", () => {
      expect(floorFunction.returnType).toBe(INTEGER_TYPE);
    });
  });
});