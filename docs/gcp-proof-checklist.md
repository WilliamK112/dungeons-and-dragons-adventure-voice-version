# Google Cloud Deployment Proof Checklist

Use this file as evidence prep for Devpost submission.

## Required proof captures

1. **Cloud Run service detail page screenshot**
   - Include service name, region, and latest revision status
2. **Cloud Run URL health check**
   - Browser or terminal showing `/health` returns `ok: true`
3. **Repo evidence link**
   - `backend/server.mjs`
   - `backend/Dockerfile`
   - `backend/deploy-cloud-run.sh`
   - `docs/cloud-deploy-now.md`
4. **Frontend backend routing proof**
   - `.env.local` contains `VITE_BACKEND_URL`
   - `services/geminiService.ts` shows backend routing path

## Copy/paste evidence block for submission

- Cloud Run service URL: 
- Region: us-central1
- Project ID: gen-lang-client-0096929751
- Screenshot links: 
- Code links:
  - backend/server.mjs
  - backend/Dockerfile
  - backend/deploy-cloud-run.sh
  - services/geminiService.ts
