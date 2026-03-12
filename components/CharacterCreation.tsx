
import React, { useState, FormEvent, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import * as geminiService from '../services/geminiService';

const ROLES = ['Warrior', 'Rogue', 'Mage', 'Cleric', 'Noble', 'Trickster', 'Balanced'];
const MAX_PLAYERS = 8;

const DEMO_PARTY: Array<{ name: string; role: string; backstory: string }> = [
  { name: 'Kael Emberforge', role: 'Warrior', backstory: 'A scarred vanguard who swore to protect the weak after his clan fell to drakes.' },
  { name: 'Lyra Nightwind', role: 'Rogue', backstory: 'A shadow-step scout who steals relics from tyrants and maps forgotten tunnels.' },
  { name: 'Mira Starwell', role: 'Mage', backstory: 'An arcane prodigy chasing visions that point toward the Dragon\'s Eye.' },
];

const makeFallbackPortrait = (seed: string) => {
  const safeSeed = encodeURIComponent(seed || 'adventurer');
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${safeSeed}`;
};


export interface PlayerData {
    name: string;
    role: string;
    backstory: string;
    portraitPrompt: string;
    portraitUrl: string | null;
    isGeneratingPortrait: boolean;
}

interface CharacterCreationProps {
  onSubmit: (players: PlayerData[]) => void;
  isLoading: boolean;
  error: string | null;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onSubmit, isLoading, error }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [players, setPlayers] = useState<PlayerData[]>(() => 
    Array.from({ length: 1 }, () => ({ 
        name: '', 
        role: ROLES[0], 
        backstory: '', 
        portraitPrompt: '', 
        portraitUrl: null,
        isGeneratingPortrait: false
    }))
  );
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const handlePlayerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setPlayerCount(count);
    setPlayers(currentPlayers => {
        const newPlayers = [...currentPlayers];
        while (newPlayers.length < count) {
            newPlayers.push({ 
                name: '', 
                role: ROLES[0], 
                backstory: '', 
                portraitPrompt: '', 
                portraitUrl: null,
                isGeneratingPortrait: false
            });
        }
        return newPlayers.slice(0, count);
    });
  };

  const applyDemoParty = () => {
    const demoCount = DEMO_PARTY.length;
    setPlayerCount(demoCount);
    const demoPlayers: PlayerData[] = DEMO_PARTY.map((p, index) => ({
      name: p.name,
      role: p.role,
      backstory: p.backstory,
      portraitPrompt: `A ${p.role.toLowerCase()} with the following traits: ${p.backstory}`,
      portraitUrl: makeFallbackPortrait(`${p.name}-${p.role}-${index}`),
      isGeneratingPortrait: false,
    }));
    setPlayers(demoPlayers);
  };

  const handlePlayerChange = (index: number, field: keyof Omit<PlayerData, 'portraitUrl' | 'isGeneratingPortrait'>, value: string) => {
    const newPlayers = [...players];
    const playerToUpdate = { ...newPlayers[index], [field]: value };

    // Auto-update prompt when role or backstory changes, but only if the user hasn't customized it yet or it's empty.
    if ((field === 'role' || field === 'backstory')) {
        playerToUpdate.portraitPrompt = `A ${playerToUpdate.role.toLowerCase()} with the following traits: ${playerToUpdate.backstory}`;
    }
    
    newPlayers[index] = playerToUpdate;
    setPlayers(newPlayers);
  };

  const applyFallbackPortrait = useCallback((index: number) => {
    const fallback = makeFallbackPortrait(`${players[index].name || 'hero'}-${players[index].role}-${index}`);
    setPlayers(current => current.map((p, i) => i === index ? { ...p, portraitUrl: fallback, isGeneratingPortrait: false } : p));
  }, [players]);

  const handleGeneratePortrait = useCallback(async (index: number) => {
    if (!players[index].portraitPrompt) {
        alert("Please provide a prompt for the portrait.");
        return;
    }
    
    // Set loading state for this specific player
    setPlayers(current => current.map((p, i) => i === index ? { ...p, isGeneratingPortrait: true } : p));

    try {
      const imageUrl = await geminiService.generateCharacterPortrait(players[index].portraitPrompt);
      setPlayers(current => current.map((p, i) => i === index ? { ...p, portraitUrl: imageUrl, isGeneratingPortrait: false } : p));
    } catch (err) {
      console.error(`Failed to generate portrait for player ${index + 1}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      applyFallbackPortrait(index);
      alert(`AI portrait failed: ${errorMessage}\n\nA placeholder portrait was used so you can continue.`);
    }
  }, [players, applyFallbackPortrait]);

  const handleUsePlaceholder = useCallback((index: number) => {
    applyFallbackPortrait(index);
  }, [applyFallbackPortrait]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (players.some(p => !p.name.trim() || !p.backstory.trim())) {
      alert("Please fill out a name and backstory for every player.");
      return;
    }

    const finalizedPlayers = players.map((p, index) => ({
      ...p,
      portraitUrl: p.portraitUrl || makeFallbackPortrait(`${p.name || 'hero'}-${p.role}-${index}`),
    }));

    setPlayers(finalizedPlayers);
    onSubmit(finalizedPlayers);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto bg-gray-900/50 backdrop-blur-sm p-8 rounded-lg border border-amber-800/20 shadow-lg shadow-amber-800/5 animate-fade-in">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
          @keyframes fade-in-fast {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        `}</style>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-amber-300 mb-2">Assemble Your Party</h2>
          <p className="text-amber-400/80">Define your heroes and their stories to begin the quest.</p>
        </div>
        
        {error && <div className="text-center text-red-400 p-4 mb-6 bg-red-900/20 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="max-w-xs mx-auto">
            <label htmlFor="player-count-select" className="block text-lg font-medium text-amber-200 mb-2 text-center">Number of Players</label>
            <select
              id="player-count-select"
              value={playerCount}
              onChange={handlePlayerCountChange}
              className="w-full bg-gray-800/70 text-gray-200 py-3 px-4 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              disabled={isLoading}
            >
              {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyDemoParty}
              disabled={isLoading}
              className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Use Demo Party (Fast Start)
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {players.map((player, index) => (
                  <div key={index} className="bg-gray-800/40 p-5 rounded-lg border border-amber-800/20 flex flex-col gap-4">
                      <h3 className="text-xl font-semibold text-amber-300 border-b border-amber-800/20 pb-2">Player {index + 1}</h3>
                      
                      <div>
                          <label htmlFor={`player-name-${index}`} className="block text-md font-medium text-amber-200 mb-1">Name</label>
                          <input
                              type="text"
                              id={`player-name-${index}`}
                              value={player.name}
                              onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                              placeholder={`e.g., Kaelan the Brave`}
                              className="w-full bg-gray-700/70 text-gray-200 py-2 px-3 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              disabled={isLoading}
                              required
                          />
                      </div>
                      <div>
                          <label htmlFor={`role-select-${index}`} className="block text-md font-medium text-amber-200 mb-1">Role</label>
                          <select
                              id={`role-select-${index}`}
                              value={player.role}
                              onChange={(e) => handlePlayerChange(index, 'role', e.target.value)}
                              className="w-full bg-gray-700/70 text-gray-200 py-2 px-3 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              disabled={isLoading}
                          >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      </div>
                      <div>
                          <label htmlFor={`backstory-input-${index}`} className="block text-md font-medium text-amber-200 mb-1">Backstory</label>
                          <textarea
                              id={`backstory-input-${index}`}
                              rows={3}
                              value={player.backstory}
                              onChange={(e) => handlePlayerChange(index, 'backstory', e.target.value)}
                              placeholder="e.g., A disgraced knight seeking redemption..."
                              className="w-full bg-gray-700/70 text-gray-200 py-2 px-3 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              disabled={isLoading}
                              required
                          />
                      </div>
                      <div className="mt-2 p-4 bg-gray-900/50 rounded-lg border border-amber-800/20">
                          <h4 className="text-lg font-semibold text-amber-300 mb-3">Character Portrait</h4>
                          <div className='flex gap-4 items-start'>
                              <div className='flex-grow space-y-2'>
                                  <label htmlFor={`portrait-prompt-${index}`} className="block text-sm font-medium text-amber-200">Portrait Prompt</label>
                                  <textarea
                                      id={`portrait-prompt-${index}`}
                                      rows={3}
                                      value={player.portraitPrompt}
                                      onChange={(e) => handlePlayerChange(index, 'portraitPrompt', e.target.value)}
                                      placeholder="Describe your character's appearance..."
                                      className="w-full text-sm bg-gray-700/70 text-gray-200 py-2 px-3 rounded-lg border border-amber-700/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      disabled={isLoading || player.isGeneratingPortrait}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleGeneratePortrait(index)}
                                        className="flex-1 bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md shadow-red-800/20 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center h-10"
                                        disabled={isLoading || player.isGeneratingPortrait || !player.portraitPrompt}
                                    >
                                        {player.isGeneratingPortrait ? <LoadingSpinner/> : (player.portraitUrl ? 'Regenerate' : 'Generate Portrait')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUsePlaceholder(index)}
                                        className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isLoading || player.isGeneratingPortrait}
                                        title="Use a placeholder avatar (no API key needed)"
                                    >
                                        Use Placeholder
                                    </button>
                                  </div>
                              </div>
                              <div className="w-24 h-24 bg-gray-800/50 rounded-lg flex items-center justify-center border border-amber-700/50 shrink-0">
                                  {player.isGeneratingPortrait ? (
                                      <LoadingSpinner />
                                  ) : player.portraitUrl ? (
                                      <button type="button" onClick={() => setEnlargedImageUrl(player.portraitUrl)} className="w-full h-full cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md">
                                          <img src={player.portraitUrl} alt={`Portrait of ${player.name}`} className="w-full h-full object-cover rounded-md group-hover:opacity-80 transition-opacity" />
                                      </button>
                                  ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-md shadow-amber-700/20 disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[200px] h-[50px]"
              disabled={isLoading || players.some(p => !p.name.trim() || !p.backstory.trim())}
            >
              {isLoading ? <LoadingSpinner /> : 'Begin Adventure'}
            </button>
          </div>
        </form>
      </div>

      {enlargedImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fade-in-fast"
          onClick={() => setEnlargedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged character portrait view"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={enlargedImageUrl}
              alt="Enlarged character portrait"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImageUrl(null)}
              className="absolute top-[-1rem] right-[-1rem] bg-gray-800 text-white rounded-full p-1.5 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close enlarged image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CharacterCreation;
