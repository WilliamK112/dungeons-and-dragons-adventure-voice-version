import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, VideoPlan, Player, PlanningResponse } from './types';
import * as geminiService from './services/geminiService';
import PlayerStatsList from './components/PlayerStats';
import GameDisplay from './components/GameDisplay';
import VideoPlanModal from './components/VideoPlanModal';
import CharacterCreation, { PlayerData } from './components/CharacterCreation';
import CoverPage from './components/CoverPage';
import LoginGatePage, { MailServerStatus } from './components/LoginGatePage';
import MusicPlayer from './components/MusicPlayer';
import SuccessPage from './components/SuccessPage';
import { motion, AnimatePresence } from 'motion/react';
import { playChoiceClick, playFail, playInventoryGain, playLevelUp, playSuccess } from './utils/audioSfx';
import {
  getNextPlayerIndex,
  initNextTurnAt,
  advanceTurnAfterAction,
  getInitiativeQueue,
} from './utils/turnOrder';
import { getBackendBaseUrl } from './utils/backendUrl';
import InitiativeQueue from './components/InitiativeQueue';
import { DEMO_API_KEY } from './constants';

/** True when the backend actually handed off mail to Resend or SMTP (not console fallback). */
function deliveredToRealInbox(r: { emailDelivery?: string; resendFallback?: boolean }) {
  if (!r?.emailDelivery || r.resendFallback) return false;
  return r.emailDelivery === 'resend' || r.emailDelivery === 'smtp';
}

type ApiKeyStatus = 'missing' | 'looks-valid' | 'looks-invalid';

const getApiKeyStatus = (key: string, isSelected: boolean): ApiKeyStatus => {
  if (!key.trim()) return 'missing';
  const looksLikeGeminiKey = /^AIza[\w-]{20,}$/.test(key.trim());
  if (looksLikeGeminiKey || isSelected) return 'looks-valid';
  return 'looks-invalid';
};

