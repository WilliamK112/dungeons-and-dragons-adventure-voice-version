
import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { Choice, PlanningResponse, QueuedConsequence } from '../types';
import LoadingSpinner from './LoadingSpinner';
import D20Roller from './D20Roller';
import { generateStoryNarrationAudio } from '../services/geminiService';

interface GameDisplayProps {
  sceneText: string;
  choices: Choice[];
  onChoiceSelect: (choiceId: number) => void;
  isLoading: boolean;
  sceneImageUrl: string | null;
  isGeneratingImage: boolean;
  sceneVideoUrl: string | null;
  isGeneratingVideoScene: boolean;
  onGenerateVideo: () => void;
  onCustomActionSubmit: (customAction: string) => void;
  currentPlayerName: string;
  recentOutcome?: string;
  recentRoll?: string;
  recentEvent?: string;
  currentD20Roll?: number | null;
  isRollingD20?: boolean;
  previousD20ForCurrentPlayer?: number | null;
  objective?: string;
  threatLevel?: number;
  queuedConsequences?: QueuedConsequence[];
  planning?: PlanningResponse | null;
  isPlanning?: boolean;
  onPlanAction: () => void;
  onApplyPlanOption: (optionId: string) => void;
}

const NARRATION_PRESETS = [
  {
    id: 'deep',
    label: 'Deep Male',
    backend: 'onyx',
    instructions: 'Dark fantasy narrator. Low, warm baritone. Calm, mysterious, intimate. Avoid bright or upbeat tone. Keep pacing steady and cinematic.',
    fallback: { pitch: 0.45, rate: 0.68, volume: 0.65, hints: ['baritone', 'deep', 'narrator', 'ralph', 'victor', 'daniel'] }
  },
  {
    id: 'whisper',
    label: 'Whisper Mysterious',
    backend: 'onyx',
    instructions: 'Whisper-like dark storyteller. Soft, close, secretive, and eerie. Keep volume gentle and emotional intensity restrained.',
    fallback: { pitch: 0.4, rate: 0.62, volume: 0.55, hints: ['whisper', 'narrator', 'deep', 'male'] }
  },
  {
    id: 'female',
    label: 'Soft Female',
    backend: 'nova',
    instructions: 'Warm, clear, gentle female narration. Calm and immersive, suitable for fantasy storytelling.',
    fallback: { pitch: 1.08, rate: 0.9, volume: 0.85, hints: ['samantha', 'karen', 'victoria', 'female'] }
  },
] as const;

