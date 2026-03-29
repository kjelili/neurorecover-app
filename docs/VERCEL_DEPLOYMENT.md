# Deploy NeuroRecover to Vercel

This repository includes a root `vercel.json` that deploys the app from `web-app`.

## What is already configured

- Install command: `npm --prefix web-app install`
- Build command: `npm --prefix web-app run build`
- Output directory: `web-app/dist`
- SPA rewrite: all routes are rewritten to `index.html` for React Router

## Prerequisites

- A GitHub, GitLab, or Bitbucket repository containing this project
- A Vercel account

## Deployment steps

1. Push your latest code to your git repository.
2. Open [https://vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. In project settings, keep defaults (Vercel reads `vercel.json`).
5. Click **Deploy**.

After deployment, open the generated Vercel URL and test:

- Home page loads
- `/app` route loads
- Game routes load (`/app/piano`, `/app/bubbles`, `/app/grab-cup`)
- Camera permission prompt appears and works over HTTPS

## Redeploy after updates

Every push to the connected branch triggers a new build automatically.

To manually redeploy:

1. Open the project in Vercel.
2. Go to **Deployments**.
3. Click **Redeploy** on the latest deployment.

## Environment variables

Current app build does not require environment variables for core functionality.

If you add variables later:

1. Go to Project Settings -> Environment Variables.
2. Add variables for Production/Preview/Development as needed.
3. Redeploy.

## Troubleshooting

## Build fails with TypeScript or lint errors

- Run locally:

```bash
cd web-app
npm install
npm run build
```

- Fix errors and push again.

## App loads but routes 404 on refresh

- Confirm `vercel.json` is in repository root.
- Confirm `rewrites` section still points all routes to `/index.html`.

## Camera does not start on deployed URL

- Ensure you are on the HTTPS Vercel URL (not HTTP).
- Check browser site permission for camera.
- Confirm no other app is blocking camera access.

## Optional: deploy with Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```
