const fs = require('fs');

let code = fs.readFileSync('web/semantic-14.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

// Patch checkIsPie in semantic-14.js to ignore container and hugeiconsrefresh elements
code = code.replace(
  `function checkIsPie(element) {
  const tag = String(element.tagName).toLowerCase();
  if (tag === 'mask' || tag === 'g' || tag === 'path') {
    const paths = tag === 'path' ? [element] : Array.from(element.querySelectorAll('path'));
    if (paths.length === 0) return false;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const match = d.match(/M\\s*(-?\\d*\\.?\\d+)\\s*(-?\\d*\\.?\\d+)/i);
      if (match) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        if (x >= 210 && x <= 295 && y >= 45 && y <= 130) {
          return true;
        }
      }
    }
  }
  const motionId = element.getAttribute('data-motion-id') || '';
  return motionId.includes('piechart');
}`,
  `function checkIsPie(element) {
  const motionId = element.getAttribute('data-motion-id') || '';
  // Don't treat container or hugeiconsrefresh elements as pie chart
  const isContainerOrRotor = [...element.querySelectorAll('*'), element].some(el => {
    const mid = el.getAttribute('data-motion-id') || '';
    return mid.includes('container') || mid.includes('hugeiconsrefresh');
  });
  if (isContainerOrRotor) return false;

  const tag = String(element.tagName).toLowerCase();
  if (tag === 'mask' || tag === 'g' || tag === 'path') {
    const paths = tag === 'path' ? [element] : Array.from(element.querySelectorAll('path'));
    if (paths.length === 0) return false;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const match = d.match(/M\\s*(-?\\d*\\.?\\d+)\\s*(-?\\d*\\.?\\d+)/i);
      if (match) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        if (x >= 210 && x <= 295 && y >= 45 && y <= 130) {
          return true;
        }
      }
    }
  }
  return motionId.includes('piechart');
}`
);

fs.writeFileSync('scratch/semantic-14.js', code, 'utf8');
console.log('Patched semantic-14.js written to scratch/semantic-14.js');
