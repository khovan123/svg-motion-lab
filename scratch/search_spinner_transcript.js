const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/minh/.gemini/antigravity/brain/54946c11-6a52-4931-bfbe-76886b05ce88/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const text = JSON.stringify(obj).toLowerCase();
    if (text.includes('spinner') && obj.step_index < 4000) {
      console.log(`[Step ${obj.step_index}] Type: ${obj.type}, Source: ${obj.source}`);
      if (obj.content) {
        console.log(`  Snippet: ${obj.content.slice(0, 300)}`);
      }
    }
  } catch (err) {}
});
