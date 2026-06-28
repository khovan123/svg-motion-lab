const fs = require('fs');

const output = fs.readFileSync('C:\\Users\\minh\\.gemini\\antigravity\\brain\\54946c11-6a52-4931-bfbe-76886b05ce88\\.system_generated\\steps\\7548\\output.txt', 'utf8');
console.log('Output length:', output.length);

// Search for any mention of property1 or variants or prototype
const lines = output.split('\n');
console.log('Total lines:', lines.length);

console.log('Lines mentioning property1 or variant:');
lines.forEach((line, idx) => {
  if (line.includes('property1') || line.includes('variant') || line.includes('Property')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
