/**
 * Base URL for the Node backend (no trailing slash).
 * - **Development (`npm run dev`):** always `''` — browser calls same-origin `/api/...` and Vite proxies to `127.0.0.1:8080`. Ignores `VITE_BACKEND_URL` so `.env` pointing at localhost cannot bypass the proxy.
 * - **Production:** use `VITE_BACKEND_URL` when set (e.g. Vercel → HTTPS API). Otherwise `''` (same-origin `/api` only if you add host rewrites).
 */
export function getBackendBaseUrl(): string {
  if (import.meta.env.DEV) return '';
  const v = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || '';
  return v ? v.replace(/\/$/, '') : '';
}
