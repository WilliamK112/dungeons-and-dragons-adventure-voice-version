import React from 'react';
import { motion } from 'motion/react';
import { Player } from '../types';

interface SuccessPageProps {
  objective?: string;
  summary?: string;
  players?: Player[];
  onContinue: () => void;
  onRestart: () => void;
}

/** Applause and crowd decoration around the success card */
const ApplaudingCrowd: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-900/15 via-transparent to-transparent" />
    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 sm:gap-6 text-3xl sm:text-4xl opacity-25">
      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>👏</span>
      <span className="animate-bounce" style={{ animationDelay: '120ms' }}>👏</span>
      <span className="animate-bounce" style={{ animationDelay: '240ms' }}>👏</span>
      <span className="animate-bounce" style={{ animationDelay: '80ms' }}>🎉</span>
      <span className="animate-bounce" style={{ animationDelay: '200ms' }}>👏</span>
      <span className="animate-bounce" style={{ animationDelay: '40ms' }}>👏</span>
    </div>
  </div>
);

const SuccessPage: React.FC<SuccessPageProps> = ({
  objective,
  summary,
  players = [],
  onContinue,
  onRestart,
}) => {
  const survivors = players.filter(p => (p?.stats?.health ?? 0) > 0);

  return (
    <div className="relative w-full min-h-[60vh] flex items-center justify-center py-8">
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="relative">
          <ApplaudingCrowd />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/70 via-black/70 to-emerald-950/50 p-8 shadow-2xl shadow-amber-900/20"
      >
        <div className="absolute inset-0 pointer-events-none opacity-25" style={{backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(251,191,36,.6), transparent 40%), radial-gradient(circle at 80% 70%, rgba(16,185,129,.5), transparent 35%)'}} />

        <div className="relative z-10 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1 text-xs font-semibold tracking-[0.18em] text-amber-200 uppercase">
            Quest Complete
          </p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-amber-100">
            Objective Achieved
          </h2>
          <p className="mt-3 text-amber-200/90 text-lg">
            The final objective has been completed. Your party has etched a new legend into the halls of the Sunken Citadel.
          </p>

          <div className="mt-6 rounded-xl border border-amber-300/25 bg-black/35 p-4 text-left">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-300/80">Final Objective</p>
            <p className="mt-1 text-amber-100 font-medium">{objective || "Retrieve the Dragon's Eye from the Sunken Citadel."}</p>
            <p className="mt-3 text-sm text-amber-100/90 leading-relaxed">
              {summary || 'The party overcame the final trial and secured victory. The realm will remember this campaign for ages.'}
            </p>

            <div className="mt-4 rounded-lg border border-amber-200/20 bg-amber-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200/80">Victory Tableau</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-amber-100/90 text-sm">
                <span>🏟️ The crowd erupts in applause</span>
                <span>👏👏👏</span>
                <span>🎉</span>
                <span className="text-amber-200/80">Survivors: {survivors.length}/{players.length || 0}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {survivors.length > 0 ? survivors.map((p) => (
                  <div key={p.name} className="group relative rounded-lg border border-emerald-300/30 bg-emerald-900/20 p-2 text-center">
                    <div className="relative mx-auto h-14 w-14">
                      <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-lg scale-125 group-hover:scale-[1.4] transition-transform" />
                      <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-amber-400/60 ring-2 ring-amber-300/30 shadow-lg bg-black/40">
                        {p.portraitUrl ? (
                          <img src={p.portraitUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-xl">🛡️</div>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-emerald-100 truncate">{p.name}</p>
                    <p className="text-[11px] text-emerald-200/80">HP {p.stats.health}</p>
                    <p className="text-[11px] text-emerald-200/80">😊 Victor</p>
                  </div>
                )) : (
                  <div className="col-span-full text-xs text-amber-100/80">No surviving portraits available for this scene.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onContinue}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-emerald-100 font-semibold hover:bg-emerald-500/30 transition"
            >
              Continue Adventure
            </button>
            <button
              onClick={onRestart}
              className="rounded-lg border border-amber-400/45 bg-amber-500/20 px-5 py-2.5 text-amber-100 font-semibold hover:bg-amber-500/30 transition"
            >
              Start New Campaign
            </button>
          </div>
        </div>
      </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
