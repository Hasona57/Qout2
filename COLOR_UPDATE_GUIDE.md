# Logo Color Update Guide

## Step 1: Extract Colors from Your New Logo

You have several options to extract colors from your logo:

### Option A: Use the HTML Color Extractor (Recommended)
1. Open `extract-logo-colors.html` in your browser
2. Upload your `Logo.jpg` file
3. The tool will display the dominant colors and generate color codes
4. Copy the primary and secondary colors

### Option B: Use Online Tools
- **Image Color Picker**: https://imagecolorpicker.com/
- **Coolors**: https://coolors.co/image-picker
- **Canva Color Palette Generator**: https://www.canva.com/colors/color-palette-generator/

### Option C: Use Design Software
- Open the logo in Photoshop, GIMP, or Figma
- Use the eyedropper tool to sample the main colors
- Note down the HEX codes

## Step 2: Update Colors in the System

Once you have your colors, update the `NEW_COLORS` object in `update-colors-from-logo.js`:

```javascript
const NEW_COLORS = {
  primary: '#YOUR_PRIMARY_COLOR',      // Main brand color
  primaryDark: '#YOUR_PRIMARY_DARK',   // Darker variant (or use darkenColor function)
  primaryLight: '#YOUR_PRIMARY_LIGHT', // Lighter variant (or use lightenColor function)
  secondary: '#YOUR_SECONDARY_COLOR',  // Accent color
  secondaryDark: '#YOUR_SECONDARY_DARK',
  secondaryLight: '#YOUR_SECONDARY_LIGHT',
};
```

## Step 3: Run the Update Script

```bash
node update-colors-from-logo.js
```

This will automatically update all Tailwind config files across:
- `frontend/store/tailwind.config.js`
- `frontend/admin/tailwind.config.js`
- `frontend/pos/tailwind.config.js`

## Step 4: Verify Changes

1. Restart your development servers
2. Check all three applications (Store, Admin, POS)
3. Verify that colors match your new logo

## Current Color Scheme

The system currently uses:
- **Primary (Gold)**: `#D4AF37` - Used for main brand elements
- **Secondary (Pink)**: `#C2185B` - Used for accents and highlights

These are mapped to Tailwind classes:
- `brand-gold` / `brand-pink` - Main colors
- `brand-gold-dark` / `brand-pink-dark` - Darker variants
- `brand-gold-light` / `brand-pink-light` - Lighter variants

## Files Updated

All logo references have been updated to use `/logo.jpg` in:
- Store frontend
- Admin panel
- POS system

All hardcoded colors have been replaced with brand color classes throughout the applications.














