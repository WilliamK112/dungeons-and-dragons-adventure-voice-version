import React from 'react';
import { InitiativeSlot, isDead } from '../utils/turnOrder';

interface InitiativeQueueProps {
  queue: InitiativeSlot[];
}

/** Semi-transparent but obvious red X overlay for dead characters. */
const DeadOverlay: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 2px rgba(239,68,68,0.9))' }}>
      <line x1="15" y1="15" x2="85" y2="85" stroke="#ef4444" strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" />
      <line x1="85" y1="15" x2="15" y2="85" stroke="#ef4444" strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" />
    </svg>
  </div>
);

/**
 * D&D-style initiative/turn queue visibility.
 * Shows who acts when, in order. Current actor is highlighted.
 * Dead players are moved to the bottom with a red X overlay.
 */
const InitiativeQueue: React.FC<InitiativeQueueProps> = ({ queue }) => {
  if (!queue || queue.length === 0) return null;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-amber-800/30 p-3">
      <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Initiative Order
      </h3>
      <div className="flex flex-wrap gap-2">
        {queue.map((slot, i) => {
          const dead = isDead(slot.player);
          return (
            <div
              key={slot.player.name}
              className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all ${
                dead
                  ? 'bg-gray-800/30 border-red-900/50 text-gray-500'
                  : slot.isCurrent
                    ? 'bg-amber-600/30 border-amber-500 text-amber-100'
                    : 'bg-gray-800/50 border-amber-800/20 text-amber-200/80'
              }`}
            >
              {dead && <DeadOverlay />}
              <span className="text-xs font-mono text-amber-500/90 w-5">{i + 1}.</span>
              {slot.player.portraitUrl && (
                <img
                  src={slot.player.portraitUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-amber-700/50"
                />
              )}
              <span className="text-sm font-medium">{slot.player.name}</span>
              <span className="text-xs text-amber-600/80">AGI {slot.player.stats.agility}</span>
              {slot.isCurrent && !dead && (
                <span className="text-xs font-bold bg-amber-500/80 text-gray-900 px-1.5 py-0.5 rounded">NOW</span>
              )}
              {dead && (
                <span className="text-xs font-bold bg-red-600/80 text-white px-1.5 py-0.5 rounded">DEAD</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InitiativeQueue;
