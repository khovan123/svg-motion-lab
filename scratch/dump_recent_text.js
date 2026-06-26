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
    if (obj.step_index >= 1100 && obj.type === 'PLANNER_RESPONSE') {
      console.log(`--- STEP ${obj.step_index} ---`);
      console.log(obj.content);
    }
  } catch (err) {
  }
});
