const fs = require('fs');
const content = fs.readFileSync('motion-manifest.json', 'utf8');

const query1 = '4565';
const query2 = '982';

console.log(`Contains "${query1}":`, content.includes(query1));
console.log(`Contains "${query2}":`, content.includes(query2));

if (content.includes(query1)) {
  let idx = 0;
  while ((idx = content.indexOf(query1, idx)) !== -1) {
    console.log(`Context for "${query1}":`, content.substring(idx - 50, idx + 50).replace(/\n/g, ' '));
    idx += query1.length;
    break; // just show first context
  }
}

if (content.includes(query2)) {
  let idx = 0;
  while ((idx = content.indexOf(query2, idx)) !== -1) {
    console.log(`Context for "${query2}":`, content.substring(idx - 50, idx + 50).replace(/\n/g, ' '));
    idx += query2.length;
    break; // just show first context
  }
}
