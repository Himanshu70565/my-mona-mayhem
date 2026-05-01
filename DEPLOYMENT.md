# Deployment Guide for Mona Mayhem

This project is now configured for deployment on **Vercel** for the interactive Astro application and **GitHub Pages** for static documentation.

## Vercel Deployment (Astro App)

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repository connected to Vercel

### Deployment Steps

1. **Connect Repository to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Search for `my-mona-mayhem` and select it
   - Click "Import"

2. **Configure Project**
   - Framework: Astro (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.vercel/output`
   - Environment: Leave empty (no env vars needed for demo)
   - Click "Deploy"

3. **Access Your App**
   - Vercel will automatically deploy on every push to `main`
   - Your app will be live at: `https://my-mona-mayhem.vercel.app`
   - Production domain can be customized in Vercel Settings

### Local Deployment Testing

To test locally (requires Node.js ≥22.12.0):
```bash
npm run build        # Build for production
npm run preview      # Preview the build locally
```

## GitHub Pages Deployment (Documentation)

### Current Status
✅ **Already Deployed** at: https://himanshu70565.github.io/my-mona-mayhem/

The documentation and workshop content are automatically deployed via GitHub Actions whenever code is pushed to `main`.

**Files deployed:**
- Static landing page (`docs/`)
- Workshop content (`workshop/`)
  - English
  - Spanish (`es`)
  - Portuguese (`pt_BR`)

### Triggering Manual Deployment

```bash
gh workflow run deploy.yml --ref main
```

## Project Structure

```
├── src/
│   └── pages/
│       ├── index.astro          # Main app page with UI improvements
│       └── api/
│           └── contributions/[username].ts  # API route for GitHub data
├── docs/                         # Static documentation site
├── workshop/                     # Interactive workshop content
├── astro.config.mjs             # Astro + Vercel configuration
├── vercel.json                  # Vercel deployment config
└── package.json                 # Dependencies (Astro 6.2.1 + Vercel adapter)
```

## Key Configuration Files

### `astro.config.mjs`
```javascript
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
});
```

### `vercel.json`
Specifies build commands and framework settings for Vercel.

## Recent Changes

### Commit History
- **74166d2**: Switch from Node adapter to Vercel adapter (Astro 5→6)
- **47e937d**: Add vercel.json configuration
- **34e0d62**: UI improvements with responsive design & accessibility

## Technology Stack

- **Framework**: Astro 6.2.1
- **Hosting**: Vercel (app) + GitHub Pages (docs)
- **Adapter**: @astrojs/vercel@10.0.6 (serverless)
- **TypeScript**: Strict mode enabled

## Troubleshooting

### Build fails with Node version error
- Vercel uses Node.js 20+ by default
- No action needed; deployment will work on Vercel servers

### App not updating after push
- Check GitHub Action logs: https://github.com/Himanshu70565/my-mona-mayhem/actions
- Vercel auto-deploys; check deployment logs at vercel.com

### Preview/Build fails locally
- Upgrade Node.js to ≥22.12.0
- Run `npm install` to sync dependencies

## Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs/frameworks/astro
- Astro Deployment: https://docs.astro.build/en/guides/deploy/
- GitHub Actions: https://github.com/Himanshu70565/my-mona-mayhem/actions
