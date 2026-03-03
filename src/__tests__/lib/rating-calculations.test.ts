import {
  getHitValue,
  getServeValue,
  getPassValue,
  getSecondTouchValue,
  ratingToPercent,
  calculateHittingRating,
  calculateServingRating,
  calculatePassingRating,
  calculateSecondTouchRating,
  calculateOverallRating,
  calculateAllRatings,
} from "../../lib/rating-calculations";
import { DEFAULT_RATING_WEIGHTS } from "../../types/stats";

// ============================================
// POINT VALUE FUNCTIONS
// ============================================

describe("getHitValue", () => {
  it("returns 4 for KILL", () => {
    expect(getHitValue("KILL")).toBe(4);
  });

  it("returns 2 for IN_PLAY", () => {
    expect(getHitValue("IN_PLAY")).toBe(2);
  });

  it("returns -1 for ERROR", () => {
    expect(getHitValue("ERROR")).toBe(-1);
  });

  it("returns -1 for unknown results", () => {
    expect(getHitValue("UNKNOWN")).toBe(-1);
    expect(getHitValue("")).toBe(-1);
  });
});

describe("getServeValue", () => {
  it("returns 4 for ACE", () => {
    expect(getServeValue("ACE")).toBe(4);
  });

  it("returns 2 for IN_PLAY", () => {
    expect(getServeValue("IN_PLAY")).toBe(2);
  });

  it("returns -1 for ERROR", () => {
    expect(getServeValue("ERROR")).toBe(-1);
  });

  it("returns -1 for unknown results", () => {
    expect(getServeValue("UNKNOWN")).toBe(-1);
    expect(getServeValue("")).toBe(-1);
  });
});

describe("getPassValue", () => {
  it("returns 4 for PASS_4", () => {
    expect(getPassValue("PASS_4")).toBe(4);
  });

  it("returns 3 for PASS_3", () => {
    expect(getPassValue("PASS_3")).toBe(3);
  });

  it("returns 2 for PASS_2", () => {
    expect(getPassValue("PASS_2")).toBe(2);
  });

  it("returns 1 for PASS_1", () => {
    expect(getPassValue("PASS_1")).toBe(1);
  });

  it("returns -1 for OVER_PASS", () => {
    expect(getPassValue("OVER_PASS")).toBe(-1);
  });

  it("returns -1 for ERROR", () => {
    expect(getPassValue("ERROR")).toBe(-1);
  });

  it("returns -1 for unknown results", () => {
    expect(getPassValue("UNKNOWN")).toBe(-1);
    expect(getPassValue("")).toBe(-1);
  });
});

describe("getSecondTouchValue", () => {
  it("returns 4 for ASSIST", () => {
    expect(getSecondTouchValue("ASSIST")).toBe(4);
  });

  it("returns 3 for PLAYABLE_SET", () => {
    expect(getSecondTouchValue("PLAYABLE_SET")).toBe(3);
  });

  it("returns 2 for PLAYABLE_BUMP", () => {
    expect(getSecondTouchValue("PLAYABLE_BUMP")).toBe(2);
  });

  it("returns 1 for POOR", () => {
    expect(getSecondTouchValue("POOR")).toBe(1);
  });

  it("returns -1 for ERROR", () => {
    expect(getSecondTouchValue("ERROR")).toBe(-1);
  });

  it("returns -1 for unknown results", () => {
    expect(getSecondTouchValue("UNKNOWN")).toBe(-1);
    expect(getSecondTouchValue("")).toBe(-1);
  });
});

// ============================================
// RATING CONVERSION
// ============================================

describe("ratingToPercent", () => {
  it("converts 4 to 100%", () => {
    expect(ratingToPercent(4)).toBe(100);
  });

  it("converts 0 to 0%", () => {
    expect(ratingToPercent(0)).toBe(0);
  });

  it("converts -1 to -25%", () => {
    expect(ratingToPercent(-1)).toBe(-25);
  });

  it("converts 2 to 50%", () => {
    expect(ratingToPercent(2)).toBe(50);
  });

  it("converts 3 to 75%", () => {
    expect(ratingToPercent(3)).toBe(75);
  });

  it("handles decimal ratings", () => {
    expect(ratingToPercent(2.5)).toBe(62.5);
  });
});

