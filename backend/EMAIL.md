# Real email (verification & password reset)

This app is designed so users **enter their own email** and **receive a real verification code** in that inbox. That only works when the backend can send outbound email.

**Without `RESEND_API_KEY`**, the backend **does not send real email** — it only logs `[EMAIL-FALLBACK]` in the server terminal (fine for dev, not OK for real users).

**For production or any time you need real inboxes**, configure Resend below. When the server starts, you should see:  
`[email] Resend ENABLED — real messages to user inboxes`.

Use [Resend](https://resend.com) (already integrated in `server.mjs`). You can also add **SMTP** so that when Resend’s test sender **refuses a recipient** (403), the server automatically tries **SMTP** next — that lets **any email address** receive codes as long as your SMTP account is allowed to send to them (e.g. Gmail SMTP, SendGrid SMTP, your own mail server).

## SMTP (optional — “every email” when Resend is in test mode)

Set one of:

- **`DND_SMTP_URL`** — full connection string, e.g. `smtps://user:pass@smtp.example.com:465`
- Or discrete: **`DND_SMTP_HOST`**, **`DND_SMTP_PORT`** (default `587`), **`DND_SMTP_USER`**, **`DND_SMTP_PASS`**, optional **`DND_SMTP_SECURE=1`** for SSL.

Set a real **From** address your SMTP provider allows:

- **`DND_SMTP_FROM`** or **`DND_FROM_EMAIL`** (e.g. `you@gmail.com` with Gmail app password, or `noreply@yourdomain.com`).

**`DND_EMAIL_PROVIDER`** (default **`auto`**):

- `auto` — send via Resend first; if that fails (403/422/429 or network), try SMTP.
- `resend` — Resend only (SMTP still used as backup on 403 if SMTP is configured).
- `smtp` — SMTP only.

## 1. Get an API key

1. Sign up at https://resend.com  
2. **API Keys** → Create an API key (starts with `re_`)

## 2. Configure the backend

Create `backend/.env` (copy from `.env.example`):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

Optional (recommended once you add your own domain in Resend):

```env
DND_FROM_EMAIL=notifications@your-verified-domain.com
```

If you **omit** `DND_FROM_EMAIL`, the server defaults to **`onboarding@resend.dev`**. On many Resend accounts this **test sender can only deliver to one address** — usually the email tied to your Resend login (Resend states this in the error). To send verification codes and magic links to **any** address (e.g. Gmail), you must **verify a domain** at [resend.com/domains](https://resend.com/domains) and set:

```env
DND_FROM_EMAIL=noreply@your-verified-domain.com
```

Until then, use that **allowed** address in the app for testing, or use Resend’s sink `delivered@resend.dev` for API smoke tests.

## 3. Restart the backend

```bash
cd backend && npm run dev
```

## 4. Verify in the app

Click **Send Code** again. The API response includes `emailDelivery: "resend"` and the user should see the message in their mailbox (check spam).

## Production (Vercel + Cloud Run)

Set the same variables on your **deployed** backend (e.g. Cloud Run env vars), not only locally.

Set **`DND_PUBLIC_APP_URL`** to the **frontend** origin where the game loads (e.g. `https://your-app.vercel.app`, no trailing slash). This is used when someone tries to **register with an email that already exists**: the backend emails a **one-time sign-in link** (`/#magic=...`) instead of returning “Email already exists” with no mail. New accounts still get the **6-digit code** as usual.

**Security:** Passwords are **never** sent by email. The link proves access to the inbox and issues a normal session token (same as login).

The login page calls **`GET /api/auth/status`** to show whether Resend is configured and which **magic-link base URL** is active.

Verification, password-reset, and magic-link messages include a simple **HTML** body in addition to plain text when using Resend.

## QQ Mail (`@qq.com`) — real delivery when Resend blocks the recipient

Resend’s **test sender** (`onboarding@resend.dev`) often returns **403** for addresses it is not allowed to mail (including many `@qq.com` inboxes) until you **verify your own domain** in Resend. Two ways to get codes in a QQ inbox:

1. **Recommended long-term:** Add and verify a domain at [resend.com/domains](https://resend.com/domains), then set `DND_FROM_EMAIL=noreply@your-verified-domain.com`. Resend can then deliver to `@qq.com` and other addresses.

2. **Use Tencent’s SMTP** (send through QQ’s servers so the message lands in the same mailbox system). In QQ Mail on the web: **Settings → Account → POP3/IMAP/SMTP** — enable SMTP and create an **authorization code** (not your login password). Then in `backend/.env`:

```env
DND_EMAIL_PROVIDER=auto
RESEND_API_KEY=re_...   # optional; if Resend fails with 403, auto tries SMTP next

DND_SMTP_HOST=smtp.qq.com
DND_SMTP_PORT=465
DND_SMTP_SECURE=1
DND_SMTP_USER=you@qq.com
DND_SMTP_PASS=your-smtp-authorization-code
DND_SMTP_FROM=you@qq.com
```

Restart the backend, register again, and check spam. You can use **`DND_EMAIL_PROVIDER=smtp`** to skip Resend entirely while testing QQ-only delivery.

## Local dev without inbox access

Set **`DND_DEV_EXPOSE_CODE_IN_API=1`** in `backend/.env` (never in production). When email cannot be delivered, API responses include **`devVerificationCode`** or **`devMagicLinkUrl`** so the UI can fill the code in for you.

## Troubleshooting

- **`Email send failed (403): ... only send testing emails to your own email address (...)`**  
  Your API key works, but Resend is restricting **who can receive** mail while you use the default test setup. **Fix:** verify your domain (link above) and set `DND_FROM_EMAIL` to that domain — then you can send to `ckang2435@gmail.com` and anyone else. **Short-term test:** register / send code only to the exact address Resend allows (often your university/work email shown in the error).

- **QQ / 163 / corporate inboxes never get the mail (403 in logs, UI shows dev code):** Resend test mode often **refuses `@qq.com`** and similar until you add a **verified sending domain**, or you route mail through **SMTP** (see **QQ Mail** section above). Check the backend terminal for `[EMAIL-FALLBACK]` and the exact Resend error.

- **App no longer shows a hard error in local dev:** if Resend returns **403 / 422 / 429**, the backend (when **not** in `NODE_ENV=production`, or when `DND_EMAIL_FALLBACK_ON_RESEND_ERROR=1`) **logs the same message to the terminal** as `[EMAIL-FALLBACK]` and returns success with `resendFallback: true`, so you can copy the **code or magic link** from the server log. **Production** defaults to failing loud unless you set `DND_EMAIL_FALLBACK_ON_RESEND_ERROR=1` (emergency only) or fix the domain.

- **`Email send failed: ...`** (other statuses): wrong `from` address, or domain not verified in Resend.

- **Still `[EMAIL-FALLBACK]` in terminal:** `RESEND_API_KEY` is missing or the server was not restarted after adding `.env`.
