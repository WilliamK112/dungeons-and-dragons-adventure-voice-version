import React, { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  isTense?: boolean;
}

const TRACKS = {
  calm: '/audio/explore-greensleeves.ogg',
  tense: '/audio/tense-tourdion.ogg',
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isTense = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = isTense ? TRACKS.tense : TRACKS.calm;

  useEffect(() => {
    try {
      const savedVolume = window.localStorage.getItem('bgm_volume');
      const savedMuted = window.localStorage.getItem('bgm_muted');
      const savedPlaying = window.localStorage.getItem('bgm_playing');
      if (savedVolume) setVolume(Math.min(1, Math.max(0, Number(savedVolume))));
      if (savedMuted) setIsMuted(savedMuted === 'true');
      if (savedPlaying) setIsPlaying(savedPlaying === 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(activeTrack);
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src.endsWith(activeTrack)) {
      const wasPlaying = isPlaying;
      audio.pause();
      audio.src = activeTrack;
      audio.load();
      if (wasPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }

    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }

    try {
      window.localStorage.setItem('bgm_volume', String(volume));
      window.localStorage.setItem('bgm_muted', String(isMuted));
      window.localStorage.setItem('bgm_playing', String(isPlaying));
    } catch {
      // ignore storage errors
    }

    return () => {
      audio.pause();
    };
  }, [volume, isPlaying, isMuted, activeTrack]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') setIsMuted((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio play failed:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 group"
      onMouseEnter={() => setIsVolumeSliderVisible(true)}
      onMouseLeave={() => setIsVolumeSliderVisible(false)}
    >
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className={`w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer transition-opacity duration-300 ${isVolumeSliderVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ accentColor: '#f59e0b' }}
        aria-label="Volume control"
      />

      <button
        onClick={() => setIsMuted((m) => !m)}
        className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title="Mute/Unmute (M)"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <button
        onClick={togglePlay}
        className="w-12 h-12 bg-black/60 hover:bg-black/80 text-white font-bold rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {isTense && (
        <span className="text-xs text-rose-300 bg-black/50 border border-rose-500/40 px-2 py-1 rounded-md">⚔️ Tense</span>
      )}
    </div>
  );
};

export default MusicPlayer;
