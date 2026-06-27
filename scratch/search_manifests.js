const fs = require('fs');

const findInFile = (filename) => {
  if (!fs.existsSync(filename)) {
    console.log(`${filename} does not exist.`);
    return;
  }
  const content = fs.readFileSync(filename, 'utf8');
  console.log(`\n=== Searching ${filename} ===`);
  console.log("Contains '1:4530':", content.includes('1:4530'));
  console.log("Contains '1:4476':", content.includes('1:4476'));
  console.log("Contains '1:4218':", content.includes('1:4218'));
  console.log("Contains '1:4182':", content.includes('1:4182'));
};

findInFile('motion-manifest.json');
findInFile('motion-manifest-1.json');
