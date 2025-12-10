# PWA Icons

This directory contains the Progressive Web App (PWA) icons for the Sauna Reservation System.

## Icon Design

The icon features:

- **Gradient blue background** (#0070f3 to #0052cc)
- **Hot stones** representing the sauna
- **Rising steam waves** symbolizing the sauna experience
- **Rounded corners** for modern aesthetic

## Generated Sizes

All icons are generated from the source SVG at `/public/icon-source.svg`:

- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px (Apple Touch Icon)
- 192x192px (Primary PWA icon)
- 384x384px
- 512x512px (Large PWA icon)

## Regenerating Icons

If you need to modify the icon design:

1. Edit `/public/icon-source.svg`
2. Run: `npm run icons:generate`
3. Rebuild and redeploy

## Files

- **icon-source.svg** - Source SVG file (512x512)
- **icon-{size}.png** - Generated PNG icons in various sizes
- **README.md** - This file

## Usage

Icons are automatically referenced in:

- `/public/manifest.json` - PWA manifest
- `/src/app/layout.tsx` - Next.js metadata

## Browser Support

These icons support:

- ✅ Android (Chrome, Firefox, Samsung Internet)
- ✅ iOS (Safari, Chrome, Firefox)
- ✅ Desktop PWAs (Chrome, Edge, Safari)
- ✅ Windows PWAs
