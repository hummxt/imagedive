const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  require('png-to-ico');
} catch (error) {
  console.log('Installing png-to-ico...');
  execSync('npm install png-to-ico', { stdio: 'inherit' });
}

const pngToIco = require('png-to-ico').default || require('png-to-ico');

async function generateIcon() {
  try {
    const pngPath = path.join(__dirname, 'icons', 'icon.png');
    const icoPath = path.join(__dirname, 'build', 'icon.ico');
    
    if (!fs.existsSync(path.join(__dirname, 'build'))) {
      fs.mkdirSync(path.join(__dirname, 'build'));
    }
    
    if (!fs.existsSync(pngPath)) {
      console.error('Error: icons/icon.png not found');
      process.exit(1);
    }
    
    console.log('Converting PNG to ICO with multiple sizes...');
    
    const icoBuffer = await pngToIco([pngPath]);
    
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('ICO generated successfully:', icoPath);
    
  } catch (error) {
    console.error('Error generating icon:', error.message);
    process.exit(1);
  }
}

generateIcon();
