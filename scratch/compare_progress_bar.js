const fs = require('fs');
const { JSDOM } = require('jsdom');

// Compare current compiled output vs correct result for motion-manifest.json
const currentSvg = fs.readFileSync('dist-test-manifest1/animation.svg', 'utf8');
const correctSvg = fs.readFileSync('correct-result/1/dist/animation.svg', 'utf8');

function analyzeSvg(svgContent, label) {
  const doc = new JSDOM(svgContent, { contentType: 'image/svg+xml' }).window.document;
  console.log(`\n========== ${label} ==========`);
  
  const svg = doc.querySelector('svg');
  console.log(`viewBox: ${svg.getAttribute('viewBox')}`);
  console.log(`duration: ${svg.getAttribute('data-duration')}`);
  console.log(`render-mode: ${svg.getAttribute('data-render-mode')}`);
  
  // Check for script
  const script = doc.querySelector('script');
  if (script) {
    const scriptText = script.textContent;
    console.log(`\nScript length: ${scriptText.length} chars`);
    
    // Check for track data
    const trackMatch = scriptText.match(/tracks\s*[:=]\s*(\[[\s\S]*?\])\s*[,;]/);
    if (trackMatch) {
      console.log(`Has tracks data`);
    }
    
    // Search for progress-related keywords  
    const progressKeywords = ['progress', 'bar', 'indicator', 'percent', 'width', 'scaleX'];
    for (const kw of progressKeywords) {
      const regex = new RegExp(kw, 'gi');
      const matches = scriptText.match(regex);
      if (matches) {
        console.log(`  Found "${kw}": ${matches.length} occurrences`);
      }
    }
    
    // Check for animate elements
    const animateEls = doc.querySelectorAll('animate, animateTransform, animateMotion');
    console.log(`\nSMIL animations: ${animateEls.length}`);
    
    // Look for rect elements (progress bars are often rects)
    const rects = doc.querySelectorAll('rect');
    console.log(`\nRect elements: ${rects.length}`);
    for (const r of rects) {
      const id = r.id || '';
      const width = r.getAttribute('width');
      const height = r.getAttribute('height');
      const fill = r.getAttribute('fill');
      console.log(`  rect id="${id}" w=${width} h=${height} fill=${fill}`);
    }
  }
  
  // count all <g> elements
  const groups = doc.querySelectorAll('g');
  console.log(`\nTotal <g> elements: ${groups.length}`);
  
  // count clipPath and mask
  const clips = doc.querySelectorAll('clipPath');
  const masks = doc.querySelectorAll('mask');
  console.log(`ClipPaths: ${clips.length}`);
  console.log(`Masks: ${masks.length}`);
}

analyzeSvg(currentSvg, 'CURRENT (dist-test-manifest1)');
analyzeSvg(correctSvg, 'CORRECT (correct-result/1/dist)');

// Also check file sizes
console.log('\n\n========== SIZE COMPARISON ==========');
console.log(`Current: ${currentSvg.length} bytes`);
console.log(`Correct: ${correctSvg.length} bytes`);
console.log(`Difference: ${currentSvg.length - correctSvg.length} bytes`);
