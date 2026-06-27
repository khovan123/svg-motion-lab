const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgContent = fs.readFileSync('dist/animation.svg', 'utf8');
const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;

const scripts = doc.querySelectorAll('script');

console.log("Script 0 render function snippet:");
const renderMatch0 = scripts[0].textContent.match(/function render\(t\)\{.*?if\(el\.hasAttribute\('data-refresh-rotor'\)\|\|el\.hasAttribute\('data-exact-ring'\)\)continue;/);
console.log("  Rotor/exact-ring ignore present:", !!renderMatch0);

console.log("\nScript 1 (rotor) script snippet:");
const renderMatch1 = scripts[1].textContent.match(/else child\.setAttribute\('opacity',i===resolvedTo&&q\.segment\?String\(p\):i===resolvedFrom&&q\.segment\?String\(1-p\):i===resolvedFrom\?'1':'0'\)/);
console.log("  Correct fallback cross-fade present in Script 1:", !!renderMatch1);

console.log("\nScript 2 (exact-ring) render function snippet:");
const renderMatch2 = scripts[2].textContent.match(/else if\(index===to\)child\.setAttribute\('opacity',String\(p\)\);else if\(index===from\)child\.setAttribute\('opacity',String\(1-p\)\);else child\.setAttribute\('opacity','0'\)/);
console.log("  Correct exact-ring cross-fade present in Script 2:", !!renderMatch2);
