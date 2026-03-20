# D&D Gemini Backend (Cloud Run target)

This backend is the Google Cloud deployment path for Gemini Live Agent Challenge compliance.

## Endpoints

- `GET /health` — service health check
- `GET /api/auth/status` — public: Resend on/off, magic-link base URL, TTLs (for the login UI)
- `POST /api/auth/register` — user registration (new users get a 6-digit code email; duplicate email gets a magic sign-in link)
- `POST /api/auth/magic-link/consume` — exchange one-time magic-link token for session JWT
- `POST /api/auth/login` — user login (returns Bearer token)
- `POST /api/campaigns` — create campaign + initial state (auth)
- `GET /api/campaigns` — list my campaigns (auth)
- `GET /api/campaigns/continue/latest` — resume latest active campaign (auth)
- `POST /api/campaigns/:id/state` — save snapshot/state for reconnect (auth)
- `POST /api/campaigns/:id/turns` — append turn + dice + action events (auth)
- `GET /api/campaigns/:id/replay` — fetch replay logs (turns/dice/events) (auth)
- `POST /api/rooms` — create multiplayer room + invite code (auth)
- `POST /api/rooms/join` — join room via invite code (auth)
- `GET /api/rooms/:id/messages` — room chat + DM notes (auth)
- `POST /api/rooms/:id/messages` — send room chat / DM notes (auth)
- `POST /api/story/next` — server-side Gemini text generation
- `POST /api/live/session` — Gemini Live API probe/session bootstrap (text modality test)
- `POST /api/tts` — server-side TTS gateway (CosyVoice/OpenAI with fallback)
- `GET /api/compliance/status` — challenge compliance status snapshot

## Local run

Copy `backend/.env.example` → `backend/.env` and set at least `RESEND_API_KEY` (real email) and `DND_APP_SECRET` (any long random string). SQLite defaults to `backend/dnd-local.sqlite` next to `server.mjs` unless `DND_DB_PATH` is set.

**So every new user receives verification email:** follow **`EMAIL-SETUP-ALL-USERS.md`** (Resend + optional SMTP for addresses Resend test mode blocks). **`EMAIL.md`** has provider-specific troubleshooting.

```bash
cd backend
npm install
npm run dev
```

See `EMAIL.md` for Resend and `DND_PUBLIC_APP_URL` (magic links must point at your real frontend in production).

## Quick auth test

```bash
# register
curl -s http://localhost:8080/api/auth/register -H 'content-type: application/json' -d '{"email":"demo@local.test","name":"Demo","password":"Pass123!"}'

# login
TOKEN=$(curl -s http://localhost:8080/api/auth/login -H 'content-type: application/json' -d '{"email":"demo@local.test","password":"Pass123!"}' | jq -r .token)

# create campaign
curl -s http://localhost:8080/api/campaigns -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"title":"Local Campaign"}'
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