// ============================================
// CALCULATE HITTING RATING
// ============================================

describe("calculateHittingRating", () => {
  it("returns null rating for empty plays array", () => {
    const result = calculateHittingRating([]);
    expect(result.rating).toBeNull();
    expect(result.percent).toBeNull();
    expect(result.count).toBe(0);
    expect(result.breakdown).toEqual({ kills: 0, inPlay: 0, errors: 0 });
  });

  it("returns null rating when no ATTACK or FREE_BALL plays", () => {
    const plays = [
      { type: "SERVE", result: "ACE" },
      { type: "PASS", result: "PASS_4" },
    ];
    const result = calculateHittingRating(plays);
    expect(result.rating).toBeNull();
    expect(result.count).toBe(0);
  });

  it("calculates rating for all kills", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "ATTACK", result: "KILL" },
      { type: "ATTACK", result: "KILL" },
    ];
    const result = calculateHittingRating(plays);
    expect(result.rating).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.count).toBe(3);
    expect(result.breakdown).toEqual({ kills: 3, inPlay: 0, errors: 0 });
  });

  it("calculates rating for all errors", () => {
    const plays = [
      { type: "ATTACK", result: "ERROR" },
      { type: "ATTACK", result: "ERROR" },
    ];
    const result = calculateHittingRating(plays);
    expect(result.rating).toBe(-1);
    expect(result.percent).toBe(-25);
    expect(result.count).toBe(2);
    expect(result.breakdown).toEqual({ kills: 0, inPlay: 0, errors: 2 });
  });

  it("calculates mixed hitting rating", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },    // +4
      { type: "ATTACK", result: "IN_PLAY" }, // +2
      { type: "ATTACK", result: "ERROR" },   // -1
    ];
    const result = calculateHittingRating(plays);
    // (4 + 2 + -1) / 3 = 5/3 = 1.6667
    expect(result.rating).toBeCloseTo(5 / 3);
    expect(result.percent).toBeCloseTo((5 / 3 / 4) * 100);
    expect(result.count).toBe(3);
    expect(result.breakdown).toEqual({ kills: 1, inPlay: 1, errors: 1 });
  });

  it("includes FREE_BALL plays", () => {
    const plays = [
      { type: "FREE_BALL", result: "KILL" },
      { type: "ATTACK", result: "KILL" },
    ];
    const result = calculateHittingRating(plays);
    expect(result.rating).toBe(4);
    expect(result.count).toBe(2);
    expect(result.breakdown.kills).toBe(2);
  });

  it("filters out non-hitting plays", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
      { type: "PASS", result: "PASS_4" },
    ];
    const result = calculateHittingRating(plays);
    expect(result.count).toBe(1);
    expect(result.breakdown.kills).toBe(1);
  });
});

// ============================================
// CALCULATE SERVING RATING
// ============================================

