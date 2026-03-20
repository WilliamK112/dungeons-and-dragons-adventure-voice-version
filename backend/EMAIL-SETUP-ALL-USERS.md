# Email setup so every new user can receive codes

The backend sends a 6-digit code on **register** and can send **magic links** / **reset codes** the same way. There is **no per-user allowlist** in the app — delivery depends only on your **mail provider** configuration.

## Recommended: `DND_EMAIL_PROVIDER=auto` (default)

1. **Resend** tries first (`RESEND_API_KEY` + `DND_FROM_EMAIL` or `onboarding@resend.dev`).
2. If Resend returns **403** (blocked recipient), **SMTP** runs next — so **any** address your SMTP can reach gets mail.

Fill **both** Resend and SMTP for the best experience: Resend handles most inboxes when your domain is verified; SMTP covers `@qq.com` and others while Resend is still on the test sender.

## Checklist (local)

| Step | What to do |
|------|------------|
| 1 | Copy `backend/.env.example` → `backend/.env` if you don’t have one. |
| 2 | Set `RESEND_API_KEY` from [resend.com/api-keys](https://resend.com/api-keys). |
| 3 | **Either** verify a domain in Resend and set `DND_FROM_EMAIL=noreply@your-domain.com` **or** set **Tencent SMTP** (`DND_SMTP_*`) with a real **QQ authorization code** (not the login password). |
| 4 | Set `DND_EMAIL_PROVIDER=auto` (already the default if unset). |
| 5 | Set `DND_PUBLIC_APP_URL` to your real frontend (e.g. `https://your-app.vercel.app`) for production. |
| 6 | Restart: `cd backend && npm run dev`. Confirm `GET /api/auth/status` shows `"resend": true` and `"smtp": true` when SMTP is configured. |
| 7 | Production: **do not** set `DND_DEV_EXPOSE_CODE_IN_API=1` (codes must not appear in API JSON). |

## Checklist (hosted API, e.g. Cloud Run)

Set the **same** variables as secrets / env vars on the service:

- `RESEND_API_KEY`
- `DND_APP_SECRET` (strong random)
- `DND_PUBLIC_APP_URL` (your Vercel or site URL)
- Optional: `DND_FROM_EMAIL` after domain verification
- Optional: full `DND_SMTP_*` block for QQ/other SMTP

Redeploy after changing env.

## Verify delivery

```bash
curl -s http://localhost:8080/api/auth/status
```

After a test **Send code**, a successful path shows `"emailDelivery":"resend"` or `"emailDelivery":"smtp"` (not `"console"`).

More detail: **`EMAIL.md`** (Resend + SMTP + troubleshooting). **Gmail inboxes:** **`GMAIL-DELIVERY.md`**.
