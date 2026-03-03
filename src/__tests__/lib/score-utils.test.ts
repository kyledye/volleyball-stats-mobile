/**
 * Tests for /lib/score-utils
 */

import {
  POINT_RESULTS,
  ERROR_RESULTS,
  IN_PLAY_RESULTS,
  isPointResult,
  isErrorResult,
  isInPlayResult,
  determineScoreChange,
  calculateServingState,
  calculateHomeRotationCount,
  calculateAwayRotationCount,
  calculateScore,
  isSetComplete,
  getSetWinner,
  isMatchComplete,
  getMatchWinner,
  PlayForScoring,
} from "../../lib/score-utils";

describe("Result type constants", () => {
  it("POINT_RESULTS contains correct values", () => {
    expect(POINT_RESULTS).toEqual(["ACE", "KILL", "OPP_ERROR"]);
  });

  it("ERROR_RESULTS contains correct values", () => {
    expect(ERROR_RESULTS).toEqual(["ERROR"]);
  });

  it("IN_PLAY_RESULTS contains correct values", () => {
    expect(IN_PLAY_RESULTS).toContain("IN_PLAY");
    expect(IN_PLAY_RESULTS).toContain("PASS_4");
    expect(IN_PLAY_RESULTS).toContain("PASS_3");
    expect(IN_PLAY_RESULTS).toContain("PASS_2");
    expect(IN_PLAY_RESULTS).toContain("PASS_1");
    expect(IN_PLAY_RESULTS).toContain("OVER_PASS");
    expect(IN_PLAY_RESULTS).toContain("ASSIST");
    expect(IN_PLAY_RESULTS).toContain("PLAYABLE_SET");
    expect(IN_PLAY_RESULTS).toContain("PLAYABLE_BUMP");
    expect(IN_PLAY_RESULTS).toContain("POOR");
  });
});

describe("isPointResult", () => {
  it("returns true for ACE", () => {
    expect(isPointResult("ACE")).toBe(true);
  });

  it("returns true for KILL", () => {
    expect(isPointResult("KILL")).toBe(true);
  });

  it("returns true for OPP_ERROR", () => {
    expect(isPointResult("OPP_ERROR")).toBe(true);
  });

  it("returns false for ERROR", () => {
    expect(isPointResult("ERROR")).toBe(false);
  });

  it("returns false for IN_PLAY", () => {
    expect(isPointResult("IN_PLAY")).toBe(false);
  });

  it("returns false for unknown result", () => {
    expect(isPointResult("UNKNOWN")).toBe(false);
  });
});

describe("isErrorResult", () => {
  it("returns true for ERROR", () => {
    expect(isErrorResult("ERROR")).toBe(true);
  });

  it("returns false for ACE", () => {
    expect(isErrorResult("ACE")).toBe(false);
  });

  it("returns false for IN_PLAY", () => {
    expect(isErrorResult("IN_PLAY")).toBe(false);
  });
});

describe("isInPlayResult", () => {
  it("returns true for IN_PLAY", () => {
    expect(isInPlayResult("IN_PLAY")).toBe(true);
  });

  it("returns true for passing results", () => {
    expect(isInPlayResult("PASS_4")).toBe(true);
    expect(isInPlayResult("PASS_3")).toBe(true);
    expect(isInPlayResult("PASS_2")).toBe(true);
    expect(isInPlayResult("PASS_1")).toBe(true);
    expect(isInPlayResult("OVER_PASS")).toBe(true);
  });

  it("returns true for setting results", () => {
    expect(isInPlayResult("ASSIST")).toBe(true);
    expect(isInPlayResult("PLAYABLE_SET")).toBe(true);
    expect(isInPlayResult("PLAYABLE_BUMP")).toBe(true);
    expect(isInPlayResult("POOR")).toBe(true);
  });

  it("returns false for scoring results", () => {
    expect(isInPlayResult("ACE")).toBe(false);
    expect(isInPlayResult("KILL")).toBe(false);
    expect(isInPlayResult("ERROR")).toBe(false);
  });
});

