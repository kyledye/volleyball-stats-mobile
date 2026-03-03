// Stats aggregation utilities

import {
  calculateHittingRating,
  calculateServingRating,
  calculatePassingRating,
  calculateSecondTouchRating,
  calculateOverallRating,
} from "./rating-calculations";

import {
  HittingBreakdown,
  ServingBreakdown,
  PassingBreakdown,
  SecondTouchBreakdown,
  RatingResult,
} from "../types/stats";

// Type aliases for rating results
export type HittingRating = RatingResult<HittingBreakdown>;
export type ServingRating = RatingResult<ServingBreakdown>;
export type PassingRating = RatingResult<PassingBreakdown>;
export type SecondTouchRating = RatingResult<SecondTouchBreakdown>;

export interface Play {
  type: string;
  result: string;
  playerId?: string | null;
  teamId?: string;
}

export interface PlayerStats {
  playerId: string;
  plays: Play[];
  hitting: HittingRating;
  serving: ServingRating;
  passing: PassingRating;
  secondTouch: SecondTouchRating;
  overallRating: number | null;
}

export interface TeamStats {
  teamId: string;
  plays: Play[];
  hitting: HittingRating;
  serving: ServingRating;
  passing: PassingRating;
  secondTouch: SecondTouchRating;
  overallRating: number | null;
}

/**
 * Group plays by player ID
 */
export function groupPlaysByPlayer(
  plays: Play[]
): Map<string, Play[]> {
  const grouped = new Map<string, Play[]>();

  for (const play of plays) {
    if (play.playerId) {
      const existing = grouped.get(play.playerId) || [];
      existing.push(play);
      grouped.set(play.playerId, existing);
    }
  }

  return grouped;
}

/**
 * Group plays by team ID
 */
export function groupPlaysByTeam(plays: Play[]): Map<string, Play[]> {
  const grouped = new Map<string, Play[]>();

  for (const play of plays) {
    if (play.teamId) {
      const existing = grouped.get(play.teamId) || [];
      existing.push(play);
      grouped.set(play.teamId, existing);
    }
  }

  return grouped;
}

/**
 * Calculate stats for a single player
 */
export function calculatePlayerStats(
  playerId: string,
  plays: Play[]
): PlayerStats {
  const hitting = calculateHittingRating(plays);
  const serving = calculateServingRating(plays);
  const passing = calculatePassingRating(plays);
  const secondTouch = calculateSecondTouchRating(plays);
  const overallRating = calculateOverallRating({
    hitting,
    serving,
    passing,
    secondTouch,
  });

  return {
    playerId,
    plays,
    hitting,
    serving,
    passing,
    secondTouch,
    overallRating,
  };
}

/**
 * Calculate stats for all players from a list of plays
 */
export function calculateAllPlayerStats(plays: Play[]): PlayerStats[] {
  const grouped = groupPlaysByPlayer(plays);
  const stats: PlayerStats[] = [];

  for (const [playerId, playerPlays] of grouped) {
    stats.push(calculatePlayerStats(playerId, playerPlays));
  }

  return stats;
}

/**
 * Calculate stats for a team
 */
export function calculateTeamStats(
  teamId: string,
  plays: Play[]
): TeamStats {
  const hitting = calculateHittingRating(plays);
  const serving = calculateServingRating(plays);
  const passing = calculatePassingRating(plays);
  const secondTouch = calculateSecondTouchRating(plays);
  const overallRating = calculateOverallRating({
    hitting,
    serving,
    passing,
    secondTouch,
  });

  return {
    teamId,
    plays,
    hitting,
    serving,
    passing,
    secondTouch,
    overallRating,
  };
}

/**
 * Filter plays by type
 */
export function filterPlaysByType(plays: Play[], types: string[]): Play[] {
  return plays.filter((p) => types.includes(p.type));
}

/**
 * Filter plays by result
 */
export function filterPlaysByResult(plays: Play[], results: string[]): Play[] {
  return plays.filter((p) => results.includes(p.result));
}

/**
 * Count plays by type
 */
export function countPlaysByType(plays: Play[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const play of plays) {
    const count = counts.get(play.type) || 0;
    counts.set(play.type, count + 1);
  }

  return counts;
}

/**
 * Count plays by result
 */
export function countPlaysByResult(plays: Play[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const play of plays) {
    const count = counts.get(play.result) || 0;
    counts.set(play.result, count + 1);
  }

  return counts;
}

/**
 * Get top performers by rating type
 */
export function getTopPerformers(
  stats: PlayerStats[],
  ratingType: "hitting" | "serving" | "passing" | "secondTouch" | "overall",
  limit: number = 5
): PlayerStats[] {
  const withRating = stats.filter((s) => {
    if (ratingType === "overall") {
      return s.overallRating !== null;
    }
    return s[ratingType].rating !== null;
  });

  const sorted = withRating.sort((a, b) => {
    if (ratingType === "overall") {
      return (b.overallRating || 0) - (a.overallRating || 0);
    }
    return (b[ratingType].rating || 0) - (a[ratingType].rating || 0);
  });

  return sorted.slice(0, limit);
}

/**
 * Get players with minimum attempts
 */
export function filterByMinAttempts(
  stats: PlayerStats[],
  ratingType: "hitting" | "serving" | "passing" | "secondTouch",
  minAttempts: number
): PlayerStats[] {
  return stats.filter((s) => s[ratingType].count >= minAttempts);
}

/**
 * Calculate totals across multiple stats
 */
export function calculateTotals(stats: PlayerStats[]): {
  totalPlays: number;
  totalKills: number;
  totalErrors: number;
  totalAces: number;
  totalAssists: number;
} {
  let totalPlays = 0;
  let totalKills = 0;
  let totalErrors = 0;
  let totalAces = 0;
  let totalAssists = 0;

  for (const s of stats) {
    totalPlays += s.plays.length;
    totalKills += s.hitting.breakdown.kills;
    totalErrors +=
      s.hitting.breakdown.errors +
      s.serving.breakdown.errors +
      s.secondTouch.breakdown.errors;
    totalAces += s.serving.breakdown.aces;
    totalAssists += s.secondTouch.breakdown.assists;
  }

  return {
    totalPlays,
    totalKills,
    totalErrors,
    totalAces,
    totalAssists,
  };
}

/**
 * Calculate efficiency (kills - errors) / attempts
 */
export function calculateEfficiency(
  kills: number,
  errors: number,
  attempts: number
): number | null {
  if (attempts === 0) return null;
  return (kills - errors) / attempts;
}

/**
 * Compare two players' stats
 */
export function comparePlayerStats(
  a: PlayerStats,
  b: PlayerStats,
  metric: "hitting" | "serving" | "passing" | "secondTouch" | "overall"
): number {
  if (metric === "overall") {
    return (a.overallRating || 0) - (b.overallRating || 0);
  }
  return (a[metric].rating || 0) - (b[metric].rating || 0);
}

/**
 * Get stat summary text
 */
export function getStatSummary(stats: PlayerStats): string {
  const parts: string[] = [];

  if (stats.hitting.count > 0) {
    parts.push(`${stats.hitting.breakdown.kills}K`);
  }
  if (stats.serving.count > 0) {
    parts.push(`${stats.serving.breakdown.aces}A`);
  }
  if (stats.secondTouch.count > 0) {
    parts.push(`${stats.secondTouch.breakdown.assists}AST`);
  }

  return parts.join(" | ") || "No stats";
}
