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

export interface TacticalOption {
  id: string;
  title: string;
  approach: string;
  successChance: 'Low' | 'Medium' | 'High';
  upside: string;
  immediateRisk: string;
  futureRisk: string;
  resourceCost: string;
}

export interface QueuedConsequence {
  id: string;
  etaTurns: number;
  title: string;
  impact: string;
  severity: number;
}

export interface GameState {
  sceneText: string;
  choices: Choice[];
  players: Player[];
  currentPlayerIndex: number;
  flags: Flag[];
  log: string[];
  objective?: string;
  threatLevel?: number;
  unresolvedHooks?: string[];
  queuedConsequences?: QueuedConsequence[];
}

export interface PlanningResponse {
  brief: string;
  tacticalOptions: TacticalOption[];
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