import React from 'react';

interface D20RollerProps {
  value: number | null;
  isRolling: boolean;
  currentPlayerName?: string;
  previousForCurrent?: number | null;
}

const D20Roller: React.FC<D20RollerProps> = ({ value, isRolling, currentPlayerName, previousForCurrent }) => {
  return (
    <div className="mb-4 p-3 rounded-lg border border-cyan-700/40 bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-300">System D20</p>
          <p className="text-[11px] text-cyan-200/80">Random d20 roll is used for action judgement.</p>
          {currentPlayerName && previousForCurrent != null && (
            <p className="text-[11px] text-violet-300 mt-1">
              {currentPlayerName}'s previous roll: <span className="font-bold">{previousForCurrent}</span>
            </p>
          )}
        </div>
        <div className={`relative w-16 h-16 flex items-center justify-center ${isRolling ? 'animate-pulse' : ''}`}>
          <div className="absolute inset-0" style={{
            clipPath: 'polygon(50% 2%, 95% 28%, 95% 72%, 50% 98%, 5% 72%, 5% 28%)',
            background: 'linear-gradient(135deg,#0f172a,#1e293b)',
            border: '2px solid rgba(34,211,238,0.65)',
            boxShadow: '0 0 14px rgba(34,211,238,0.35)',
          }} />
          <span className="relative z-10 text-cyan-200 font-bold text-xl">
            {isRolling ? '…' : (value ?? '-')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default D20Roller;