describe("determineScoreChange", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("home team ACE scores for home", () => {
    const play: PlayForScoring = { result: "ACE", teamId: homeTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: true,
      awayScored: false,
    });
  });

  it("away team ACE scores for away", () => {
    const play: PlayForScoring = { result: "ACE", teamId: awayTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: false,
      awayScored: true,
    });
  });

  it("home team KILL scores for home", () => {
    const play: PlayForScoring = { result: "KILL", teamId: homeTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: true,
      awayScored: false,
    });
  });

  it("home team ERROR scores for away", () => {
    const play: PlayForScoring = { result: "ERROR", teamId: homeTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: false,
      awayScored: true,
    });
  });

  it("away team ERROR scores for home", () => {
    const play: PlayForScoring = { result: "ERROR", teamId: awayTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: true,
      awayScored: false,
    });
  });

  it("IN_PLAY does not change score", () => {
    const play: PlayForScoring = { result: "IN_PLAY", teamId: homeTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: false,
      awayScored: false,
    });
  });

  it("PASS results do not change score", () => {
    const play: PlayForScoring = { result: "PASS_4", teamId: homeTeamId };
    expect(determineScoreChange(play, homeTeamId)).toEqual({
      homeScored: false,
      awayScored: false,
    });
  });
});

describe("calculateServingState", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns homeServesFirst when no plays", () => {
    expect(calculateServingState([], homeTeamId, true)).toBe(true);
    expect(calculateServingState([], homeTeamId, false)).toBe(false);
  });

  it("home keeps serve after home scores while serving", () => {
    const plays: PlayForScoring[] = [{ result: "ACE", teamId: homeTeamId }];
    expect(calculateServingState(plays, homeTeamId, true)).toBe(true);
  });

  it("away gains serve after home errors while serving", () => {
    const plays: PlayForScoring[] = [{ result: "ERROR", teamId: homeTeamId }];
    expect(calculateServingState(plays, homeTeamId, true)).toBe(false);
  });

  it("home gains serve after away scores while away serving (sideout)", () => {
    const plays: PlayForScoring[] = [
      // Away serves first, home scores - sideout
      { result: "KILL", teamId: homeTeamId },
    ];
    expect(calculateServingState(plays, homeTeamId, false)).toBe(true);
  });

  it("home gains serve after away errors", () => {
    const plays: PlayForScoring[] = [{ result: "ERROR", teamId: awayTeamId }];
    expect(calculateServingState(plays, homeTeamId, false)).toBe(true);
  });

  it("tracks multiple sideouts correctly", () => {
    const plays: PlayForScoring[] = [
      // Home serves first (true), home aces - still serving
      { result: "ACE", teamId: homeTeamId },
      // Home serves, home errors - away serves
      { result: "ERROR", teamId: homeTeamId },
      // Away serves, away kills - away still serves
      { result: "KILL", teamId: awayTeamId },
      // Away serves, home kills - sideout, home serves
      { result: "KILL", teamId: homeTeamId },
    ];
    expect(calculateServingState(plays, homeTeamId, true)).toBe(true);
  });

  it("ignores in-play results for serving state", () => {
    const plays: PlayForScoring[] = [
      { result: "PASS_4", teamId: homeTeamId },
      { result: "IN_PLAY", teamId: awayTeamId },
      { result: "PLAYABLE_SET", teamId: homeTeamId },
    ];
    expect(calculateServingState(plays, homeTeamId, true)).toBe(true);
  });
});

