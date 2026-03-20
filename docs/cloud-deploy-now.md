# Cloud Deploy Now (Terminal Checklist)

Use this exact order to finish Google Cloud proof quickly.

1. `gcloud auth login`
2. `gcloud config set project gen-lang-client-0096929751`
3. `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com`
4. Deploy backend (pick one):
   - Direct env var:
     `cd backend && PROJECT_ID=gen-lang-client-0096929751 REGION=us-central1 SERVICE_NAME=dnd-gemini-backend GEMINI_API_KEY='<YOUR_KEY>' ./deploy-cloud-run.sh`
   - Secret Manager (recommended):
     `printf '%s' '<YOUR_KEY>' | gcloud secrets create gemini-api-key --data-file=- --project gen-lang-client-0096929751 || printf '%s' '<YOUR_KEY>' | gcloud secrets versions add gemini-api-key --data-file=- --project gen-lang-client-0096929751`
     `cd backend && PROJECT_ID=gen-lang-client-0096929751 REGION=us-central1 SERVICE_NAME=dnd-gemini-backend GEMINI_SECRET_NAME=gemini-api-key ./deploy-cloud-run.sh`
5. Copy returned Cloud Run URL (e.g. `https://dnd-gemini-backend-xxxx-uc.a.run.app`)
6. Verify proof endpoints:
   - `curl -s <URL>/health`
   - `curl -s <URL>/api/compliance/status`
7. Add to `.env.local`:
   - `VITE_BACKEND_URL=<URL>`
8. Redeploy frontend on Vercel.

## What to paste back to assistant

- Cloud Run URL
- Output of `/health`
- Output of `/api/compliance/status`
