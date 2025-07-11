# Implement DateTime Arithmetic [pending]

## Overview
Implement date/time arithmetic operations for FHIRPath including addition, subtraction, and duration handling.

## Tasks
- [ ] Move pending-tests/24-datetime-arithmetic.test.ts to test directory
- [ ] Verify test compliance with FHIRPath specification (./refs/FHIRPath/)
- [ ] Fix test if not compliant with spec
- [ ] Run tests to identify failures
- [ ] Implement datetime arithmetic in the codebase

## Requirements from Tests
1. **Duration types**:
   - Years, months, days
   - Hours, minutes, seconds
   - Support decimal values
   - ISO 8601 duration format

2. **Addition operations**:
   - Date + Duration = Date
   - DateTime + Duration = DateTime
   - Time + Duration = Time
   - Handle month/year boundaries

3. **Subtraction operations**:
   - Date - Date = Duration (days)
   - DateTime - DateTime = Duration
   - Date - Duration = Date
   - Cannot subtract incompatible types

4. **Calendar rules**:
   - Leap year handling
   - Month length variations
   - Daylight saving time
   - Timezone considerations

5. **Precision handling**:
   - Maintain input precision
   - Round appropriately
   - Handle partial dates

6. **Edge cases**:
   - End of month handling
   - Leap day calculations
   - Cross-year boundaries
   - Invalid date prevention

## Implementation Notes
- Use robust date library
- Consider timezone complexities
- Handle precision carefully
- Follow FHIR date/time rules

## Success Criteria
- All tests in 24-datetime-arithmetic.test.ts pass
- Accurate calculations
- Timezone aware
- Handle all edge cases
- Good performance