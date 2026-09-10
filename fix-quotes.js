const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let count = 0;
walkDir(path.join(__dirname, 'apps/web/src'), function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("'${API_BASE_URL}")) {
    // Replace '${API_BASE_URL}... ' with `${API_BASE_URL}...`
    // We need to carefully replace the single quotes with backticks for those specific lines.
    // A regex would be: /'\$\{API_BASE_URL\}([^']*)'/g
    const newContent = content.replace(/'\$\{API_BASE_URL\}([^']*)'/g, '`${API_BASE_URL}$1`');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed ${filePath}`);
      count++;
    }
  }
});
console.log(`Fixed ${count} files.`);
