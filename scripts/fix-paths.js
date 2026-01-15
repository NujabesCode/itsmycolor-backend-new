const fs = require('fs');
const path = require('path');

function fixPaths(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixPaths(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      
      // require("src/ -> require("../ 
      content = content.replace(/require\("src\//g, 'require("../');
      // require('src/ -> require('../ 
      content = content.replace(/require\('src\//g, "require('../");
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  console.log('Fixing paths in dist folder...');
  fixPaths(distDir);
  console.log('Done!');
} else {
  console.log('dist folder not found');
  process.exit(1);
}
