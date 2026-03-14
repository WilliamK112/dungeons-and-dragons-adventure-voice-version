# D&D Gemini Backend (Cloud Run target)

This backend is the Google Cloud deployment path for Gemini Live Agent Challenge compliance.

## Endpoints

- `GET /health` — service health check
- `POST /api/story/next` — server-side Gemini text generation
- `POST /api/live/session` — Gemini Live API probe/session bootstrap (text modality test)
- `POST /api/tts` — server-side TTS gateway (CosyVoice/OpenAI with fallback)
- `GET /api/compliance/status` — challenge compliance status snapshot

## Local run

```bash
cd backend
npm install
GEMINI_API_KEY=your_key_here OPENAI_API_KEY=your_openai_key_here COSYVOICE_BASE_URL=http://127.0.0.1:9880 TTS_PROVIDER=cosyvoice TTS_FALLBACK_PROVIDER=openai npm run dev
```

## Deploy to Cloud Run

```bash
gcloud run deploy dnd-gemini-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY,OPENAI_API_KEY=YOUR_OPENAI_KEY
```

After deploy, use the Cloud Run URL from the frontend for server-side generation.
