import { test, expect } from "bun:test";
import { parse } from "../src/index";
import { TypedNodeUtils } from "../src/typed-nodes";
import { TypeInferenceEngine } from "../src/type-inference";
import { 
  type FHIRPathType,
  STRING_TYPE, 
  INTEGER_TYPE, 
  DECIMAL_TYPE, 
  BOOLEAN_TYPE,
  createResourceType,
  createCollectionType
} from "../src/type-system";

test("literal type inference - string", () => {
  const ast = parse("'hello'");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("string");
});

test("literal type inference - integer", () => {
  const ast = parse("42");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("integer");
});

test("literal type inference - decimal", () => {
  const ast = parse("3.14");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("decimal");
});

test("literal type inference - boolean", () => {
  const ast = parse("true");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("boolean");
});

test("binary operation type inference - arithmetic", () => {
  const ast = parse("1 + 2");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("integer");
});

test("binary operation type inference - comparison", () => {
  const ast = parse("1 < 2");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("boolean");
});

test("function call type inference - exists", () => {
  const ast = parse("name.exists()");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("boolean");
});

test("function call type inference - count", () => {
  const ast = parse("name.count()");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("integer");
});

test("dot navigation type inference", () => {
  // Create a mock resource type with properties
  const patientType = createResourceType("Patient", new Map<string, FHIRPathType>([
    ["name", createCollectionType(STRING_TYPE)],
    ["age", INTEGER_TYPE]
  ]));
  
  const ast = parse("name");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine({ rootType: patientType });
  const result = inferrer.inferTypes(typedAST, patientType);
  
  // Should be a collection of strings
  expect(result.inferredType?.isCollection).toBe(true);
});

test("indexer type inference", () => {
  const ast = parse("name[0]");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  // Should infer the element type of the collection
  expect(result.inferredType).toBeDefined();
});

test("type casting with 'as'", () => {
  const ast = parse("value as string");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("string");
});

test("type checking with 'is'", () => {
  const ast = parse("value is string");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("boolean");
});

test("variable type inference", () => {
  const variableTypes = new Map([["test", STRING_TYPE]]);
  const ast = parse("$test");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine({ variables: variableTypes });
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("string");
});

test("environment variable type inference", () => {
  const ast = parse("%resource");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("any");
});

test("null literal type inference", () => {
  const ast = parse("{}");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const result = inferrer.inferTypes(typedAST);
  
  expect(result.inferredType?.name).toBe("empty");
});