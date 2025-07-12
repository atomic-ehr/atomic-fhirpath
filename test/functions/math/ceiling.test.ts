import { describe, it, expect } from "bun:test";
import { ceiling, ceilingFunction } from "../../../src/functions/math/ceiling";
import { INTEGER_TYPE } from "../../../src/type-system";
import type { CompilerContext } from "../../../src/functions/base";
import type { FunctionCallNode } from "../../../src/types";

describe("ceiling() function", () => {
  describe("core function", () => {
    it("should round up positive decimals", () => {
      expect(ceiling(3.2)).toBe(4);
      expect(ceiling(3.7)).toBe(4);
      expect(ceiling(3.0)).toBe(3);
    });
    
    it("should round up negative decimals", () => {
      expect(ceiling(-3.2)).toBe(-3);
      expect(ceiling(-3.7)).toBe(-3);
      expect(ceiling(-3.0)).toBe(-3);
    });
    
    it("should handle integers", () => {
      expect(ceiling(5)).toBe(5);
      expect(ceiling(-5)).toBe(-5);
      expect(ceiling(0)).toBe(0);
    });
    
    it("should return null for null/undefined", () => {
      expect(ceiling(null)).toBe(null);
      expect(ceiling(undefined)).toBe(null);
    });
    
    it("should throw for non-numeric input", () => {
      expect(() => ceiling("5" as any)).toThrow("ceiling() requires numeric input");
      expect(() => ceiling(true as any)).toThrow("ceiling() requires numeric input");
    });
  });
  
  describe("FHIRPath integration", () => {
    it("should handle collections", () => {
      const compiled = ceilingFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([1.1, 2.5, 3.9], {});
      expect(result).toEqual([2, 3, 4]);
    });
    
    it("should handle single values", () => {
      const compiled = ceilingFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled(4.3, {});
      expect(result).toEqual([5]);
    });
    
    it("should handle empty collections", () => {
      const compiled = ceilingFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([], {});
      expect(result).toEqual([]);
    });
    
    it("should filter out nulls from collections", () => {
      const compiled = ceilingFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([1.5, null, 2.7, undefined, 3.1], {});
      expect(result).toEqual([2, 3, 4]);
    });
  });
  
  describe("type information", () => {
    it("should always return INTEGER_TYPE", () => {
      expect(ceilingFunction.returnType).toBe(INTEGER_TYPE);
    });
  });
});