
import React from 'react';

const DRAGON_SRC = 'https://img.icons8.com/ios-filled/100/FAB005/dragon.png';

export interface LoadingSpinnerProps {
  /** Use `sm` inside buttons or small preview slots. */
  size?: 'sm' | 'md';
  /** “Chronicles of Shadow” line under the dragon (e.g. cover / splash). */
  showTagline?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const dragonClass =
    size === 'sm' ? 'loader-dragon loader-dragon--sm' : 'loader-dragon loader-dragon--md';

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <img src={DRAGON_SRC} className={dragonClass} alt="" />
      {showTagline ? <p className="loader-dragon-tagline">Chronicles of Shadow</p> : null}
    </div>
  );
};

export default LoadingSpinner;
