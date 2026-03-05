export interface PlayerStats {
  health: number;
  mana: number;
  strength: number;
  agility: number;
  intellect: number;
  charisma: number;
  luck: number;
  xp: number;
  rep: { faction: string; value: number }[];
  inventory: string[];
}

export interface Player {
  name: string;
  stats: PlayerStats;
  portraitUrl: string;
  description: string;
}

export interface Choice {
  id: number;
  text: string;
}

export interface Flag {
  key: string;
  value: boolean;
}

export interface GameState {
  sceneText: string;
  choices: Choice[];
  players: Player[];
  currentPlayerIndex: number;
  flags: Flag[];
  log: string[];
}

export interface Shot {
  shot_number: number;
  prompt: string;
  vo_script: string;
  duration_s: number;
}

export interface VideoPlan {
  title: string;
  total_duration_s: number;
  shots: Shot[];
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}