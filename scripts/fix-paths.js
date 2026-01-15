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
      
      // Fix 1: src/ paths -> calculate relative path
      content = content.replace(/require\((["'])(src\/[^"']+)\1\)/g, (match, quote, modulePath) => {
        const distDir = path.resolve(__dirname, '..', 'dist');
        const fromDir = path.dirname(path.resolve(filePath));
        const toPath = modulePath.replace('src/', '');
        const toFile = path.resolve(distDir, toPath + '.js');
        const toDir = path.dirname(toFile);
        
        let relative = path.relative(fromDir, toDir).replace(/\\/g, '/');
        if (relative === '' || relative === '.') relative = '.';
        
        const fileName = path.basename(toFile, '.js');
        let result = relative === '.' ? `./${fileName}` : `${relative}/${fileName}`;
        if (!result.startsWith('.')) result = './' + result;
        
        return `require(${quote}${result}${quote})`;
      });
      
      // Fix 2: Fix wrong ../ paths (should be ../../)
      // products/entities -> orders/entities needs ../../ not ../
      content = content.replace(/require\((["'])\.\.\/(orders|users|brands|auth|coupons)\//g, (match, quote, module) => {
        const fileDir = path.dirname(filePath).replace(/\\/g, '/');
        // If file is in entities/ or controllers/ subdirectory, need ../../ not ../
        if (fileDir.includes('/entities/') || fileDir.includes('/controllers/') || fileDir.includes('/services/')) {
          return `require(${quote}../../${module}/`;
        }
        return match;
      });
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${path.relative(path.join(__dirname, '..', 'dist'), filePath)}`);
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