describe("calculateServingRating", () => {
  it("returns null rating for empty plays array", () => {
    const result = calculateServingRating([]);
    expect(result.rating).toBeNull();
    expect(result.percent).toBeNull();
    expect(result.count).toBe(0);
    expect(result.breakdown).toEqual({ aces: 0, inPlay: 0, errors: 0 });
  });

  it("returns null rating when no SERVE plays", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "PASS", result: "PASS_4" },
    ];
    const result = calculateServingRating(plays);
    expect(result.rating).toBeNull();
    expect(result.count).toBe(0);
  });

  it("calculates rating for all aces", () => {
    const plays = [
      { type: "SERVE", result: "ACE" },
      { type: "SERVE", result: "ACE" },
    ];
    const result = calculateServingRating(plays);
    expect(result.rating).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.count).toBe(2);
    expect(result.breakdown).toEqual({ aces: 2, inPlay: 0, errors: 0 });
  });

  it("calculates rating for all errors", () => {
    const plays = [
      { type: "SERVE", result: "ERROR" },
      { type: "SERVE", result: "ERROR" },
    ];
    const result = calculateServingRating(plays);
    expect(result.rating).toBe(-1);
    expect(result.percent).toBe(-25);
    expect(result.breakdown).toEqual({ aces: 0, inPlay: 0, errors: 2 });
  });

  it("calculates mixed serving rating", () => {
    const plays = [
      { type: "SERVE", result: "ACE" },     // +4
      { type: "SERVE", result: "IN_PLAY" }, // +2
      { type: "SERVE", result: "IN_PLAY" }, // +2
      { type: "SERVE", result: "ERROR" },   // -1
    ];
    const result = calculateServingRating(plays);
    // (4 + 2 + 2 + -1) / 4 = 7/4 = 1.75
    expect(result.rating).toBe(1.75);
    expect(result.percent).toBe(43.75);
    expect(result.count).toBe(4);
    expect(result.breakdown).toEqual({ aces: 1, inPlay: 2, errors: 1 });
  });

  it("filters out non-serve plays", () => {
    const plays = [
      { type: "SERVE", result: "ACE" },
      { type: "ATTACK", result: "KILL" },
      { type: "PASS", result: "PASS_4" },
    ];
    const result = calculateServingRating(plays);
    expect(result.count).toBe(1);
    expect(result.breakdown.aces).toBe(1);
  });
});

// ============================================
// CALCULATE PASSING RATING
// ============================================

describe("calculatePassingRating", () => {
  it("returns null rating for empty plays array", () => {
    const result = calculatePassingRating([]);
    expect(result.rating).toBeNull();
    expect(result.percent).toBeNull();
    expect(result.count).toBe(0);
    expect(result.breakdown).toEqual({ p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 });
  });

  it("returns null rating when no PASS or SERVE_RECEIVE plays", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
    ];
    const result = calculatePassingRating(plays);
    expect(result.rating).toBeNull();
    expect(result.count).toBe(0);
  });

  it("calculates rating for perfect passes", () => {
    const plays = [
      { type: "PASS", result: "PASS_4" },
      { type: "SERVE_RECEIVE", result: "PASS_4" },
    ];
    const result = calculatePassingRating(plays);
    expect(result.rating).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.count).toBe(2);
    expect(result.breakdown).toEqual({ p4: 2, p3: 0, p2: 0, p1: 0, p0: 0 });
  });

  it("calculates rating for all errors", () => {
    const plays = [
      { type: "PASS", result: "ERROR" },
      { type: "PASS", result: "OVER_PASS" },
    ];
    const result = calculatePassingRating(plays);
    expect(result.rating).toBe(-1);
    expect(result.percent).toBe(-25);
    expect(result.breakdown).toEqual({ p4: 0, p3: 0, p2: 0, p1: 0, p0: 2 });
  });

  it("calculates mixed passing rating", () => {
    const plays = [
      { type: "PASS", result: "PASS_4" },  // +4
      { type: "PASS", result: "PASS_3" },  // +3
      { type: "PASS", result: "PASS_2" },  // +2
      { type: "PASS", result: "PASS_1" },  // +1
      { type: "PASS", result: "ERROR" },   // -1
    ];
    const result = calculatePassingRating(plays);
    // (4 + 3 + 2 + 1 + -1) / 5 = 9/5 = 1.8
    expect(result.rating).toBe(1.8);
    expect(result.percent).toBe(45);
    expect(result.count).toBe(5);
    expect(result.breakdown).toEqual({ p4: 1, p3: 1, p2: 1, p1: 1, p0: 1 });
  });

  it("includes both PASS and SERVE_RECEIVE types", () => {
    const plays = [
      { type: "PASS", result: "PASS_3" },
      { type: "SERVE_RECEIVE", result: "PASS_3" },
    ];
    const result = calculatePassingRating(plays);
    expect(result.count).toBe(2);
    expect(result.rating).toBe(3);
  });

  it("filters out non-passing plays", () => {
    const plays = [
      { type: "PASS", result: "PASS_4" },
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
    ];
    const result = calculatePassingRating(plays);
    expect(result.count).toBe(1);
    expect(result.breakdown.p4).toBe(1);
  });
});

// ============================================
// CALCULATE SECOND TOUCH RATING
// ============================================

