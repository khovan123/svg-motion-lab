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
    if (obj.type === 'USER_INPUT' && obj.content && (obj.content.includes('vẫn chưa') || obj.content.includes('progress bar'))) {
      console.log(`\n=== [Step ${obj.step_index}] USER INPUT ===`);
      console.log(obj.content);
    }
  } catch (err) {}
});
