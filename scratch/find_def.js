const fs = require('fs');
const lines = fs.readFileSync('web/semantic-15.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('getAbsoluteBounds') && !line.includes('SvgMotionCompiler')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
