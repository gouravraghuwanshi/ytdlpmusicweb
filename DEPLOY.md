# AudioStream Deployment Guide

## Complete App (UI + Backend)
**Recommended: Render or Railway**

### Render:
1. Zip entire `ytdlpweb` folder
2. Upload to render.com
3. Auto-deploys with render.yaml

### Railway:
1. Upload folder to railway.app
2. Uses Procfile for deployment

## UI Only Deployment
**For static hosting:**

### Netlify:
1. Zip `static` folder contents
2. Drag & drop to netlify.com
3. Instant deployment

### Vercel:
1. Zip `static` folder contents  
2. Upload to vercel.com
3. Uses vercel.json config

### GitHub Pages:
1. Push `static` contents to GitHub repo
2. Enable Pages in repo settings
3. Uses 404.html for routing

## Files Ready:
- ✅ render.yaml (Render config)
- ✅ Procfile (Railway config)  
- ✅ netlify.toml (Netlify config)
- ✅ vercel.json (Vercel config)
- ✅ _redirects (Netlify SPA routing)
- ✅ 404.html (GitHub Pages routing)

Choose your preferred platform and upload!