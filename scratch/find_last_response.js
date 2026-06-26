const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/minh/.gemini/antigravity/brain/54946c11-6a52-4931-bfbe-76886b05ce88/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 1130 && obj.step_index <= 1162) {
      console.log(`Step ${obj.step_index}: source=${obj.source}, type=${obj.type}, status=${obj.status}, keys=${Object.keys(obj).join(',')}`);
      if (obj.content) console.log(`  content: ${obj.content.slice(0, 100)}`);
      if (obj.error) console.log(`  error: ${JSON.stringify(obj.error)}`);
    }
  } catch (err) {
  }
});
