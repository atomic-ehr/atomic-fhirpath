import { test, expect } from "bun:test";
import { parse } from "../src/index";
import { TypedNodeUtils } from "../src/typed-nodes";
import { TypeInferenceEngine } from "../src/type-inference";
import { SemanticValidator } from "../src/semantic-validator";
import { 
  STRING_TYPE, 
  INTEGER_TYPE, 
  BOOLEAN_TYPE,
  createResourceType
} from "../src/type-system";

function validateExpression(expression: string) {
  const ast = parse(expression);
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const inferredAST = inferrer.inferTypes(typedAST);
  const validator = new SemanticValidator();
  return validator.validate(inferredAST);
}

test("valid expression passes validation", () => {
  const result = validateExpression("'hello'");
  expect(result.isValid).toBe(true);
  expect(result.errors.length).toBe(0);
});

test("arithmetic with correct types", () => {
  const result = validateExpression("1 + 2");
  expect(result.isValid).toBe(true);
});

test("arithmetic with incompatible types reports error", () => {
  const result = validateExpression("'hello' + 2");
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_ARITHMETIC_OPERANDS")).toBe(true);
});

test("comparison with compatible types", () => {
  const result = validateExpression("1 < 2");
  expect(result.isValid).toBe(true);
});

test("comparison with incompatible types warns", () => {
  const result = validateExpression("'hello' < true");
  expect(result.warnings.some(w => w.code === "INCOMPATIBLE_COMPARISON")).toBe(true);
});

test("string concatenation with correct types", () => {
  const result = validateExpression("'hello' & 'world'");
  expect(result.isValid).toBe(true);
});

test("string concatenation with wrong types reports error", () => {
  const result = validateExpression("1 & 2");
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_CONCATENATION_OPERANDS")).toBe(true);
});

test("logical operations with boolean types", () => {
  const result = validateExpression("true and false");
  expect(result.isValid).toBe(true);
});

test("logical operations with non-boolean types warns", () => {
  const result = validateExpression("1 and 2");
  expect(result.warnings.some(w => w.code === "LOGICAL_OPERAND_TYPE")).toBe(true);
});

test("unary arithmetic with numeric type", () => {
  const result = validateExpression("-42");
  expect(result.isValid).toBe(true);
});

test("unary arithmetic with non-numeric type reports error", () => {
  const result = validateExpression("-'hello'");
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_UNARY_OPERAND")).toBe(true);
});

test("logical NOT with any type (warns)", () => {
  const result = validateExpression("not 'hello'");
  expect(result.warnings.some(w => w.code === "BOOLEAN_CONVERSION")).toBe(true);
});

test("array indexer with integer index", () => {
  const result = validateExpression("name[0]");
  expect(result.isValid).toBe(true);
});

test("array indexer with non-integer index reports error", () => {
  const result = validateExpression("name['hello']");
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_INDEX_TYPE")).toBe(true);
});

test("known function call validates successfully", () => {
  const result = validateExpression("name.exists()");
  expect(result.isValid).toBe(true);
});

test("unknown function in non-strict mode warns", () => {
  const validator = new SemanticValidator({ allowUnknownFunctions: true });
  const ast = parse("name.unknownFunction()");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const inferredAST = inferrer.inferTypes(typedAST);
  const result = validator.validate(inferredAST);
  
  expect(result.warnings.some(w => w.code === "UNKNOWN_FUNCTION")).toBe(true);
});

test("unknown function in strict mode reports error", () => {
  const validator = new SemanticValidator({ allowUnknownFunctions: false });
  const ast = parse("name.unknownFunction()");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const inferredAST = inferrer.inferTypes(typedAST);
  const result = validator.validate(inferredAST);
  
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "UNKNOWN_FUNCTION")).toBe(true);
});

test("function with wrong parameter count reports error", () => {
  const result = validateExpression("substring()"); // substring requires at least 1 arg
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_FUNCTION_PARAMS")).toBe(true);
});

test("function with wrong parameter type reports error", () => {
  const result = validateExpression("substring(123)"); // substring expects string context
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_FUNCTION_PARAMS")).toBe(true);
});

test("membership operation with collection", () => {
  const result = validateExpression("'a' in ('a', 'b', 'c')");
  expect(result.isValid).toBe(true);
});

test("membership operation without collection reports error", () => {
  const result = validateExpression("'a' in 'abc'");
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "INVALID_MEMBERSHIP_OPERANDS")).toBe(true);
});

test("type casting between compatible types", () => {
  const result = validateExpression("42 as decimal");
  expect(result.isValid).toBe(true);
});

test("invalid type casting warns", () => {
  const result = validateExpression("'hello' as integer");
  expect(result.warnings.some(w => w.code === "INVALID_TYPE_CAST")).toBe(true);
});

test("variable reference in strict mode without definition", () => {
  const validator = new SemanticValidator({ strictMode: true });
  const ast = parse("$undefinedVar");
  const typedAST = TypedNodeUtils.convertToTyped(ast);
  const inferrer = new TypeInferenceEngine();
  const inferredAST = inferrer.inferTypes(typedAST);
  const result = validator.validate(inferredAST);
  
  expect(result.isValid).toBe(false);
  expect(result.errors.some(e => e.code === "UNDEFINED_VARIABLE")).toBe(true);
});