
import React, { useState, FormEvent } from 'react';
import { Choice } from '../types';
import LoadingSpinner from './LoadingSpinner';

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
}

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
    recentOutcome
}) => {
  const showVideoButton = !isGeneratingImage && !isGeneratingVideoScene && sceneImageUrl && !sceneVideoUrl;
  const [customAction, setCustomAction] = useState('');

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customAction.trim() || isLoading) return;
    onCustomActionSubmit(customAction.trim());
    setCustomAction('');
  };

  return (
    <main className="w-full lg:w-2/3 bg-gray-900/50 backdrop-blur-sm p-8 rounded-lg border border-amber-800/20 shadow-lg shadow-amber-800/5">
      
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
      <div className="mt-8 border-t border-amber-800/20 pt-6">
        <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-amber-300">It's <span className="text-amber-100">{currentPlayerName}'s</span> turn.</h2>
            <p className="text-amber-400/80">What do you do?</p>
            {recentOutcome && (
              <p className="mt-2 text-sm text-emerald-300/90 italic">Consequence: {recentOutcome}</p>
            )}
        </div>
        {isLoading ? (
          <p className="text-amber-400 italic text-center">The Dungeon Master is pondering your fate...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onChoiceSelect(choice.id)}
                  disabled={isLoading}
                  className="w-full text-left bg-slate-800/50 hover:bg-slate-700/70 text-amber-200 font-medium py-3 px-5 rounded-lg transition-all duration-200 border border-amber-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {choice.text}
                </button>
              ))}
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
          </>
        )}
      </div>
    </main>
  );
};

export default GameDisplay;