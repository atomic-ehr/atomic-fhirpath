import { describe, it, expect } from "bun:test";
import { fhirpath } from "../../../src/index";

describe("abs() function integration", () => {
  it("should work through the fhirpath() function", () => {
    const result = fhirpath({}, "abs()", -42);
    expect(result).toEqual([42]);
  });
  
  it("should work with collections", () => {
    const result = fhirpath({}, "abs()", [-1, 2, -3]);
    expect(result).toEqual([1, 2, 3]);
  });
  
  it("should work with paths", () => {
    const data = { value: -5 };
    const result = fhirpath({}, "value.abs()", data);
    expect(result).toEqual([5]);
  });
  
  it("should filter nulls", () => {
    const result = fhirpath({}, "abs()", [null, -2, undefined, 3]);
    expect(result).toEqual([2, 3]);
  });
});