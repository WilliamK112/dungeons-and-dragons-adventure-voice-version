# Dungeons & Dragons Adventure — Gemini Live Agent Demo

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb)](#architecture)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20Express-3c873a)](#architecture)
[![Cloud](https://img.shields.io/badge/Cloud-Google%20Cloud%20Run-4285F4)](#deployment)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A production-style, multimodal D&D-inspired web app where players build a party, make tactical choices, and drive an evolving AI-generated adventure with matching visuals.

> Target category: **Creative Storyteller** (Gemini Live Agent Challenge)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Gameplay Mechanics](#gameplay-mechanics)
- [Competition Submission Docs](#competition-submission-docs)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Gameplay
- Party creation (1–8 players)
- Turn-based narrative progression
- Agility-based initiative timeline (faster characters act more often)
- Branching decisions + custom free-text actions
- Dead-player logic (dead players moved to bottom, marked, skipped until revived)

### AI Systems
- Gemini-powered story generation
- Scene image generation with action-context alignment
- Cinematic video-plan generation from story logs
- Live API probe endpoint on backend (`/api/live/session`)

### UX & Reliability
- API-key onboarding state and guidance
- One-click **Demo Party** fast start
- Continuous tense background music + contextual SFX
- Timeout/retry handling for backend actions
- Startup/runtime fallback UI to avoid blank-screen failure

---

## Architecture

- **Frontend:** React 19, TypeScript, Vite
- **Animation/UI:** Motion, Lucide React
- **AI SDK:** `@google/genai`
- **Backend:** Node + Express
- **Cloud Backend:** Google Cloud Run
- **Frontend Hosting:** Vercel

See also:
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

### Run locally (recommended)

```bash
npm run dev:local
```

Open:

- `http://127.0.0.1:5173/`

### Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create `.env.local` in the project root:

```bash
GEMINI_API_KEY=your_key_here
# Optional: route game command calls through deployed cloud backend
VITE_BACKEND_URL=https://your-cloud-run-service-url
# Optional TTS routing preference (default set to cosyvoice in app service call)
VITE_TTS_PROVIDER=cosyvoice
VITE_TTS_FALLBACK_PROVIDER=openai
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

Deployment helpers:
- `backend/deploy-cloud-run.sh`
- `scripts/setup-gcloud-mac.sh`
- `docs/cloud-deploy-now.md`
- `docs/gcp-proof-checklist.md`

---

## Gameplay Mechanics

- **Initiative:** speed-based timeline (not simple round-robin)
- **Action outcomes:** d20-style roll logging (`[ROLL] ...`)
- **Action economy labels:** `[Action]`, `[Move]`, `[Bonus]`, `[Reaction]`
- **Death state:** dead players are visually marked and removed from actionable turn flow
- **Revival:** possible via explicit resurrection attempts with cost/tradeoff

---

## Competition Submission Docs

- `docs/submission-checklist.md`
- `docs/devpost-submission-draft.md`
- `docs/competition-requirement-matrix.md`
- `docs/demo-checklist.md`
- `docs/live-adk-implementation-plan.md`

---

## Troubleshooting

- If local `localhost` behaves oddly, use `http://127.0.0.1:5173/`.
- If the page looks blank/stale, hard refresh (`Cmd + Shift + R`).
- Ensure `GEMINI_API_KEY` is set if story/image generation fails.
- Keep keys out of Git.

---

## Roadmap

- Expand combat fidelity (conditions, richer AC/DC semantics)
- Add class-specific abilities/resources with stronger tactical identity
- Improve observability for cloud runtime and gameplay diagnostics

---

## Contributing

PRs and issue reports are welcome.

Suggested contribution flow:
1. Fork + create feature branch
2. Make scoped changes
3. Run:
   ```bash
   npm run lint
   npm run build
   ```
4. Open PR with before/after notes

---

## Media & Attribution

- Audio attribution: `docs/audio-attribution.md`
- Screenshot placeholders (add later):
  - `docs/screenshots/cover.png`
  - `docs/screenshots/gameplay.png`
  - `docs/screenshots/initiative.png`

---

## License

MIT (or your preferred license)
