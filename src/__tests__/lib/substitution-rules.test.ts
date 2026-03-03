import {
  NFHS_RULES,
  isBackRow,
  isFrontRow,
  canSubstitute,
  canLiberoEnter,
  rotatePositions,
  getPlayerAtPosition,
  shouldLiberoLeave,
} from "../../lib/substitution-rules";

describe("NFHS_RULES constants", () => {
  it("has correct max subs per set", () => {
    expect(NFHS_RULES.MAX_SUBS_PER_SET).toBe(18);
  });

  it("has correct libero positions (back row only)", () => {
    expect(NFHS_RULES.LIBERO_POSITIONS).toEqual([1, 5, 6]);
  });

  it("has correct front row positions", () => {
    expect(NFHS_RULES.FRONT_ROW).toEqual([2, 3, 4]);
  });

  it("has correct back row positions", () => {
    expect(NFHS_RULES.BACK_ROW).toEqual([1, 5, 6]);
  });
});

describe("isBackRow", () => {
  it("returns true for position 1", () => {
    expect(isBackRow(1)).toBe(true);
  });

  it("returns true for position 5", () => {
    expect(isBackRow(5)).toBe(true);
  });

  it("returns true for position 6", () => {
    expect(isBackRow(6)).toBe(true);
  });

  it("returns false for position 2", () => {
    expect(isBackRow(2)).toBe(false);
  });

  it("returns false for position 3", () => {
    expect(isBackRow(3)).toBe(false);
  });

  it("returns false for position 4", () => {
    expect(isBackRow(4)).toBe(false);
  });

  it("returns false for invalid position", () => {
    expect(isBackRow(7)).toBe(false);
    expect(isBackRow(0)).toBe(false);
  });
});

describe("isFrontRow", () => {
  it("returns true for position 2", () => {
    expect(isFrontRow(2)).toBe(true);
  });

  it("returns true for position 3", () => {
    expect(isFrontRow(3)).toBe(true);
  });

  it("returns true for position 4", () => {
    expect(isFrontRow(4)).toBe(true);
  });

  it("returns false for position 1", () => {
    expect(isFrontRow(1)).toBe(false);
  });

  it("returns false for position 5", () => {
    expect(isFrontRow(5)).toBe(false);
  });

  it("returns false for position 6", () => {
    expect(isFrontRow(6)).toBe(false);
  });

  it("returns false for invalid position", () => {
    expect(isFrontRow(7)).toBe(false);
    expect(isFrontRow(0)).toBe(false);
  });
});

