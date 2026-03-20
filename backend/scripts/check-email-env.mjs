#!/usr/bin/env node
/**
 * Validates backend/.env for outbound email. Does not print secret values.
 * Usage: cd backend && npm run email:check
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const issues = [];
const ok = [];

function flagPlaceholder(name, val, opts = {}) {
  const { minLen = 8 } = opts;
  if (!val || !String(val).trim()) {
    issues.push(`${name} is empty`);
    return true;
  }
  const v = String(val);
  if (/PASTE_|placeholder|change_me_in_production|YOUR_|^xxxx/i.test(v) || v.length < minLen) {
    issues.push(`${name} looks like a placeholder — replace with a real secret`);
    return true;
  }
  return false;
}

const resend = process.env.RESEND_API_KEY?.trim();
if (resend && resend.startsWith('re_')) ok.push('RESEND_API_KEY is set (starts with re_)');
else if (resend) issues.push('RESEND_API_KEY should start with re_');
else issues.push('RESEND_API_KEY missing — add from resend.com/api-keys');

flagPlaceholder('DND_APP_SECRET', process.env.DND_APP_SECRET, { minLen: 16 });

const smtpHost = process.env.DND_SMTP_HOST?.trim();
const smtpUser = process.env.DND_SMTP_USER?.trim();
const smtpPass = process.env.DND_SMTP_PASS;
const smtpFrom = process.env.DND_SMTP_FROM?.trim() || process.env.DND_FROM_EMAIL?.trim();

if (smtpHost) {
  if (!smtpUser) issues.push('DND_SMTP_USER missing but DND_SMTP_HOST is set');
  flagPlaceholder('DND_SMTP_PASS', smtpPass, { minLen: 6 });
  if (!smtpFrom) issues.push('DND_SMTP_FROM or DND_FROM_EMAIL required when using SMTP');
  else ok.push(`SMTP From: ${smtpFrom}`);
  if (smtpHost === 'smtp.gmail.com') {
    ok.push('Gmail SMTP — use a Google App Password (not your normal Gmail password); see GMAIL-DELIVERY.md');
  }
} else {
  ok.push('No DND_SMTP_HOST — SMTP fallback disabled (Resend-only until you add SMTP)');
}

const fromResend = process.env.DND_FROM_EMAIL?.trim();
if (resend && !fromResend) {
  ok.push('DND_FROM_EMAIL not set — using onboarding@resend.dev (many addresses get 403; verify a domain or use SMTP)');
}

const mode = process.env.DND_EMAIL_PROVIDER || 'auto';
ok.push(`DND_EMAIL_PROVIDER=${mode}`);

console.log('\n=== Email environment check (backend/.env) ===\n');
if (ok.length) {
  console.log('OK:');
  ok.forEach((l) => console.log(`  • ${l}`));
}
console.log('');
if (issues.length) {
  console.log('Fix:');
  issues.forEach((l) => console.log(`  • ${l}`));
} else {
  console.log('No obvious placeholder issues.');
}
console.log('');
console.log('Next: restart backend (`npm run dev`), then:');
console.log('  curl -s http://127.0.0.1:8080/api/auth/status');
console.log('  curl -s -X POST http://127.0.0.1:8080/api/auth/send-verification -H "Content-Type: application/json" -d \'{"email":"you@gmail.com"}\'');
console.log('Look for emailDelivery: resend or smtp (not console).');
console.log('\nDocs: EMAIL-SETUP-ALL-USERS.md, GMAIL-DELIVERY.md, EMAIL.md\n');

process.exit(issues.length ? 1 : 0);
