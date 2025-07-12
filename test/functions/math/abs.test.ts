import { describe, it, expect } from "bun:test";
import { abs, absFunction } from "../../../src/functions/math/abs";
import { INTEGER_TYPE, DECIMAL_TYPE, QUANTITY_TYPE } from "../../../src/type-system";
import type { CompilerContext } from "../../../src/functions/base";
import type { FunctionCallNode } from "../../../src/types";

describe("abs() function", () => {
  describe("core function", () => {
    it("should return absolute value of positive numbers", () => {
      expect(abs(5)).toBe(5);
      expect(abs(3.14)).toBe(3.14);
    });
    
    it("should return absolute value of negative numbers", () => {
      expect(abs(-5)).toBe(5);
      expect(abs(-3.14)).toBe(3.14);
    });
    
    it("should handle zero", () => {
      expect(abs(0)).toBe(0);
      expect(abs(-0)).toBe(0);
    });
    
    it("should return null for null/undefined", () => {
      expect(abs(null)).toBe(null);
      expect(abs(undefined)).toBe(null);
    });
    
    it("should throw for non-numeric input", () => {
      expect(() => abs("5" as any)).toThrow("abs() requires numeric input");
      expect(() => abs(true as any)).toThrow("abs() requires numeric input");
    });
  });
  
  describe("FHIRPath integration", () => {
    it("should handle collections", () => {
      const compiled = absFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([-1, 2, -3], {});
      expect(result).toEqual([1, 2, 3]);
    });
    
    it("should handle single values", () => {
      const compiled = absFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled(-42, {});
      expect(result).toEqual([42]);
    });
    
    it("should handle empty collections", () => {
      const compiled = absFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([], {});
      expect(result).toEqual([]);
    });
    
    it("should filter out nulls from collections", () => {
      const compiled = absFunction.compile({} as CompilerContext, {} as FunctionCallNode);
      const result = compiled([-1, null, 2, undefined, -3], {});
      expect(result).toEqual([1, 2, 3]);
    });
  });
  
  describe("type inference", () => {
    it("should preserve integer type", () => {
      const returnType = absFunction.inferReturnType!(
        {} as any,
        INTEGER_TYPE,
        [],
        {} as FunctionCallNode
      );
      expect(returnType).toBe(INTEGER_TYPE);
    });
    
    it("should preserve decimal type", () => {
      const returnType = absFunction.inferReturnType!(
        {} as any,
        DECIMAL_TYPE,
        [],
        {} as FunctionCallNode
      );
      expect(returnType).toBe(DECIMAL_TYPE);
    });
    
    it("should preserve quantity type", () => {
      const returnType = absFunction.inferReturnType!(
        {} as any,
        QUANTITY_TYPE,
        [],
        {} as FunctionCallNode
      );
      expect(returnType).toBe(QUANTITY_TYPE);
    });
    
    it("should default to decimal for other types", () => {
      const returnType = absFunction.inferReturnType!(
        {} as any,
        undefined,
        [],
        {} as FunctionCallNode
      );
      expect(returnType).toBe(DECIMAL_TYPE);
    });
  });
});