describe("calculateHomeRotationCount", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns 0 when no plays", () => {
    expect(calculateHomeRotationCount([], homeTeamId, true)).toBe(0);
  });

  it("returns 0 when home serves first and keeps serving", () => {
    const plays: PlayForScoring[] = [
      { result: "ACE", teamId: homeTeamId },
      { result: "ACE", teamId: homeTeamId },
    ];
    expect(calculateHomeRotationCount(plays, homeTeamId, true)).toBe(0);
  });

  it("returns 0 when home serves first and loses serve (no rotation yet)", () => {
    const plays: PlayForScoring[] = [{ result: "ERROR", teamId: homeTeamId }];
    expect(calculateHomeRotationCount(plays, homeTeamId, true)).toBe(0);
  });

  it("returns 1 when home gains serve back (sideout)", () => {
    const plays: PlayForScoring[] = [
      // Home serves, errors - away serves
      { result: "ERROR", teamId: homeTeamId },
      // Away serves, home kills - sideout, home rotates
      { result: "KILL", teamId: homeTeamId },
    ];
    expect(calculateHomeRotationCount(plays, homeTeamId, true)).toBe(1);
  });

  it("returns 1 when away serves first and home wins sideout", () => {
    const plays: PlayForScoring[] = [{ result: "KILL", teamId: homeTeamId }];
    expect(calculateHomeRotationCount(plays, homeTeamId, false)).toBe(1);
  });

  it("counts multiple rotations correctly", () => {
    const plays: PlayForScoring[] = [
      // Away serves first
      { result: "KILL", teamId: homeTeamId }, // Sideout 1 - home rotates
      { result: "ACE", teamId: homeTeamId }, // Home serves
      { result: "ERROR", teamId: homeTeamId }, // Away serves
      { result: "KILL", teamId: homeTeamId }, // Sideout 2 - home rotates
      { result: "ERROR", teamId: homeTeamId }, // Away serves
      { result: "ERROR", teamId: awayTeamId }, // Sideout 3 - home rotates
    ];
    expect(calculateHomeRotationCount(plays, homeTeamId, false)).toBe(3);
  });
});

describe("calculateAwayRotationCount", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns 0 when no plays", () => {
    expect(calculateAwayRotationCount([], homeTeamId, true)).toBe(0);
  });

  it("returns 1 when home serves first and away wins sideout", () => {
    const plays: PlayForScoring[] = [{ result: "KILL", teamId: awayTeamId }];
    expect(calculateAwayRotationCount(plays, homeTeamId, true)).toBe(1);
  });

  it("returns 0 when away serves first and keeps serving", () => {
    const plays: PlayForScoring[] = [
      { result: "ACE", teamId: awayTeamId },
      { result: "KILL", teamId: awayTeamId },
    ];
    expect(calculateAwayRotationCount(plays, homeTeamId, false)).toBe(0);
  });

  it("counts multiple rotations correctly", () => {
    const plays: PlayForScoring[] = [
      // Home serves first
      { result: "KILL", teamId: awayTeamId }, // Sideout 1 - away rotates
      { result: "ACE", teamId: awayTeamId }, // Away serves
      { result: "ERROR", teamId: awayTeamId }, // Home serves
      { result: "KILL", teamId: awayTeamId }, // Sideout 2 - away rotates
    ];
    expect(calculateAwayRotationCount(plays, homeTeamId, true)).toBe(2);
  });
});