const splitNarrationChunks = (text: string, maxChars = 900): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const sentences = normalized.split(/(?<=[.!?。！？])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (!sentence) continue;
    if (!current) {
      current = sentence;
      continue;
    }
    if ((current + ' ' + sentence).length <= maxChars) {
      current += ` ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

const getActionTypeTag = (text: string): 'Action' | 'Move' | 'Bonus' | 'Reaction' | null => {
  const match = text.match(/^\[(Action|Move|Bonus|Reaction)\]/i);
  if (!match) return null;
  const normalized = match[1].toLowerCase();
  if (normalized === 'action') return 'Action';
  if (normalized === 'move') return 'Move';
  if (normalized === 'bonus') return 'Bonus';
  return 'Reaction';
};

const GameDisplay: React.FC<GameDisplayProps> = ({ 
    sceneText, 
    choices, 
    onChoiceSelect, 
    isLoading, 
    sceneImageUrl, 
    isGeneratingImage,
    sceneVideoUrl,
    isGeneratingVideoScene,
    onGenerateVideo,
    onCustomActionSubmit,
    currentPlayerName,
    recentOutcome,
    recentRoll,
    recentEvent,
    currentD20Roll,
    isRollingD20,
    previousD20ForCurrentPlayer,
    objective,
    threatLevel,
    queuedConsequences,
    planning,
    isPlanning,
    onPlanAction,
    onApplyPlanOption
}) => {
  const showVideoButton = !isGeneratingImage && !isGeneratingVideoScene && sceneImageUrl && !sceneVideoUrl;
  const [customAction, setCustomAction] = useState('');
  const [isNarrating, setIsNarrating] = useState(false);
  const [isNarrationLoading, setIsNarrationLoading] = useState(false);
  const [voicePreset, setVoicePreset] = useState<(typeof NARRATION_PRESETS)[number]['id']>('deep');
  const [narrationProgress, setNarrationProgress] = useState<{ index: number; total: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const narrationStopRef = useRef(false);

  useEffect(() => {
    return () => {
      narrationStopRef.current = true;
      window.speechSynthesis?.cancel();
      if (audioRef.current) audioRef.current.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  const fallbackToSpeechSynthesis = (text: string) => {
    const preset = NARRATION_PRESETS.find(p => p.id === voicePreset) || NARRATION_PRESETS[1];
    const { pitch, rate, volume, hints } = preset.fallback;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    const voices = synth.getVoices();
    const pick = (h: readonly string[]) => voices.find(v => {
      const key = `${v.name} ${v.voiceURI}`.toLowerCase();
      return h.some(x => key.includes(x));
    });
    const voice = pick(hints) || pick(['male', 'female', 'english']) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    synth.speak(utterance);
  };

  const toggleStoryNarration = async () => {
    if (isNarrating) {
      narrationStopRef.current = true;
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsNarrating(false);
      setNarrationProgress(null);
      return;
    }

    const cleanText = sceneText?.trim();
    if (!cleanText || isNarrationLoading) return;

    narrationStopRef.current = false;
    const chunks = splitNarrationChunks(cleanText, 900).slice(0, 6);
    if (!chunks.length) return;

    setNarrationProgress({ index: 1, total: chunks.length });
    setIsNarrationLoading(true);
    setIsNarrating(true);

    try {
      const preset = NARRATION_PRESETS.find(p => p.id === voicePreset) || NARRATION_PRESETS[0];

      for (let i = 0; i < chunks.length; i++) {
        if (narrationStopRef.current) break;
        setNarrationProgress({ index: i + 1, total: chunks.length });

        const audioUrl = await generateStoryNarrationAudio(chunks[i], {
          voice: preset.backend,
          model: 'gpt-4o-mini-tts',
          format: 'mp3',
          timeoutMs: 12000,
          instructions: preset.instructions,
        });

        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('Audio playback failed'));
          audio.play().catch(reject);
        });
      }
    } catch (error) {
      console.error('Narration error:', error);
      if (!narrationStopRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        fallbackToSpeechSynthesis(cleanText);
      } else if (!narrationStopRef.current) {
        alert('Failed to generate narration. Please check backend OPENAI_API_KEY and try again.');
      }
    } finally {
      setIsNarrationLoading(false);
      setIsNarrating(false);
      setNarrationProgress(null);
      narrationStopRef.current = false;
    }
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customAction.trim() || isLoading) return;
    onCustomActionSubmit(customAction.trim());
    setCustomAction('');
  };

  return (
    <main className="w-full lg:w-3/5 bg-gray-900/50 backdrop-blur-sm p-8 rounded-lg border border-amber-800/20 shadow-lg shadow-amber-800/5">
      
      <div className="relative mb-6 aspect-video bg-gray-800/50 rounded-lg overflow-hidden flex justify-center items-center border border-amber-800/20">
        {isGeneratingVideoScene ? (
            <div className="flex flex-col items-center text-center p-4">
                <LoadingSpinner />
                <p className="text-amber-400 mt-2 text-sm italic">The future is taking shape... (This can take a few minutes)</p>
            </div>
        ) : sceneVideoUrl ? (
            <video src={sceneVideoUrl} className="w-full h-full object-contain" controls autoPlay loop muted />
        ) : isGeneratingImage ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="text-amber-400 mt-2 text-sm italic">Conjuring a vision...</p>
          </div>
        ) : sceneImageUrl ? (
          <img src={sceneImageUrl} alt="A digital painting illustrating the current scene." className="w-full h-full object-cover" />
        ) : (
            <div className="text-gray-500 p-4 text-center">
                <p>The mists of creation swirl, awaiting a vision...</p>
            </div>
        )}

        {showVideoButton && (
            <button
                onClick={onGenerateVideo}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGeneratingVideoScene}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                <span>Animate Scene</span>
            </button>
        )}
      </div>

      <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-amber-300">
        {/* Using whitespace-pre-wrap to preserve formatting from the AI's narrative text. */}
        <p className="whitespace-pre-wrap min-h-[150px]">{sceneText}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {NARRATION_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setVoicePreset(p.id)}
                className={`text-[11px] px-2 py-1 rounded border transition ${
                  voicePreset === p.id
                    ? 'bg-indigo-600/50 border-indigo-500 text-indigo-100'
                    : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-indigo-600/50'
                }`}
                title={`Voice: ${p.label}`}
              >
              {p.label}
            </button>
            ))}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={toggleStoryNarration}
            disabled={!sceneText?.trim() || isNarrationLoading}
            className="bg-indigo-950/70 hover:bg-indigo-900 text-indigo-100 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg border border-indigo-600/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={!sceneText?.trim() ? 'No story text to narrate yet' : 'Narrate current story'}
          >
            {isNarrationLoading ? 'Preparing Voice…' : isNarrating ? 'Stop Narration' : 'Listen to Story'}
          </button>
          {narrationProgress && (
            <span className="text-[11px] text-indigo-300/90">Auto queue: part {narrationProgress.index}/{narrationProgress.total}</span>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-800/40 border border-amber-700/30 rounded-lg p-3">
          <p className="text-amber-400 uppercase tracking-wide mb-1">Objective</p>
          <p className="text-amber-100">{objective || 'Push deeper into the Sunken Citadel.'}</p>
        </div>
        <div className="bg-slate-800/40 border border-amber-700/30 rounded-lg p-3">
          <p className="text-amber-400 uppercase tracking-wide mb-1">Threat Level</p>
          <p className="text-amber-100">{typeof threatLevel === 'number' ? `${threatLevel}/5` : '2/5'}</p>
        </div>
        <div className="bg-slate-800/40 border border-amber-700/30 rounded-lg p-3">
          <p className="text-amber-400 uppercase tracking-wide mb-1">Queued Consequences</p>
          <p className="text-amber-100">{queuedConsequences?.length ? `${queuedConsequences.length} pending` : 'None pending'}</p>
        </div>
      </div>

      <div className="mt-8 border-t border-amber-800/20 pt-6">
        <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-amber-300">It's <span className="text-amber-100">{currentPlayerName}'s</span> turn.</h2>
            <p className="text-amber-400/80">What do you do?</p>
            <p className="text-xs text-amber-600/80 mt-1">Turn order is speed-based — higher agility acts more often.</p>
            {recentOutcome && (
              <p className="mt-2 text-sm text-emerald-300/90 italic">Consequence: {recentOutcome}</p>
            )}
            {recentRoll && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[10px] uppercase tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded px-1.5 py-0.5">Roll</span>
                <p className="text-xs text-cyan-300/90 font-mono">{recentRoll}</p>
                <span className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 border ${/SUCCESS/i.test(recentRoll) ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border-rose-400/40'}`}>
                  {/SUCCESS/i.test(recentRoll) ? 'Success' : 'Fail'}
                </span>
              </div>
            )}
            {recentEvent && (
              <p className="mt-1 text-xs text-violet-300/90">✨ {recentEvent}</p>
            )}
        </div>
        <D20Roller
          value={currentD20Roll ?? null}
          isRolling={Boolean(isRollingD20)}
          currentPlayerName={currentPlayerName}
          previousForCurrent={previousD20ForCurrentPlayer ?? null}
        />
        {isLoading ? (
          <p className="text-amber-400 italic text-center">The Dungeon Master is pondering your fate...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {choices.map((choice) => {
                const actionTag = getActionTypeTag(choice.text);
                const cleanText = choice.text.replace(/^\[(Action|Move|Bonus|Reaction)\]\s*/i, '');
                return (
                <button
                  key={choice.id}
                  onClick={() => onChoiceSelect(choice.id)}
                  disabled={isLoading}
                  className="w-full text-left bg-slate-800/50 hover:bg-slate-700/70 text-amber-200 font-medium py-3 px-5 rounded-lg transition-all duration-200 border border-amber-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionTag && (
                    <span className="inline-block mr-2 mb-1 text-[10px] uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded px-1.5 py-0.5">
                      {actionTag}
                    </span>
                  )}
                  <span>{cleanText}</span>
                </button>
              )})}
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-6">
                <div className="text-center text-sm text-amber-400/80 mb-3">...or write your own action.</div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={customAction}
                        onChange={(e) => setCustomAction(e.target.value)}
                        placeholder="e.g., 'Use my rope to climb down the cliff...'"
                        className="flex-grow bg-gray-800/70 text-gray-200 py-2 px-4 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition disabled:opacity-50"
                        disabled={isLoading}
                        aria-label="Custom action input"
                    />
                    <button
                        type="submit"
                        className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md shadow-amber-700/20 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={isLoading || !customAction.trim()}
                        aria-label="Submit custom action"
                    >
                        Act
                    </button>
                </div>
            </form>

            <div className="mt-6 border border-violet-700/30 bg-violet-950/20 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-violet-200 font-semibold">Tactical Planning Mode</h3>
                <button
                  onClick={onPlanAction}
                  disabled={isLoading || Boolean(isPlanning)}
                  className="text-sm bg-violet-700 hover:bg-violet-800 text-white font-semibold py-1.5 px-3 rounded disabled:bg-gray-600"
                >
                  {isPlanning ? 'Planning…' : 'Generate Plan'}
                </button>
              </div>
              {planning?.brief ? <p className="text-sm text-violet-100 mb-3">{planning.brief}</p> : <p className="text-sm text-violet-200/80">Generate a tactical plan to preview risk/reward before committing.</p>}
              {planning?.tacticalOptions?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planning.tacticalOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onApplyPlanOption(opt.id)}
                      disabled={isLoading}
                      className="text-left p-3 rounded-lg border border-violet-600/40 bg-slate-900/40 hover:bg-slate-800/50"
                    >
                      <p className="text-violet-100 font-semibold">{opt.title} <span className="text-[10px] text-violet-300">[{opt.successChance}]</span></p>
                      <p className="text-xs text-slate-200 mt-1">{opt.approach}</p>
                      <p className="text-[11px] text-emerald-300 mt-2">Upside: {opt.upside}</p>
                      <p className="text-[11px] text-rose-300">Risk now: {opt.immediateRisk}</p>
                      <p className="text-[11px] text-amber-300">Later: {opt.futureRisk}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default GameDisplay;