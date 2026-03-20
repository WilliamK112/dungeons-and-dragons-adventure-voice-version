import React from 'react';
import { motion } from 'motion/react';
import { KeyRound, Zap, ScrollText } from 'lucide-react';

interface LoginGatePageProps {
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
}

const LoginGatePage: React.FC<LoginGatePageProps> = ({
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
}) => {
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

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onRegister} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">Register</button>
              <button onClick={onLogin} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Login</button>
              <button onClick={onQuickStart} className="inline-flex items-center gap-2 rounded-lg border border-violet-400/35 bg-violet-900/35 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-800/40">
                <Zap className="h-4 w-4" />
                Quick Start
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/20 bg-slate-900/40 p-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-amber-300/80">Email Verification</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={onSendVerificationCode} className="rounded bg-blue-700 px-3 py-1 text-xs text-white hover:bg-blue-600">Send Code</button>
                <input className="rounded bg-black/40 px-2 py-1 text-xs text-amber-100" placeholder="verification code" value={verificationCode} onChange={(e) => onVerificationCodeChange(e.target.value)} />
                <button onClick={onVerifyEmail} className="rounded bg-cyan-700 px-3 py-1 text-xs text-white hover:bg-cyan-600">Verify Email</button>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-rose-400/20 bg-slate-900/40 p-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-rose-300/80">Forgot Password</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={onForgotPassword} className="rounded bg-rose-700 px-3 py-1 text-xs text-white hover:bg-rose-600">Send Reset Code</button>
                <input className="rounded bg-black/40 px-2 py-1 text-xs text-amber-100" placeholder="reset code" value={resetCode} onChange={(e) => onResetCodeChange(e.target.value)} />
                <input className="rounded bg-black/40 px-2 py-1 text-xs text-amber-100" placeholder="new password" type="password" value={newPassword} onChange={(e) => onNewPasswordChange(e.target.value)} />
                <button onClick={onResetPassword} className="rounded bg-fuchsia-700 px-3 py-1 text-xs text-white hover:bg-fuchsia-600">Reset Password</button>
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
                <button onClick={onJoinRoom} className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Join Room</button>
                <button onClick={onRefreshChat} className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600">Refresh Chat</button>
              </div>

              <div className="rounded-lg border border-amber-500/15 bg-slate-950/60 px-3 py-2 text-sm text-amber-100/85">
                Campaign: {campaignId ?? '-'} · Room: {roomId ?? '-'}
              </div>

              <p className="inline-flex items-center gap-2 text-xs text-amber-300/70">
                <ScrollText className="h-3.5 w-3.5" />
                API key prompt comes after this page.
              </p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginGatePage;
