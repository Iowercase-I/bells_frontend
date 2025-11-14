# Cloudflare Pages - React + Vite Setup

## Build Configuration

**Build command:**
```
npm run build
```

**Output directory:**
```
dist
```

**Root directory:**
```
/ 
```
(Leave empty - you're uploading the entire frontend folder)

## What Changed

- ✅ Migrated from Next.js to React + Vite
- ✅ Simpler build process
- ✅ No static export issues
- ✅ Works perfectly with Cloudflare Pages

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

The `dist` folder contains everything you need to deploy.

## Benefits

1. **No hydration issues** - Pure client-side React
2. **Faster builds** - Vite is much faster than Next.js
3. **Simpler deployment** - Just upload the `dist` folder
4. **Better compatibility** - Works with any static hosting

