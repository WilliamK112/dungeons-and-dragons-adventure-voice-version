import { Player } from '../types';

const BASE_TICKS = 5000;

export function isDead(player: Player): boolean {
  return (player.stats?.health ?? 0) <= 0;
}

export function timePerAction(agility: number): number {
  return Math.floor(BASE_TICKS / Math.max(agility, 1));
}

export function getNextPlayerIndex(
  players: Player[],
  nextTurnAt: Record<string, number>
): number {
  if (players.length === 0) return -1;

  const alive = players
    .map((p, index) => ({ index, player: p, nextTurnAt: nextTurnAt[p.name] ?? 0 }))
    .filter((s) => !isDead(s.player));

  if (alive.length === 0) return -1;

  alive.sort((a, b) => {
    const timeDiff = a.nextTurnAt - b.nextTurnAt;
    if (timeDiff !== 0) return timeDiff;
    return b.player.stats.agility - a.player.stats.agility;
  });

  return alive[0].index;
}

export function initNextTurnAt(players: Player[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of players) out[p.name] = 0;
  return out;
}

export function advanceTurnAfterAction(
  nextTurnAt: Record<string, number>,
  actingPlayerName: string,
  agility: number
): Record<string, number> {
  const current = nextTurnAt[actingPlayerName] ?? 0;
  const cost = timePerAction(agility);
  return { ...nextTurnAt, [actingPlayerName]: current + cost };
}

export interface InitiativeSlot {
  player: Player;
  index: number;
  nextTurnAt: number;
  isCurrent: boolean;
}

export function getInitiativeQueue(
  players: Player[],
  nextTurnAt: Record<string, number>,
  currentPlayerIndex: number
): InitiativeSlot[] {
  if (players.length === 0) return [];

  const alive = players
    .map((p, index) => ({ index, player: p, nextTurnAt: nextTurnAt[p.name] ?? 0 }))
    .filter((s) => !isDead(s.player));
  const dead = players
    .map((p, index) => ({ index, player: p, nextTurnAt: nextTurnAt[p.name] ?? 0 }))
    .filter((s) => isDead(s.player));

  alive.sort((a, b) => {
    const timeDiff = a.nextTurnAt - b.nextTurnAt;
    if (timeDiff !== 0) return timeDiff;
    return b.player.stats.agility - a.player.stats.agility;
  });

  return [...alive, ...dead].map((slot) => ({
    player: slot.player,
    index: slot.index,
    nextTurnAt: slot.nextTurnAt,
    isCurrent: slot.index === currentPlayerIndex,
  }));
}