describe("calculateScore", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns 0-0 when no plays", () => {
    expect(calculateScore([], homeTeamId)).toEqual({
      homeScore: 0,
      awayScore: 0,
    });
  });

  it("counts home team points correctly", () => {
    const plays: PlayForScoring[] = [
      { result: "ACE", teamId: homeTeamId },
      { result: "KILL", teamId: homeTeamId },
      { result: "OPP_ERROR", teamId: homeTeamId },
    ];
    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 3,
      awayScore: 0,
    });
  });

  it("counts away team points correctly", () => {
    const plays: PlayForScoring[] = [
      { result: "ACE", teamId: awayTeamId },
      { result: "KILL", teamId: awayTeamId },
    ];
    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 0,
      awayScore: 2,
    });
  });

  it("counts errors as points for opponent", () => {
    const plays: PlayForScoring[] = [
      { result: "ERROR", teamId: homeTeamId }, // Away scores
      { result: "ERROR", teamId: awayTeamId }, // Home scores
    ];
    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 1,
      awayScore: 1,
    });
  });

  it("ignores in-play results", () => {
    const plays: PlayForScoring[] = [
      { result: "PASS_4", teamId: homeTeamId },
      { result: "IN_PLAY", teamId: homeTeamId },
      { result: "KILL", teamId: homeTeamId },
    ];
    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 1,
      awayScore: 0,
    });
  });

  it("calculates mixed game correctly", () => {
    const plays: PlayForScoring[] = [
      { result: "ACE", teamId: homeTeamId }, // 1-0
      { result: "KILL", teamId: awayTeamId }, // 1-1
      { result: "KILL", teamId: homeTeamId }, // 2-1
      { result: "ERROR", teamId: homeTeamId }, // 2-2
      { result: "ACE", teamId: homeTeamId }, // 3-2
    ];
    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 3,
      awayScore: 2,
    });
  });
});

describe("isSetComplete", () => {
  describe("sets 1-4 (to 25)", () => {
    it("returns false when neither team has 25", () => {
      expect(isSetComplete(24, 20, 1)).toBe(false);
      expect(isSetComplete(20, 24, 2)).toBe(false);
    });

    it("returns false at 25-24 (not win by 2)", () => {
      expect(isSetComplete(25, 24, 1)).toBe(false);
      expect(isSetComplete(24, 25, 2)).toBe(false);
    });

    it("returns true at 25-23", () => {
      expect(isSetComplete(25, 23, 1)).toBe(true);
      expect(isSetComplete(23, 25, 3)).toBe(true);
    });

    it("returns true at 25-0 (mercy)", () => {
      expect(isSetComplete(25, 0, 1)).toBe(true);
    });

    it("returns true at 26-24", () => {
      expect(isSetComplete(26, 24, 2)).toBe(true);
      expect(isSetComplete(24, 26, 4)).toBe(true);
    });

    it("returns true at 30-28", () => {
      expect(isSetComplete(30, 28, 1)).toBe(true);
    });
  });

  describe("set 5 (to 15)", () => {
    it("returns false when neither team has 15", () => {
      expect(isSetComplete(14, 10, 5)).toBe(false);
    });

    it("returns false at 15-14 (not win by 2)", () => {
      expect(isSetComplete(15, 14, 5)).toBe(false);
    });

    it("returns true at 15-13", () => {
      expect(isSetComplete(15, 13, 5)).toBe(true);
      expect(isSetComplete(13, 15, 5)).toBe(true);
    });

    it("returns true at 17-15", () => {
      expect(isSetComplete(17, 15, 5)).toBe(true);
    });
  });
});

describe("getSetWinner", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns null when set is not complete", () => {
    expect(getSetWinner(24, 23, 1, homeTeamId, awayTeamId)).toBeNull();
    expect(getSetWinner(25, 24, 1, homeTeamId, awayTeamId)).toBeNull();
  });

  it("returns home team when home wins", () => {
    expect(getSetWinner(25, 23, 1, homeTeamId, awayTeamId)).toBe(homeTeamId);
    expect(getSetWinner(26, 24, 2, homeTeamId, awayTeamId)).toBe(homeTeamId);
  });

  it("returns away team when away wins", () => {
    expect(getSetWinner(23, 25, 1, homeTeamId, awayTeamId)).toBe(awayTeamId);
    expect(getSetWinner(13, 15, 5, homeTeamId, awayTeamId)).toBe(awayTeamId);
  });
});

