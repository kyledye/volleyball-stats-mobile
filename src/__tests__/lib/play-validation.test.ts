/**
 * Tests for /lib/play-validation
 */

import {
  VALID_RESULTS_BY_TYPE,
  SCORING_PLAY_TYPES,
  HITTING_PLAY_TYPES,
  PASSING_PLAY_TYPES,
  isValidResultForType,
  getValidResultsForType,
  isHittingPlay,
  isPassingPlay,
  isServingPlay,
  isSecondTouchPlay,
  canScorePoints,
  validatePlay,
  getPlayTypeDisplayName,
  getPlayResultDisplayName,
  getPlayResultAbbreviation,
} from "../../lib/play-validation";

describe("VALID_RESULTS_BY_TYPE constants", () => {
  it("has valid SERVE results", () => {
    expect(VALID_RESULTS_BY_TYPE.SERVE).toEqual(["ACE", "IN_PLAY", "ERROR"]);
  });

  it("has valid ATTACK results", () => {
    expect(VALID_RESULTS_BY_TYPE.ATTACK).toEqual(["KILL", "IN_PLAY", "ERROR"]);
  });

  it("has valid BLOCK results", () => {
    expect(VALID_RESULTS_BY_TYPE.BLOCK).toEqual(["KILL", "IN_PLAY", "ERROR"]);
  });

  it("has valid PASS results", () => {
    expect(VALID_RESULTS_BY_TYPE.PASS).toEqual([
      "PASS_4",
      "PASS_3",
      "PASS_2",
      "PASS_1",
      "OVER_PASS",
    ]);
  });

  it("has valid SERVE_RECEIVE results", () => {
    expect(VALID_RESULTS_BY_TYPE.SERVE_RECEIVE).toEqual([
      "PASS_4",
      "PASS_3",
      "PASS_2",
      "PASS_1",
      "OVER_PASS",
    ]);
  });

  it("has valid SECOND_TOUCH results", () => {
    expect(VALID_RESULTS_BY_TYPE.SECOND_TOUCH).toEqual([
      "ASSIST",
      "PLAYABLE_SET",
      "PLAYABLE_BUMP",
      "POOR",
      "ERROR",
    ]);
  });

  it("has valid FREE_BALL results", () => {
    expect(VALID_RESULTS_BY_TYPE.FREE_BALL).toEqual(["KILL", "IN_PLAY", "ERROR"]);
  });

  it("has valid OPP_ERROR results", () => {
    expect(VALID_RESULTS_BY_TYPE.OPP_ERROR).toEqual(["OPP_ERROR"]);
  });
});

describe("Play type constants", () => {
  it("SCORING_PLAY_TYPES contains correct types", () => {
    expect(SCORING_PLAY_TYPES).toContain("SERVE");
    expect(SCORING_PLAY_TYPES).toContain("ATTACK");
    expect(SCORING_PLAY_TYPES).toContain("BLOCK");
    expect(SCORING_PLAY_TYPES).toContain("FREE_BALL");
    expect(SCORING_PLAY_TYPES).toContain("OPP_ERROR");
    expect(SCORING_PLAY_TYPES).not.toContain("PASS");
    expect(SCORING_PLAY_TYPES).not.toContain("SECOND_TOUCH");
  });

  it("HITTING_PLAY_TYPES contains correct types", () => {
    expect(HITTING_PLAY_TYPES).toContain("ATTACK");
    expect(HITTING_PLAY_TYPES).toContain("FREE_BALL");
    expect(HITTING_PLAY_TYPES).not.toContain("SERVE");
    expect(HITTING_PLAY_TYPES).not.toContain("BLOCK");
  });

  it("PASSING_PLAY_TYPES contains correct types", () => {
    expect(PASSING_PLAY_TYPES).toContain("PASS");
    expect(PASSING_PLAY_TYPES).toContain("SERVE_RECEIVE");
    expect(PASSING_PLAY_TYPES).not.toContain("ATTACK");
    expect(PASSING_PLAY_TYPES).not.toContain("SECOND_TOUCH");
  });
});

