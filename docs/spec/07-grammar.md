# Chapter 7: Grammar Reference

## Lexical Elements

### Whitespace
Characters that separate tokens:
- Space (` `)
- Tab (`\t`)
- Line feed (`\n`)
- Carriage return (`\r`)

Whitespace is ignored except for delimiting tokens.

### Comments

#### Single-line
```
2 + 2 // This is a comment
```

#### Multi-line
```
/*
  This is a 
  multi-line comment
*/
```

### Literals

| Type | Syntax | Example |
|------|--------|---------|
| Empty | `{}` | `{}` |
| Boolean | `true`, `false` | `true` |
| Integer | `[0-9]+` | `42` |
| Decimal | `[0-9]+.[0-9]+` | `3.14` |
| String | `'...'` | `'hello'` |
| Date | `@YYYY-MM-DD` | `@2023-01-15` |
| DateTime | `@YYYY-MM-DDThh:mm:ss` | `@2023-01-15T10:30:00` |
| Time | `@Thh:mm:ss` | `@T10:30:00` |
| Quantity | `number 'unit'` | `5 'mg'` |

### Symbols

| Symbol | Purpose |
|--------|---------|
| `()` | Grouping, function calls |
| `[]` | Indexing |
| `{}` | Empty collection |
| `.` | Path navigation |
| `,` | Parameter separator |
| `=` `!=` | Equality |
| `<` `>` `<=` `>=` | Comparison |
| `+` `-` `*` `/` | Arithmetic |
| `|` | Union |
| `&` | String concatenation |

### Keywords

Reserved words (cannot be used as identifiers):

| | | | |
|---|---|---|---|
| `$index` | `div` | `milliseconds` | `true` |
| `$this` | `false` | `minute` | `week` |
| `$total` | `hour` | `minutes` | `weeks` |
| `and` | `hours` | `mod` | `xor` |
| `as` | `implies` | `month` | `year` |
| `contains` | `in` | `months` | `years` |
| `day` | `is` | `or` | `second` |
| `days` | `millisecond` | `seconds` | |

## Identifiers

### Simple Identifiers
- Start with letter or underscore
- Followed by letters, digits, underscores

Examples:
```
Patient
_id
valueDateTime
_1234
```

### Delimited Identifiers
- Enclosed in backticks
- Can contain any characters
- Support escape sequences

Examples:
```
`QI-Core Patient`
`value[x]`
`us-zip`
```

### Identifier Resolution
1. At expression root: Type name first
2. Must match context type if resolved as type
3. Otherwise resolved as path
4. Error if cannot resolve

## Case Sensitivity
- **Language**: Case-sensitive (keywords, operators)
- **Identifiers**: Model-dependent
- **FHIR**: Case-sensitive for properties

## Formal Grammar (BNF-style)

### Expression
```
expression: term (operator term)*
term: invocation | literal | externalConstant | expression
invocation: identifier | function | accessor
function: identifier '(' paramList? ')'
paramList: expression (',' expression)*
accessor: '.' identifier | '[' expression ']'
```

### Operators
```
operator: multiplicative | additive | union | comparative | equality | logical | implies
multiplicative: '*' | '/' | 'div' | 'mod'
additive: '+' | '-' | '&'
union: '|'
comparative: '<' | '>' | '<=' | '>='
equality: '=' | '~' | '!=' | '!~'
logical: 'and' | 'or' | 'xor'
implies: 'implies'
```

### Literals
```
literal: nullLiteral | booleanLiteral | stringLiteral | numberLiteral | dateLiteral | timeLiteral | dateTimeLiteral | quantityLiteral
nullLiteral: '{' '}'
booleanLiteral: 'true' | 'false'
stringLiteral: '\'' stringCharacter* '\''
numberLiteral: [0-9]+ ('.' [0-9]+)?
dateLiteral: '@' dateFormat
dateTimeLiteral: '@' dateTimeFormat
timeLiteral: '@T' timeFormat
quantityLiteral: numberLiteral '\'' unit '\''
```

### Identifiers
```
identifier: simpleIdentifier | delimitedIdentifier
simpleIdentifier: [a-zA-Z_][a-zA-Z0-9_]*
delimitedIdentifier: '`' delimitedCharacter* '`'
```

## Escape Sequences

Available in strings and delimited identifiers:

| Escape | Character |
|--------|-----------|
| `\'` | Single quote |
| `\"` | Double quote |
| `\`` | Backtick |
| `\\` | Backslash |
| `\r` | Carriage return |
| `\n` | Line feed |
| `\t` | Tab |
| `\f` | Form feed |
| `\uXXXX` | Unicode character |

## Type Specifiers
```
typeSpecifier: qualifiedIdentifier | identifier
qualifiedIdentifier: identifier '.' identifier
```

Used in:
- `is` operator: `value is Quantity`
- `as` operator: `value as Quantity`
- `ofType()` function: `value.ofType(Quantity)`

## Environment Variables
```
envVariable: '%' (identifier | delimitedIdentifier)
```

Examples:
```
%ucum
%context
%`us-zip`
```

## Expression Examples

### Complex Expression
```
Patient
  .name
  .where(use = 'official')
  .given
  .first() + ' ' + 
  Patient.name.family.first()
```

### Type-checked Navigation
```
Observation
  .value
  .ofType(Quantity)
  .where(value > 100 and unit = 'mg/dL')
```

### With Environment Variables
```
Patient.telecom
  .where(system = 'phone')
  .value
  .matches(%`us-phone-pattern`)
```

## Next: [Appendices →](08-appendices.md)