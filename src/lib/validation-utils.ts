// Validation utilities

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate player number (1-99)
 */
export function isValidPlayerNumber(number: number): boolean {
  return Number.isInteger(number) && number >= 1 && number <= 99;
}

/**
 * Validate score (non-negative integer)
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0;
}

/**
 * Validate set number (1-5)
 */
export function isValidSetNumber(setNumber: number): boolean {
  return Number.isInteger(setNumber) && setNumber >= 1 && setNumber <= 5;
}

/**
 * Validate position number (1-6)
 */
export function isValidPositionNumber(position: number): boolean {
  return Number.isInteger(position) && position >= 1 && position <= 6;
}

/**
 * Validate required string (non-empty after trimming)
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate name (letters, spaces, hyphens, apostrophes)
 */
export function isValidName(name: string): boolean {
  if (!isNonEmptyString(name)) return false;
  const nameRegex = /^[a-zA-Z][a-zA-Z\s'-]*$/;
  return nameRegex.test(name.trim());
}

/**
 * Validate team name (more permissive - allows numbers)
 */
export function isValidTeamName(name: string): boolean {
  if (!isNonEmptyString(name)) return false;
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Validate abbreviation (2-4 uppercase letters)
 */
export function isValidAbbreviation(abbr: string): boolean {
  if (!isNonEmptyString(abbr)) return false;
  const abbrRegex = /^[A-Z]{2,4}$/;
  return abbrRegex.test(abbr.trim());
}

/**
 * Validate ID format (non-empty string)
 */
export function isValidId(id: string | null | undefined): id is string {
  return isNonEmptyString(id);
}

/**
 * Validate date string (ISO format)
 */
export function isValidDateString(dateStr: string): boolean {
  if (!isNonEmptyString(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate date is not in the past
 */
export function isNotInPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

/**
 * Validate lineup has exactly 6 starters
 */
export function isValidLineupSize(starters: unknown[]): boolean {
  return Array.isArray(starters) && starters.length === 6;
}

/**
 * Validate all positions 1-6 are filled
 */
export function areAllPositionsFilled(
  positions: Record<number, string | null | undefined>
): boolean {
  for (let i = 1; i <= 6; i++) {
    if (!isValidId(positions[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Validate no duplicate players in positions
 */
export function hasNoDuplicatePlayers(
  positions: Record<number, string | null | undefined>
): boolean {
  const playerIds = Object.values(positions).filter(isValidId);
  const uniqueIds = new Set(playerIds);
  return playerIds.length === uniqueIds.size;
}

/**
 * Validate substitution count is within limits
 */
export function isValidSubCount(
  subCount: number,
  maxSubs: number = 18
): boolean {
  return Number.isInteger(subCount) && subCount >= 0 && subCount <= maxSubs;
}

/**
 * Validate match type
 */
export function isValidMatchType(
  type: string
): type is "BEST_OF_3" | "BEST_OF_5" {
  return type === "BEST_OF_3" || type === "BEST_OF_5";
}

/**
 * Validate match status
 */
export function isValidMatchStatus(
  status: string
): status is "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" {
  return ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status);
}

/**
 * Validate player position
 */
export function isValidPlayerPosition(
  position: string
): position is
  | "SETTER"
  | "OUTSIDE_HITTER"
  | "MIDDLE_BLOCKER"
  | "OPPOSITE"
  | "LIBERO"
  | "DEFENSIVE_SPECIALIST" {
  return [
    "SETTER",
    "OUTSIDE_HITTER",
    "MIDDLE_BLOCKER",
    "OPPOSITE",
    "LIBERO",
    "DEFENSIVE_SPECIALIST",
  ].includes(position);
}

/**
 * Comprehensive player validation
 */
export interface PlayerValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePlayer(player: {
  number?: number;
  firstName?: string;
  lastName?: string;
  position?: string | null;
}): PlayerValidationResult {
  const errors: string[] = [];

  if (player.number !== undefined && !isValidPlayerNumber(player.number)) {
    errors.push("Player number must be between 1 and 99");
  }

  if (player.firstName !== undefined && !isValidName(player.firstName)) {
    errors.push("First name is required and must contain only letters");
  }

  if (player.lastName !== undefined && !isValidName(player.lastName)) {
    errors.push("Last name is required and must contain only letters");
  }

  if (
    player.position !== undefined &&
    player.position !== null &&
    !isValidPlayerPosition(player.position)
  ) {
    errors.push("Invalid player position");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive team validation
 */
export function validateTeam(team: {
  name?: string;
  abbreviation?: string;
}): PlayerValidationResult {
  const errors: string[] = [];

  if (team.name !== undefined && !isValidTeamName(team.name)) {
    errors.push("Team name must be 2-100 characters");
  }

  if (
    team.abbreviation !== undefined &&
    team.abbreviation !== "" &&
    !isValidAbbreviation(team.abbreviation.toUpperCase())
  ) {
    errors.push("Abbreviation must be 2-4 uppercase letters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