describe("canSubstitute", () => {
  describe("libero swaps", () => {
    it("always allows libero swaps regardless of sub count", () => {
      expect(canSubstitute(0, true)).toEqual({ allowed: true });
      expect(canSubstitute(17, true)).toEqual({ allowed: true });
      expect(canSubstitute(18, true)).toEqual({ allowed: true });
      expect(canSubstitute(100, true)).toEqual({ allowed: true });
    });
  });

  describe("regular substitutions", () => {
    it("allows substitutions when count is 0", () => {
      const result = canSubstitute(0, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it("allows substitutions when count is less than 15", () => {
      const result = canSubstitute(14, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it("allows with warning when count is 15", () => {
      const result = canSubstitute(15, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBe("3 substitutions remaining");
    });

    it("allows with warning when count is 16", () => {
      const result = canSubstitute(16, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBe("2 substitutions remaining");
    });

    it("allows with warning when count is 17", () => {
      const result = canSubstitute(17, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBe("1 substitutions remaining");
    });

    it("denies substitutions when count is 18 (max)", () => {
      const result = canSubstitute(18, false);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Maximum 18 substitutions reached for this set");
    });

    it("denies substitutions when count exceeds 18", () => {
      const result = canSubstitute(20, false);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Maximum 18 substitutions reached for this set");
    });
  });
});

describe("canLiberoEnter", () => {
  it("allows libero to enter position 1", () => {
    expect(canLiberoEnter(1)).toEqual({ allowed: true });
  });

  it("allows libero to enter position 5", () => {
    expect(canLiberoEnter(5)).toEqual({ allowed: true });
  });

  it("allows libero to enter position 6", () => {
    expect(canLiberoEnter(6)).toEqual({ allowed: true });
  });

  it("denies libero entry to position 2 (front row)", () => {
    const result = canLiberoEnter(2);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Libero can only replace back row players (positions 1, 5, or 6)");
  });

  it("denies libero entry to position 3 (front row)", () => {
    const result = canLiberoEnter(3);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Libero can only replace back row players (positions 1, 5, or 6)");
  });

  it("denies libero entry to position 4 (front row)", () => {
    const result = canLiberoEnter(4);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Libero can only replace back row players (positions 1, 5, or 6)");
  });
});

describe("rotatePositions", () => {
  const startingPositions = {
    1: "player-A",
    2: "player-B",
    3: "player-C",
    4: "player-D",
    5: "player-E",
    6: "player-F",
  };

  it("rotates all players clockwise", () => {
    const rotated = rotatePositions(startingPositions);

    // Position 2 → Position 1 (new server)
    expect(rotated[1]).toBe("player-B");
    // Position 3 → Position 2
    expect(rotated[2]).toBe("player-C");
    // Position 4 → Position 3
    expect(rotated[3]).toBe("player-D");
    // Position 5 → Position 4
    expect(rotated[4]).toBe("player-E");
    // Position 6 → Position 5
    expect(rotated[5]).toBe("player-F");
    // Position 1 → Position 6
    expect(rotated[6]).toBe("player-A");
  });

  it("returns to original positions after 6 rotations", () => {
    let positions: Record<number, string> = { ...startingPositions };
    for (let i = 0; i < 6; i++) {
      positions = rotatePositions(positions);
    }
    expect(positions).toEqual(startingPositions);
  });

  it("does not mutate original positions", () => {
    const original = { ...startingPositions };
    rotatePositions(startingPositions);
    expect(startingPositions).toEqual(original);
  });
});

describe("getPlayerAtPosition", () => {
  const startingPositions = {
    1: "player-A",
    2: "player-B",
    3: "player-C",
    4: "player-D",
    5: "player-E",
    6: "player-F",
  };

  it("returns correct player with 0 rotations", () => {
    expect(getPlayerAtPosition(startingPositions, 0, 1)).toBe("player-A");
    expect(getPlayerAtPosition(startingPositions, 0, 4)).toBe("player-D");
  });

  it("returns correct player after 1 rotation", () => {
    // After 1 rotation: B is at 1, C at 2, etc.
    expect(getPlayerAtPosition(startingPositions, 1, 1)).toBe("player-B");
    expect(getPlayerAtPosition(startingPositions, 1, 6)).toBe("player-A");
  });

  it("returns correct player after 3 rotations", () => {
    expect(getPlayerAtPosition(startingPositions, 3, 1)).toBe("player-D");
  });

  it("handles rotation count > 6 correctly (mod 6)", () => {
    // 6 rotations = back to start
    expect(getPlayerAtPosition(startingPositions, 6, 1)).toBe("player-A");
    // 7 rotations = same as 1 rotation
    expect(getPlayerAtPosition(startingPositions, 7, 1)).toBe("player-B");
    // 12 rotations = same as 0 rotations
    expect(getPlayerAtPosition(startingPositions, 12, 1)).toBe("player-A");
  });
});

describe("shouldLiberoLeave", () => {
  it("returns false when libero position is null", () => {
    expect(shouldLiberoLeave(null, 0)).toBe(false);
    expect(shouldLiberoLeave(null, 5)).toBe(false);
  });

  it("returns true when libero at position 1 and rotating (will go to 6→5→4)", () => {
    // Position 1 rotates to position 6 after 1 rotation
    // Then 6→5 after another, then 5→4 (front row)
    // At position 1, next rotation puts them at 6, still back row
    expect(shouldLiberoLeave(1, 0)).toBe(false); // 1→6, still back row
  });

  it("returns true when libero at position 5 (will rotate to position 4 - front row)", () => {
    // Position 5 rotates to position 4 (front row)
    expect(shouldLiberoLeave(5, 0)).toBe(true);
  });

  it("returns true when libero at position 6 (will rotate to position 5)", () => {
    // Position 6 rotates to position 5 (still back row)
    expect(shouldLiberoLeave(6, 0)).toBe(false);
  });

  it("returns false for back row positions staying in back row", () => {
    // Position 1 → 6 (back row)
    expect(shouldLiberoLeave(1, 0)).toBe(false);
    // Position 6 → 5 (back row)
    expect(shouldLiberoLeave(6, 0)).toBe(false);
  });
});
