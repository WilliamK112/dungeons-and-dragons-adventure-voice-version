#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-gen-lang-client-0096929751}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-dnd-gemini-backend}"

cat <<EOF
Step 1: Authenticate
  gcloud auth login

Step 2: Set project
  gcloud config set project ${PROJECT_ID}

Step 3: Deploy backend (requires GEMINI_API_KEY env var)
  cd backend
  PROJECT_ID=${PROJECT_ID} REGION=${REGION} SERVICE_NAME=${SERVICE_NAME} GEMINI_API_KEY='<YOUR_KEY>' ./deploy-cloud-run.sh

Step 4: Verify deployed service
  curl -s https://<your-service-url>/health
  curl -s https://<your-service-url>/api/compliance/status

Step 5: Wire frontend
  echo "VITE_BACKEND_URL=https://<your-service-url>" >> .env.local

EOF
