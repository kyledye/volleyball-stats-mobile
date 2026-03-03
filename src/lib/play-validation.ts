// Play type and result validation utilities

import { PlayType, PlayResult } from "../types/api";

/**
 * Valid results for each play type
 */
export const VALID_RESULTS_BY_TYPE: Record<PlayType, PlayResult[]> = {
  SERVE: ["ACE", "IN_PLAY", "ERROR"],
  ATTACK: ["KILL", "IN_PLAY", "ERROR"],
  BLOCK: ["KILL", "IN_PLAY", "ERROR"],
  PASS: ["PASS_4", "PASS_3", "PASS_2", "PASS_1", "OVER_PASS"],
  SERVE_RECEIVE: ["PASS_4", "PASS_3", "PASS_2", "PASS_1", "OVER_PASS"],
  SECOND_TOUCH: ["ASSIST", "PLAYABLE_SET", "PLAYABLE_BUMP", "POOR", "ERROR"],
  FREE_BALL: ["KILL", "IN_PLAY", "ERROR"],
  OPP_ERROR: ["OPP_ERROR"],
};

/**
 * Play types that can score points (KILL, ACE, or OPP_ERROR result)
 */
export const SCORING_PLAY_TYPES: PlayType[] = [
  "SERVE",
  "ATTACK",
  "BLOCK",
  "FREE_BALL",
  "OPP_ERROR",
];

/**
 * Play types for attacking/hitting
 */
export const HITTING_PLAY_TYPES: PlayType[] = ["ATTACK", "FREE_BALL"];

/**
 * Play types for passing
 */
export const PASSING_PLAY_TYPES: PlayType[] = ["PASS", "SERVE_RECEIVE"];

/**
 * Check if a result is valid for a given play type
 */
export function isValidResultForType(
  playType: PlayType,
  result: PlayResult
): boolean {
  const validResults = VALID_RESULTS_BY_TYPE[playType];
  if (!validResults) return false;
  return validResults.includes(result);
}

/**
 * Get all valid results for a play type
 */
export function getValidResultsForType(playType: PlayType): PlayResult[] {
  return VALID_RESULTS_BY_TYPE[playType] || [];
}

/**
 * Check if a play type is a hitting play
 */
export function isHittingPlay(playType: PlayType): boolean {
  return HITTING_PLAY_TYPES.includes(playType);
}

/**
 * Check if a play type is a passing play
 */
export function isPassingPlay(playType: PlayType): boolean {
  return PASSING_PLAY_TYPES.includes(playType);
}

/**
 * Check if a play type is a serving play
 */
export function isServingPlay(playType: PlayType): boolean {
  return playType === "SERVE";
}

/**
 * Check if a play type is a setting/second touch play
 */
export function isSecondTouchPlay(playType: PlayType): boolean {
  return playType === "SECOND_TOUCH";
}

/**
 * Check if a play type can score points
 */
export function canScorePoints(playType: PlayType): boolean {
  return SCORING_PLAY_TYPES.includes(playType);
}

/**
 * Validate a complete play object
 */
export function validatePlay(play: {
  type: string;
  result: string;
  playerId?: string | null;
  teamId?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if play type is valid
  const validTypes = Object.keys(VALID_RESULTS_BY_TYPE);
  if (!validTypes.includes(play.type)) {
    errors.push(`Invalid play type: ${play.type}`);
  }

  // Check if result is valid for the play type
  if (validTypes.includes(play.type)) {
    const playType = play.type as PlayType;
    const result = play.result as PlayResult;
    if (!isValidResultForType(playType, result)) {
      errors.push(
        `Invalid result "${play.result}" for play type "${play.type}". ` +
          `Valid results are: ${getValidResultsForType(playType).join(", ")}`
      );
    }
  }

  // Scoring plays should have a player (except OPP_ERROR)
  if (
    play.type !== "OPP_ERROR" &&
    canScorePoints(play.type as PlayType) &&
    ["ACE", "KILL"].includes(play.result) &&
    !play.playerId
  ) {
    errors.push("Scoring plays (ACE, KILL) must have a player assigned");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get display name for a play type
 */
export function getPlayTypeDisplayName(playType: PlayType): string {
  const names: Record<PlayType, string> = {
    SERVE: "Serve",
    ATTACK: "Attack",
    BLOCK: "Block",
    PASS: "Pass",
    SERVE_RECEIVE: "Serve Receive",
    SECOND_TOUCH: "Second Touch",
    FREE_BALL: "Free Ball",
    OPP_ERROR: "Opponent Error",
  };
  return names[playType] || playType;
}

/**
 * Get display name for a play result
 */
export function getPlayResultDisplayName(result: PlayResult): string {
  const names: Record<PlayResult, string> = {
    ACE: "Ace",
    KILL: "Kill",
    IN_PLAY: "In Play",
    ERROR: "Error",
    OPP_ERROR: "Opponent Error",
    PASS_4: "Pass 4 (Perfect)",
    PASS_3: "Pass 3 (Good)",
    PASS_2: "Pass 2 (Playable)",
    PASS_1: "Pass 1 (Out of System)",
    OVER_PASS: "Over Pass",
    ASSIST: "Assist",
    PLAYABLE_SET: "Playable Set",
    PLAYABLE_BUMP: "Playable Bump",
    POOR: "Poor",
  };
  return names[result] || result;
}

/**
 * Get a short abbreviation for a play result (for compact display)
 */
export function getPlayResultAbbreviation(result: PlayResult): string {
  const abbreviations: Record<PlayResult, string> = {
    ACE: "A",
    KILL: "K",
    IN_PLAY: "IP",
    ERROR: "E",
    OPP_ERROR: "OE",
    PASS_4: "P4",
    PASS_3: "P3",
    PASS_2: "P2",
    PASS_1: "P1",
    OVER_PASS: "OP",
    ASSIST: "AST",
    PLAYABLE_SET: "PS",
    PLAYABLE_BUMP: "PB",
    POOR: "PR",
  };
  return abbreviations[result] || result;
}
