# NeuroRecover

Camera-based hand rehabilitation for stroke recovery.

NeuroRecover turns repetitive physiotherapy into adaptive games using your device camera. It tracks 21 hand landmarks in real time and calculates useful recovery metrics such as range of motion, tremor, smoothness, and reaction time.

## Documentation

- User guide: `docs/USER_GUIDE.md`
- Therapist workflow: `docs/THERAPIST_WORKFLOW.md`
- Vercel deployment guide: `docs/VERCEL_DEPLOYMENT.md`
- Web app developer notes: `web-app/README.md`

## Features

- Three exercises: Virtual Piano, Bubble Pop, Cup Grasp
- Session history with weekly goals and streak tracking
- Progress charts and PDF session export
- Local-first privacy model (all data in browser storage)

## Local development

```bash
cd web-app
npm install
npm run dev
```

Open the URL shown in the terminal and allow camera access when prompted.

## Build for production

```bash
cd web-app
npm run build
```

The production bundle is generated in `web-app/dist`.

## Deploy on Vercel

This repository is preconfigured with `vercel.json` for deploying the `web-app` subfolder.

Quick steps:

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repository in Vercel.
3. Keep the default project settings (Vercel will use `vercel.json`).
4. Deploy.

For full instructions and troubleshooting, see `docs/VERCEL_DEPLOYMENT.md`.

## License

MIT