describe("isValidResultForType", () => {
  describe("SERVE", () => {
    it("returns true for ACE", () => {
      expect(isValidResultForType("SERVE", "ACE")).toBe(true);
    });

    it("returns true for IN_PLAY", () => {
      expect(isValidResultForType("SERVE", "IN_PLAY")).toBe(true);
    });

    it("returns true for ERROR", () => {
      expect(isValidResultForType("SERVE", "ERROR")).toBe(true);
    });

    it("returns false for KILL", () => {
      expect(isValidResultForType("SERVE", "KILL")).toBe(false);
    });
  });

  describe("ATTACK", () => {
    it("returns true for KILL", () => {
      expect(isValidResultForType("ATTACK", "KILL")).toBe(true);
    });

    it("returns true for IN_PLAY", () => {
      expect(isValidResultForType("ATTACK", "IN_PLAY")).toBe(true);
    });

    it("returns false for ACE", () => {
      expect(isValidResultForType("ATTACK", "ACE")).toBe(false);
    });
  });

  describe("PASS", () => {
    it("returns true for PASS_4", () => {
      expect(isValidResultForType("PASS", "PASS_4")).toBe(true);
    });

    it("returns true for all pass grades", () => {
      expect(isValidResultForType("PASS", "PASS_3")).toBe(true);
      expect(isValidResultForType("PASS", "PASS_2")).toBe(true);
      expect(isValidResultForType("PASS", "PASS_1")).toBe(true);
      expect(isValidResultForType("PASS", "OVER_PASS")).toBe(true);
    });

    it("returns false for ERROR (passes use OVER_PASS)", () => {
      expect(isValidResultForType("PASS", "ERROR")).toBe(false);
    });
  });

  describe("SECOND_TOUCH", () => {
    it("returns true for ASSIST", () => {
      expect(isValidResultForType("SECOND_TOUCH", "ASSIST")).toBe(true);
    });

    it("returns true for setting results", () => {
      expect(isValidResultForType("SECOND_TOUCH", "PLAYABLE_SET")).toBe(true);
      expect(isValidResultForType("SECOND_TOUCH", "PLAYABLE_BUMP")).toBe(true);
      expect(isValidResultForType("SECOND_TOUCH", "POOR")).toBe(true);
    });

    it("returns true for ERROR", () => {
      expect(isValidResultForType("SECOND_TOUCH", "ERROR")).toBe(true);
    });

    it("returns false for KILL", () => {
      expect(isValidResultForType("SECOND_TOUCH", "KILL")).toBe(false);
    });
  });
});

describe("getValidResultsForType", () => {
  it("returns correct results for SERVE", () => {
    expect(getValidResultsForType("SERVE")).toEqual(["ACE", "IN_PLAY", "ERROR"]);
  });

  it("returns correct results for ATTACK", () => {
    expect(getValidResultsForType("ATTACK")).toEqual([
      "KILL",
      "IN_PLAY",
      "ERROR",
    ]);
  });

  it("returns empty array for unknown type", () => {
    expect(getValidResultsForType("UNKNOWN" as any)).toEqual([]);
  });
});

describe("isHittingPlay", () => {
  it("returns true for ATTACK", () => {
    expect(isHittingPlay("ATTACK")).toBe(true);
  });

  it("returns true for FREE_BALL", () => {
    expect(isHittingPlay("FREE_BALL")).toBe(true);
  });

  it("returns false for SERVE", () => {
    expect(isHittingPlay("SERVE")).toBe(false);
  });

  it("returns false for BLOCK", () => {
    expect(isHittingPlay("BLOCK")).toBe(false);
  });
});

describe("isPassingPlay", () => {
  it("returns true for PASS", () => {
    expect(isPassingPlay("PASS")).toBe(true);
  });

  it("returns true for SERVE_RECEIVE", () => {
    expect(isPassingPlay("SERVE_RECEIVE")).toBe(true);
  });

  it("returns false for ATTACK", () => {
    expect(isPassingPlay("ATTACK")).toBe(false);
  });
});

describe("isServingPlay", () => {
  it("returns true for SERVE", () => {
    expect(isServingPlay("SERVE")).toBe(true);
  });

  it("returns false for ATTACK", () => {
    expect(isServingPlay("ATTACK")).toBe(false);
  });

  it("returns false for all other types", () => {
    expect(isServingPlay("BLOCK")).toBe(false);
    expect(isServingPlay("PASS")).toBe(false);
    expect(isServingPlay("SECOND_TOUCH")).toBe(false);
  });
});

