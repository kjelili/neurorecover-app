# Web App (NeuroRecover)

This is the frontend app for NeuroRecover, built with React + TypeScript + Vite.

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build in `dist`
- `npm run preview`: preview the production build
- `npm run lint`: run ESLint

## Local development

```bash
npm install
npm run dev
```

Then open the local URL (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Notes

- This app uses browser camera access for hand tracking.
- Most app data is persisted in browser `localStorage`.
- Main deployment target is Vercel using repository-root `vercel.json`.
