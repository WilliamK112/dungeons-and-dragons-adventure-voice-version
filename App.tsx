import React, { useState, useEffect, useCallback } from 'react';
import { GameState, VideoPlan, Player } from './types';
import * as geminiService from './services/geminiService';
import PlayerStatsList from './components/PlayerStats';
import GameDisplay from './components/GameDisplay';
import VideoPlanModal from './components/VideoPlanModal';
import CharacterCreation, { PlayerData } from './components/CharacterCreation';
import CoverPage from './components/CoverPage';
import MusicPlayer from './components/MusicPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { playChoiceClick, playFail, playInventoryGain, playLevelUp, playSuccess } from './utils/audioSfx';
import {
  getNextPlayerIndex,
  initNextTurnAt,
  advanceTurnAfterAction,
  getInitiativeQueue,
} from './utils/turnOrder';
import InitiativeQueue from './components/InitiativeQueue';

type ApiKeyStatus = 'missing' | 'looks-valid' | 'looks-invalid';

const getApiKeyStatus = (key: string, isSelected: boolean): ApiKeyStatus => {
  if (!key.trim()) return 'missing';
  const looksLikeGeminiKey = /^AIza[\w-]{20,}$/.test(key.trim());
  if (looksLikeGeminiKey || isSelected) return 'looks-valid';
  return 'looks-invalid';
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'cover' | 'creation' | 'game'>('cover');
  
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
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [playerNextTurnAt, setPlayerNextTurnAt] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkApiKey = async () => {
      let hasKey = false;
      try {
        const localKey = window.localStorage.getItem('gemini_api_key') || '';
        if (localKey.trim()) {
          hasKey = true;
          setApiKeyInput(localKey);
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

  const handleStartGame = () => {
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

  const handleAction = useCallback(async (getAction: (gs: GameState) => Promise<GameState>, actionContext: string) => {
    if (!gameState || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      resetMedia({ keepImage: true });
      const nextState = await getAction(gameState);
      
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

      generateAndSetImage(finalState.sceneText, finalState.players, actionContext);
    } catch (err) {
      setError('An error occurred while resolving the action. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [gameState, isLoading, generateAndSetImage, playerNextTurnAt]);

  const handleChoiceSelect = (choiceId: number) => {
    playChoiceClick();
    const choiceText = gameState?.choices.find((c) => c.id === choiceId)?.text || `Choice ${choiceId}`;
    handleAction((gs) => geminiService.resolveAction(gs, choiceId), choiceText);
  };
  
  const handleCustomActionSubmit = (customActionText: string) => {
    playChoiceClick();
    handleAction((gs) => geminiService.resolveAction(gs, null, customActionText), customActionText);
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
        <div className="flex flex-col lg:flex-row gap-8">
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
          />
          <PlayerStatsList players={gameState.players} currentPlayerIndex={gameState.currentPlayerIndex} />
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

  const appStyle: React.CSSProperties = {
    backgroundImage: (currentView === 'cover' && coverImageUrl)
        ? `url(${coverImageUrl})`
        : `linear-gradient(to bottom right, #020617, #111827)`,
    backgroundColor: '#020617', // Fallback
  };

  const recentOutcome = gameState?.log?.[gameState.log.length - 1] || '';
  const isTenseScene = /dragon|ambush|trap|blood|curse|dark|shadow|battle|danger|attack|scream/i.test(gameState?.sceneText || '');

  return (
    <div className="relative min-h-screen p-4 sm:p-8 bg-cover bg-center transition-all duration-1000" style={appStyle}>
      <MusicPlayer isTense={isTenseScene} />
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${currentView === 'cover' && coverImageUrl ? 'opacity-60' : 'opacity-0'}`} 
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