describe("isMatchComplete", () => {
  describe("BEST_OF_3", () => {
    it("returns false when neither team has won 2 sets", () => {
      expect(isMatchComplete(1, 1, "BEST_OF_3")).toBe(false);
      expect(isMatchComplete(1, 0, "BEST_OF_3")).toBe(false);
      expect(isMatchComplete(0, 1, "BEST_OF_3")).toBe(false);
    });

    it("returns true when home has won 2 sets", () => {
      expect(isMatchComplete(2, 0, "BEST_OF_3")).toBe(true);
      expect(isMatchComplete(2, 1, "BEST_OF_3")).toBe(true);
    });

    it("returns true when away has won 2 sets", () => {
      expect(isMatchComplete(0, 2, "BEST_OF_3")).toBe(true);
      expect(isMatchComplete(1, 2, "BEST_OF_3")).toBe(true);
    });
  });

  describe("BEST_OF_5", () => {
    it("returns false when neither team has won 3 sets", () => {
      expect(isMatchComplete(2, 2, "BEST_OF_5")).toBe(false);
      expect(isMatchComplete(2, 1, "BEST_OF_5")).toBe(false);
      expect(isMatchComplete(1, 2, "BEST_OF_5")).toBe(false);
    });

    it("returns true when home has won 3 sets", () => {
      expect(isMatchComplete(3, 0, "BEST_OF_5")).toBe(true);
      expect(isMatchComplete(3, 1, "BEST_OF_5")).toBe(true);
      expect(isMatchComplete(3, 2, "BEST_OF_5")).toBe(true);
    });

    it("returns true when away has won 3 sets", () => {
      expect(isMatchComplete(0, 3, "BEST_OF_5")).toBe(true);
      expect(isMatchComplete(1, 3, "BEST_OF_5")).toBe(true);
      expect(isMatchComplete(2, 3, "BEST_OF_5")).toBe(true);
    });
  });
});

describe("getMatchWinner", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("returns null when match is not complete", () => {
    expect(getMatchWinner(1, 1, "BEST_OF_3", homeTeamId, awayTeamId)).toBeNull();
    expect(getMatchWinner(2, 2, "BEST_OF_5", homeTeamId, awayTeamId)).toBeNull();
  });

  it("returns home team when home wins", () => {
    expect(getMatchWinner(2, 0, "BEST_OF_3", homeTeamId, awayTeamId)).toBe(
      homeTeamId
    );
    expect(getMatchWinner(3, 1, "BEST_OF_5", homeTeamId, awayTeamId)).toBe(
      homeTeamId
    );
  });

  it("returns away team when away wins", () => {
    expect(getMatchWinner(1, 2, "BEST_OF_3", homeTeamId, awayTeamId)).toBe(
      awayTeamId
    );
    expect(getMatchWinner(2, 3, "BEST_OF_5", homeTeamId, awayTeamId)).toBe(
      awayTeamId
    );
  });
});

describe("Integration: full game simulation", () => {
  const homeTeamId = "home-team";
  const awayTeamId = "away-team";

  it("simulates a complete rally sequence", () => {
    const plays: PlayForScoring[] = [
      // Rally 1: Home serves, away passes (P3), away sets (assist), away kills
      { result: "PASS_3", teamId: awayTeamId },
      { result: "ASSIST", teamId: awayTeamId },
      { result: "KILL", teamId: awayTeamId }, // Away scores 0-1
      // Rally 2: Away serves, home passes, home attacks but error
      { result: "PASS_4", teamId: homeTeamId },
      { result: "PLAYABLE_SET", teamId: homeTeamId },
      { result: "ERROR", teamId: homeTeamId }, // Away scores 0-2
      // Rally 3: Away serves, home kills
      { result: "KILL", teamId: homeTeamId }, // Home scores 1-2, sideout
    ];

    expect(calculateScore(plays, homeTeamId)).toEqual({
      homeScore: 1,
      awayScore: 2,
    });
    expect(calculateServingState(plays, homeTeamId, true)).toBe(true);
    expect(calculateHomeRotationCount(plays, homeTeamId, true)).toBe(1);
    expect(calculateAwayRotationCount(plays, homeTeamId, true)).toBe(1);
  });
});