describe("calculateSecondTouchRating", () => {
  it("returns null rating for empty plays array", () => {
    const result = calculateSecondTouchRating([]);
    expect(result.rating).toBeNull();
    expect(result.percent).toBeNull();
    expect(result.count).toBe(0);
    expect(result.breakdown).toEqual({
      assists: 0,
      playableSet: 0,
      playableBump: 0,
      poor: 0,
      errors: 0,
    });
  });

  it("returns null rating when no SECOND_TOUCH plays", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
    ];
    const result = calculateSecondTouchRating(plays);
    expect(result.rating).toBeNull();
    expect(result.count).toBe(0);
  });

  it("calculates rating for all assists", () => {
    const plays = [
      { type: "SECOND_TOUCH", result: "ASSIST" },
      { type: "SECOND_TOUCH", result: "ASSIST" },
    ];
    const result = calculateSecondTouchRating(plays);
    expect(result.rating).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.count).toBe(2);
    expect(result.breakdown).toEqual({
      assists: 2,
      playableSet: 0,
      playableBump: 0,
      poor: 0,
      errors: 0,
    });
  });

  it("calculates rating for all errors", () => {
    const plays = [
      { type: "SECOND_TOUCH", result: "ERROR" },
      { type: "SECOND_TOUCH", result: "ERROR" },
    ];
    const result = calculateSecondTouchRating(plays);
    expect(result.rating).toBe(-1);
    expect(result.percent).toBe(-25);
    expect(result.breakdown.errors).toBe(2);
  });

  it("calculates mixed second touch rating", () => {
    const plays = [
      { type: "SECOND_TOUCH", result: "ASSIST" },       // +4
      { type: "SECOND_TOUCH", result: "PLAYABLE_SET" }, // +3
      { type: "SECOND_TOUCH", result: "PLAYABLE_BUMP" },// +2
      { type: "SECOND_TOUCH", result: "POOR" },         // +1
      { type: "SECOND_TOUCH", result: "ERROR" },        // -1
    ];
    const result = calculateSecondTouchRating(plays);
    // (4 + 3 + 2 + 1 + -1) / 5 = 9/5 = 1.8
    expect(result.rating).toBe(1.8);
    expect(result.percent).toBe(45);
    expect(result.count).toBe(5);
    expect(result.breakdown).toEqual({
      assists: 1,
      playableSet: 1,
      playableBump: 1,
      poor: 1,
      errors: 1,
    });
  });

  it("filters out non-second-touch plays", () => {
    const plays = [
      { type: "SECOND_TOUCH", result: "ASSIST" },
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
    ];
    const result = calculateSecondTouchRating(plays);
    expect(result.count).toBe(1);
    expect(result.breakdown.assists).toBe(1);
  });
});

// ============================================
// CALCULATE OVERALL RATING
// ============================================

