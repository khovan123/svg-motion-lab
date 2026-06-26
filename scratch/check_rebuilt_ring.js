const fs = require('fs');
const { JSDOM } = require('jsdom');

const svgStr = fs.readFileSync('dist/animation.svg', 'utf8');
const { window } = new JSDOM(svgStr, { contentType: 'image/svg+xml' });
const doc = window.document;

const exactRoot = doc.querySelector('[data-exact-ring]');
if (exactRoot) {
  console.log("Found data-exact-ring root element!");
  console.log("Number of ring state wrappers:", exactRoot.children.length);
  Array.from(exactRoot.children).forEach((wrapper, idx) => {
    console.log(`  Wrapper [State ${idx}]: data-ring-state="${wrapper.getAttribute('data-ring-state')}", visibility="${wrapper.getAttribute('visibility')}", opacity="${wrapper.getAttribute('opacity')}"`);
    console.log(`    Children count: ${wrapper.children.length}`);
    Array.from(wrapper.children).slice(0, 3).forEach(c => {
      console.log(`      Child tag: ${c.tagName}, id: ${c.getAttribute('id') || 'none'}, mask: ${c.getAttribute('mask') || 'none'}`);
    });
  });
} else {
  console.log("Could NOT find data-exact-ring root element in dist/animation.svg!");
}

const refreshIcon = doc.querySelector('[data-motion-id*="hugeiconsrefresh"]');
if (refreshIcon) {
  console.log("\nFound hugeiconsrefresh icon outside of exact ring wrapper!");
  console.log(`  Tag: ${refreshIcon.tagName}, ID: ${refreshIcon.getAttribute('data-motion-id')}, parent: ${refreshIcon.parentElement.id || refreshIcon.parentElement.tagName}`);
} else {
  console.log("\nCould NOT find hugeiconsrefresh icon in DOM (maybe inside exact wrapper)!");
}
