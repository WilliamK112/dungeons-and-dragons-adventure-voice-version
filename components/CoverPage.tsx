import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'motion/react';
import { Shield, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

interface CoverPageProps {
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
  onConnectKey: () => void;
  isApiKeySelected: boolean;
}

const CoverPage: React.FC<CoverPageProps> = ({ onStart, isLoading, error, onConnectKey, isApiKeySelected }) => {
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

        {!isLoading && !error && (
            <div className="flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="bg-amber-700 hover:bg-amber-600 text-white text-2xl font-bold py-5 px-12 rounded-lg transition-all duration-300 shadow-lg shadow-amber-700/30 hover:shadow-xl hover:shadow-amber-600/40 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-50"
                >
                    Start the Game
                </motion.button>
                
                {!isApiKeySelected && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="text-amber-400/40 text-xs italic max-w-xs">
                      Note: AI-generated images and videos require a paid API key. You can play with text-only for free.
                    </p>
                    <button
                      onClick={onConnectKey}
                      className="text-amber-500/60 hover:text-amber-400 text-xs underline flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Connect Paid Key for Visuals
                    </button>
                  </motion.div>
                )}
                
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