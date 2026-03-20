import React from 'react';
import { motion } from 'motion/react';
import { KeyRound, Zap, ScrollText } from 'lucide-react';

export type MailServerStatus =
  | { loading: true }
  | { loading: false; error: string }
  | {
      loading: false;
      resend: boolean;
      smtp: boolean;
      providerMode: string;
      publicAppUrl: string;
      codeTtlMin: number;
      magicLinkTtlMin: number;
      usingDefaultAppSecret: boolean;
      /** If Resend returns 403 etc., dev server logs [EMAIL-FALLBACK] instead of failing. */
      resendConsoleFallbackOnError: boolean;
      devExposeCodeInApi: boolean;
    };

interface LoginGatePageProps {
  mailStatus?: MailServerStatus;
  email: string;
  name: string;
  password: string;
  verificationCode: string;
  resetCode: string;
  newPassword: string;
  inviteCode: string;
  campaignId: number | null;
  roomId: number | null;
  onEmailChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onVerificationCodeChange: (v: string) => void;
  onResetCodeChange: (v: string) => void;
  onNewPasswordChange: (v: string) => void;
  onInviteCodeChange: (v: string) => void;
  onRegister: () => void;
  onLogin: () => void;
  onSendVerificationCode: () => void;
  onVerifyEmail: () => void;
  onForgotPassword: () => void;
  onResetPassword: () => void;
  onQuickStart: () => void;
  onJoinRoom: () => void;
  onRefreshChat: () => void;
  /** Shown inside the card so login errors are not lost below the fold */
  authError?: string | null;
  authSuccess?: string | null;
  isAuthBusy?: boolean;
}

