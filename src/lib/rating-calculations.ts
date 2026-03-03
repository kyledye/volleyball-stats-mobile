import {
  HittingBreakdown,
  ServingBreakdown,
  PassingBreakdown,
  SecondTouchBreakdown,
  RatingResult,
  RatingWeights,
  DEFAULT_RATING_WEIGHTS,
} from "../types/stats";

// ============================================
// POINT VALUES FOR EACH RESULT TYPE
// ============================================

/**
 * Get point value for hitting results (ATTACK, FREE_BALL plays)
 * KILL = +4 (100%), IN_PLAY = +2 (50%), ERROR = -1 (-25%)
 */
export function getHitValue(result: string): number {
  switch (result) {
    case "KILL":
      return 4;
    case "IN_PLAY":
      return 2;
    default:
      return -1; // ERROR
  }
}

/**
 * Get point value for serving results (SERVE plays)
 * ACE = +4 (100%), IN_PLAY = +2 (50%), ERROR = -1 (-25%)
 */
export function getServeValue(result: string): number {
  switch (result) {
    case "ACE":
      return 4;
    case "IN_PLAY":
      return 2;
    default:
      return -1; // ERROR
  }
}

/**
 * Get point value for passing results (PASS, SERVE_RECEIVE plays)
 * PASS_4 = +4, PASS_3 = +3, PASS_2 = +2, PASS_1 = +1, ERROR/OVER_PASS = -1
 */
export function getPassValue(result: string): number {
  switch (result) {
    case "PASS_4":
      return 4;
    case "PASS_3":
      return 3;
    case "PASS_2":
      return 2;
    case "PASS_1":
      return 1;
    case "OVER_PASS":
      return -1;
    default:
      return -1; // ERROR
  }
}

/**
 * Get point value for second touch results (SECOND_TOUCH plays)
 * ASSIST = +4, PLAYABLE_SET = +3, PLAYABLE_BUMP = +2, POOR = +1, ERROR = -1
 */
export function getSecondTouchValue(result: string): number {
  switch (result) {
    case "ASSIST":
      return 4;
    case "PLAYABLE_SET":
      return 3;
    case "PLAYABLE_BUMP":
      return 2;
    case "POOR":
      return 1;
    default:
      return -1; // ERROR
  }
}

// ============================================
// RATING CONVERSION
// ============================================

/**
 * Convert rating from -1 to 4 scale to percentage
 * 4 = 100%, 0 = 0%, -1 = -25%
 */
export function ratingToPercent(rating: number): number {
  return (rating / 4) * 100;
}

// ============================================
// CALCULATE RATINGS FROM PLAYS
// ============================================

interface Play {
  type: string;
  result: string;
  playerId?: string | null;
  matchId?: string;
}

/**
 * Calculate hitting rating from an array of plays
 */
export function calculateHittingRating(
  plays: Play[]
): RatingResult<HittingBreakdown> {
  const hitPlays = plays.filter(
    (p) => p.type === "ATTACK" || p.type === "FREE_BALL"
  );

  if (hitPlays.length === 0) {
    return {
      rating: null,
      percent: null,
      count: 0,
      breakdown: { kills: 0, inPlay: 0, errors: 0 },
    };
  }

  let totalRating = 0;
  const breakdown: HittingBreakdown = { kills: 0, inPlay: 0, errors: 0 };

  hitPlays.forEach((p) => {
    const value = getHitValue(p.result);
    totalRating += value;
    if (p.result === "KILL") breakdown.kills++;
    else if (p.result === "IN_PLAY") breakdown.inPlay++;
    else breakdown.errors++;
  });

  const rating = totalRating / hitPlays.length;
  return {
    rating,
    percent: ratingToPercent(rating),
    count: hitPlays.length,
    breakdown,
  };
}

/**
 * Calculate serving rating from an array of plays
 */
export function calculateServingRating(
  plays: Play[]
): RatingResult<ServingBreakdown> {
  const servePlays = plays.filter((p) => p.type === "SERVE");

  if (servePlays.length === 0) {
    return {
      rating: null,
      percent: null,
      count: 0,
      breakdown: { aces: 0, inPlay: 0, errors: 0 },
    };
  }

  let totalRating = 0;
  const breakdown: ServingBreakdown = { aces: 0, inPlay: 0, errors: 0 };

  servePlays.forEach((p) => {
    const value = getServeValue(p.result);
    totalRating += value;
    if (p.result === "ACE") breakdown.aces++;
    else if (p.result === "IN_PLAY") breakdown.inPlay++;
    else breakdown.errors++;
  });

  const rating = totalRating / servePlays.length;
  return {
    rating,
    percent: ratingToPercent(rating),
    count: servePlays.length,
    breakdown,
  };
}

/**
 * Calculate passing rating from an array of plays
 */
