// Score and serving state calculation utilities

// Results that score a point for the team making the play
export const POINT_RESULTS = ["ACE", "KILL", "OPP_ERROR"] as const;

// Results that give a point to the opponent (errors)
export const ERROR_RESULTS = ["ERROR"] as const;

// Results that don't change the score
export const IN_PLAY_RESULTS = [
  "IN_PLAY",
  "PASS_4",
  "PASS_3",
  "PASS_2",
  "PASS_1",
  "OVER_PASS",
  "ASSIST",
  "PLAYABLE_SET",
  "PLAYABLE_BUMP",
  "POOR",
] as const;

export type PointResult = (typeof POINT_RESULTS)[number];
export type ErrorResult = (typeof ERROR_RESULTS)[number];
export type InPlayResult = (typeof IN_PLAY_RESULTS)[number];

export interface PlayForScoring {
  result: string;
  teamId: string;
}

/**
 * Check if a play result scores a point for the team
 */
export function isPointResult(result: string): result is PointResult {
  return POINT_RESULTS.includes(result as PointResult);
}

/**
 * Check if a play result is an error (gives point to opponent)
 */
export function isErrorResult(result: string): result is ErrorResult {
  return ERROR_RESULTS.includes(result as ErrorResult);
}

/**
 * Check if a play result is in-play (doesn't change score)
 */
export function isInPlayResult(result: string): result is InPlayResult {
  return IN_PLAY_RESULTS.includes(result as InPlayResult);
}

/**
 * Determine if a play scores a point and for which team
 * Returns { homeScored, awayScored }
 */
export function determineScoreChange(
  play: PlayForScoring,
  homeTeamId: string
): { homeScored: boolean; awayScored: boolean } {
  let homeScored = false;
  let awayScored = false;

  if (isPointResult(play.result)) {
    if (play.teamId === homeTeamId) {
      homeScored = true;
    } else {
      awayScored = true;
    }
  } else if (isErrorResult(play.result)) {
    // Error gives point to opponent
    if (play.teamId === homeTeamId) {
      awayScored = true;
    } else {
      homeScored = true;
    }
  }

  return { homeScored, awayScored };
}

/**
 * Calculate serving state from play history
 * Returns true if home team is serving, false if away team
 */
export function calculateServingState(
  plays: PlayForScoring[],
  homeTeamId: string,
  homeServesFirst: boolean
): boolean {
  let homeServing = homeServesFirst;

  for (const play of plays) {
    const { homeScored, awayScored } = determineScoreChange(play, homeTeamId);

    // Sideout occurs when receiving team scores
    if (homeScored && !homeServing) {
      homeServing = true;
    } else if (awayScored && homeServing) {
      homeServing = false;
    }
  }

  return homeServing;
}

/**
 * Calculate how many rotations occurred for home team from a list of plays
 * Returns the number of sideouts (times home team gained serve while receiving)
 */
export function calculateHomeRotationCount(
  plays: PlayForScoring[],
  homeTeamId: string,
  homeServesFirst: boolean
): number {
  let homeServing = homeServesFirst;
  let rotations = 0;

  for (const play of plays) {
    const { homeScored, awayScored } = determineScoreChange(play, homeTeamId);

    // Sideout for home team - they rotate
    if (homeScored && !homeServing) {
      homeServing = true;
      rotations++;
    } else if (awayScored && homeServing) {
      homeServing = false;
    }
  }

  return rotations;
}

/**
 * Calculate how many rotations occurred for away team from a list of plays
 * Returns the number of sideouts (times away team gained serve while receiving)
 */
export function calculateAwayRotationCount(
  plays: PlayForScoring[],
  homeTeamId: string,
  homeServesFirst: boolean
): number {
  let homeServing = homeServesFirst;
  let rotations = 0;

  for (const play of plays) {
    const { homeScored, awayScored } = determineScoreChange(play, homeTeamId);

    // Sideout for away team - they rotate
    if (awayScored && homeServing) {
      homeServing = false;
      rotations++;
    } else if (homeScored && !homeServing) {
      homeServing = true;
    }
  }

  return rotations;
}

/**
 * Calculate current score from play history
 */
export function calculateScore(
  plays: PlayForScoring[],
  homeTeamId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;

  for (const play of plays) {
    const { homeScored, awayScored } = determineScoreChange(play, homeTeamId);
    if (homeScored) homeScore++;
    if (awayScored) awayScore++;
  }

  return { homeScore, awayScore };
}

/**
 * Determine if a set is complete based on score
 * Standard volleyball: first to 25 (sets 1-4) or 15 (set 5), win by 2
 */
export function isSetComplete(
  homeScore: number,
  awayScore: number,
  setNumber: number
): boolean {
  const targetScore = setNumber >= 5 ? 15 : 25;
  const minScore = Math.min(homeScore, awayScore);
  const maxScore = Math.max(homeScore, awayScore);

  // Must reach target score and win by 2
  return maxScore >= targetScore && maxScore - minScore >= 2;
}

/**
 * Get the winner of a set (returns null if set not complete)
 */
export function getSetWinner(
  homeScore: number,
  awayScore: number,
  setNumber: number,
  homeTeamId: string,
  awayTeamId: string
): string | null {
  if (!isSetComplete(homeScore, awayScore, setNumber)) {
    return null;
  }
  return homeScore > awayScore ? homeTeamId : awayTeamId;
}

/**
 * Determine if a match is complete based on sets won
 */
export function isMatchComplete(
  homeSetsWon: number,
  awaySetsWon: number,
  matchType: "BEST_OF_3" | "BEST_OF_5"
): boolean {
  const setsToWin = matchType === "BEST_OF_3" ? 2 : 3;
  return homeSetsWon >= setsToWin || awaySetsWon >= setsToWin;
}

/**
 * Get the winner of a match (returns null if match not complete)
 */
export function getMatchWinner(
  homeSetsWon: number,
  awaySetsWon: number,
  matchType: "BEST_OF_3" | "BEST_OF_5",
  homeTeamId: string,
  awayTeamId: string
): string | null {
  if (!isMatchComplete(homeSetsWon, awaySetsWon, matchType)) {
    return null;
  }
  return homeSetsWon > awaySetsWon ? homeTeamId : awayTeamId;
}
