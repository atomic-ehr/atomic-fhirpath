import { test, expect } from "bun:test";
import { 
  STRING_TYPE, 
  INTEGER_TYPE, 
  DECIMAL_TYPE, 
  BOOLEAN_TYPE, 
  QUANTITY_TYPE,
  EMPTY_TYPE,
  ANY_TYPE,
  createCollectionType,
  createResourceType,
  TypeCompatibility,
  CardinalityOps
} from "../src/type-system";

test("primitive types have correct properties", () => {
  expect(STRING_TYPE.name).toBe("string");
  expect(STRING_TYPE.isPrimitive).toBe(true);
  expect(STRING_TYPE.isResource).toBe(false);
  expect(STRING_TYPE.isCollection).toBe(false);
  expect(STRING_TYPE.cardinality).toBe("1..1");
});

test("collection type creation", () => {
  const stringCollection = createCollectionType(STRING_TYPE);
  expect(stringCollection.name).toBe("Collection<string>");
  expect(stringCollection.isCollection).toBe(true);
  expect(stringCollection.elementType).toBe(STRING_TYPE);
});

test("resource type creation", () => {
  const properties = new Map([
    ["name", STRING_TYPE],
    ["age", INTEGER_TYPE]
  ]);
  const patientType = createResourceType("Patient", properties);
  expect(patientType.name).toBe("Patient");
  expect(patientType.isResource).toBe(true);
  expect(patientType.resourceType).toBe("Patient");
  expect(patientType.properties?.get("name")).toBe(STRING_TYPE);
});

test("type compatibility - same types", () => {
  expect(TypeCompatibility.isAssignable(STRING_TYPE, STRING_TYPE)).toBe(true);
  expect(TypeCompatibility.isAssignable(INTEGER_TYPE, INTEGER_TYPE)).toBe(true);
});

test("type compatibility - numeric coercion", () => {
  expect(TypeCompatibility.isAssignable(INTEGER_TYPE, DECIMAL_TYPE)).toBe(true);
  expect(TypeCompatibility.isAssignable(DECIMAL_TYPE, INTEGER_TYPE)).toBe(false);
});

test("type compatibility - any type", () => {
  expect(TypeCompatibility.isAssignable(STRING_TYPE, ANY_TYPE)).toBe(true);
  expect(TypeCompatibility.isAssignable(ANY_TYPE, STRING_TYPE)).toBe(false);
});

test("type compatibility - empty type", () => {
  expect(TypeCompatibility.isAssignable(EMPTY_TYPE, EMPTY_TYPE)).toBe(true);
  expect(TypeCompatibility.isAssignable(EMPTY_TYPE, STRING_TYPE)).toBe(false);
  expect(TypeCompatibility.isAssignable(STRING_TYPE, EMPTY_TYPE)).toBe(false);
});

test("common supertype - same types", () => {
  const result = TypeCompatibility.getCommonSupertype(STRING_TYPE, STRING_TYPE);
  expect(result).toBe(STRING_TYPE);
});

test("common supertype - numeric types", () => {
  const result = TypeCompatibility.getCommonSupertype(INTEGER_TYPE, DECIMAL_TYPE);
  expect(result).toBe(DECIMAL_TYPE);
});

test("common supertype - different types", () => {
  const result = TypeCompatibility.getCommonSupertype(STRING_TYPE, INTEGER_TYPE);
  expect(result).toBe(ANY_TYPE);
});

test("arithmetic compatibility", () => {
  expect(TypeCompatibility.isArithmeticCompatible(INTEGER_TYPE)).toBe(true);
  expect(TypeCompatibility.isArithmeticCompatible(DECIMAL_TYPE)).toBe(true);
  expect(TypeCompatibility.isArithmeticCompatible(QUANTITY_TYPE)).toBe(true);
  expect(TypeCompatibility.isArithmeticCompatible(STRING_TYPE)).toBe(false);
});

test("string compatibility", () => {
  expect(TypeCompatibility.isStringCompatible(STRING_TYPE)).toBe(true);
  expect(TypeCompatibility.isStringCompatible(INTEGER_TYPE)).toBe(false);
});

test("cardinality operations", () => {
  expect(CardinalityOps.allowsEmpty("0..1")).toBe(true);
  expect(CardinalityOps.allowsEmpty("1..1")).toBe(false);
  expect(CardinalityOps.allowsMultiple("0..*")).toBe(true);
  expect(CardinalityOps.allowsMultiple("0..1")).toBe(false);
  expect(CardinalityOps.requiresValue("1..1")).toBe(true);
  expect(CardinalityOps.requiresValue("0..1")).toBe(false);
});

test("cardinality combination", () => {
  expect(CardinalityOps.combine("1..1", "1..1")).toBe("1..1");
  expect(CardinalityOps.combine("0..1", "1..1")).toBe("0..1");
  expect(CardinalityOps.combine("1..*", "1..1")).toBe("1..*");
  expect(CardinalityOps.combine("0..*", "1..1")).toBe("0..*");
});