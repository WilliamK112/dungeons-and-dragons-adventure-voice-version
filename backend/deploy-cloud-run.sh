#!/usr/bin/env bash
set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud not found. Install it first."
  exit 1
fi

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-dnd-gemini-backend}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Missing PROJECT_ID env var"
  exit 1
fi

if [[ -z "$GEMINI_API_KEY" ]]; then
  echo "Missing GEMINI_API_KEY env var"
  exit 1
fi

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY" \
  --format='value(status.url)'
