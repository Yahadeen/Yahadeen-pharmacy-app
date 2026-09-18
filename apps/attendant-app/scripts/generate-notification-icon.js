/**
 * Script to generate a 96x96 all-white PNG with transparency for push notifications
 * Run with: node scripts/generate-notification-icon.js
 * Requires: npm install sharp
 */

const sharp = require('sharp');
const path = require('path');

async function generateNotificationIcon() {
  const size = 96;
  const iconPath = path.join(__dirname, '../assets/images/notification-icon.png');
  
  try {
    // Create a 96x96 white image with transparency
    // Using a simple white square with rounded corners for better appearance
    const roundedCorner = 16;
    
    // Create a white rounded square
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${roundedCorner}" ry="${roundedCorner}" fill="white"/>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(iconPath);
    
    console.log('✅ Notification icon generated successfully at:', iconPath);
    console.log('   Size: 96x96, White with transparency');
  } catch (error) {
    console.error('❌ Error generating notification icon:', error);
    
    // Fallback: create a simple white square if sharp is not available
    console.log('📝 Fallback: Please manually create a 96x96 white PNG with transparency');
    console.log('   Save it as: assets/images/notification-icon.png');
    console.log('   You can use online tools like: https://www.canva.com/ or Adobe Photoshop');
  }
}

generateNotificationIcon();
