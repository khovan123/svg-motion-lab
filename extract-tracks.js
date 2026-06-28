const fs = require('fs');
const html = fs.readFileSync('dist/animation.html', 'utf8');
const start = html.indexOf('"tracks"');
// Find the end of the tracks array - it's ]},svg=...
const endMarker = ']},svg=';
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0 || end <= start) {
  console.log('Cant find tracks data');
  process.exit(1);
}
// Extract just the tracks array: "tracks":[...]
const raw = html.substring(start, end + 1);
fs.writeFileSync('dist/tracks-raw.json', raw);
console.log('Extracted ' + raw.length + ' chars, trying to parse...');
// Wrap to make valid JSON
let json = '{' + raw + '}';
json = json.replace(/&amp;/g, '&');
try {
  const obj = JSON.parse(json);
  const tracks = obj.tracks;
  console.log('Parsed OK. Found ' + tracks.length + ' tracks.');
  const filtered = tracks.filter(t => t.id && (
    t.id.endsWith('/list[0]/frame[0]') ||
    t.id.endsWith('/list[0]/frame[0]/frame[0]/badge-text[0]') ||
    t.id.endsWith('/list[0]/frame[0]/avatar-group[0]/avatar-1[0]') ||
    t.id.endsWith('/list[0]/frame[4]') ||
    t.id.endsWith('/list[0]/frame[4]/frame[0]/badge-text[0]')
  ));
  filtered.forEach(t => {
    const shortId = t.id.split('@')[1];
    console.log(shortId + ':');
    console.log(JSON.stringify({transforms: t.transforms, rotations: t.rotations}, null, 2));
  });
} catch(e) {
  console.log('Parse error: ' + e.message);
  console.log('First 500 chars of raw:', raw.substring(0, 500));
  console.log('Last 200 chars of raw:', raw.substring(raw.length - 200));
}
