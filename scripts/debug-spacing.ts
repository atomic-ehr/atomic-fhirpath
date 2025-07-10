#!/usr/bin/env bun

// Simulate the exact formatting
const lineNum = '1';
const expression = 'Patient.name(';
const errorColumn = 13;

// Build the line exactly as in formatter
const lineNumPadded = lineNum.padStart(4, ' ');
const sourceLine = `> ${lineNumPadded} | ${expression}`;

console.log('Source line:');
console.log(sourceLine);
console.log('0123456789012345678901234567890'); // Position ruler

// Count exact prefix before expression
const prefixBeforeExpr = `> ${lineNumPadded} | `.length;
console.log('\nPrefix length before expression:', prefixBeforeExpr);

// The caret should align with column 13 of the expression
const caretPosition = prefixBeforeExpr + errorColumn - 1; // -1 for 0-based
console.log('Caret should be at position:', caretPosition);

// Build caret line
const caretLine = ' '.repeat(7) + '| ' + ' '.repeat(errorColumn - 1) + '^';
console.log('\nCaret line:');
console.log(caretLine);

console.log('\nTogether:');
console.log(sourceLine);
console.log(caretLine);