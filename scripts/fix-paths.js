const fs = require('fs');
const path = require('path');

function calculateRelativePath(fromFile, toModule) {
  // fromFile: dist/products/entities/product.entity.js (absolute path)
  // toModule: src/orders/entities/order-item.entity
  // result: ../../orders/entities/order-item.entity
  
  const distDir = path.resolve(__dirname, '..', 'dist');
  const fromDir = path.dirname(path.resolve(fromFile));
  const toPath = toModule.replace('src/', '');
  const toFile = path.resolve(distDir, toPath + '.js');
  const toDir = path.dirname(toFile);
  
  // Calculate relative path
  let relative = path.relative(fromDir, toDir);
  
  // Normalize path separators
  relative = relative.replace(/\\/g, '/');
  
  // If relative is empty, they're in the same directory
  if (relative === '' || relative === '.') {
    relative = '.';
  }
  
  const fileName = path.basename(toFile, '.js');
  let result = relative === '.' ? `./${fileName}` : `${relative}/${fileName}`;
  
  // Ensure it starts with ./
  if (!result.startsWith('.')) {
    result = './' + result;
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
        const matches = original.match(regex);
        if (matches) {
          console.log(`Fixed: ${path.relative(path.join(__dirname, '..', 'dist'), filePath)}`);
        }
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
