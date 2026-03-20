# Devpost Submission Draft — Gemini Live Agent Challenge

Track: **Creative Storyteller**

## Project summary
Dungeons & Dragons Adventure is a multimodal storytelling app where users create characters, play branching narrative turns, and generate scene media with Gemini. It combines narrative progression, image generation, and video planning in a cohesive fantasy experience.

## Technologies used
- Frontend: React + TypeScript + Vite
- AI SDK: `@google/genai`
- Backend: Express (Node.js)
- Cloud hosting: **Google Cloud Run** (`dnd-gemini-backend`)
- Frontend hosting: Vercel

## Mandatory requirement mapping
- Gemini model usage: ✅
- Built with Google GenAI SDK or ADK: ✅ (Google GenAI SDK)
- Gemini Live API or ADK: ✅ (`POST /api/live/session` in backend)
- Uses Google Cloud service: ✅ (Cloud Run)

## Google Cloud proof
- Project ID: `gen-lang-client-0096929751`
- Region: `us-central1`
- Cloud Run URL: `https://dnd-gemini-backend-1061476694622.us-central1.run.app`
- Health endpoint proof: `/health`
- Compliance endpoint proof: `/api/compliance/status`
- Live endpoint proof: `/api/live/session`

## Public repository
- Repo: `https://github.com/WilliamK112/dungeons-and-dragons-adventure-voice-version`

## Repro steps (short)
1. Install deps: `npm install`
2. Configure `.env.local` with `GEMINI_API_KEY` and optional `VITE_BACKEND_URL`
3. Run: `npm run dev`
4. For cloud backend: deploy `backend/` to Cloud Run and set `VITE_BACKEND_URL`

## Architecture reference
- `docs/architecture.md`

## Demo checklist reference
- `docs/demo-checklist.md`

## Suggested final attachments for Devpost
1. Architecture diagram export image (from `docs/architecture.md`)
2. <4 minute demo video
3. Cloud proof clip/screenshots (Cloud Run service + endpoint checks)
