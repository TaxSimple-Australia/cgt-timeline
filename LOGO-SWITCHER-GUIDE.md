# Logo Switcher Guide

## 🎨 Quick Start

The logo switcher is now live! Here's how to use it:

### Step 1: Upload Your Logo Files

1. Navigate to `/public/logos/` folder
2. Add your JPG logo files with these names:
   - `logo-1.jpg`
   - `logo-2.jpg`
   - `logo-3.jpg`
   - ... up to `logo-10.jpg`

**Recommended specs:**
- Format: JPG (or PNG for transparency)
- Width: 200-400px
- Height: Proportional (maintain aspect ratio)
- Background: White for light mode, dark for dark mode (optional)

### Step 2: Access the Logo Switcher

1. Go to http://localhost:3002/landing
2. Press **Ctrl+L** (or **Cmd+L** on Mac)
3. The logo switcher button will appear in the header (purple button with "Logo Options")

### Step 3: Switch Between Logos

1. Click the "Logo Options" button
2. Browse through all your logo variations with thumbnails
3. Click any logo to instantly preview it in the header
4. The selection is saved automatically (persists across page refreshes)

### Step 4: Hide the Switcher

- Press **Ctrl+L** again to hide the switcher from view
- This keeps it hidden from stakeholders until you want to show it

---

## 📁 File Structure

```
public/
├── logos/
│   ├── logo-1.jpg          ← Your first logo option
│   ├── logo-2.jpg          ← Your second logo option
│   ├── logo-3.jpg          ← etc.
│   ├── ...
│   ├── logo-10.jpg
│   ├── logos-config.json   ← Logo metadata (names, descriptions)
│   └── README.md           ← Upload instructions
```

---

## 🎯 Customizing Logo Metadata

Edit `/public/logos/logos-config.json` to update logo names and descriptions:

```json
{
  "logos": [
    {
      "id": "text-current",
      "name": "Current Text Logo",
      "description": "CGT Brain text-based logo with gradient",
      "type": "text",
      "file": null
    },
    {
      "id": "logo-1",
      "name": "Logo Option 1",         ← Change this name
      "description": "First design",   ← Change this description
      "type": "image",
      "file": "/logos/logo-1.jpg"
    }
  ]
}
```

---

## 🔑 Keyboard Shortcut

- **Ctrl+L** (Windows/Linux) or **Cmd+L** (Mac) - Toggle logo switcher visibility

---

## 💡 Pro Tips

1. **Present to stakeholders**: Keep the switcher visible (press Ctrl+L once) so they can click through options
2. **Test in context**: Switch logos while viewing the full landing page to see how they look
3. **Dark mode support**: If you have dark mode variants, name them `logo-1-dark.jpg`, `logo-2-dark.jpg` etc.
4. **Different file names?**: Update the `file` path in `logos-config.json`

---

## 🐛 Troubleshooting

### Logo not showing up?
- Check the file name matches exactly (e.g., `logo-1.jpg` not `Logo-1.JPG`)
- Ensure file is in `/public/logos/` directory
- Try refreshing the page after uploading

### Switcher button not visible?
- Press **Ctrl+L** to toggle visibility
- Check browser console for any errors

### Logo looks cut off?
- Adjust the image dimensions (200-400px width recommended)
- Ensure aspect ratio is maintained

---

## ✨ Current Features

- ✅ Live logo preview in header
- ✅ 10 logo slots available
- ✅ Text logo (current "CGT Brain") as option 1
- ✅ Keyboard shortcut to show/hide
- ✅ Thumbnail previews in dropdown
- ✅ Automatic persistence (remembers selection)
- ✅ Dark mode compatible
- ✅ Responsive design

---

## 📝 Next Steps

1. Upload your 7-10 logo JPG files to `/public/logos/`
2. Press Ctrl+L on the landing page
3. Click through your logo options
4. Pick your favorite!

Enjoy presenting your logos! 🎉
