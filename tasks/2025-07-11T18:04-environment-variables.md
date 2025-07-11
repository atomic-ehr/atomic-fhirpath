# Implement Environment Variables [pending]

## Overview
Implement FHIRPath environment variables including built-in variables (`%context`, `%now`, `%ucum`) and support for custom variables.

## Tasks
- [ ] Move pending-tests/14-environment-variables.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement environment variables in the codebase

## Requirements from Tests
1. **Built-in variables**:
   - `%context` - Root resource being evaluated
   - `%now` - Current datetime (consistent within expression)
   - `%ucum` - Unit conversion service
   - `%sct` - SNOMED CT service (optional)
   - `%loinc` - LOINC service (optional)
   - `%ext` - Extension functions (optional)

2. **Custom variables**:
   - Support user-defined variables
   - Pass through evaluation context
   - Any valid identifier after `%`

3. **Variable syntax**:
   - `%identifier` format
   - Support quoted names: `%"variable with spaces"`
   - Property access: `%variable.property`
   - Method calls: `%ucum.convert()`

4. **Evaluation semantics**:
   - Variables resolved from environment
   - Error if undefined (unless optional)
   - `%now` constant within expression
   - `%context` provides root access

5. **UCUM support**:
   - Unit validation: `%ucum.validate('mg')`
   - Unit conversion: `%ucum.convert(10, 'mg', 'g')`
   - Canonical form: `%ucum.canonical()`

6. **Type handling**:
   - Variables can be any type
   - Support complex objects
   - Collections allowed

## Implementation Notes
- Extend evaluation context for variables
- Parser needs to recognize % syntax
- Consider caching for %now
- UCUM integration may need external library

## Success Criteria
- All tests in 14-environment-variables.test.ts pass
- Clean API for custom variables
- Efficient variable resolution
- Good error messages for undefined
- Extensible for future variables