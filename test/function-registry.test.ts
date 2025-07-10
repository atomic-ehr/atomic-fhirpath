import { test, expect } from "bun:test";
import { functionRegistry } from "../src/function-registry";
import { 
  STRING_TYPE, 
  INTEGER_TYPE, 
  BOOLEAN_TYPE,
  createCollectionType
} from "../src/type-system";

test("registry has built-in functions", () => {
  expect(functionRegistry.has("exists")).toBe(true);
  expect(functionRegistry.has("empty")).toBe(true);
  expect(functionRegistry.has("count")).toBe(true);
  expect(functionRegistry.has("where")).toBe(true);
  expect(functionRegistry.has("select")).toBe(true);
});

test("get function signature", () => {
  const existsEntry = functionRegistry.get("exists");
  expect(existsEntry).toBeDefined();
  expect(existsEntry?.signature.name).toBe("exists");
  expect(existsEntry?.signature.returnType).toBe(BOOLEAN_TYPE);
});

test("infer return type for exists function", () => {
  const returnType = functionRegistry.inferReturnType("exists", []);
  expect(returnType).toBe(BOOLEAN_TYPE);
});

test("infer return type for count function", () => {
  const returnType = functionRegistry.inferReturnType("count", []);
  expect(returnType).toBe(INTEGER_TYPE);
});

test("infer return type for where function", () => {
  const contextType = createCollectionType(STRING_TYPE);
  const returnType = functionRegistry.inferReturnType("where", [BOOLEAN_TYPE], contextType);
  expect(returnType.isCollection).toBe(true);
});

test("infer return type for first function", () => {
  const contextType = createCollectionType(STRING_TYPE);
  const returnType = functionRegistry.inferReturnType("first", [], contextType);
  expect(returnType).toBe(STRING_TYPE);
});

test("infer return type for select function", () => {
  const returnType = functionRegistry.inferReturnType("select", [INTEGER_TYPE]);
  expect(returnType.isCollection).toBe(true);
  expect((returnType as any).elementType).toBe(INTEGER_TYPE);
});

test("validate function parameters - correct arity", () => {
  const errors = functionRegistry.validateParameters("exists", []);
  expect(errors.length).toBe(0);
});

test("validate function parameters - too few arguments", () => {
  const errors = functionRegistry.validateParameters("substring", []);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0]).toContain("at least");
});

test("validate function parameters - too many arguments", () => {
  const errors = functionRegistry.validateParameters("empty", [STRING_TYPE]);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0]).toContain("at most");
});

test("validate function parameters - wrong type", () => {
  const errors = functionRegistry.validateParameters("startsWith", [INTEGER_TYPE]);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors[0]).toContain("expects");
});

test("unknown function returns any type", () => {
  const returnType = functionRegistry.inferReturnType("unknownFunction", []);
  expect(returnType.name).toBe("any");
});

test("get functions by category", () => {
  const collectionFunctions = functionRegistry.getByCategory("collection");
  expect(collectionFunctions.has("where")).toBe(true);
  expect(collectionFunctions.has("select")).toBe(true);
  expect(collectionFunctions.has("count")).toBe(true);
  
  const stringFunctions = functionRegistry.getByCategory("string");
  expect(stringFunctions.has("length")).toBe(true);
  expect(stringFunctions.has("substring")).toBe(true);
});

test("get all function names", () => {
  const allNames = functionRegistry.getAllNames();
  expect(allNames).toContain("exists");
  expect(allNames).toContain("empty");
  expect(allNames).toContain("count");
  expect(allNames).toContain("length");
  expect(allNames.length).toBeGreaterThan(10);
});

test("register custom function", () => {
  functionRegistry.register("customFunction", {
    signature: {
      name: "customFunction",
      parameters: [{ name: "input", type: STRING_TYPE, optional: false }],
      returnType: INTEGER_TYPE,
      minArity: 1,
      maxArity: 1,
      isVariadic: false
    },
    inferReturnType: () => INTEGER_TYPE,
    category: "utility",
    description: "Custom test function"
  });
  
  expect(functionRegistry.has("customFunction")).toBe(true);
  const returnType = functionRegistry.inferReturnType("customFunction", [STRING_TYPE]);
  expect(returnType).toBe(INTEGER_TYPE);
});