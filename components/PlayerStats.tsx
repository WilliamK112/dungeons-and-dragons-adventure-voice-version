import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { isDead } from '../utils/turnOrder';

/** 名字在固定宽度内完整显示，超出则等比例缩小字号 */
const ScalableName: React.FC<{ name: string; maxWidthPx: number; className?: string }> = ({ name, maxWidthPx, className = '' }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const adjust = () => {
    const span = spanRef.current;
    const container = containerRef.current;
    if (!span || !container) return;
    span.style.fontSize = '';
    const maxW = container.clientWidth || maxWidthPx;
    if (span.scrollWidth > maxW) {
      const scale = maxW / span.scrollWidth;
      const basePx = parseFloat(getComputedStyle(span).fontSize);
      span.style.fontSize = `${basePx * scale}px`;
    }
  };

  useEffect(() => {
    adjust();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(adjust);
    ro.observe(container);
    return () => ro.disconnect();
  }, [name, maxWidthPx]);

  return (
    <div ref={containerRef} className="overflow-visible" style={{ maxWidth: maxWidthPx }}>
      <span ref={spanRef} className={`whitespace-nowrap block ${className}`}>
        {name}
      </span>
    </div>
  );
};

interface PlayerStatsListProps {
  players: Player[];
  currentPlayerIndex: number;
  statDeltas?: Record<string, Record<string, number>>;
}

interface PlayerStatsCardProps {
  player: Player;
  isActive: boolean;
  dead: boolean;
  statDeltas?: Record<string, number>;
  onPortraitClick?: (player: Player) => void;
}

