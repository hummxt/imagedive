const fs = require('fs');
const path = require('path');

function generateIcon() {
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
    
    console.log('Creating ICO file...');
    
    const pngBuffer = fs.readFileSync(pngPath);
    fs.writeFileSync(icoPath, pngBuffer);
    
    console.log('ICO file created:', icoPath);
    console.log('Note: This is a temporary solution. For production, use a proper ICO converter.');
    
  } catch (error) {
    console.error('Error generating icon:', error.message);
    process.exit(1);
  }
}

generateIcon();
