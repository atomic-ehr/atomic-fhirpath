import { test, expect } from "bun:test";
import { parse } from "../src/index";
import { TypedCompiler } from "../src/typed-compiler";
import { 
  STRING_TYPE, 
  INTEGER_TYPE, 
  BOOLEAN_TYPE,
  createResourceType,
  createCollectionType
} from "../src/type-system";

test("compile simple literal", () => {
  const ast = parse("'hello'");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("string");
  
  // Test execution
  const evalResult = result.compiledNode.eval([], null, {});
  expect(evalResult).toEqual(["hello"]);
});

test("compile arithmetic expression", () => {
  const ast = parse("1 + 2");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("integer");
});

test("compile with validation errors", () => {
  const ast = parse("'hello' + 2");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(true);
  expect(result.errors.some(e => e.includes("arithmetic"))).toBe(true);
});

test("compile function call", () => {
  const ast = parse("name.exists()");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("boolean");
});

test("compile with model provider context", () => {
  const patientType = createResourceType("Patient", new Map([
    ["name", createCollectionType(STRING_TYPE)],
    ["active", createCollectionType(BOOLEAN_TYPE)]
  ]));
  
  const ast = parse("name");
  const compiler = new TypedCompiler({ rootType: patientType });
  const result = compiler.compile(ast, patientType);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.isCollection).toBe(true);
});

test("compile with strict mode", () => {
  const ast = parse("unknownFunction()");
  const compiler = new TypedCompiler({ 
    strictMode: true, 
    allowUnknownFunctions: false 
  });
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(true);
  expect(result.errors.some(e => e.includes("Unknown function"))).toBe(true);
});

test("compile without validation", () => {
  const ast = parse("'hello' + 2");
  const compiler = new TypedCompiler({ performValidation: false });
  const result = compiler.compile(ast);
  
  // Should not have validation errors, but still has type inference
  expect(result.validationResult).toBeUndefined();
  expect(result.typedAST.inferredType).toBeDefined();
});

test("compile dot navigation", () => {
  const ast = parse("name.family");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  
  // Test execution with mock data
  const mockData = [{ name: { family: "Doe", given: ["John"] } }];
  const evalResult = result.compiledNode.eval(mockData, mockData[0], {});
  expect(evalResult).toEqual(["Doe"]);
});

test("compile indexer", () => {
  const ast = parse("name[0]");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  
  // Test execution
  const data = [{ name: ["first", "second", "third"] }];
  const evalResult = result.compiledNode.eval(data, data[0], {});
  expect(evalResult).toEqual(["first"]);
});

test("compile variable reference", () => {
  const variables = new Map([["test", STRING_TYPE]]);
  const ast = parse("$test");
  const compiler = new TypedCompiler({ variables });
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("string");
  
  // Test execution
  const evalResult = result.compiledNode.eval([], null, { variables: { test: "hello" } });
  expect(evalResult).toEqual(["hello"]);
});

test("compile environment variable", () => {
  const ast = parse("%resource");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  
  // Test execution
  const mockResource = { resourceType: "Patient" };
  const evalResult = result.compiledNode.eval([], mockResource, {});
  expect(evalResult).toEqual([mockResource]);
});

test("compile type casting", () => {
  const ast = parse("42 as string");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("string");
});

test("compile type checking", () => {
  const ast = parse("name is string");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("boolean");
});

test("compile null literal", () => {
  const ast = parse("{}");
  const compiler = new TypedCompiler();
  const result = compiler.compile(ast);
  
  expect(result.hasErrors).toBe(false);
  expect(result.typedAST.inferredType?.name).toBe("empty");
  
  // Test execution
  const evalResult = result.compiledNode.eval([], null, {});
  expect(evalResult).toEqual([]);
});