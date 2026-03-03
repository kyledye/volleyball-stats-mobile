// Rating breakdown interfaces for each skill type

export interface HittingBreakdown {
  kills: number;
  inPlay: number;
  errors: number;
}

export interface ServingBreakdown {
  aces: number;
  inPlay: number;
  errors: number;
}

export interface PassingBreakdown {
  p4: number; // Perfect pass
  p3: number; // Good pass
  p2: number; // Playable pass
  p1: number; // Out of system
  p0: number; // Error/over pass
}

// Second Touch (combines hand setting and bump setting)
export interface SecondTouchBreakdown {
  assists: number;       // +4 (hitter got kill)
  playableSet: number;   // +3 (good hand set)
  playableBump: number;  // +2 (good bump set)
  poor: number;          // +1 (out of system)
  errors: number;        // -1 (error)
}

// Generic rating result structure
export interface RatingResult<T> {
  rating: number | null; // -1 to 4 scale, null if no data
  percent: number | null; // 0-100 scale (can be negative for poor ratings)
  count: number;
  breakdown: T;
}

// Player season ratings
export interface PlayerSeasonRatings {
  playerId: string;
  player: {
    id: string;
    number: number;
    firstName: string;
    lastName: string;
    position: string | null;
    team?: { id: string; name: string };
  } | null;
  hitting: RatingResult<HittingBreakdown>;
  serving: RatingResult<ServingBreakdown>;
  passing: RatingResult<PassingBreakdown>;
  secondTouch: RatingResult<SecondTouchBreakdown>;
  overallRating: number | null; // Weighted composite 0-100
  matchesPlayed: number;
}

// Team season ratings
export interface TeamSeasonRatings {
  teamId: string;
  teamName: string;
  ratings: {
    hitting: { rating: number | null; percent: number | null; count: number };
    serving: { rating: number | null; percent: number | null; count: number };
    passing: { rating: number | null; percent: number | null; count: number };
    secondTouch: { rating: number | null; percent: number | null; count: number };
    overall: number | null;
  };
  matchesPlayed: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  player: {
    id: string;
    number: number;
    firstName: string;
    lastName: string;
    team: { id: string; name: string };
  };
  rating: number;
  percent: number;
  attempts: number;
  breakdown: HittingBreakdown | ServingBreakdown | PassingBreakdown | SecondTouchBreakdown | Record<string, number | null>;
}

// Leaderboard category types
export type LeaderboardCategory =
  | "hitting"
  | "serving"
  | "passing"
  | "secondtouch"
  | "overall";

// Overall rating weights
export interface RatingWeights {
  hitting: number;
  serving: number;
  passing: number;
  secondTouch: number;
}

export const DEFAULT_RATING_WEIGHTS: RatingWeights = {
  hitting: 0.35,
  serving: 0.20,
  passing: 0.25,
  secondTouch: 0.20,
};
