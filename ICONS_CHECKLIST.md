# PWA Icons Checklist for Ashoka Marketplace

## 📸 Base Image

Use: `/public/images/logo.png` (your existing Ashoka Marketplace logo)

---

## 📋 Required Icons

### ⭐ Critical Icons (Must Have)

```
/public/icons/icon-192x192.png           (192x192px)
/public/icons/icon-512x512.png           (512x512px)
/public/icons/icon-192x192-maskable.png  (192x192px with 40% padding, #4f39f6 bg)
/public/icons/icon-512x512-maskable.png  (512x512px with 40% padding, #4f39f6 bg)
/public/favicon.png                       (32x32px)
/public/favicon.ico                       (16x16, 32x32, 48x48 multi-size)
```

### 🍎 Apple Icons (iOS)

```
/public/icons/apple-touch-icon-120x120.png  (120x120px, white background)
/public/icons/apple-touch-icon-152x152.png  (152x152px, white background)
/public/icons/apple-touch-icon-167x167.png  (167x167px, white background)
/public/icons/apple-touch-icon-180x180.png  (180x180px, white background) ⭐ Most important
```

### 📱 Standard PWA Icons

```
/public/icons/icon-72x72.png    (72x72px)
/public/icons/icon-96x96.png    (96x96px)
/public/icons/icon-128x128.png  (128x128px)
/public/icons/icon-144x144.png  (144x144px)
/public/icons/icon-152x152.png  (152x152px)
/public/icons/icon-384x384.png  (384x384px)
```

### 🎯 Shortcut Icons (Colored backgrounds)

```
/public/icons/shortcut-browse.png    (96x96px, purple bg: #9333ea)
/public/icons/shortcut-sell.png      (96x96px, green bg: #22c55e)
/public/icons/shortcut-wishlist.png  (96x96px, red bg: #ef4444)
/public/icons/shortcut-profile.png   (96x96px, blue bg: #3b82f6)
```

### 📸 Screenshots (Optional but recommended)

```
/public/screenshots/home.png    (1170x2532px) - iPhone screenshot
/public/screenshots/browse.png  (1170x2532px) - Browse page
```

---

## 🎨 Design Specifications

### Standard Icons

- **Content**: Ashoka Marketplace logo centered
- **Background**: Transparent
- **Format**: PNG
- **Purpose**: General app icons

### Maskable Icons

- **Content**: Logo centered, scaled to 60% of total size
- **Padding**: 40% safe zone (20% on each side)
- **Background**: Solid #4f39f6 (theme color)
- **Format**: PNG
- **Purpose**: Adaptive icons for Android

### Apple Touch Icons

- **Content**: Logo centered, slightly padded
- **Background**: White (#ffffff)
- **Format**: PNG
- **Purpose**: iOS home screen icons

### Shortcut Icons

- **Content**: Logo centered at 60% size
- **Background**: Colored (see colors above)
- **Format**: PNG
- **Rounded corners**: Yes (4-8px)
- **Purpose**: App shortcuts menu

### Favicon

- **Content**: Logo simplified/minimal version
- **Background**: Transparent or white
- **Format**: PNG and ICO
- **Purpose**: Browser tab icon

---

## 🛠️ Quick Generation Guide

### Option 1: Online Tools

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator

   - Upload your logo.png
   - Select all sizes
   - Download ZIP

2. **Real Favicon Generator**: https://realfavicongenerator.net/
   - Upload logo
   - Configure for all platforms
   - Download package

### Option 2: Figma/Photoshop

1. Open logo.png in Figma/Photoshop
2. Create artboards for each size
3. Export with proper naming

### Option 3: ImageMagick CLI

```bash
# Standard icons
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 icon-192x192.png
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 icon-512x512.png

# Maskable (with padding and background)
convert logo.png -resize 307x307 -background none -gravity center -extent 307x307 temp.png
convert temp.png -background "#4f39f6" -gravity center -extent 512x512 icon-512x512-maskable.png

# Apple icons
convert logo.png -resize 160x160 -background white -gravity center -extent 180x180 apple-touch-icon-180x180.png

# Shortcut icons
convert logo.png -resize 58x58 -background none -gravity center -extent 58x58 temp.png
convert temp.png -background "#9333ea" -gravity center -extent 96x96 shortcut-browse.png
```

---

## ✅ Validation Checklist

After creating icons, verify:

- [ ] All icon files are named exactly as listed above
- [ ] Icons are in correct directories (`/public/icons/` or `/public/`)
- [ ] File sizes are under 512KB each
- [ ] PNG files have transparent backgrounds (except Apple icons and maskable)
- [ ] Maskable icons have proper safe zone padding
- [ ] Icons look good when scaled down to small sizes
- [ ] favicon.ico is multi-resolution (16, 32, 48px)
- [ ] No pixelation or artifacts
- [ ] Logo is clearly visible at all sizes

---

## 🧪 Testing

### Test Icon Quality

1. Open Chrome DevTools
2. Go to Application > Manifest
3. Check "Icons" section
4. Verify all icons load without errors
5. Click icons to preview

### Test on Device

1. Install PWA on phone
2. Check home screen icon quality
3. Verify correct icon shows in multitasking
4. Test shortcuts (long-press app icon)

---

## 💡 Pro Tips

1. **Keep it simple**: Logo should be recognizable at small sizes
2. **High contrast**: Ensure logo stands out on all backgrounds
3. **Maskable padding**: Don't put important content in outer 40%
4. **Test on dark mode**: Especially for maskable icons
5. **Optimize file size**: Use tools like TinyPNG or ImageOptim
6. **Vector source**: Keep an SVG version for easy resizing

---

## 📞 Need Help?

If you need help generating icons:

1. Use https://www.pwabuilder.com/imageGenerator (easiest)
2. Or share your logo and we can help generate them
3. Check PWA_SETUP.md for full setup instructions

---

## 🎯 Priority Order

If you're creating icons incrementally, do them in this order:

1. ⭐ icon-192x192.png, icon-512x512.png (required for PWA)
2. ⭐ apple-touch-icon-180x180.png (iOS)
3. ⭐ favicon.png, favicon.ico (browser)
4. maskable icons (Android adaptive)
5. Other standard sizes
6. Shortcut icons
7. Screenshots

Once you have at least items 1-3, your PWA will be functional!