const StatBar: React.FC<{ label: string; value: number; color: string; isProgress?: boolean; delta?: number }> = ({ label, value, color, isProgress = false, delta }) => {
  const colorMap: { [key: string]: string } = {
    'text-green-400': 'from-green-500 to-green-400',
    'text-blue-400': 'from-blue-500 to-blue-400',
    'text-red-400': 'from-red-500 to-red-400',
    'text-yellow-400': 'from-yellow-500 to-yellow-400',
    'text-purple-400': 'from-purple-500 to-purple-400',
    'text-pink-400': 'from-pink-500 to-pink-400',
    'text-amber-400': 'from-amber-500 to-amber-400',
  };

  const gradient = colorMap[color] || 'from-gray-500 to-gray-400';
  const percentage = isProgress ? value % 100 : Math.min(value, 100);

  return (
    <div className="min-w-0">
      <div className="flex justify-between items-center gap-2 mb-1 min-w-0">
        <span className="text-xs font-medium text-amber-200 truncate shrink-0">{label}</span>
        <span className="flex items-center gap-1 shrink-0">
          <span className={`text-xs font-bold ${color}`}>{value}</span>
          {delta !== undefined && delta !== 0 && (
            <span className={`text-[10px] font-semibold ${color} whitespace-nowrap`} title={delta > 0 ? '增加' : '减少'}>
              {delta > 0 ? '↑' : '↓'}
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1">
        <div className={`h-1 rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
      </div>
    </div>
  );
};

const DeadOverlay: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-black/10 to-red-950/35" />
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(127,29,29,0.9))' }}>
      {/* ancient ritual ring */}
      <circle cx="50" cy="50" r="40" fill="none" stroke="#7f1d1d" strokeOpacity={0.45} strokeWidth="2.5" strokeDasharray="3 4" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#991b1b" strokeOpacity={0.4} strokeWidth="1.5" />

      {/* solemn rune-like cross */}
      <line x1="20" y1="18" x2="80" y2="82" stroke="#b91c1c" strokeOpacity={0.7} strokeWidth="8" strokeLinecap="square" />
      <line x1="80" y1="18" x2="20" y2="82" stroke="#b91c1c" strokeOpacity={0.7} strokeWidth="8" strokeLinecap="square" />

      {/* corner rune marks */}
      <path d="M14 14 L24 14 L24 18" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M86 14 L76 14 L76 18" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M14 86 L24 86 L24 82" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M86 86 L76 86 L76 82" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
    </svg>
  </div>
);

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ player, isActive, dead, statDeltas: playerDeltas, onPortraitClick }) => {
  const { stats } = player;
  return (
    <div className={`relative bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border shadow-lg min-w-0 overflow-hidden ${dead ? 'opacity-70 border-red-500/70' : isActive ? 'border-amber-500 shadow-amber-500/20' : 'border-amber-800/20 shadow-amber-800/5'}`}>
      {dead && <DeadOverlay />}
      <div className='flex justify-between items-start gap-2 mb-3'>
        <div className="min-w-0 flex-1">
          <ScalableName name={player.name} maxWidthPx={110} className="text-base font-bold text-amber-300" />
          {isActive && !dead && <span className="text-[10px] font-bold bg-amber-500 text-gray-900 px-1.5 py-0.5 rounded-full">CURRENT TURN</span>}
          {dead && <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">DEAD</span>}
        </div>
        {player.portraitUrl && (
          <button
            type="button"
            onClick={() => onPortraitClick?.(player)}
            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-amber-500/50 shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer hover:opacity-90 transition"
          >
            <img
              src={player.portraitUrl}
              alt={`${player.name}'s portrait`}
              className="w-full h-full object-cover"
            />
          </button>
        )}
      </div>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <StatBar label="Health" value={stats.health} color="text-green-400" delta={playerDeltas?.health} />
          <StatBar label="Mana" value={stats.mana} color="text-blue-400" delta={playerDeltas?.mana} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatBar label="Strength" value={stats.strength} color="text-red-400" delta={playerDeltas?.strength} />
          <StatBar label="Agility" value={stats.agility} color="text-yellow-400" delta={playerDeltas?.agility} />
          <StatBar label="Intellect" value={stats.intellect} color="text-purple-400" delta={playerDeltas?.intellect} />
          <StatBar label="Charisma" value={stats.charisma} color="text-pink-400" delta={playerDeltas?.charisma} />
        </div>
        <StatBar label="Luck" value={stats.luck} color="text-amber-400" delta={playerDeltas?.luck} />
        <StatBar label="Experience" value={stats.xp} color="text-amber-400" isProgress={true} delta={playerDeltas?.xp} />

        <div className="pt-1.5 border-t border-amber-800/20">
          <h3 className="text-xs font-semibold text-amber-200 mb-1">Inventory</h3>
          {stats.inventory.length > 0 ? (
            <ul className="space-y-0.5 text-[11px]">
              {stats.inventory.map((item, index) => (
                <li key={index} className="bg-gray-800/50 py-0.5 px-1.5 rounded list-inside marker:text-amber-400 truncate">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-xs">Empty</p>
          )}
        </div>
        <div className="pt-1.5 border-t border-amber-800/20">
          <h3 className="text-xs font-semibold text-amber-200 mb-1">Reputation</h3>
          {stats.rep && stats.rep.length > 0 ? (
            <div className="space-y-0.5 text-[11px]">
              {stats.rep.map(({ faction, value }) => (
                <div key={faction} className="flex justify-between items-center bg-gray-800/50 py-0.5 px-1.5 rounded">
                  <span>{faction}</span>
                  <span className={`font-bold ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-xs">No factions met</p>
          )}
        </div>
      </div>
    </div>
  );
};

const PlayerStatsList: React.FC<PlayerStatsListProps> = ({ players, currentPlayerIndex, statDeltas = {} }) => {
  const [expandedPlayer, setExpandedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedPlayer(null);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  if (!players || players.length === 0) return null;

  const currentPlayer = players[currentPlayerIndex];
  const sortedPlayers = [...players].sort((a, b) => {
    const aDead = isDead(a);
    const bDead = isDead(b);
    if (aDead && !bDead) return 1;
    if (!aDead && bDead) return -1;
    return 0;
  });

  return (
    <aside className="w-full lg:w-2/5 min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
        {sortedPlayers.map((player) => {
          const dead = isDead(player);
          return (
            <PlayerStatsCard
              key={player.name}
              player={player}
              isActive={!dead && currentPlayer?.name === player.name}
              dead={dead}
              statDeltas={statDeltas[player.name]}
              onPortraitClick={setExpandedPlayer}
            />
          );
        })}
      </div>

      {expandedPlayer?.portraitUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedPlayer(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setExpandedPlayer(null)}
          aria-label="Close portrait"
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedPlayer.portraitUrl}
              alt={`${expandedPlayer.name}'s portrait`}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
            />
            <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent py-2 px-4 text-amber-200 font-semibold text-center">
              {expandedPlayer.name}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PlayerStatsList;
