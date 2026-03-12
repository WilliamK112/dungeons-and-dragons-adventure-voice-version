import React from 'react';
import { Player } from '../types';
import { isDead } from '../utils/turnOrder';

interface PlayerStatsListProps {
  players: Player[];
  currentPlayerIndex: number;
}

interface PlayerStatsCardProps {
  player: Player;
  isActive: boolean;
  dead: boolean;
}

const StatBar: React.FC<{ label: string; value: number; color: string; isProgress?: boolean }> = ({ label, value, color, isProgress = false }) => {
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
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-amber-200">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
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

      {/* engraved inner highlights */}
      <line x1="24" y1="22" x2="76" y2="78" stroke="#fecaca" strokeOpacity={0.25} strokeWidth="1.8" strokeLinecap="square" />
      <line x1="76" y1="22" x2="24" y2="78" stroke="#fecaca" strokeOpacity={0.25} strokeWidth="1.8" strokeLinecap="square" />

      {/* corner rune marks */}
      <path d="M14 14 L24 14 L24 18" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M86 14 L76 14 L76 18" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M14 86 L24 86 L24 82" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
      <path d="M86 86 L76 86 L76 82" stroke="#7f1d1d" strokeOpacity={0.75} strokeWidth="2" fill="none" />
    </svg>
  </div>
);

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ player, isActive, dead }) => {
  const { stats } = player;
  return (
    <div className={`relative bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg border shadow-lg transition-all duration-300 ${dead ? 'opacity-70 border-red-500/70' : isActive ? 'border-amber-500 shadow-amber-500/20' : 'border-amber-800/20 shadow-amber-800/5'}`}>
      {dead && <DeadOverlay />}
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h2 className="text-xl font-bold text-amber-300">{player.name}</h2>
          {isActive && !dead && <span className="text-xs font-bold bg-amber-500 text-gray-900 px-2 py-1 rounded-full">CURRENT TURN</span>}
          {dead && <span className="text-xs font-bold bg-red-600 text-white px-2 py-1 rounded-full">DEAD</span>}
        </div>
        {player.portraitUrl && (
          <img
            src={player.portraitUrl}
            alt={`${player.name}'s portrait`}
            className="w-20 h-20 rounded-lg object-cover border-2 border-amber-500/50 shadow-md"
          />
        )}
      </div>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <StatBar label="Health" value={stats.health} color="text-green-400" />
          <StatBar label="Mana" value={stats.mana} color="text-blue-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBar label="Strength" value={stats.strength} color="text-red-400" />
          <StatBar label="Agility" value={stats.agility} color="text-yellow-400" />
          <StatBar label="Intellect" value={stats.intellect} color="text-purple-400" />
          <StatBar label="Charisma" value={stats.charisma} color="text-pink-400" />
        </div>
        <StatBar label="Luck" value={stats.luck} color="text-amber-400" />
        <StatBar label="Experience" value={stats.xp} color="text-amber-400" isProgress={true} />

        <div className="pt-2 border-t border-amber-800/20">
          <h3 className="text-md font-semibold text-amber-200 mb-2">Inventory</h3>
          {stats.inventory.length > 0 ? (
            <ul className="space-y-1 text-xs">
              {stats.inventory.map((item, index) => (
                <li key={index} className="bg-gray-800/50 p-1 px-2 rounded list-inside marker:text-amber-400">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic text-xs">Empty</p>
          )}
        </div>
        <div className="pt-2 border-t border-amber-800/20">
          <h3 className="text-md font-semibold text-amber-200 mb-2">Reputation</h3>
          {stats.rep && stats.rep.length > 0 ? (
            <div className="space-y-1 text-xs">
              {stats.rep.map(({ faction, value }) => (
                <div key={faction} className="flex justify-between items-center bg-gray-800/50 p-1 px-2 rounded">
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

const PlayerStatsList: React.FC<PlayerStatsListProps> = ({ players, currentPlayerIndex }) => {
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
    <aside className="w-full lg:w-1/3 space-y-4">
      {sortedPlayers.map((player) => {
        const dead = isDead(player);
        return (
          <PlayerStatsCard
            key={player.name}
            player={player}
            isActive={!dead && currentPlayer?.name === player.name}
            dead={dead}
          />
        );
      })}
    </aside>
  );
};

export default PlayerStatsList;
