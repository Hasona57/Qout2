// This script helps update colors based on the new logo
// Run this after extracting colors from your logo image

const fs = require('fs');
const path = require('path');

// TODO: Replace these with actual colors extracted from your new logo
// You can extract colors using:
// - Online tool: https://imagecolorpicker.com/
// - Design software: Photoshop, GIMP, Figma
// - Python script with PIL/Pillow

const NEW_COLORS = {
  primary: '#D4AF37',      // Main brand color (replace with your logo's primary color)
  primaryDark: '#B8941F',  // Darker variant for hover states
  primaryLight: '#E5C866', // Lighter variant for backgrounds
  secondary: '#C2185B',    // Accent color (replace with your logo's secondary color)
  secondaryDark: '#9A1247', // Darker variant
  secondaryLight: '#E91E63', // Lighter variant
};

// Files to update
const tailwindConfigs = [
  'frontend/store/tailwind.config.js',
  'frontend/admin/tailwind.config.js',
  'frontend/pos/tailwind.config.js',
];

function updateTailwindConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update brand colors
  content = content.replace(
    /gold:\s*'#[^']+'/g,
    `gold: '${NEW_COLORS.primary}'`
  );
  content = content.replace(
    /'gold-dark':\s*'#[^']+'/g,
    `'gold-dark': '${NEW_COLORS.primaryDark}'`
  );
  content = content.replace(
    /'gold-light':\s*'#[^']+'/g,
    `'gold-light': '${NEW_COLORS.primaryLight}'`
  );
  content = content.replace(
    /pink:\s*'#[^']+'/g,
    `pink: '${NEW_COLORS.secondary}'`
  );
  content = content.replace(
    /'pink-dark':\s*'#[^']+'/g,
    `'pink-dark': '${NEW_COLORS.secondaryDark}'`
  );
  content = content.replace(
    /'pink-light':\s*'#[^']+'/g,
    `'pink-light': '${NEW_COLORS.secondaryLight}'`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

console.log('Updating color scheme across all applications...\n');
console.log('Current colors:');
console.log(`Primary: ${NEW_COLORS.primary}`);
console.log(`Secondary: ${NEW_COLORS.secondary}\n`);

tailwindConfigs.forEach(updateTailwindConfig);

console.log('\n✅ Color update complete!');
console.log('\n⚠️  IMPORTANT: Please update the NEW_COLORS object in this script');
console.log('   with the actual colors extracted from your new logo, then run again.');






