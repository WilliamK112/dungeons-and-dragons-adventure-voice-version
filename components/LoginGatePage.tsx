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

type AuthTab = 'guest' | 'signin' | 'signup';

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

const tabBtn =
  'flex-1 rounded-md px-2 py-2 text-center text-xs font-medium transition-colors sm:text-sm min-h-[2.75rem] sm:min-h-0';

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
  const [authTab, setAuthTab] = React.useState<AuthTab>('guest');

  const tabActive = 'bg-amber-600/90 text-stone-950 shadow-sm';
  const tabIdle = 'text-amber-200/75 hover:bg-amber-950/40 hover:text-amber-100';

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
            <p className="mt-3 text-sm text-amber-100/70">
              Save campaigns and use room chat with an account, or play the demo as a guest.
            </p>

            <div
              className="mt-5 flex rounded-xl border border-amber-500/20 bg-black/35 p-1"
              role="tablist"
              aria-label="Account options"
            >
              {(
                [
                  ['guest', 'Guest'],
                  ['signin', 'Sign in'],
                  ['signup', 'Register'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={authTab === id}
                  className={`${tabBtn} ${authTab === id ? tabActive : tabIdle}`}
                  onClick={() => setAuthTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {authTab === 'guest' ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-amber-200/65">Jump in with no signup — you can create an account later from settings.</p>
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onQuickStart}
                  title="Try the demo instantly — no signup required"
                  aria-label="Quick Start: try the demo instantly"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/30 bg-violet-950/40 px-4 py-3 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-900/45 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  Quick Start
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2.5 text-amber-100 placeholder:text-amber-200/35"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                />

                {authTab === 'signup' ? (
                  <input
                    className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2.5 text-amber-100 placeholder:text-amber-200/35"
                    placeholder="Display name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                  />
                ) : null}

                <input
                  type="password"
                  autoComplete={authTab === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-amber-400/20 bg-black/40 px-3 py-2.5 text-amber-100 placeholder:text-amber-200/35"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                />

                {authTab === 'signin' ? (
                  <button
                    type="button"
                    disabled={disableAuth}
                    onClick={onLogin}
                    className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={disableAuth}
                    onClick={onRegister}
                    className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create account
                  </button>
                )}

                <details className="group rounded-lg border border-amber-500/15 bg-slate-900/35">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-amber-200/80 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="underline decoration-amber-500/40 underline-offset-2 group-open:decoration-amber-500/70">
                      Verification code, magic link, or forgot password
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-amber-500/10 px-3 pb-3 pt-2">
                    <p className="text-[11px] leading-relaxed text-amber-200/50">
                      After registering, check your email for a 6-digit code. If the address is already taken, we may send a one-time sign-in link instead.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        disabled={disableAuth}
                        onClick={onSendVerificationCode}
                        className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-900/35 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send code
                      </button>
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-amber-500/20 bg-black/40 px-2 py-2 text-sm text-amber-100 placeholder:text-amber-200/35 sm:max-w-[10rem]"
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={verificationCode}
                        onChange={(e) => onVerificationCodeChange(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={disableAuth}
                        onClick={onVerifyEmail}
                        className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-900/35 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Verify email
                      </button>
                    </div>
                    <div className="border-t border-amber-500/10 pt-3">
                      <p className="mb-2 text-[11px] uppercase tracking-wide text-amber-200/45">Reset password</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={disableAuth}
                            onClick={onForgotPassword}
                            className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-900/35 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Email reset code
                          </button>
                          <input
                            className="min-w-[6rem] flex-1 rounded-lg border border-amber-500/20 bg-black/40 px-2 py-2 text-xs text-amber-100"
                            placeholder="Code from email"
                            value={resetCode}
                            onChange={(e) => onResetCodeChange(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <input
                            className="min-w-[8rem] flex-1 rounded-lg border border-amber-500/20 bg-black/40 px-2 py-2 text-xs text-amber-100"
                            placeholder="New password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => onNewPasswordChange(e.target.value)}
                          />
                          <button
                            type="button"
                            disabled={disableAuth}
                            onClick={onResetPassword}
                            className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-900/35 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Set new password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-amber-400/15 bg-black/30 p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-amber-200">
              <KeyRound className="h-4 w-4" />
              <span className="font-semibold">Room access</span>
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
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Join room
                </button>
                <button
                  type="button"
                  disabled={disableAuth}
                  onClick={onRefreshChat}
                  className="rounded-lg border border-zinc-500/40 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Refresh chat
                </button>
              </div>

              <div className="rounded-lg border border-amber-500/15 bg-slate-950/60 px-3 py-2 text-sm text-amber-100/85">
                Campaign: {campaignId ?? '-'} · Room: {roomId ?? '-'}
              </div>

              <p className="flex flex-wrap items-start gap-2 text-xs leading-snug text-amber-300/70">
                <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Sign in first to join a room or refresh chat. The API key step comes on the next screen.
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginGatePage;