describe("calculateOverallRating", () => {
  it("returns null when no ratings available", () => {
    const result = calculateOverallRating({});
    expect(result).toBeNull();
  });

  it("returns null when all ratings are null", () => {
    const result = calculateOverallRating({
      hitting: { percent: null, count: 0 },
      serving: { percent: null, count: 0 },
      passing: { percent: null, count: 0 },
      secondTouch: { percent: null, count: 0 },
    });
    expect(result).toBeNull();
  });

  it("calculates rating with single skill", () => {
    const result = calculateOverallRating({
      hitting: { percent: 80, count: 10 },
    });
    // With only one skill, it should be 100% of that skill
    expect(result).toBe(80);
  });

  it("calculates weighted average with all skills", () => {
    const result = calculateOverallRating({
      hitting: { percent: 100, count: 10 },    // weight: 0.35
      serving: { percent: 100, count: 10 },    // weight: 0.20
      passing: { percent: 100, count: 10 },    // weight: 0.25
      secondTouch: { percent: 100, count: 10 },// weight: 0.20
    });
    expect(result).toBe(100);
  });

  it("calculates weighted average with mixed ratings", () => {
    const result = calculateOverallRating({
      hitting: { percent: 80, count: 10 },     // 0.35 * 80 = 28
      serving: { percent: 60, count: 10 },     // 0.20 * 60 = 12
      passing: { percent: 70, count: 10 },     // 0.25 * 70 = 17.5
      secondTouch: { percent: 50, count: 10 }, // 0.20 * 50 = 10
    });
    // 28 + 12 + 17.5 + 10 = 67.5
    expect(result).toBe(67.5);
  });

  it("normalizes weights when some skills are missing", () => {
    // Only hitting (0.35) and serving (0.20) available
    // Normalized: hitting = 0.35/0.55, serving = 0.20/0.55
    const result = calculateOverallRating({
      hitting: { percent: 100, count: 10 },
      serving: { percent: 0, count: 10 },
    });
    // (100 * 0.35 + 0 * 0.20) / (0.35 + 0.20)
    // = 35 / 0.55 = 63.636...
    expect(result).toBeCloseTo(63.636, 2);
  });

  it("respects minAttempts threshold", () => {
    const result = calculateOverallRating(
      {
        hitting: { percent: 100, count: 5 },  // below threshold
        serving: { percent: 50, count: 10 },  // above threshold
      },
      10
    );
    // Only serving qualifies, so result is 50
    expect(result).toBe(50);
  });

  it("returns null when no skills meet minAttempts", () => {
    const result = calculateOverallRating(
      {
        hitting: { percent: 100, count: 5 },
        serving: { percent: 50, count: 5 },
      },
      10
    );
    expect(result).toBeNull();
  });

  it("accepts custom weights", () => {
    const customWeights = {
      hitting: 1.0,
      serving: 0.0,
      passing: 0.0,
      secondTouch: 0.0,
    };
    const result = calculateOverallRating(
      {
        hitting: { percent: 80, count: 10 },
        serving: { percent: 60, count: 10 },
      },
      0,
      customWeights
    );
    // Only hitting has weight, so result is 80
    expect(result).toBe(80);
  });

  it("handles negative percentages", () => {
    const result = calculateOverallRating({
      hitting: { percent: -25, count: 10 },
      serving: { percent: -25, count: 10 },
      passing: { percent: -25, count: 10 },
      secondTouch: { percent: -25, count: 10 },
    });
    expect(result).toBe(-25);
  });

  it("handles undefined ratings gracefully", () => {
    const result = calculateOverallRating({
      hitting: { percent: 80, count: 10 },
      serving: undefined,
      passing: undefined,
      secondTouch: undefined,
    });
    expect(result).toBe(80);
  });
});

// ============================================
// CALCULATE ALL RATINGS
// ============================================

