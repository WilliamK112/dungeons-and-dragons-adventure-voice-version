# D&D Gemini Backend (Cloud Run target)

This backend is the Google Cloud deployment path for Gemini Live Agent Challenge compliance.

## Endpoints

- `GET /health` — service health check
- `POST /api/story/next` — server-side Gemini text generation
- `POST /api/live/session` — Gemini Live API probe/session bootstrap (text modality test)
- `GET /api/compliance/status` — challenge compliance status snapshot

## Local run

```bash
cd backend
npm install
GEMINI_API_KEY=your_key_here npm run dev
```

## Deploy to Cloud Run

```bash
gcloud run deploy dnd-gemini-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

After deploy, use the Cloud Run URL from the frontend for server-side generation.
