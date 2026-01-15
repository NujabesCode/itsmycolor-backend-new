const fs = require('fs');
const path = require('path');

function calculateRelativePath(fromFile, toModule) {
  // fromFile: dist/products/entities/product.entity.js
  // toModule: src/orders/entities/order-item.entity
  // result: ../../orders/entities/order-item.entity
  
  const fromDir = path.dirname(fromFile);
  const distDir = path.join(__dirname, '..', 'dist');
  const toPath = toModule.replace('src/', '');
  const toFile = path.join(distDir, toPath + '.js');
  
  const relative = path.relative(fromDir, path.dirname(toFile));
  let result = path.join(relative, path.basename(toFile)).replace(/\\/g, '/');
  
  // Normalize path separators and ensure it starts with ./ or ../
  if (!result.startsWith('.')) {
    result = './' + result;
  }
  // Remove .js extension if present (Node.js will add it automatically)
  result = result.replace(/\.js$/, '');
  return result;
}

function fixPaths(dir, baseDir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixPaths(filePath, baseDir);
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
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  console.log('Fixing paths in dist folder...');
  fixPaths(distDir, distDir);
  console.log('Done!');
} else {
  console.log('dist folder not found');
  process.exit(1);
}
