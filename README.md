# Dungeons & Dragons Adventure — Gemini Live Agent Demo

A production-style, multimodal D&D-inspired web experience built with React + Gemini.
Players create a party, make tactical turn-based choices, and generate evolving story scenes with matching AI visuals.

> Track target: **Creative Storyteller** (Gemini Live Agent Challenge)

---

## Overview

This project combines:

- **Narrative game loop** (stateful story, branching choices, per-player stats)
- **Multimodal generation** (text + image + optional video plan)
- **Speed-based initiative** (high agility acts more frequently)
- **Cloud backend path** (Cloud Run + Gemini endpoints)
- **Competition-ready packaging** (architecture, checklist, proof docs)

---

## Core Features

### Gameplay
- Party creation (1–8 players)
- Turn-based story progression
- Agility-based timeline turn order (not just round-robin)
- Dead-player handling (moved to bottom, marked dead, no actions until revival)
- Revival rule support with costs/tradeoffs

### AI Systems
- Gemini-driven scene/story generation
- Scene image generation tied to action context + character consistency
- Cinematic plan generation from session logs
- Live API probe endpoint on backend (`/api/live/session`)

### UX & Reliability
- API key onboarding status + guided setup
- One-click demo party fast start
- Contextual SFX + BGM controls (mute/volume/persistence)
- Request timeout/retry handling
- Startup/runtime fallback UI to avoid blank-screen failures

---

## Architecture

- **Frontend:** React 19 + TypeScript + Vite
- **AI SDK:** `@google/genai`
- **Backend:** Express (Node)
- **Cloud:** Google Cloud Run
- **Deployment:** Vercel (frontend)

Detailed diagrams and docs:
- `docs/architecture.md`
- `docs/competition-requirement-matrix.md`

---

## Quick Start

### Prerequisites
- Node.js 18+
- Gemini API key

### Install

```bash
npm install
```

### Configure env
Create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
# optional cloud backend routing
VITE_BACKEND_URL=https://your-cloud-run-service-url
```

### Run locally (recommended)

```bash
npm run dev:local
```

Open:

- `http://127.0.0.1:5173/`

### Build

```bash
npm run build
```

---

## Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Cloud Run)

From `backend/`:

```bash
PROJECT_ID=<your-project> REGION=us-central1 SERVICE_NAME=dnd-gemini-backend GEMINI_API_KEY='<your_key>' ./deploy-cloud-run.sh
```

Helper docs/scripts:
- `backend/deploy-cloud-run.sh`
- `scripts/setup-gcloud-mac.sh`
- `docs/cloud-deploy-now.md`
- `docs/gcp-proof-checklist.md`

---

## Competition / Submission Docs

- `docs/submission-checklist.md`
- `docs/devpost-submission-draft.md`
- `docs/competition-requirement-matrix.md`
- `docs/demo-checklist.md`
- `docs/live-adk-implementation-plan.md`

---

## Media & Attribution

- Audio attribution: `docs/audio-attribution.md`
- You can add screenshots later in this section:
  - `docs/screenshots/cover.png`
  - `docs/screenshots/gameplay.png`
  - `docs/screenshots/initiative.png`

---

## Repository Structure

```txt
.
├── App.tsx
├── index.tsx
├── components/
├── services/
├── utils/
├── backend/
├── docs/
├── public/
└── scripts/
```

---

## Notes

- Keep API keys out of source control.
- If local `localhost` behaves oddly, use `127.0.0.1:5173`.
- For startup issues, hard refresh (`Cmd+Shift+R`) to clear stale cached bundles.