describe("calculateAllRatings", () => {
  it("returns all null ratings for empty plays", () => {
    const result = calculateAllRatings([]);
    expect(result.hitting.rating).toBeNull();
    expect(result.serving.rating).toBeNull();
    expect(result.passing.rating).toBeNull();
    expect(result.secondTouch.rating).toBeNull();
    expect(result.overallRating).toBeNull();
  });

  it("calculates all skill ratings from mixed plays", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "ATTACK", result: "IN_PLAY" },
      { type: "SERVE", result: "ACE" },
      { type: "SERVE", result: "IN_PLAY" },
      { type: "PASS", result: "PASS_4" },
      { type: "PASS", result: "PASS_3" },
      { type: "SECOND_TOUCH", result: "ASSIST" },
      { type: "SECOND_TOUCH", result: "PLAYABLE_SET" },
    ];

    const result = calculateAllRatings(plays);

    // Hitting: (4 + 2) / 2 = 3
    expect(result.hitting.rating).toBe(3);
    expect(result.hitting.count).toBe(2);

    // Serving: (4 + 2) / 2 = 3
    expect(result.serving.rating).toBe(3);
    expect(result.serving.count).toBe(2);

    // Passing: (4 + 3) / 2 = 3.5
    expect(result.passing.rating).toBe(3.5);
    expect(result.passing.count).toBe(2);

    // Second Touch: (4 + 3) / 2 = 3.5
    expect(result.secondTouch.rating).toBe(3.5);
    expect(result.secondTouch.count).toBe(2);

    // Overall should be calculated
    expect(result.overallRating).not.toBeNull();
  });

  it("calculates overall rating from partial skills", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "ATTACK", result: "KILL" },
    ];

    const result = calculateAllRatings(plays);

    expect(result.hitting.rating).toBe(4);
    expect(result.serving.rating).toBeNull();
    expect(result.passing.rating).toBeNull();
    expect(result.secondTouch.rating).toBeNull();
    // Overall should still be calculated from available skills
    expect(result.overallRating).toBe(100);
  });

  it("returns correct breakdown structures", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "SERVE", result: "ACE" },
      { type: "PASS", result: "PASS_4" },
      { type: "SECOND_TOUCH", result: "ASSIST" },
    ];

    const result = calculateAllRatings(plays);

    expect(result.hitting.breakdown).toEqual({ kills: 1, inPlay: 0, errors: 0 });
    expect(result.serving.breakdown).toEqual({ aces: 1, inPlay: 0, errors: 0 });
    expect(result.passing.breakdown).toEqual({ p4: 1, p3: 0, p2: 0, p1: 0, p0: 0 });
    expect(result.secondTouch.breakdown).toEqual({
      assists: 1,
      playableSet: 0,
      playableBump: 0,
      poor: 0,
      errors: 0,
    });
  });

  it("ignores plays with unrecognized types", () => {
    const plays = [
      { type: "ATTACK", result: "KILL" },
      { type: "UNKNOWN_TYPE", result: "WHATEVER" },
      { type: "TIMEOUT", result: "CALLED" },
    ];

    const result = calculateAllRatings(plays);

    expect(result.hitting.count).toBe(1);
    expect(result.serving.count).toBe(0);
    expect(result.passing.count).toBe(0);
    expect(result.secondTouch.count).toBe(0);
  });
});

// ============================================
// EDGE CASES & INTEGRATION
// ============================================

describe("Rating Calculations Edge Cases", () => {
  it("handles plays with optional fields", () => {
    const plays = [
      { type: "ATTACK", result: "KILL", playerId: "player-1", matchId: "match-1" },
      { type: "ATTACK", result: "IN_PLAY", playerId: null },
      { type: "ATTACK", result: "ERROR" },
    ];

    const result = calculateHittingRating(plays);
    expect(result.count).toBe(3);
  });

  it("handles large number of plays", () => {
    const plays = Array.from({ length: 1000 }, (_, i) => ({
      type: "ATTACK",
      result: i % 3 === 0 ? "KILL" : i % 3 === 1 ? "IN_PLAY" : "ERROR",
    }));

    const result = calculateHittingRating(plays);
    expect(result.count).toBe(1000);
    // 334 kills + 333 in_play + 333 errors
    // (334*4 + 333*2 + 333*-1) / 1000 = (1336 + 666 - 333) / 1000 = 1.669
    expect(result.rating).toBeCloseTo(1.669, 2);
  });

  it("maintains precision with floating point calculations", () => {
    const plays = [
      { type: "PASS", result: "PASS_4" },
      { type: "PASS", result: "PASS_3" },
      { type: "PASS", result: "PASS_2" },
    ];

    const result = calculatePassingRating(plays);
    // (4 + 3 + 2) / 3 = 3
    expect(result.rating).toBe(3);
    expect(result.percent).toBe(75);
  });
});

describe("DEFAULT_RATING_WEIGHTS", () => {
  it("has correct weight values", () => {
    expect(DEFAULT_RATING_WEIGHTS.hitting).toBe(0.35);
    expect(DEFAULT_RATING_WEIGHTS.serving).toBe(0.20);
    expect(DEFAULT_RATING_WEIGHTS.passing).toBe(0.25);
    expect(DEFAULT_RATING_WEIGHTS.secondTouch).toBe(0.20);
  });

  it("weights sum to 1.0", () => {
    const sum =
      DEFAULT_RATING_WEIGHTS.hitting +
      DEFAULT_RATING_WEIGHTS.serving +
      DEFAULT_RATING_WEIGHTS.passing +
      DEFAULT_RATING_WEIGHTS.secondTouch;
    expect(sum).toBe(1.0);
  });
});
