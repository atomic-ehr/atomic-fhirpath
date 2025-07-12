import { describe, it, expect } from "bun:test";
import { fhirpath } from "../../../src/index";

describe("ceiling() function integration", () => {
  it("should work through the fhirpath() function", () => {
    const result = fhirpath({}, "ceiling()", 3.2);
    expect(result).toEqual([4]);
  });
  
  it("should work with negative numbers", () => {
    const result = fhirpath({}, "ceiling()", -3.7);
    expect(result).toEqual([-3]);
  });
  
  it("should work with paths", () => {
    const data = { value: 5.1 };
    const result = fhirpath({}, "value.ceiling()", data);
    expect(result).toEqual([6]);
  });
});