# Backend setup (auth + email)

## 1. Install & env file

```bash
cd backend
npm install
cp .env.example .env
```

## 2. Required secrets in `.env`

| Variable | Purpose |
|----------|---------|
| **`RESEND_API_KEY`** | From [resend.com/api-keys](https://resend.com/api-keys) (`re_...`). |
| **`DND_APP_SECRET`** | Long random string (JWT / magic links). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **`DND_PUBLIC_APP_URL`** | Frontend URL for magic links. Local: `http://localhost:5173`. Production: `https://your-app.vercel.app` |

## 3. So verification emails actually arrive

`DND_EMAIL_PROVIDER=auto` (default): **Resend first**, then **SMTP** if Resend returns 403.

Pick **one** outbound path for real delivery:

### A. Resend + verified domain (production)

1. Verify a domain at [resend.com/domains](https://resend.com/domains).
2. Set `DND_FROM_EMAIL=noreply@your-domain.com`.

### B. Gmail SMTP (quick tests to Gmail)

See **`GMAIL-DELIVERY.md`**. Set `DND_SMTP_HOST=smtp.gmail.com`, app password in `DND_SMTP_PASS`, same address in `DND_SMTP_USER` and `DND_SMTP_FROM`.

### C. QQ SMTP

See **`EMAIL.md`** (Tencent section).

**Do not leave `DND_SMTP_PASS` as a placeholder** — backup delivery will fail.

## 4. Validate without starting the app

```bash
npm run email:check
```

## 5. Run the API

```bash
npm run dev
```

Confirm:

```bash
curl -s http://127.0.0.1:8080/api/auth/status
```

## 6. Production API (e.g. Cloud Run)

Set the **same** variables as environment variables on the service. Never commit `.env`.

**Do not** set `DND_DEV_EXPOSE_CODE_IN_API=1` in production.

More: **`EMAIL-SETUP-ALL-USERS.md`**, **`EMAIL.md`**.