export function calculatePassingRating(
  plays: Play[]
): RatingResult<PassingBreakdown> {
  const passPlays = plays.filter(
    (p) => p.type === "PASS" || p.type === "SERVE_RECEIVE"
  );

  if (passPlays.length === 0) {
    return {
      rating: null,
      percent: null,
      count: 0,
      breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 },
    };
  }

  let totalRating = 0;
  const breakdown: PassingBreakdown = { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 };

  passPlays.forEach((p) => {
    const value = getPassValue(p.result);
    totalRating += value;
    switch (p.result) {
      case "PASS_4":
        breakdown.p4++;
        break;
      case "PASS_3":
        breakdown.p3++;
        break;
      case "PASS_2":
        breakdown.p2++;
        break;
      case "PASS_1":
        breakdown.p1++;
        break;
      default:
        breakdown.p0++; // ERROR or OVER_PASS
    }
  });

  const rating = totalRating / passPlays.length;
  return {
    rating,
    percent: ratingToPercent(rating),
    count: passPlays.length,
    breakdown,
  };
}

/**
 * Calculate second touch rating from an array of plays (SECOND_TOUCH type)
 * Scoring: ASSIST=+4, PLAYABLE_SET=+3, PLAYABLE_BUMP=+2, POOR=+1, ERROR=-1
 */
export function calculateSecondTouchRating(
  plays: Play[]
): RatingResult<SecondTouchBreakdown> {
  const secondTouchPlays = plays.filter((p) => p.type === "SECOND_TOUCH");

  if (secondTouchPlays.length === 0) {
    return {
      rating: null,
      percent: null,
      count: 0,
      breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 },
    };
  }

  let totalRating = 0;
  const breakdown: SecondTouchBreakdown = {
    assists: 0,
    playableSet: 0,
    playableBump: 0,
    poor: 0,
    errors: 0,
  };

  secondTouchPlays.forEach((p) => {
    const value = getSecondTouchValue(p.result);
    totalRating += value;
    switch (p.result) {
      case "ASSIST":
        breakdown.assists++;
        break;
      case "PLAYABLE_SET":
        breakdown.playableSet++;
        break;
      case "PLAYABLE_BUMP":
        breakdown.playableBump++;
        break;
      case "POOR":
        breakdown.poor++;
        break;
      default:
        breakdown.errors++;
    }
  });

  const rating = totalRating / secondTouchPlays.length;
  return {
    rating,
    percent: ratingToPercent(rating),
    count: secondTouchPlays.length,
    breakdown,
  };
}

// ============================================
// OVERALL RATING CALCULATION
// ============================================

interface PartialRatings {
  hitting?: { percent: number | null; count: number };
  serving?: { percent: number | null; count: number };
  passing?: { percent: number | null; count: number };
  secondTouch?: { percent: number | null; count: number };
}

/**
 * Calculate overall weighted rating from individual skill ratings
 * Only includes skills where the player has data
 * Normalizes weights to sum to 100%
 *
 * @param ratings Object containing rating percentages and counts for each skill
 * @param minAttempts Minimum attempts required to include a skill in the calculation
 * @param weights Custom weights (optional, defaults to DEFAULT_RATING_WEIGHTS)
 */
export function calculateOverallRating(
  ratings: PartialRatings,
  minAttempts: number = 0,
  weights: RatingWeights = DEFAULT_RATING_WEIGHTS
): number | null {
  const availableRatings: { rating: number; weight: number }[] = [];

  if (
    ratings.hitting?.percent !== null &&
    ratings.hitting?.percent !== undefined &&
    ratings.hitting.count >= minAttempts
  ) {
    availableRatings.push({
      rating: ratings.hitting.percent,
      weight: weights.hitting,
    });
  }

  if (
    ratings.serving?.percent !== null &&
    ratings.serving?.percent !== undefined &&
    ratings.serving.count >= minAttempts
  ) {
    availableRatings.push({
      rating: ratings.serving.percent,
      weight: weights.serving,
    });
  }

  if (
    ratings.passing?.percent !== null &&
    ratings.passing?.percent !== undefined &&
    ratings.passing.count >= minAttempts
  ) {
    availableRatings.push({
      rating: ratings.passing.percent,
      weight: weights.passing,
    });
  }

  if (
    ratings.secondTouch?.percent !== null &&
    ratings.secondTouch?.percent !== undefined &&
    ratings.secondTouch.count >= minAttempts
  ) {
    availableRatings.push({
      rating: ratings.secondTouch.percent,
      weight: weights.secondTouch,
    });
  }

  if (availableRatings.length === 0) {
    return null;
  }

  // Normalize weights to sum to 1
  const totalWeight = availableRatings.reduce((sum, r) => sum + r.weight, 0);

  // Calculate weighted average
  const weightedSum = availableRatings.reduce(
    (sum, r) => sum + r.rating * (r.weight / totalWeight),
    0
  );

  return weightedSum;
}

// ============================================
// CALCULATE ALL RATINGS FOR A PLAYER
// ============================================

/**
 * Calculate all skill ratings for a player from their plays
 */
export function calculateAllRatings(plays: Play[]) {
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
    hitting,
    serving,
    passing,
    secondTouch,
    overallRating,
  };
}
