/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional: pre-fill login/register email locally (set in `.env`, never commit real addresses). */
  readonly VITE_PREFILL_AUTH_EMAIL?: string;
}
