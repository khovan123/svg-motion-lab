const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/minh/.gemini/antigravity/brain/54946c11-6a52-4931-bfbe-76886b05ce88/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const lines = [];
rl.on('line', (line) => {
  lines.push(line);
  if (lines.length > 30) {
    lines.shift();
  }
});

rl.on('close', () => {
  lines.forEach(line => {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index}: source=${obj.source}, type=${obj.type}, status=${obj.status}, keys=${Object.keys(obj).join(',')}`);
      if (obj.content) console.log(`  content: ${obj.content.slice(0, 150)}...`);
      if (obj.thinking) console.log(`  thinking: ${obj.thinking.slice(0, 150)}...`);
    } catch (e) {
      console.log("Error parsing line: " + e.message);
    }
  });
});
