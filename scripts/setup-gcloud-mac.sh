#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install from https://brew.sh"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Installing Google Cloud SDK..."
  brew install --cask google-cloud-sdk
else
  echo "gcloud already installed"
fi

echo "Run these next commands manually:"
echo "  gcloud auth login"
echo "  gcloud config set project <YOUR_PROJECT_ID>"
echo "  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com"
