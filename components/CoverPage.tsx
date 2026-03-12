import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'motion/react';
import { Shield, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface CoverPageProps {
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
  onConnectKey: () => void;
  isApiKeySelected: boolean;
  apiKeyInput: string;
  onSaveApiKey: (key: string) => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ onStart, isLoading, error, onConnectKey, isApiKeySelected, apiKeyInput, onSaveApiKey }) => {
  const [draftKey, setDraftKey] = useState(apiKeyInput || '');

  useEffect(() => {
    setDraftKey(apiKeyInput || '');
  }, [apiKeyInput]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="flex flex-col items-center justify-center h-full w-full text-center"
    >
      <div className="flex flex-col items-center gap-8">
        {isLoading && (
          <div className="flex flex-col items-center">
              <LoadingSpinner />
              <motion.p 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-amber-300 mt-4 text-lg italic"
              >
                Forging a legendary saga...
              </motion.p>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center text-red-400 p-6 mb-6 bg-red-900/40 rounded-xl border border-red-800/30 max-w-md backdrop-blur-sm"
          >
              <div className="flex justify-center mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="font-semibold text-lg">An ancient evil prevents entry...</p>
              <p className="text-sm mt-2 opacity-80">{error}</p>
          </motion.div>
        )}

        {!isLoading && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left bg-black/35 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-2 text-amber-200">
                    <Shield className="w-4 h-4" />
                    <p className="font-semibold">Enter your Gemini API key to unlock AI features</p>
                  </div>
                  <p className="text-amber-100/70 text-xs mb-3">
                    Stored locally in your browser for this app. Never committed to GitHub.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={draftKey}
                      onChange={(e) => setDraftKey(e.target.value)}
                      placeholder="AIza..."
                      className="flex-1 rounded-lg bg-zinc-900/80 border border-amber-400/30 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      onClick={() => onSaveApiKey(draftKey)}
                      className="rounded-lg bg-amber-700 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save Key
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Get Gemini API key (Google AI Studio)
                    </a>
                    {!isApiKeySelected && (
                      <button
                        onClick={onConnectKey}
                        className="text-amber-400/80 hover:text-amber-300 underline inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Use AI Studio key selector
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="bg-amber-700 hover:bg-amber-600 text-white text-2xl font-bold py-5 px-12 rounded-lg transition-all duration-300 shadow-lg shadow-amber-700/30 hover:shadow-xl hover:shadow-amber-600/40 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-50"
                >
                    Start the Game
                </motion.button>

                <motion.p 
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-amber-400/60 text-sm tracking-widest uppercase"
                >
                    An Adventure Awaits
                </motion.p>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default CoverPage;