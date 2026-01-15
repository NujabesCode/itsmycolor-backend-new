const fs = require('fs');
const path = require('path');

function calculateRelativePath(fromFile, toModule) {
  // fromFile: dist/products/entities/product.entity.js
  // toModule: src/orders/entities/order-item.entity
  // result: ../../orders/entities/order-item.entity
  
  const distDir = path.resolve(__dirname, '..', 'dist');
  const fromDir = path.dirname(path.resolve(fromFile));
  const toPath = toModule.replace('src/', '');
  const toFile = path.resolve(distDir, toPath + '.js');
  const toDir = path.dirname(toFile);
  
  // Calculate relative path using path.relative
  const relative = path.relative(fromDir, toDir).replace(/\\/g, '/');
  const fileName = path.basename(toFile, '.js');
  
  // Build result path
  let result = relative ? `${relative}/${fileName}` : fileName;
  
  // Normalize: ensure it starts with ./ or ../
  if (!result.startsWith('.')) {
    result = './' + result;
  }
  
  // Fix: if relative is empty (same directory), use ./
  if (relative === '' || relative === '.') {
    result = './' + fileName;
  }
  
  return result;
}

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
      
      // Match require("src/...") or require('src/...')
      const regex = /require\((["'])(src\/[^"']+)\1\)/g;
      content = content.replace(regex, (match, quote, modulePath) => {
        const relativePath = calculateRelativePath(filePath, modulePath);
        return `require(${quote}${relativePath}${quote})`;
      });
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath} -> ${relativePath}`);
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