const OBJECTIVE_COMPLETE_RE = /(objective\s*(complete|completed)|quest\s*(complete|completed)|mission accomplished|victory|you\s*(win|won)|dragon'?s\s*eye\s*(retrieved|secured|claimed))/i;

const isObjectiveComplete = (state: GameState | null): boolean => {
  if (!state) return false;
  // Important: do NOT use objective text itself as success evidence,
  // otherwise phrases like "Retrieve ..." can cause false positives.
  const textCorpus = [
    state.sceneText || '',
    ...(state.log || []).slice(-8),
  ].join(' ');

  if (OBJECTIVE_COMPLETE_RE.test(textCorpus)) return true;

  const lowThreat = typeof state.threatLevel === 'number' && state.threatLevel <= 1;
  const hooksResolved = (state.unresolvedHooks || []).length === 0;
  const hasFinaleContext = /(citadel|dragon'?s\s*eye|relic|final objective)/i.test(textCorpus);
  return lowThreat && hooksResolved && hasFinaleContext;
};

const App: React.FC = () => {
  useEffect(() => {
    const fallback = document.getElementById('boot-fallback');
    if (fallback) fallback.remove();
  }, []);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'cover' | 'creation' | 'game' | 'success'>('login');
  
  const [isVideoPlanModalOpen, setIsVideoPlanModalOpen] = useState(false);
  const [videoPlan, setVideoPlan] = useState<VideoPlan | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  
  const [isGeneratingVideoScene, setIsGeneratingVideoScene] = useState<boolean>(false);
  const [sceneVideoUrl, setSceneVideoUrl] = useState<string | null>(null);

  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [hasTriedCoverGeneration, setHasTriedCoverGeneration] = useState<boolean>(false);

  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    try {
      const stored = window.localStorage.getItem('gemini_api_key');
      if (stored?.trim()) return stored;
      return DEMO_API_KEY;
    } catch { return DEMO_API_KEY; }
  });
  const [playerNextTurnAt, setPlayerNextTurnAt] = useState<Record<string, number>>({});
  const [currentD20Roll, setCurrentD20Roll] = useState<number | null>(null);
  const [isRollingD20, setIsRollingD20] = useState(false);
  const [lastD20ByPlayer, setLastD20ByPlayer] = useState<Record<string, number>>({});
  const [isPlanning, setIsPlanning] = useState(false);
  const [planning, setPlanning] = useState<PlanningResponse | null>(null);
  const [statDeltas, setStatDeltas] = useState<Record<string, Record<string, number>>>({});
  const [turnsPlayed, setTurnsPlayed] = useState<number>(0);

  // Local backend persistence/auth states
  const [authToken, setAuthToken] = useState<string>(() => {
    try { return window.localStorage.getItem('dnd_auth_token') || ''; } catch { return ''; }
  });
  const [authEmail, setAuthEmail] = useState(
    () => import.meta.env.VITE_PREFILL_AUTH_EMAIL?.trim() || ''
  );
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signupEmailVerified, setSignupEmailVerified] = useState(false);
  const [signupVerificationToken, setSignupVerificationToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [replayData, setReplayData] = useState<{ turns: any[]; dice: any[]; events: any[] } | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [roomJoinCode, setRoomJoinCode] = useState('');
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const backendBaseUrl = getBackendBaseUrl();
  const [mailStatus, setMailStatus] = useState<MailServerStatus>({ loading: true });
  const [authBusy, setAuthBusy] = useState(false);
  const [authSuccessLine, setAuthSuccessLine] = useState<string | null>(null);
  const magicLinkHandled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${backendBaseUrl}/api/auth/status`);
        const d = await r.json();
        if (cancelled) return;
        if (!d?.ok) {
          setMailStatus({ loading: false, error: 'status' });
          return;
        }
        setMailStatus({
          loading: false,
          resend: !!d.email?.resend,
          smtp: !!d.email?.smtp,
          providerMode: String(d.email?.providerMode || 'auto'),
          publicAppUrl: String(d.email?.publicAppUrl || 'http://localhost:5173'),
          codeTtlMin: Number(d.email?.codeTtlMin) || 15,
          magicLinkTtlMin: Number(d.email?.magicLinkTtlMin) || 15,
          usingDefaultAppSecret: !!d.security?.usingDefaultAppSecret,
          resendConsoleFallbackOnError: !!d.email?.resendConsoleFallbackOnError,
          devExposeCodeInApi: !!d.email?.devExposeCodeInApi,
        });
      } catch {
        if (!cancelled) setMailStatus({ loading: false, error: 'network' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backendBaseUrl]);

  useEffect(() => {
    if (magicLinkHandled.current || typeof window === 'undefined') return;
    let raw = '';
    const h = window.location.hash;
    if (h.startsWith('#magic=')) {
      raw = decodeURIComponent(h.slice('#magic='.length));
    } else {
      const q = new URLSearchParams(window.location.search).get('magic');
      if (q) raw = decodeURIComponent(q);
    }
    if (!raw) return;
    magicLinkHandled.current = true;
    (async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/api/auth/magic-link/consume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: raw }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const token = data?.token || '';
        setAuthToken(token);
        try {
          window.localStorage.setItem('dnd_auth_token', token);
        } catch {
          /* ignore */
        }
        if (data?.user?.email) setAuthEmail(data.user.email);
        if (data?.user?.name) setAuthName(data.user.name);
        setAuthPassword('');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        setError(null);
        setCurrentView('cover');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in link failed');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
    })();
  }, [backendBaseUrl]);

  useEffect(() => {
    const checkApiKey = async () => {
      let hasKey = false;
      try {
        const localKey = window.localStorage.getItem('gemini_api_key') || '';
        if (localKey.trim()) {
          hasKey = true;
          setApiKeyInput(localKey);
        } else {
          // Auto-fill judge key for competition (no API key entry required)
          window.localStorage.setItem('gemini_api_key', DEMO_API_KEY);
          setApiKeyInput(DEMO_API_KEY);
          hasKey = true;
        }
      } catch {
        // ignore localStorage failures
      }

      if (!hasKey && window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        hasKey = selected;
      }
      setIsApiKeySelected(hasKey);
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true);
      // Retry cover generation if it failed
      if (!coverImageUrl && !isGeneratingCover) {
          setHasTriedCoverGeneration(false);
      }
    }
  };

  const handleSaveApiKey = (key: string) => {
    const cleaned = key.trim();
    setApiKeyInput(cleaned);
    if (!cleaned) return;
    try {
      window.localStorage.setItem('gemini_api_key', cleaned);
    } catch {
      // ignore storage errors
    }
    setIsApiKeySelected(true);
    setError(null);
    if (!coverImageUrl && !isGeneratingCover) {
      setHasTriedCoverGeneration(false);
    }
  };

  const apiFetch = useCallback(async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> || {}) };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    let res: Response;
    try {
      res = await fetch(`${backendBaseUrl}${path}`, { ...init, headers });
    } catch {
      const isDev = import.meta.env.DEV;
      const apiHint = backendBaseUrl || '(same-origin /api via Vite proxy → :8080)';
      const hint = !isDev
        ? ` Set VITE_BACKEND_URL in Vercel to your public API URL (HTTPS).`
        : ` Start the backend: cd backend && npm run dev (port 8080). Frontend uses ${apiHint}.`;
      throw new Error(`Cannot reach API ${apiHint}. Email verification and auth need the Node backend running. ${hint}`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      if (res.status === 401) {
        throw new Error(data?.error || 'Unauthorized — please Login first (room features need an account).');
      }
      throw new Error(data?.error || `Request failed: ${res.status}`);
    }
    return data;
  }, [authToken, backendBaseUrl]);

  const handleRegister = useCallback(async () => {
    if (!signupEmailVerified || !signupVerificationToken) {
      setError('Please verify your email first (send code → verify code).');
      return;
    }
    if (!authEmail.trim() || !authPassword.trim()) {
      setError('Enter username and password to create your account.');
      return;
    }
    setAuthBusy(true);
    setAuthSuccessLine(null);
    try {
      const result = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: authEmail,
          name: authName || 'Player',
          password: authPassword,
          verificationToken: signupVerificationToken,
        }),
      });
      if (result?.existingAccount && result?.magicLinkSent) {
        setAuthSuccessLine('This email is already registered. Use Login with your password.');
        return;
      }
      if (result?.ok) {
        setError(null);
        setAuthSuccessLine('Account created successfully. You can login now.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail, authName, authPassword, signupEmailVerified, signupVerificationToken]);

  const handleLogin = useCallback(async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setError('Enter email and password to login.');
      return;
    }
    setAuthBusy(true);
    setAuthSuccessLine(null);
    setError(null);
    try {
      const result = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: authEmail, password: authPassword }) });
      const token = result?.token || '';
      setAuthToken(token);
      try {
        window.localStorage.setItem('dnd_auth_token', token);
      } catch {
        /* ignore */
      }
      setError(null);
      setCurrentView('cover');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/verify|not verified|verify first/i.test(msg)) {
        setError(
          'Email not verified yet — enter the 6-digit code in the Email Verification section and click Verify Email, then try Login again.'
        );
      } else if (/Invalid credentials/i.test(msg)) {
        setError(
          'Wrong email or password. If you just registered, click Verify Email first. If you forgot your password, use Forgot Password below.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail, authPassword]);

  const handleSendVerificationCode = useCallback(async () => {
    if (!authEmail.trim()) {
      setError('Enter your email first.');
      return;
    }
    setAuthBusy(true);
    setAuthSuccessLine(null);
    setSignupEmailVerified(false);
    setSignupVerificationToken('');
    try {
    const result = await apiFetch('/api/auth/send-verification', { method: 'POST', body: JSON.stringify({ email: authEmail }) });
    if (result?.devVerificationCode && !deliveredToRealInbox(result)) {
      setVerificationCode('');
      setError(null);
      setAuthSuccessLine(
        'Mail was not delivered. Code field left empty — see backend terminal [EMAIL-FALLBACK], or backend/GMAIL-DELIVERY.md (Gmail SMTP or Resend domain), then try Send code again.'
      );
      return;
    }
    if (result?.resendFallback) {
      setError(
        'Could not send to this inbox — your code is in the backend terminal ([EMAIL-FALLBACK]). Add SMTP (DND_SMTP_*) or verify a Resend domain so any email can receive codes. Or set DND_DEV_EXPOSE_CODE_IN_API=1 in backend/.env for local dev.'
      );
      return;
    }
    if (deliveredToRealInbox(result)) {
      setVerificationCode('');
      setError(null);
      setAuthSuccessLine(
        result?.deliveredViaSmtpFallback
          ? 'Verification code sent via backup SMTP — check your inbox and spam, then enter the 6-digit code below.'
          : 'Verification code sent — check your inbox and spam, then enter the 6-digit code below.'
      );
      return;
    }
    setError(
      'Code generated locally only — see backend terminal for `[EMAIL-FALLBACK]`. Set RESEND_API_KEY and/or SMTP in backend/.env for real email.'
    );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail]);

  const handleVerifyEmail = useCallback(async () => {
    const codeDigits = verificationCode.replace(/\D/g, '').slice(0, 6);
    if (!authEmail.trim() || codeDigits.length !== 6) {
      setError('Enter email and the 6-digit verification code.');
      return;
    }
    setAuthBusy(true);
    setError(null);
    try {
      const result = await apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: authEmail, code: codeDigits }) });
      setSignupEmailVerified(true);
      setSignupVerificationToken(String(result?.verificationToken || ''));
      setAuthSuccessLine('Email verified. Now enter username + password to finish registration.');
    } catch (e) {
      setAuthSuccessLine(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail, verificationCode]);

  const handleForgotPassword = useCallback(async () => {
    if (!authEmail.trim()) {
      setError('Enter your email first.');
      return;
    }
    setAuthBusy(true);
    setAuthSuccessLine(null);
    try {
    const result = await apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: authEmail }) });
    if (result?.emailDelivery === 'skipped_no_user') {
      setError(null);
      setAuthSuccessLine('If an account exists for that email, a reset code was sent (check inbox).');
      return;
    }
    if (result?.devVerificationCode && !deliveredToRealInbox(result)) {
      setResetCode('');
      setError(null);
      setAuthSuccessLine(
        'Mail was not delivered. Reset code field left empty — copy from your backend terminal ([EMAIL-FALLBACK]) if shown, or fix email config (backend/EMAIL.md).'
      );
      return;
    }
    if (result?.resendFallback) {
      setError(
        'Could not send mail — if your account exists, the reset code is in the backend terminal ([EMAIL-FALLBACK]). Add SMTP or verify a Resend domain. Or set DND_DEV_EXPOSE_CODE_IN_API=1 for local dev.'
      );
      return;
    }
    if (deliveredToRealInbox(result)) {
      setResetCode('');
      setError(null);
      setAuthSuccessLine(
        result?.deliveredViaSmtpFallback
          ? 'If an account exists, a reset code was sent via backup SMTP — check inbox and paste it below.'
          : 'If an account exists, a reset code was sent — check inbox and paste it below.'
      );
      return;
    }
    setError(
      'Reset code only in backend terminal (`[EMAIL-FALLBACK]`). Set RESEND_API_KEY and/or SMTP in backend/.env.'
    );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail]);

  const handleResetPassword = useCallback(async () => {
    if (!authEmail.trim() || !resetCode.trim() || !newPassword.trim()) {
      setError('Enter email, reset code, and new password.');
      return;
    }
    setAuthBusy(true);
    setAuthSuccessLine(null);
    try {
      await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: authEmail, code: resetCode, newPassword }) });
      setError(null);
      setAuthSuccessLine('Password reset complete. Login with your new password.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthBusy(false);
    }
  }, [apiFetch, authEmail, resetCode, newPassword]);

  const handleCreateCampaignSave = useCallback(async () => {
    if (!gameState) return;
    const result = await apiFetch('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        title: `Campaign ${new Date().toLocaleString()}`,
        chapter: gameState.objective || 'Chapter 1',
        mapState: { sceneText: gameState.sceneText },
        inventory: gameState.players.flatMap((p) => p.stats.inventory || []),
        partyMembers: gameState.players.map((p) => ({
          name: p.name,
          className: null,
          hp: p.stats.health,
          maxHp: 100,
          agility: p.stats.agility,
          isDead: p.stats.health <= 0,
          metadata: { mana: p.stats.mana, xp: p.stats.xp, strength: p.stats.strength, intellect: p.stats.intellect, charisma: p.stats.charisma, luck: p.stats.luck },
        })),
      }),
    });
    setCampaignId(result?.campaignId || null);
  }, [apiFetch, gameState]);

  const handleSaveState = useCallback(async () => {
    if (!gameState || !campaignId) return;
    await apiFetch(`/api/campaigns/${campaignId}/state`, {
      method: 'POST',
      body: JSON.stringify({
        turnNumber: turnsPlayed,
        chapter: gameState.objective || 'Chapter 1',
        mapState: { sceneText: gameState.sceneText },
        inventory: gameState.players.flatMap((p) => p.stats.inventory || []),
        state: gameState,
        partyMembers: gameState.players.map((p) => ({
          name: p.name,
          className: null,
          hp: p.stats.health,
          maxHp: 100,
          agility: p.stats.agility,
          isDead: p.stats.health <= 0,
          metadata: { mana: p.stats.mana, xp: p.stats.xp, strength: p.stats.strength, intellect: p.stats.intellect, charisma: p.stats.charisma, luck: p.stats.luck, inventory: p.stats.inventory },
        })),
      }),
    });
  }, [apiFetch, campaignId, gameState, turnsPlayed]);

  const handleContinueLatest = useCallback(async () => {
    const result = await apiFetch('/api/campaigns/continue/latest');
    const latestState = result?.campaign?.latestState;
    if (latestState && latestState.players && latestState.choices) {
      setGameState(latestState as GameState);
      setCurrentView('game');
      setCampaignId(result?.campaign?.id || null);
      setError(null);
      return;
    }
    setError('Found campaign but no full game snapshot yet. Save once in active game first.');
  }, [apiFetch]);

  const handleLoadReplay = useCallback(async () => {
    if (!campaignId) return;
    const result = await apiFetch(`/api/campaigns/${campaignId}/replay`);
    setReplayData({ turns: result?.turns || [], dice: result?.dice || [], events: result?.events || [] });
  }, [apiFetch, campaignId]);

  const handleCreateRoom = useCallback(async () => {
    const result = await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ campaignId, roomName: 'Campaign Room' }) });
    setRoomId(result?.roomId || null);
    setInviteCode(result?.inviteCode || '');
  }, [apiFetch, campaignId]);

  const handleJoinRoom = useCallback(async () => {
    if (!authToken) {
      setError('Please Login first — room features require an account.');
      return;
    }
    if (!roomJoinCode.trim()) {
      setError('Enter an invite code.');
      return;
    }
    const result = await apiFetch('/api/rooms/join', { method: 'POST', body: JSON.stringify({ inviteCode: roomJoinCode }) });
    setRoomId(result?.roomId || null);
    setError(null);
  }, [apiFetch, roomJoinCode, authToken]);

  const handleLoadMessages = useCallback(async () => {
    if (!authToken) {
      setError('Please Login first — chat requires an account.');
      return;
    }
    if (!roomId) {
      setError('Join a room first (enter invite code and click Join Room).');
      return;
    }
    const result = await apiFetch(`/api/rooms/${roomId}/messages`);
    setRoomMessages(result?.messages || []);
    setError(null);
  }, [apiFetch, roomId, authToken]);

  const handleSendMessage = useCallback(async () => {
    if (!roomId || !chatInput.trim()) return;
    await apiFetch(`/api/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ message: chatInput }) });
    setChatInput('');
    await handleLoadMessages();
  }, [apiFetch, roomId, chatInput, handleLoadMessages]);

  useEffect(() => {
    const generateCover = async () => {
        // Only run once per cover entry unless explicitly reset.
        if (currentView === 'cover' && !coverImageUrl && !isGeneratingCover && !hasTriedCoverGeneration) {
            setIsGeneratingCover(true);
            setHasTriedCoverGeneration(true);
            setError(null);
            try {
                const prompt = "Epic dark fantasy cover art for a game titled “Chronicles of Shadow.” A stormy night sky looms above a ruined gothic citadel on jagged cliffs, illuminated by flashes of lightning. A massive shadowy dragon circles in the clouds while eerie torchlight flickers near the fortress gates. In the foreground, a cracked stone path with glowing runes leads toward the citadel. The atmosphere is ominous, dramatic, and cinematic, in the style of a dark fantasy RPG cover. Bold composition, wide banner orientation, highly detailed.";
                const imageUrl = await geminiService.generateCoverImage(prompt);
                setCoverImageUrl(imageUrl);
            } catch (err) {
                // Prevent hot retry loops on quota errors.
                console.warn("Cover art generation failed (likely free tier limit):", err);
                setCoverImageUrl(null);
            } finally {
                setIsGeneratingCover(false);
            }
        }
    };
    generateCover();
  }, [currentView, coverImageUrl, isGeneratingCover, hasTriedCoverGeneration]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (currentView !== 'cover') return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      setParallax({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentView]);


  const generateAndSetImage = useCallback(async (prompt: string, players: Player[], actionContext?: string) => {
    setIsGeneratingImage(true);
    try {
        const imageUrl = await geminiService.generateImage(prompt, players, actionContext);
        setSceneImageUrl(imageUrl);
    } catch (err) {
        console.error("Failed to generate scene image:", err);
        const message = err instanceof Error ? err.message : '';
        if (!/timed out/i.test(message)) {
          setSceneImageUrl(null); // Clear image on non-timeout errors
        }
    } finally {
        setIsGeneratingImage(false);
    }
  }, []);

  const resetMedia = (opts?: { keepImage?: boolean }) => {
    setSceneVideoUrl(null);
    if (!opts?.keepImage) setSceneImageUrl(null);
  };

  const rollVisualD20 = async (): Promise<number> => {
    setIsRollingD20(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const result = Math.floor(Math.random() * 20) + 1;
    setCurrentD20Roll(result);
    setIsRollingD20(false);
    return result;
  };

  const handleStartGame = () => {
    setError(null);
    setTurnsPlayed(0);
    setCurrentView('creation');
  };

  const handleQuickStart = () => {
    setError(null);
    setAuthSuccessLine(null);
    setCurrentView('cover');
  };

  const handleContinueFromSuccess = () => {
    setCurrentView('game');
  };

  const handleRestartCampaign = () => {
    setGameState(null);
    setPlanning(null);
    setCurrentD20Roll(null);
    setIsRollingD20(false);
    setLastD20ByPlayer({});
    setStatDeltas({});
    setTurnsPlayed(0);
    setPlayerNextTurnAt({});
    resetMedia();
    setError(null);
    setCurrentView('creation');
  };

  const handleCharacterCreation = useCallback(async (players: PlayerData[]) => {
    try {
      setIsLoading(true);
      setError(null);
      resetMedia();

      const playersForApi = players.map(({ name, role, backstory }) => ({ name, role, backstory }));
      const initialState = await geminiService.createCharacterAndStartGame(playersForApi);
      
      // Determine turn order based on agility, highest first
      const sortedPlayers = [...initialState.players].sort((a, b) => b.stats.agility - a.stats.agility);

      // Merge the generated portrait URLs and descriptions back into the player data after sorting
      const playersWithPortraits = sortedPlayers.map(player => {
        const creationData = players.find(p => p.name === player.name);
        return {
          ...player,
          portraitUrl: creationData?.portraitUrl || '',
          description: creationData?.portraitPrompt || '',
        };
      });

      const sortedState = { ...initialState, players: playersWithPortraits, currentPlayerIndex: 0 };
      
      setGameState(sortedState as GameState);
      setTurnsPlayed(0);
      setStatDeltas({});
      setPlayerNextTurnAt(initNextTurnAt(playersWithPortraits));
      generateAndSetImage(initialState.sceneText, playersWithPortraits, 'The party begins their quest at the Sunken Citadel entrance.');
      setCurrentView('game');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create characters. Please check your API key and try again. Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [generateAndSetImage]);

  const handleAction = useCallback(async (getAction: (gs: GameState, rolledD20: number) => Promise<GameState>, actionContext: string) => {
    if (!gameState || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      setPlanning(null);
      resetMedia({ keepImage: true });
      const rolledD20 = await rollVisualD20();
      const actingName = gameState.players[gameState.currentPlayerIndex]?.name;
      if (actingName) {
        setLastD20ByPlayer((prev) => ({ ...prev, [actingName]: rolledD20 }));
      }
      const nextState = await getAction(gameState, rolledD20);
      
      // Preserve portrait URLs and descriptions from the old state, as the AI response won't contain them.
      const playersWithPortraits = nextState.players.map(player => {
        const oldPlayer = gameState.players.find(p => p.name === player.name);
        return {
          ...player,
          portraitUrl: oldPlayer?.portraitUrl || '',
          description: oldPlayer?.description || '',
        };
      });

      const actingPlayerBefore = gameState.players[gameState.currentPlayerIndex];
      const actingPlayerAfter = playersWithPortraits.find((p) => p.name === actingPlayerBefore?.name);

      const deltas: Record<string, Record<string, number>> = {};
      const statKeys = ['health', 'mana', 'strength', 'agility', 'intellect', 'charisma', 'luck', 'xp'] as const;
      for (const p of playersWithPortraits) {
        const oldP = gameState.players.find((x) => x.name === p.name);
        if (!oldP) continue;
        const playerDeltas: Record<string, number> = {};
        for (const key of statKeys) {
          const before = oldP.stats[key] ?? 0;
          const after = p.stats[key] ?? 0;
          const delta = after - before;
          if (delta !== 0) playerDeltas[key] = delta;
        }
        if (Object.keys(playerDeltas).length > 0) deltas[p.name] = playerDeltas;
      }
      setStatDeltas(deltas);

      if (actingPlayerBefore && actingPlayerAfter) {
        const beforeStats = actingPlayerBefore.stats;
        const afterStats = actingPlayerAfter.stats;
        if (afterStats.inventory.length > beforeStats.inventory.length) playInventoryGain();
        if (Math.floor(beforeStats.xp / 100) < Math.floor(afterStats.xp / 100)) playLevelUp();
        if (afterStats.health < beforeStats.health) {
          playFail();
        } else if (afterStats.xp > beforeStats.xp || afterStats.health > beforeStats.health) {
          playSuccess();
        }
      }

      // Advance turn: speed-based initiative (faster players can act multiple times before slower ones)
      const actingPlayer = actingPlayerAfter ?? playersWithPortraits[gameState.currentPlayerIndex];
      const updatedNextTurnAt = advanceTurnAfterAction(
        playerNextTurnAt,
        actingPlayer?.name ?? '',
        actingPlayer?.stats?.agility ?? 50
      );
      setPlayerNextTurnAt(updatedNextTurnAt);
      const nextPlayerIndex = getNextPlayerIndex(playersWithPortraits, updatedNextTurnAt);
      const finalState = { 
        ...nextState, 
        players: playersWithPortraits,
        currentPlayerIndex: nextPlayerIndex >= 0 ? nextPlayerIndex : gameState.currentPlayerIndex 
      };
      setGameState(finalState);
      setTurnsPlayed((v) => v + 1);

      if (campaignId) {
        apiFetch(`/api/campaigns/${campaignId}/turns`, {
          method: 'POST',
          body: JSON.stringify({
            turnNumber: turnsPlayed + 1,
            actorName: actingPlayer?.name,
            actionSummary: actionContext,
            damage: Math.max(0, (actingPlayerBefore?.stats.health || 0) - (actingPlayerAfter?.stats.health || 0)),
            dice: [{ diceType: 'd20', rollValue: rolledD20, modifier: 0, total: rolledD20 }],
            events: [{ eventType: 'scene_update', payload: { sceneText: finalState.sceneText } }],
          }),
        }).catch((e) => console.warn('turn log save failed', e));

        apiFetch(`/api/campaigns/${campaignId}/state`, {
          method: 'POST',
          body: JSON.stringify({
            turnNumber: turnsPlayed + 1,
            chapter: finalState.objective || 'Chapter 1',
            mapState: { sceneText: finalState.sceneText },
            inventory: finalState.players.flatMap((p) => p.stats.inventory || []),
            state: finalState,
            partyMembers: finalState.players.map((p) => ({
              name: p.name,
              className: null,
              hp: p.stats.health,
              maxHp: 100,
              agility: p.stats.agility,
              isDead: p.stats.health <= 0,
              metadata: { mana: p.stats.mana, xp: p.stats.xp },
            })),
          }),
        }).catch((e) => console.warn('autosave failed', e));
      }

      generateAndSetImage(finalState.sceneText, finalState.players, actionContext);
    } catch (err) {
      setError('An error occurred while resolving the action. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [gameState, isLoading, generateAndSetImage, playerNextTurnAt, campaignId, apiFetch, turnsPlayed]);

  useEffect(() => {
    if (currentView !== 'game') return;
    if (!gameState) return;
    // Prevent instant jump to success until at least 2 turns have been played.
    if (turnsPlayed < 2) return;
    if (isObjectiveComplete(gameState)) {
      setCurrentView('success');
    }
  }, [gameState, currentView, turnsPlayed]);

  const handleChoiceSelect = (choiceId: number) => {
    playChoiceClick();
    const choiceText = gameState?.choices.find((c) => c.id === choiceId)?.text || `Choice ${choiceId}`;
    handleAction((gs, rolledD20) => geminiService.resolveAction(gs, choiceId, undefined, rolledD20, gs.players[gs.currentPlayerIndex]?.name), choiceText);
  };
  
  const handleCustomActionSubmit = (customActionText: string) => {
    playChoiceClick();
    handleAction((gs, rolledD20) => geminiService.resolveAction(gs, null, customActionText, rolledD20, gs.players[gs.currentPlayerIndex]?.name), customActionText);
  };


  const handlePlanAction = useCallback(async () => {
    if (!gameState || isLoading || isPlanning) return;
    try {
      setIsPlanning(true);
      setError(null);
      const actingPlayerName = gameState.players[gameState.currentPlayerIndex]?.name;
      const plan = await geminiService.planAction(gameState, actingPlayerName);
      setPlanning(plan);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown planning error';
      setError(`Failed to generate tactical plan. ${errorMessage}`);
    } finally {
      setIsPlanning(false);
    }
  }, [gameState, isLoading, isPlanning]);

  const handleApplyPlanOption = (optionId: string) => {
    const option = planning?.tacticalOptions.find((o) => o.id === optionId);
    if (!option) return;
    const action = `${option.title}: ${option.approach}`;
    handleCustomActionSubmit(action);
  };

  const handleGenerateVideo = useCallback(async () => {
      if (!gameState || !sceneImageUrl || isGeneratingVideoScene) return;

      setIsGeneratingVideoScene(true);
      setError(null);
      try {
        const videoUrl = await geminiService.generateVideoFromScene(sceneImageUrl, gameState.sceneText);
        setSceneVideoUrl(videoUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the scene video. Error: ${errorMessage}`);
      } finally {
        setIsGeneratingVideoScene(false);
      }
  }, [gameState, sceneImageUrl, isGeneratingVideoScene]);

  const handleGenerateVideoPlan = async () => {
    if (!gameState || gameState.log.length < 2) {
        alert("Play a little more to generate a more interesting video!");
        return;
    };

    setIsVideoPlanModalOpen(true);
    setIsGeneratingVideo(true);
    setVideoPlan(null);

    try {
        const plan = await geminiService.generateVideoPlan(gameState.log, 60);
        setVideoPlan(plan);
    } catch(err) {
        console.error("Failed to generate video plan:", err);
    } finally {
        setIsGeneratingVideo(false);
    }
  }

  const renderGameContent = () => {
    if (!gameState || !gameState.players.length) return null;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) {
      setError("Error: Current player data is missing.");
      return null;
    }

    const initiativeQueue = getInitiativeQueue(
      gameState.players,
      playerNextTurnAt,
      gameState.currentPlayerIndex
    );

    return (
      <>
        <div className="mb-6 w-full">
          <InitiativeQueue queue={initiativeQueue} />
        </div>
        <div className="flex flex-col lg:flex-row gap-8 min-w-0">
          <GameDisplay 
            sceneText={gameState.sceneText} 
            choices={gameState.choices} 
            onChoiceSelect={handleChoiceSelect}
            isLoading={isLoading}
            sceneImageUrl={sceneImageUrl}
            isGeneratingImage={isGeneratingImage}
            sceneVideoUrl={sceneVideoUrl}
            isGeneratingVideoScene={isGeneratingVideoScene}
            onGenerateVideo={handleGenerateVideo}
            onCustomActionSubmit={handleCustomActionSubmit}
            currentPlayerName={currentPlayer.name}
            recentOutcome={recentOutcome}
            recentRoll={recentRoll}
            recentEvent={recentEvent}
            currentD20Roll={currentD20Roll}
            isRollingD20={isRollingD20}
            previousD20ForCurrentPlayer={lastD20ByPlayer[currentPlayer.name] ?? null}
            objective={gameState.objective}
            threatLevel={gameState.threatLevel}
            queuedConsequences={gameState.queuedConsequences || []}
            planning={planning}
            isPlanning={isPlanning}
            onPlanAction={handlePlanAction}
            onApplyPlanOption={handleApplyPlanOption}
          />
          <PlayerStatsList players={gameState.players} currentPlayerIndex={gameState.currentPlayerIndex} statDeltas={statDeltas} />
        </div>
        <div className="text-center mt-8">
          <button 
              onClick={handleGenerateVideoPlan}
              className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-red-800/20 disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={isGeneratingVideo}
          >
              {isGeneratingVideo ? 'Generating...' : 'Generate Cinematic Plan'}
          </button>
        </div>
      </>
    );
  }

  const headerStyle: React.CSSProperties = {
    transform: `translate(${parallax.x * -15}px, ${parallax.y * -10}px)`,
    textShadow: `0 2px 10px rgb(252 211 77 / 0.5), ${parallax.x * 8}px ${parallax.y * 6}px 20px rgb(252 211 77 / 0.3)`,
    transition: 'transform 0.3s ease-out, text-shadow 0.3s ease-out',
  };

  const contentContainerStyle: React.CSSProperties = {
    transform: `translate(${parallax.x * 20}px, ${parallax.y * 15}px)`,
    transition: 'transform 0.3s ease-out',
  };

  const SUCCESS_BG = '/image--bakcfound.png';
  const appStyle: React.CSSProperties = {
    backgroundImage:
      currentView === 'success'
        ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%), url(${SUCCESS_BG})`
        : (currentView === 'cover' && coverImageUrl)
          ? `url(${coverImageUrl})`
          : `linear-gradient(to bottom right, #020617, #111827)`,
    backgroundColor: '#020617', // Fallback
  };

  const recentOutcome = gameState?.log?.[gameState.log.length - 1] || '';
  const recentRoll = [...(gameState?.log || [])].reverse().find((entry) => entry.startsWith('[ROLL]')) || '';
  const recentEvent = [...(gameState?.log || [])].reverse().find((entry) => entry.startsWith('[EVENT]')) || '';
  const isTenseScene = /dragon|ambush|trap|blood|curse|dark|shadow|battle|danger|attack|scream/i.test(gameState?.sceneText || '');

  return (
    <div className="relative min-h-screen p-4 sm:p-8 bg-cover bg-center transition-all duration-1000" style={appStyle}>
      <MusicPlayer isTense={isTenseScene} />
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${(currentView === 'cover' || currentView === 'success') && coverImageUrl ? 'opacity-60' : 'opacity-0'}`} 
        style={{ pointerEvents: 'none' }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-8rem)]">
        <header className="text-center mb-8" style={currentView === 'cover' ? headerStyle : {}}>
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-300 tracking-wider">
            Dungeons and Dragons Adventure
          </h1>
          <p className="text-amber-400/80 mt-2 italic text-lg">An epic dark fantasy saga, powered by AI</p>
        </header>
        
        <main className="w-full flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentView === 'login' && (
              <motion.div
                key="login"
                /* Avoid blank main area for one frame on first paint (boot → React handoff). */
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <LoginGatePage
                  mailStatus={mailStatus}
                  authError={error}
                  authSuccess={authSuccessLine}
                  isAuthBusy={authBusy}
                  email={authEmail}
                  name={authName}
                  password={authPassword}
                  verificationCode={verificationCode}
                  signupEmailVerified={signupEmailVerified}
                  resetCode={resetCode}
                  newPassword={newPassword}
                  inviteCode={roomJoinCode}
                  campaignId={campaignId}
                  roomId={roomId}
                  onEmailChange={setAuthEmail}
                  onNameChange={setAuthName}
                  onPasswordChange={setAuthPassword}
                  onVerificationCodeChange={setVerificationCode}
                  onResetCodeChange={setResetCode}
                  onNewPasswordChange={setNewPassword}
                  onInviteCodeChange={setRoomJoinCode}
                  onRegister={() => handleRegister()}
                  onLogin={() => handleLogin()}
                  onSendVerificationCode={() => handleSendVerificationCode()}
                  onVerifyEmail={() => handleVerifyEmail()}
                  onForgotPassword={() => handleForgotPassword()}
                  onResetPassword={() => handleResetPassword()}
                  onQuickStart={handleQuickStart}
                  onJoinRoom={() => handleJoinRoom().catch((e) => setError(String(e?.message || e)))}
                  onRefreshChat={() => handleLoadMessages().catch((e) => setError(String(e?.message || e)))}
                />
              </motion.div>
            )}
            {currentView === 'cover' && (
              <motion.div 
                key="cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={contentContainerStyle} 
                className="w-full flex-grow flex"
              >
                  <CoverPage 
                    onStart={handleStartGame} 
                    isLoading={isGeneratingCover} 
                    error={error} 
                    onConnectKey={handleOpenKeySelection}
                    isApiKeySelected={isApiKeySelected}
                    apiKeyInput={apiKeyInput}
                    apiKeyStatus={getApiKeyStatus(apiKeyInput, isApiKeySelected)}
                    onSaveApiKey={handleSaveApiKey}
                    maskKeyDisplay={apiKeyInput === DEMO_API_KEY}
                  />
              </motion.div>
            )}

            {currentView === 'creation' && (
              <motion.div 
                key="creation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                  <CharacterCreation 
                  onSubmit={handleCharacterCreation} 
                  isLoading={isLoading} 
                  error={error} 
                  />
              </motion.div>
            )}
            
            {currentView === 'game' && (
              <motion.div 
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {renderGameContent()}
              </motion.div>
            )}

            {currentView === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <SuccessPage
                  objective={gameState?.objective}
                  summary={gameState?.log?.[gameState.log.length - 1] || gameState?.sceneText}
                  players={gameState?.players || []}
                  onContinue={handleContinueFromSuccess}
                  onRestart={handleRestartCampaign}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {isVideoPlanModalOpen && (
            <VideoPlanModal 
                plan={videoPlan}
                isLoading={isGeneratingVideo}
                onClose={() => setIsVideoPlanModalOpen(false)}
            />
        )}
      </div>
    </div>
  );
};

export default App;