const LoginGatePage: React.FC<LoginGatePageProps> = ({
  mailStatus,
  email,
  name,
  password,
  verificationCode,
  resetCode,
  newPassword,
  inviteCode,
  campaignId,
  roomId,
  onEmailChange,
  onNameChange,
  onPasswordChange,
  onVerificationCodeChange,
  onResetCodeChange,
  onNewPasswordChange,
  onInviteCodeChange,
  onRegister,
  onLogin,
  onSendVerificationCode,
  onVerifyEmail,
  onForgotPassword,
  onResetPassword,
  onQuickStart,
  onJoinRoom,
  onRefreshChat,
  authError,
  authSuccess,
  isAuthBusy = false,
}) => {
  const disableAuth = isAuthBusy;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-4xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950/70 shadow-2xl shadow-amber-900/20 backdrop-blur-md">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative grid gap-6 p-6 md:grid-cols-2 md:p-8">
          <section>
            {mailStatus?.loading ? (
              <p className="mb-3 rounded-lg border border-amber-500/20 bg-slate-900/50 px-3 py-2 text-xs text-amber-200/70">Checking email server…</p>
            ) : null}
            {!mailStatus?.loading && mailStatus && 'error' in mailStatus ? (
              <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200/90">
                Cannot reach the API — start the backend (<code className="rounded bg-black/40 px-1">cd backend && npm run dev</code>) and keep the Vite dev server running.
              </p>
            ) : null}
            {mailStatus?.loading === false && mailStatus && 'resend' in mailStatus ? (
              <>
                {mailStatus.resend || mailStatus.smtp ? (
                  mailStatus.usingDefaultAppSecret ? (
                    <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-950/25 px-3 py-2 text-[10px] text-amber-200/70">
                      Using default app secret — set DND_APP_SECRET before production.
                    </p>
                  ) : null
                ) : (
                  <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/85">
                    <strong className="text-amber-200/95">Dev mode</strong> — no{' '}
                    <code className="rounded bg-black/40 px-1">RESEND_API_KEY</code>: codes only in the backend terminal (
                    <code className="rounded bg-black/40 px-1">[EMAIL-FALLBACK]</code>).
                  </div>
                )}
              </>
            ) : null}
            {authError ? (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-rose-500/45 bg-rose-950/50 px-3 py-2 text-sm text-rose-100"
              >
                {authError}
              </div>
            ) : null}
            {authSuccess ? (
              <div
                role="status"
                className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100/95"
              >
                {authSuccess}
              </div>
            ) : null}
            {isAuthBusy ? (
              <p className="mb-2 text-xs font-medium text-amber-200/90" aria-live="polite">
                Working…
              </p>
            ) : null}
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70">Chronicles of Shadow</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-100">Enter the Citadel</h2>
            <p className="mt-3 text-sm text-amber-100/70">Create an account to enable campaign saves, replay, and room chat. Or jump in instantly as a guest.</p>

            <div className="mt-6 space-y-3">
              <input
                className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2 text-amber-100 placeholder:text-amber-200/35"
                placeholder="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2 text-amber-100 placeholder:text-amber-200/35"
                placeholder="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
              <input
                type="password"
                className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2 text-amber-100 placeholder:text-amber-200/35"
                placeholder="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <button
                type="button"
                disabled={disableAuth}
                onClick={onRegister}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Register
              </button>
              <button
                type="button"
                disabled={disableAuth}
                onClick={onLogin}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Login
              </button>
              <div className="quickstart-cta-wrap">
                <span className="quickstart-cta-label" aria-hidden>
                  Click me
                </span>
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onQuickStart}
                  title="Try the demo instantly — no signup required"
                  aria-label="Quick Start: try the demo instantly"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/35 bg-violet-900/35 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-800/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  Quick Start
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/20 bg-slate-900/40 p-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-amber-300/80">Email Verification</p>
              <p className="mb-2 text-[11px] text-amber-200/55">
                New accounts: paste the 6-digit code from your email. If you try to register again with an email that already exists, we send a one-time sign-in link instead (no password in email).
              </p>
              <input
                type="email"
                autoComplete="email"
                className="mb-2 w-full rounded-lg border border-amber-400/25 bg-black/50 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-200/40"
                placeholder="Email address"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onSendVerificationCode}
                  className="rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send Code
                </button>
                <input
                  className="min-w-[8rem] flex-1 rounded border border-amber-500/20 bg-black/40 px-2 py-1.5 text-xs text-amber-100 placeholder:text-amber-200/35"
                  placeholder="6-digit code from email"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(e) => onVerificationCodeChange(e.target.value)}
                />
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onVerifyEmail}
                  className="rounded bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Verify Email
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-rose-400/20 bg-slate-900/40 p-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-rose-300/80">Forgot Password</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onForgotPassword}
                  className="rounded bg-rose-700 px-3 py-1 text-xs text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send Reset Code
                </button>
                <input className="rounded bg-black/40 px-2 py-1 text-xs text-amber-100" placeholder="reset code" value={resetCode} onChange={(e) => onResetCodeChange(e.target.value)} />
                <input className="rounded bg-black/40 px-2 py-1 text-xs text-amber-100" placeholder="new password" type="password" value={newPassword} onChange={(e) => onNewPasswordChange(e.target.value)} />
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onResetPassword}
                  className="rounded bg-fuchsia-700 px-3 py-1 text-xs text-white hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-amber-400/15 bg-black/30 p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-amber-200">
              <KeyRound className="h-4 w-4" />
              <span className="font-semibold">Room Access</span>
            </div>

            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-amber-400/20 bg-slate-900/70 px-3 py-2 text-amber-100 placeholder:text-amber-200/35"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onJoinRoom}
                  className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Join Room
                </button>
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onRefreshChat}
                  className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Refresh Chat
                </button>
              </div>

              <div className="rounded-lg border border-amber-500/15 bg-slate-950/60 px-3 py-2 text-sm text-amber-100/85">
                Campaign: {campaignId ?? '-'} · Room: {roomId ?? '-'}
              </div>

              <p className="inline-flex items-center gap-2 text-xs text-amber-300/70">
                <ScrollText className="h-3.5 w-3.5" />
                Join Room / Refresh Chat require <strong className="text-amber-200/90">Login</strong> first. API key prompt comes after this page.
              </p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginGatePage;
