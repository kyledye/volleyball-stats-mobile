// NFHS Volleyball Substitution Rules

export const NFHS_RULES = {
  MAX_SUBS_PER_SET: 18,
  LIBERO_POSITIONS: [1, 5, 6] as const, // Back row only
  FRONT_ROW: [2, 3, 4] as const,
  BACK_ROW: [1, 5, 6] as const,
};

export type CourtPosition = 1 | 2 | 3 | 4 | 5 | 6;

export function isBackRow(position: number): boolean {
  return NFHS_RULES.BACK_ROW.includes(position as 1 | 5 | 6);
}

export function isFrontRow(position: number): boolean {
  return NFHS_RULES.FRONT_ROW.includes(position as 2 | 3 | 4);
}

export function canSubstitute(
  subCount: number,
  isLiberoSwap: boolean
): { allowed: boolean; warning?: string; error?: string } {
  // Libero swaps don't count against the limit
  if (isLiberoSwap) {
    return { allowed: true };
  }

  if (subCount >= NFHS_RULES.MAX_SUBS_PER_SET) {
    return {
      allowed: false,
      error: `Maximum ${NFHS_RULES.MAX_SUBS_PER_SET} substitutions reached for this set`,
    };
  }

  if (subCount >= 15) {
    return {
      allowed: true,
      warning: `${NFHS_RULES.MAX_SUBS_PER_SET - subCount} substitutions remaining`,
    };
  }

  return { allowed: true };
}

export function canLiberoEnter(position: number): { allowed: boolean; error?: string } {
  if (!isBackRow(position)) {
    return {
      allowed: false,
      error: "Libero can only replace back row players (positions 1, 5, or 6)",
    };
  }
  return { allowed: true };
}

/**
 * Rotate positions clockwise
 * In volleyball, when the receiving team wins a rally (side-out),
 * they rotate one position clockwise before serving.
 *
 * Position flow: 1 → 6 → 5 → 4 → 3 → 2 → 1
 * (Server position 1 moves to position 6)
 */
export function rotatePositions(
  currentPositions: Record<number, string>
): Record<number, string> {
  return {
    1: currentPositions[2], // Position 2 rotates to position 1 (serving)
    2: currentPositions[3],
    3: currentPositions[4],
    4: currentPositions[5],
    5: currentPositions[6],
    6: currentPositions[1], // Position 1 rotates to position 6
  };
}

/**
 * Reverse rotation (rotate counter-clockwise)
 * Used when undoing a play that triggered a rotation.
 *
 * Position flow: 1 → 2 → 3 → 4 → 5 → 6 → 1
 * (Opposite of rotatePositions)
 */
export function reverseRotation(
  currentPositions: Record<number, string>
): Record<number, string> {
  return {
    1: currentPositions[6], // Position 6 moves back to position 1
    2: currentPositions[1],
    3: currentPositions[2],
    4: currentPositions[3],
    5: currentPositions[4],
    6: currentPositions[5],
  };
}

/**
 * Get the player at a specific position after N rotations
 */
export function getPlayerAtPosition(
  startingPositions: Record<number, string>,
  rotationCount: number,
  position: CourtPosition
): string {
  // Calculate effective rotation (mod 6)
  const effectiveRotations = rotationCount % 6;

  // Apply rotations
  let positions = { ...startingPositions };
  for (let i = 0; i < effectiveRotations; i++) {
    positions = rotatePositions(positions);
  }

  return positions[position];
}

/**
 * Check if libero needs to leave court due to rotation
 * (Libero must leave when their position rotates to front row)
 */
export function shouldLiberoLeave(
  liberoPosition: number | null,
  rotationCount: number
): boolean {
  if (liberoPosition === null) return false;

  // After rotation, check if the libero's position is now front row
  // Rotation moves position N to position N-1 (with 1 going to 6)
  // So position 1 → 6 → 5 → 4 (front row)
  //    position 5 → 4 (front row)
  //    position 6 → 5 → 4 (front row)

  // Calculate where the libero's position will be after rotation
  const positionMap: Record<number, number> = {
    1: 6,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
  };

  const newPosition = positionMap[liberoPosition];
  return isFrontRow(newPosition);
}

export interface CourtState {
  positions: Record<number, string>; // position -> playerId
  rotationCount: number;
  liberoPlayerId: string | null;
  liberoInFor: string | null;
  liberoPosition: number | null;
  subCount: number;
  subRemaining: number;
}

export interface SubstitutionResult {
  success: boolean;
  error?: string;
  warning?: string;
  newCourtState?: CourtState;
}
