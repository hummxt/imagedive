const fs = require('fs');
const path = require('path');

function createProperICO() {
  try {
    const pngPath = path.join(__dirname, 'icons', 'icon.png');
    const icoPath = path.join(__dirname, 'build', 'icon.ico');
    
    console.log('Creating proper ICO file...');
    
    const pngBuffer = fs.readFileSync(pngPath);
    
    const icoHeader = Buffer.from([
      0x00, 0x00, // Reserved (must be 0)
      0x01, 0x00, // Type (1 = ICO)
      0x01, 0x00, // Number of images (1)
      0x00,       // Width (0 = 256)
      0x00,       // Height (0 = 256)
      0x00,       // Color palette (0 = no palette)
      0x00,       // Reserved
      0x01, 0x00, // Color planes
      0x20, 0x00, // Bits per pixel (32)
      0x00, 0x00, 0x00, 0x00, // Size of image data
      0x16, 0x00, 0x00, 0x00  // Offset to image data
    ]);
    
    const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);
    
    icoBuffer.writeUInt32LE(pngBuffer.length, 8);
    
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('ICO file created:', icoPath);
    
  } catch (error) {
    console.error('Error creating ICO:', error.message);
    process.exit(1);
  }
}

createProperICO();
