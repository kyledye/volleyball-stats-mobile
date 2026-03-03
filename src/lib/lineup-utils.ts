// Lineup management utilities

import { isBackRow, isFrontRow } from "./substitution-rules";

export interface CourtPlayer {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: number; // 1-6 court position
  isLibero?: boolean;
}

export interface BenchPlayer {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  isLibero?: boolean;
}

export interface LineupEntry {
  playerId: string;
  isStarter: boolean;
  isLibero: boolean;
  servingOrder?: number;
}

/**
 * Get the player at a specific court position
 */
export function getPlayerAtCourtPosition(
  onCourt: CourtPlayer[],
  position: number
): CourtPlayer | undefined {
  return onCourt.find((p) => p.position === position);
}

/**
 * Get the server (player at position 1)
 */
export function getServer(onCourt: CourtPlayer[]): CourtPlayer | undefined {
  return getPlayerAtCourtPosition(onCourt, 1);
}

/**
 * Get front row players (positions 2, 3, 4)
 */
export function getFrontRowPlayers(onCourt: CourtPlayer[]): CourtPlayer[] {
  return onCourt.filter((p) => isFrontRow(p.position));
}

/**
 * Get back row players (positions 1, 5, 6)
 */
export function getBackRowPlayers(onCourt: CourtPlayer[]): CourtPlayer[] {
  return onCourt.filter((p) => isBackRow(p.position));
}

/**
 * Convert court positions to a positions record
 */
export function courtToPositionsRecord(
  onCourt: CourtPlayer[]
): Record<number, string> {
  const positions: Record<number, string> = {};
  for (const player of onCourt) {
    positions[player.position] = player.id;
  }
  return positions;
}

/**
 * Convert positions record to court players (requires player data)
 */
export function positionsRecordToCourt(
  positions: Record<number, string>,
  players: Map<string, Omit<CourtPlayer, "position">>
): CourtPlayer[] {
  const court: CourtPlayer[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const playerId = positions[pos];
    if (playerId) {
      const playerData = players.get(playerId);
      if (playerData) {
        court.push({
          ...playerData,
          position: pos,
        });
      }
    }
  }
  return court;
}

/**
 * Swap two players on court
 */
export function swapCourtPositions(
  onCourt: CourtPlayer[],
  position1: number,
  position2: number
): CourtPlayer[] {
  return onCourt.map((player) => {
    if (player.position === position1) {
      return { ...player, position: position2 };
    }
    if (player.position === position2) {
      return { ...player, position: position1 };
    }
    return player;
  });
}

/**
 * Substitute a bench player for a court player
 */
export function substitutePlayer(
  onCourt: CourtPlayer[],
  bench: BenchPlayer[],
  courtPlayerId: string,
  benchPlayerId: string
): { onCourt: CourtPlayer[]; bench: BenchPlayer[] } {
  const courtPlayer = onCourt.find((p) => p.id === courtPlayerId);
  const benchPlayer = bench.find((p) => p.id === benchPlayerId);

  if (!courtPlayer || !benchPlayer) {
    return { onCourt, bench };
  }

  const newOnCourt = onCourt.map((p) => {
    if (p.id === courtPlayerId) {
      return {
        id: benchPlayer.id,
        number: benchPlayer.number,
        firstName: benchPlayer.firstName,
        lastName: benchPlayer.lastName,
        position: courtPlayer.position,
        isLibero: benchPlayer.isLibero,
      };
    }
    return p;
  });

  const newBench = bench.map((p) => {
    if (p.id === benchPlayerId) {
      return {
        id: courtPlayer.id,
        number: courtPlayer.number,
        firstName: courtPlayer.firstName,
        lastName: courtPlayer.lastName,
        isLibero: courtPlayer.isLibero,
      };
    }
    return p;
  });

  return { onCourt: newOnCourt, bench: newBench };
}

/**
 * Check if a lineup is valid (all positions filled, no duplicates)
 */
export function isValidLineup(onCourt: CourtPlayer[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if all 6 positions are filled
  if (onCourt.length !== 6) {
    errors.push(`Lineup must have exactly 6 players, found ${onCourt.length}`);
  }

  // Check all positions 1-6 are represented
  const positions = new Set(onCourt.map((p) => p.position));
  for (let i = 1; i <= 6; i++) {
    if (!positions.has(i)) {
      errors.push(`Position ${i} is not filled`);
    }
  }

  // Check for duplicate players
  const playerIds = onCourt.map((p) => p.id);
  const uniqueIds = new Set(playerIds);
  if (playerIds.length !== uniqueIds.size) {
    errors.push("Duplicate player in lineup");
  }

  // Check for duplicate positions
  if (positions.size !== onCourt.length) {
    errors.push("Duplicate court position");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Find the libero in a lineup
 */
export function findLibero(
  onCourt: CourtPlayer[],
  bench: BenchPlayer[]
): CourtPlayer | BenchPlayer | undefined {
  const onCourtLibero = onCourt.find((p) => p.isLibero);
  if (onCourtLibero) return onCourtLibero;

  return bench.find((p) => p.isLibero);
}

/**
 * Check if libero is currently on court
 */
export function isLiberoOnCourt(onCourt: CourtPlayer[]): boolean {
  return onCourt.some((p) => p.isLibero);
}

/**
 * Get valid positions for libero entry
 */
export function getLiberoEntryPositions(onCourt: CourtPlayer[]): number[] {
  return onCourt.filter((p) => isBackRow(p.position)).map((p) => p.position);
}

/**
 * Sort players by jersey number
 */
export function sortByNumber<T extends { number: number }>(players: T[]): T[] {
  return [...players].sort((a, b) => a.number - b.number);
}

/**
 * Sort players by position (for display)
 */
export function sortByPosition<T extends { position: number }>(
  players: T[]
): T[] {
  return [...players].sort((a, b) => a.position - b.position);
}

/**
 * Create lineup entries from player IDs
 */
export function createLineupEntries(
  starterIds: string[],
  benchIds: string[],
  liberoId?: string
): LineupEntry[] {
  const entries: LineupEntry[] = [];

  starterIds.forEach((playerId, index) => {
    entries.push({
      playerId,
      isStarter: true,
      isLibero: playerId === liberoId,
      servingOrder: index + 1,
    });
  });

  benchIds.forEach((playerId) => {
    entries.push({
      playerId,
      isStarter: false,
      isLibero: playerId === liberoId,
    });
  });

  return entries;
}

/**
 * Extract starter IDs from lineup entries
 */
export function getStarterIds(lineup: LineupEntry[]): string[] {
  return lineup
    .filter((e) => e.isStarter)
    .sort((a, b) => (a.servingOrder || 0) - (b.servingOrder || 0))
    .map((e) => e.playerId);
}

/**
 * Extract bench player IDs from lineup entries
 */
export function getBenchIds(lineup: LineupEntry[]): string[] {
  return lineup.filter((e) => !e.isStarter).map((e) => e.playerId);
}

/**
 * Get libero ID from lineup entries
 */
export function getLiberoId(lineup: LineupEntry[]): string | undefined {
  return lineup.find((e) => e.isLibero)?.playerId;
}
