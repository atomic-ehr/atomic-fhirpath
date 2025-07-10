#!/usr/bin/env bun

// Let's analyze the exact formatting
const line = '>    1 | Patient.name(';
console.log('Line:', line);
console.log('Length:', line.length);

// Count characters before the actual expression starts
let pos = 0;
for (let i = 0; i < line.length; i++) {
  if (line.substring(i).startsWith('Patient')) {
    pos = i;
    break;
  }
}

console.log('Expression starts at position:', pos);
console.log('Prefix length:', pos);

// For column 13, the caret should be at position: prefix + 13 - 1
const caretPos = pos + 13 - 1;
console.log('Caret should be at position:', caretPos);

// Build the caret line
const caretLine = ' '.repeat(caretPos) + '^';
console.log('\nFormatted:');
console.log(line);
console.log(caretLine);