describe("isSecondTouchPlay", () => {
  it("returns true for SECOND_TOUCH", () => {
    expect(isSecondTouchPlay("SECOND_TOUCH")).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isSecondTouchPlay("ATTACK")).toBe(false);
    expect(isSecondTouchPlay("SERVE")).toBe(false);
    expect(isSecondTouchPlay("PASS")).toBe(false);
  });
});

describe("canScorePoints", () => {
  it("returns true for SERVE", () => {
    expect(canScorePoints("SERVE")).toBe(true);
  });

  it("returns true for ATTACK", () => {
    expect(canScorePoints("ATTACK")).toBe(true);
  });

  it("returns true for BLOCK", () => {
    expect(canScorePoints("BLOCK")).toBe(true);
  });

  it("returns true for FREE_BALL", () => {
    expect(canScorePoints("FREE_BALL")).toBe(true);
  });

  it("returns true for OPP_ERROR", () => {
    expect(canScorePoints("OPP_ERROR")).toBe(true);
  });

  it("returns false for PASS", () => {
    expect(canScorePoints("PASS")).toBe(false);
  });

  it("returns false for SECOND_TOUCH", () => {
    expect(canScorePoints("SECOND_TOUCH")).toBe(false);
  });
});

describe("validatePlay", () => {
  describe("valid plays", () => {
    it("validates a valid SERVE ACE", () => {
      const result = validatePlay({
        type: "SERVE",
        result: "ACE",
        playerId: "player-1",
        teamId: "team-1",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates a valid ATTACK KILL", () => {
      const result = validatePlay({
        type: "ATTACK",
        result: "KILL",
        playerId: "player-1",
      });
      expect(result.valid).toBe(true);
    });

    it("validates a valid PASS", () => {
      const result = validatePlay({
        type: "PASS",
        result: "PASS_4",
        playerId: "player-1",
      });
      expect(result.valid).toBe(true);
    });

    it("validates a valid SECOND_TOUCH ASSIST", () => {
      const result = validatePlay({
        type: "SECOND_TOUCH",
        result: "ASSIST",
        playerId: "player-1",
      });
      expect(result.valid).toBe(true);
    });

    it("validates OPP_ERROR without player", () => {
      const result = validatePlay({
        type: "OPP_ERROR",
        result: "OPP_ERROR",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid plays", () => {
    it("rejects invalid play type", () => {
      const result = validatePlay({
        type: "INVALID_TYPE",
        result: "KILL",
        playerId: "player-1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid play type: INVALID_TYPE");
    });

    it("rejects invalid result for play type", () => {
      const result = validatePlay({
        type: "SERVE",
        result: "KILL",
        playerId: "player-1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid result "KILL" for play type "SERVE"');
    });

    it("rejects ATTACK KILL without player", () => {
      const result = validatePlay({
        type: "ATTACK",
        result: "KILL",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Scoring plays (ACE, KILL) must have a player assigned"
      );
    });

    it("rejects SERVE ACE without player", () => {
      const result = validatePlay({
        type: "SERVE",
        result: "ACE",
        playerId: null,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Scoring plays (ACE, KILL) must have a player assigned"
      );
    });

    it("allows ERROR without player", () => {
      const result = validatePlay({
        type: "SERVE",
        result: "ERROR",
      });
      expect(result.valid).toBe(true);
    });

    it("allows IN_PLAY without player", () => {
      const result = validatePlay({
        type: "ATTACK",
        result: "IN_PLAY",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("multiple errors", () => {
    it("reports multiple validation errors", () => {
      const result = validatePlay({
        type: "INVALID_TYPE",
        result: "INVALID_RESULT",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("getPlayTypeDisplayName", () => {
  it("returns correct name for SERVE", () => {
    expect(getPlayTypeDisplayName("SERVE")).toBe("Serve");
  });

  it("returns correct name for ATTACK", () => {
    expect(getPlayTypeDisplayName("ATTACK")).toBe("Attack");
  });

  it("returns correct name for SECOND_TOUCH", () => {
    expect(getPlayTypeDisplayName("SECOND_TOUCH")).toBe("Second Touch");
  });

  it("returns correct name for SERVE_RECEIVE", () => {
    expect(getPlayTypeDisplayName("SERVE_RECEIVE")).toBe("Serve Receive");
  });

  it("returns correct name for FREE_BALL", () => {
    expect(getPlayTypeDisplayName("FREE_BALL")).toBe("Free Ball");
  });

  it("returns correct name for OPP_ERROR", () => {
    expect(getPlayTypeDisplayName("OPP_ERROR")).toBe("Opponent Error");
  });
});

describe("getPlayResultDisplayName", () => {
  it("returns correct name for ACE", () => {
    expect(getPlayResultDisplayName("ACE")).toBe("Ace");
  });

  it("returns correct name for KILL", () => {
    expect(getPlayResultDisplayName("KILL")).toBe("Kill");
  });

  it("returns correct name for pass grades", () => {
    expect(getPlayResultDisplayName("PASS_4")).toBe("Pass 4 (Perfect)");
    expect(getPlayResultDisplayName("PASS_3")).toBe("Pass 3 (Good)");
    expect(getPlayResultDisplayName("PASS_2")).toBe("Pass 2 (Playable)");
    expect(getPlayResultDisplayName("PASS_1")).toBe("Pass 1 (Out of System)");
    expect(getPlayResultDisplayName("OVER_PASS")).toBe("Over Pass");
  });

  it("returns correct name for setting results", () => {
    expect(getPlayResultDisplayName("ASSIST")).toBe("Assist");
    expect(getPlayResultDisplayName("PLAYABLE_SET")).toBe("Playable Set");
    expect(getPlayResultDisplayName("PLAYABLE_BUMP")).toBe("Playable Bump");
    expect(getPlayResultDisplayName("POOR")).toBe("Poor");
  });
});

describe("getPlayResultAbbreviation", () => {
  it("returns correct abbreviation for scoring results", () => {
    expect(getPlayResultAbbreviation("ACE")).toBe("A");
    expect(getPlayResultAbbreviation("KILL")).toBe("K");
  });

  it("returns correct abbreviation for pass grades", () => {
    expect(getPlayResultAbbreviation("PASS_4")).toBe("P4");
    expect(getPlayResultAbbreviation("PASS_3")).toBe("P3");
    expect(getPlayResultAbbreviation("PASS_2")).toBe("P2");
    expect(getPlayResultAbbreviation("PASS_1")).toBe("P1");
    expect(getPlayResultAbbreviation("OVER_PASS")).toBe("OP");
  });

  it("returns correct abbreviation for setting results", () => {
    expect(getPlayResultAbbreviation("ASSIST")).toBe("AST");
    expect(getPlayResultAbbreviation("PLAYABLE_SET")).toBe("PS");
    expect(getPlayResultAbbreviation("PLAYABLE_BUMP")).toBe("PB");
    expect(getPlayResultAbbreviation("POOR")).toBe("PR");
  });

  it("returns correct abbreviation for other results", () => {
    expect(getPlayResultAbbreviation("IN_PLAY")).toBe("IP");
    expect(getPlayResultAbbreviation("ERROR")).toBe("E");
    expect(getPlayResultAbbreviation("OPP_ERROR")).toBe("OE");
  });
});

describe("Integration: play workflow validation", () => {
  it("validates a complete attack sequence", () => {
    // Pass
    expect(
      validatePlay({ type: "PASS", result: "PASS_3", playerId: "p1" }).valid
    ).toBe(true);

    // Set
    expect(
      validatePlay({ type: "SECOND_TOUCH", result: "PLAYABLE_SET", playerId: "p2" })
        .valid
    ).toBe(true);

    // Attack
    expect(
      validatePlay({ type: "ATTACK", result: "KILL", playerId: "p3" }).valid
    ).toBe(true);
  });

  it("validates a serve sequence", () => {
    // Serve
    expect(
      validatePlay({ type: "SERVE", result: "IN_PLAY", playerId: "p1" }).valid
    ).toBe(true);

    // Serve receive
    expect(
      validatePlay({ type: "SERVE_RECEIVE", result: "PASS_4", playerId: "p2" })
        .valid
    ).toBe(true);
  });

  it("validates error scenarios", () => {
    // Serve error
    expect(
      validatePlay({ type: "SERVE", result: "ERROR", playerId: "p1" }).valid
    ).toBe(true);

    // Attack error
    expect(
      validatePlay({ type: "ATTACK", result: "ERROR", playerId: "p1" }).valid
    ).toBe(true);

    // Setting error
    expect(
      validatePlay({ type: "SECOND_TOUCH", result: "ERROR", playerId: "p1" })
        .valid
    ).toBe(true);
  });
});
