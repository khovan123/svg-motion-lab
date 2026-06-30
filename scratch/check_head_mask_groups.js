const { execSync } = require('child_process');
const content = execSync('git show HEAD:motion-manifest.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
const manifest = JSON.parse(content);
console.log('HEAD states count:', manifest.states.length);
manifest.states.forEach((s, idx) => {
  console.log(`State ${idx}: id = ${s.id}, name = ${s.name}`);
  const match = s.svg.match(/data-motion-id="([^"]*)"/g);
  if (match) {
    console.log(`  Unique motion IDs count: ${new Set(match).size}`);
    const firstFew = [...new Set(match)].slice(0, 5).map(m => m.slice(16, -1));
    console.log(`  First few:`, firstFew);
  }
});
