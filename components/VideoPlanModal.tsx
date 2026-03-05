

import React from 'react';
import { VideoPlan } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlanModalProps {
  plan: VideoPlan | null;
  isLoading: boolean;
  onClose: () => void;
}

const VideoPlanModal: React.FC<VideoPlanModalProps> = ({ plan, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-amber-800/30 rounded-lg shadow-2xl shadow-amber-800/10 w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-2xl font-bold text-amber-300">{plan ? plan.title : 'Generating Video Plan'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-full">
              <LoadingSpinner />
              <p className="text-amber-400 mt-4">Analyzing narrative log... generating shots...</p>
            </div>
          ) : plan ? (
            <div className="space-y-6">
              <p className="text-center text-lg text-gray-400 mb-6">Total Duration: <span className="font-bold text-amber-300">{plan.total_duration_s} seconds</span></p>
              {plan.shots.map((shot) => (
                <div key={shot.shot_number} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-semibold text-amber-400 mb-2">Shot {shot.shot_number} <span className="text-sm font-normal text-gray-400">({shot.duration_s}s)</span></h3>
                  <div>
                    <strong className="text-gray-300 block mb-1">Visual Prompt:</strong>
                    <p className="font-mono text-sm bg-gray-900 p-2 rounded text-green-300">{shot.prompt}</p>
                  </div>
                  <div className="mt-3">
                    <strong className="text-gray-300 block mb-1">Voiceover Script:</strong>
                    <p className="italic text-gray-400">"{shot.vo_script}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-red-400">Failed to generate video plan. Please try again.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlanModal;