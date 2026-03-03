/**
 * Tests for /lib/validation-utils
 */

import {
  isValidEmail,
  isValidPlayerNumber,
  isValidScore,
  isValidSetNumber,
  isValidPositionNumber,
  isNonEmptyString,
  isValidName,
  isValidTeamName,
  isValidAbbreviation,
  isValidId,
  isValidDateString,
  isNotInPast,
  isValidLineupSize,
  areAllPositionsFilled,
  hasNoDuplicatePlayers,
  isValidSubCount,
  isValidMatchType,
  isValidMatchStatus,
  isValidPlayerPosition,
  validatePlayer,
  validateTeam,
} from "../../lib/validation-utils";

describe("isValidEmail", () => {
  it("returns true for valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.org")).toBe(true);
    expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
  });

  it("returns false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });
});

describe("isValidPlayerNumber", () => {
  it("returns true for valid numbers 1-99", () => {
    expect(isValidPlayerNumber(1)).toBe(true);
    expect(isValidPlayerNumber(50)).toBe(true);
    expect(isValidPlayerNumber(99)).toBe(true);
  });

  it("returns false for invalid numbers", () => {
    expect(isValidPlayerNumber(0)).toBe(false);
    expect(isValidPlayerNumber(100)).toBe(false);
    expect(isValidPlayerNumber(-1)).toBe(false);
    expect(isValidPlayerNumber(1.5)).toBe(false);
  });
});

describe("isValidScore", () => {
  it("returns true for valid scores", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(25)).toBe(true);
    expect(isValidScore(30)).toBe(true);
  });

  it("returns false for invalid scores", () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(25.5)).toBe(false);
  });
});

describe("isValidSetNumber", () => {
  it("returns true for valid set numbers 1-5", () => {
    expect(isValidSetNumber(1)).toBe(true);
    expect(isValidSetNumber(3)).toBe(true);
    expect(isValidSetNumber(5)).toBe(true);
  });

  it("returns false for invalid set numbers", () => {
    expect(isValidSetNumber(0)).toBe(false);
    expect(isValidSetNumber(6)).toBe(false);
    expect(isValidSetNumber(2.5)).toBe(false);
  });
});

describe("isValidPositionNumber", () => {
  it("returns true for valid positions 1-6", () => {
    expect(isValidPositionNumber(1)).toBe(true);
    expect(isValidPositionNumber(3)).toBe(true);
    expect(isValidPositionNumber(6)).toBe(true);
  });

  it("returns false for invalid positions", () => {
    expect(isValidPositionNumber(0)).toBe(false);
    expect(isValidPositionNumber(7)).toBe(false);
    expect(isValidPositionNumber(1.5)).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  it("returns true for non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("  hello  ")).toBe(true);
  });

  it("returns false for empty or whitespace strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString("\t\n")).toBe(false);
  });

  it("returns false for null and undefined", () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });
});

describe("isValidName", () => {
  it("returns true for valid names", () => {
    expect(isValidName("John")).toBe(true);
    expect(isValidName("Mary Jane")).toBe(true);
    expect(isValidName("O'Brien")).toBe(true);
    expect(isValidName("Smith-Jones")).toBe(true);
  });

  it("returns false for invalid names", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("123")).toBe(false);
    expect(isValidName("John123")).toBe(false);
    expect(isValidName("@#$")).toBe(false);
  });

  it("returns false for names starting with non-letter", () => {
    expect(isValidName("'Smith")).toBe(false);
    expect(isValidName("-Jones")).toBe(false);
    expect(isValidName("1John")).toBe(false);
  });
});

describe("isValidTeamName", () => {
  it("returns true for valid team names", () => {
    expect(isValidTeamName("Varsity")).toBe(true);
    expect(isValidTeamName("JV Team")).toBe(true);
    expect(isValidTeamName("Team 1")).toBe(true);
    expect(isValidTeamName("St. Mary's")).toBe(true);
  });

  it("returns false for invalid team names", () => {
    expect(isValidTeamName("")).toBe(false);
    expect(isValidTeamName("A")).toBe(false); // Too short
  });

  it("returns false for null and undefined", () => {
    expect(isValidTeamName(null as unknown as string)).toBe(false);
    expect(isValidTeamName(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidAbbreviation", () => {
  it("returns true for valid abbreviations", () => {
    expect(isValidAbbreviation("AB")).toBe(true);
    expect(isValidAbbreviation("ABC")).toBe(true);
    expect(isValidAbbreviation("ABCD")).toBe(true);
  });

  it("returns false for invalid abbreviations", () => {
    expect(isValidAbbreviation("A")).toBe(false); // Too short
    expect(isValidAbbreviation("ABCDE")).toBe(false); // Too long
    expect(isValidAbbreviation("ab")).toBe(false); // Lowercase
    expect(isValidAbbreviation("A1")).toBe(false); // Numbers
    expect(isValidAbbreviation("")).toBe(false);
  });
});

describe("isValidId", () => {
  it("returns true for valid IDs", () => {
    expect(isValidId("abc-123")).toBe(true);
    expect(isValidId("player_1")).toBe(true);
  });

  it("returns false for invalid IDs", () => {
    expect(isValidId("")).toBe(false);
    expect(isValidId(null)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });
});

describe("isValidDateString", () => {
  it("returns true for valid date strings", () => {
    expect(isValidDateString("2024-03-15")).toBe(true);
    expect(isValidDateString("2024-03-15T10:30:00")).toBe(true);
    expect(isValidDateString("2024-03-15T10:30:00Z")).toBe(true);
  });

  it("returns false for invalid date strings", () => {
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString("not a date")).toBe(false);
    expect(isValidDateString("2024-13-45")).toBe(false); // Invalid month/day
  });
});

describe("isNotInPast", () => {
  it("returns true for future dates", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isNotInPast(tomorrow)).toBe(true);
  });

  it("returns true for today", () => {
    const today = new Date();
    expect(isNotInPast(today)).toBe(true);
  });

  it("returns false for past dates", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isNotInPast(yesterday)).toBe(false);
  });

  it("handles string dates", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isNotInPast(futureDate.toISOString())).toBe(true);
  });

  it("returns false for invalid dates", () => {
    expect(isNotInPast("invalid")).toBe(false);
  });
});

describe("isValidLineupSize", () => {
  it("returns true for exactly 6 starters", () => {
    expect(isValidLineupSize([1, 2, 3, 4, 5, 6])).toBe(true);
    expect(isValidLineupSize(["a", "b", "c", "d", "e", "f"])).toBe(true);
  });

  it("returns false for wrong number of starters", () => {
    expect(isValidLineupSize([])).toBe(false);
    expect(isValidLineupSize([1, 2, 3, 4, 5])).toBe(false);
    expect(isValidLineupSize([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });

  it("returns false for non-arrays", () => {
    expect(isValidLineupSize("not an array" as unknown as unknown[])).toBe(false);
  });
});

describe("areAllPositionsFilled", () => {
  it("returns true when all positions filled", () => {
    expect(
      areAllPositionsFilled({
        1: "p1",
        2: "p2",
        3: "p3",
        4: "p4",
        5: "p5",
        6: "p6",
      })
    ).toBe(true);
  });

  it("returns false when positions are empty", () => {
    expect(
      areAllPositionsFilled({
        1: "p1",
        2: "p2",
        3: "p3",
        4: "p4",
        5: "p5",
        6: null,
      })
    ).toBe(false);

    expect(
      areAllPositionsFilled({
        1: "p1",
        2: "p2",
        3: "p3",
        4: "p4",
        5: "p5",
        6: undefined,
      })
    ).toBe(false);

    expect(
      areAllPositionsFilled({
        1: "p1",
        2: "p2",
        3: "p3",
        4: "p4",
        5: "p5",
        6: "",
      })
    ).toBe(false);
  });
});

describe("hasNoDuplicatePlayers", () => {
  it("returns true when no duplicates", () => {
    expect(
      hasNoDuplicatePlayers({
        1: "p1",
        2: "p2",
        3: "p3",
        4: "p4",
        5: "p5",
        6: "p6",
      })
    ).toBe(true);
  });

  it("returns false when duplicates exist", () => {
    expect(
      hasNoDuplicatePlayers({
        1: "p1",
        2: "p1", // Duplicate
        3: "p3",
        4: "p4",
        5: "p5",
        6: "p6",
      })
    ).toBe(false);
  });

  it("ignores null/undefined values", () => {
    expect(
      hasNoDuplicatePlayers({
        1: "p1",
        2: null,
        3: null,
        4: "p4",
        5: undefined,
        6: "p6",
      })
    ).toBe(true);
  });
});

describe("isValidSubCount", () => {
  it("returns true for valid sub counts", () => {
    expect(isValidSubCount(0)).toBe(true);
    expect(isValidSubCount(10)).toBe(true);
    expect(isValidSubCount(18)).toBe(true);
  });

  it("returns false for invalid sub counts", () => {
    expect(isValidSubCount(-1)).toBe(false);
    expect(isValidSubCount(19)).toBe(false);
    expect(isValidSubCount(5.5)).toBe(false);
  });

  it("respects custom max", () => {
    expect(isValidSubCount(10, 10)).toBe(true);
    expect(isValidSubCount(11, 10)).toBe(false);
  });
});

describe("isValidMatchType", () => {
  it("returns true for valid match types", () => {
    expect(isValidMatchType("BEST_OF_3")).toBe(true);
    expect(isValidMatchType("BEST_OF_5")).toBe(true);
  });

  it("returns false for invalid match types", () => {
    expect(isValidMatchType("BEST_OF_7")).toBe(false);
    expect(isValidMatchType("")).toBe(false);
  });
});

describe("isValidMatchStatus", () => {
  it("returns true for valid statuses", () => {
    expect(isValidMatchStatus("SCHEDULED")).toBe(true);
    expect(isValidMatchStatus("IN_PROGRESS")).toBe(true);
    expect(isValidMatchStatus("COMPLETED")).toBe(true);
    expect(isValidMatchStatus("CANCELLED")).toBe(true);
  });

  it("returns false for invalid statuses", () => {
    expect(isValidMatchStatus("UNKNOWN")).toBe(false);
    expect(isValidMatchStatus("")).toBe(false);
  });
});

describe("isValidPlayerPosition", () => {
  it("returns true for valid positions", () => {
    expect(isValidPlayerPosition("SETTER")).toBe(true);
    expect(isValidPlayerPosition("OUTSIDE_HITTER")).toBe(true);
    expect(isValidPlayerPosition("MIDDLE_BLOCKER")).toBe(true);
    expect(isValidPlayerPosition("OPPOSITE")).toBe(true);
    expect(isValidPlayerPosition("LIBERO")).toBe(true);
    expect(isValidPlayerPosition("DEFENSIVE_SPECIALIST")).toBe(true);
  });

  it("returns false for invalid positions", () => {
    expect(isValidPlayerPosition("UNKNOWN")).toBe(false);
    expect(isValidPlayerPosition("")).toBe(false);
    expect(isValidPlayerPosition("setter")).toBe(false); // Lowercase
  });
});

describe("validatePlayer", () => {
  it("returns valid for correct player data", () => {
    const result = validatePlayer({
      number: 7,
      firstName: "John",
      lastName: "Doe",
      position: "SETTER",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for invalid number", () => {
    const result = validatePlayer({ number: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Player number must be between 1 and 99");
  });

  it("returns errors for invalid names", () => {
    const result = validatePlayer({
      firstName: "123",
      lastName: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("allows null position", () => {
    const result = validatePlayer({
      number: 7,
      firstName: "John",
      lastName: "Doe",
      position: null,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid position", () => {
    const result = validatePlayer({
      position: "INVALID",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invalid player position");
  });
});

describe("validateTeam", () => {
  it("returns valid for correct team data", () => {
    const result = validateTeam({
      name: "Varsity",
      abbreviation: "VAR",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for invalid name", () => {
    const result = validateTeam({ name: "A" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Team name must be 2-100 characters");
  });

  it("returns errors for invalid abbreviation", () => {
    const result = validateTeam({ abbreviation: "toolong" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Abbreviation must be 2-4 uppercase letters");
  });

  it("allows empty abbreviation", () => {
    const result = validateTeam({
      name: "Team Name",
      abbreviation: "",
    });
    expect(result.valid).toBe(true);
  });
});
