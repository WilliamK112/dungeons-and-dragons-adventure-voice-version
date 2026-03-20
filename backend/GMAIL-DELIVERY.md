# Receiving codes at Gmail (`@gmail.com`)

Your API response shows `"emailDelivery": "console"` and `"resendFallback": true` when **Resend rejects the send** (common with **`onboarding@resend.dev`**) **and** **SMTP backup fails** (wrong/missing password).

## Fix 1 — Resend + your own domain (best for production)

1. Add a domain at [resend.com/domains](https://resend.com/domains) and complete DNS.
2. In `backend/.env` set:
   ```env
   DND_FROM_EMAIL=noreply@your-verified-domain.com
   ```
3. Restart the backend. Resend can then deliver to **any** address, including Gmail.

## Fix 2 — Gmail SMTP (good for quick tests to your own Gmail)

Send **through Google** so delivery to `you@gmail.com` works without a custom domain.

1. Google Account → **Security** → enable **2-Step Verification**.
2. **App passwords** → create a password for “Mail”.
3. In `backend/.env`, **replace** any QQ SMTP lines with (use your address and the 16-char app password). The server uses Nodemailer’s **`service: 'gmail'`** when `DND_SMTP_HOST=smtp.gmail.com` (reliable app-password auth):

   ```env
   DND_EMAIL_PROVIDER=auto
   DND_SMTP_HOST=smtp.gmail.com
   DND_SMTP_USER=ckang2435@gmail.com
   DND_SMTP_PASS=xxxx xxxx xxxx xxxx
   DND_SMTP_FROM=ckang2435@gmail.com
   ```

   Port/starttls are optional for Gmail when using this host (handled by the transport). Remove spaces in the app password if needed: `xxxxxxxxxxxxxxxx`.

4. Restart: `cd backend && npm run dev`.
5. Click **Send code** again. You want `"emailDelivery":"smtp"` in the JSON (check with curl below).

## Verify

```bash
curl -s -X POST http://127.0.0.1:8080/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR@gmail.com"}'
```

- Success: `"emailDelivery":"resend"` or `"smtp"`, no `resendFallback`.
- Still failing: read the backend terminal for `[email]` / `[EMAIL-FALLBACK]` lines and check [Resend → Logs](https://resend.com/emails).

## Why QQ SMTP + Gmail didn’t work

If `DND_SMTP_*` is still set to **QQ** with a **placeholder** password, SMTP auth **fails**, so after Resend errors the backup path does not deliver either. Use a **real** QQ authorization code **or** switch to **Gmail SMTP** for testing Gmail inboxes.
