/**
 * Tests for /lib/format-utils
 */

import {
  formatPlayerName,
  formatPlayerWithNumber,
  formatDate,
  formatTime,
  formatMatchScore,
  formatSetScore,
  formatPercent,
  formatRating,
  formatMatchStatus,
  formatMatchType,
  formatPosition,
  formatPositionShort,
  formatOrdinal,
  formatSetNumber,
  pluralize,
  formatDuration,
  truncate,
} from "../../lib/format-utils";

describe("formatPlayerName", () => {
  it("formats full name by default", () => {
    expect(formatPlayerName("John", "Doe")).toBe("John Doe");
  });

  it("formats first-last", () => {
    expect(formatPlayerName("John", "Doe", "first-last")).toBe("John Doe");
  });

  it("formats last-first", () => {
    expect(formatPlayerName("John", "Doe", "last-first")).toBe("Doe, John");
  });

  it("formats initials", () => {
    expect(formatPlayerName("John", "Doe", "initials")).toBe("J. Doe");
  });

  it("handles single character names", () => {
    expect(formatPlayerName("J", "D", "initials")).toBe("J. D");
  });
});

describe("formatPlayerWithNumber", () => {
  it("formats player with number", () => {
    expect(formatPlayerWithNumber(7, "John", "Doe")).toBe("#7 John Doe");
  });

  it("handles single digit numbers", () => {
    expect(formatPlayerWithNumber(1, "Test", "Player")).toBe("#1 Test Player");
  });

  it("handles double digit numbers", () => {
    expect(formatPlayerWithNumber(99, "Test", "Player")).toBe("#99 Test Player");
  });
});

describe("formatDate", () => {
  const testDate = new Date("2024-03-15T10:30:00");

  it("formats medium date by default", () => {
    const result = formatDate(testDate, "medium");
    expect(result).toContain("Mar");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats short date", () => {
    const result = formatDate(testDate, "short");
    expect(result).toContain("3");
    expect(result).toContain("15");
  });

  it("formats long date", () => {
    const result = formatDate(testDate, "long");
    expect(result).toContain("March");
    expect(result).toContain("15");
    expect(result).toContain("2024");
    expect(result).toContain("Friday");
  });

  it("handles string dates", () => {
    const result = formatDate("2024-03-15T10:30:00", "medium");
    expect(result).toContain("Mar");
  });

  it("handles invalid dates", () => {
    expect(formatDate("invalid")).toBe("Invalid date");
  });
});

describe("formatTime", () => {
  it("formats time correctly", () => {
    const result = formatTime(new Date("2024-03-15T10:30:00"));
    expect(result).toContain("10");
    expect(result).toContain("30");
  });

  it("handles string dates", () => {
    const result = formatTime("2024-03-15T14:45:00");
    expect(result).toContain("45");
  });

  it("handles invalid dates", () => {
    expect(formatTime("invalid")).toBe("Invalid time");
  });
});

describe("formatMatchScore", () => {
  it("formats match score", () => {
    expect(formatMatchScore(2, 1)).toBe("2-1");
    expect(formatMatchScore(0, 0)).toBe("0-0");
    expect(formatMatchScore(3, 2)).toBe("3-2");
  });
});

describe("formatSetScore", () => {
  it("formats set score", () => {
    expect(formatSetScore(25, 23)).toBe("25-23");
    expect(formatSetScore(15, 13)).toBe("15-13");
    expect(formatSetScore(0, 0)).toBe("0-0");
  });
});

describe("formatPercent", () => {
  it("formats percentage with default decimals", () => {
    expect(formatPercent(75.5)).toBe("75.5%");
    expect(formatPercent(100)).toBe("100.0%");
  });

  it("formats percentage with custom decimals", () => {
    expect(formatPercent(75.555, 2)).toBe("75.56%");
    expect(formatPercent(50, 0)).toBe("50%");
  });

  it("handles null and undefined", () => {
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(undefined)).toBe("-");
  });

  it("handles negative percentages", () => {
    expect(formatPercent(-5.5)).toBe("-5.5%");
  });
});

describe("formatRating", () => {
  it("formats rating with default decimals", () => {
    expect(formatRating(2.5)).toBe("2.50");
    expect(formatRating(4)).toBe("4.00");
  });

  it("formats rating with custom decimals", () => {
    expect(formatRating(2.555, 1)).toBe("2.6");
    expect(formatRating(3, 0)).toBe("3");
  });

  it("handles null and undefined", () => {
    expect(formatRating(null)).toBe("-");
    expect(formatRating(undefined)).toBe("-");
  });

  it("handles negative ratings", () => {
    expect(formatRating(-1)).toBe("-1.00");
  });
});

describe("formatMatchStatus", () => {
  it("formats SCHEDULED", () => {
    expect(formatMatchStatus("SCHEDULED")).toBe("Scheduled");
  });

  it("formats IN_PROGRESS", () => {
    expect(formatMatchStatus("IN_PROGRESS")).toBe("In Progress");
  });

  it("formats COMPLETED", () => {
    expect(formatMatchStatus("COMPLETED")).toBe("Completed");
  });

  it("formats CANCELLED", () => {
    expect(formatMatchStatus("CANCELLED")).toBe("Cancelled");
  });
});

describe("formatMatchType", () => {
  it("formats BEST_OF_3", () => {
    expect(formatMatchType("BEST_OF_3")).toBe("Best of 3");
  });

  it("formats BEST_OF_5", () => {
    expect(formatMatchType("BEST_OF_5")).toBe("Best of 5");
  });
});

describe("formatPosition", () => {
  it("formats all positions", () => {
    expect(formatPosition("SETTER")).toBe("Setter");
    expect(formatPosition("OUTSIDE_HITTER")).toBe("Outside Hitter");
    expect(formatPosition("MIDDLE_BLOCKER")).toBe("Middle Blocker");
    expect(formatPosition("OPPOSITE")).toBe("Opposite");
    expect(formatPosition("LIBERO")).toBe("Libero");
    expect(formatPosition("DEFENSIVE_SPECIALIST")).toBe("DS");
  });

  it("handles null and undefined", () => {
    expect(formatPosition(null)).toBe("-");
    expect(formatPosition(undefined)).toBe("-");
  });

  it("returns unknown positions as-is", () => {
    expect(formatPosition("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("formatPositionShort", () => {
  it("formats all position abbreviations", () => {
    expect(formatPositionShort("SETTER")).toBe("S");
    expect(formatPositionShort("OUTSIDE_HITTER")).toBe("OH");
    expect(formatPositionShort("MIDDLE_BLOCKER")).toBe("MB");
    expect(formatPositionShort("OPPOSITE")).toBe("OPP");
    expect(formatPositionShort("LIBERO")).toBe("L");
    expect(formatPositionShort("DEFENSIVE_SPECIALIST")).toBe("DS");
  });

  it("handles null and undefined", () => {
    expect(formatPositionShort(null)).toBe("-");
    expect(formatPositionShort(undefined)).toBe("-");
  });
});

describe("formatOrdinal", () => {
  it("formats 1st, 2nd, 3rd", () => {
    expect(formatOrdinal(1)).toBe("1st");
    expect(formatOrdinal(2)).toBe("2nd");
    expect(formatOrdinal(3)).toBe("3rd");
  });

  it("formats 4th through 10th", () => {
    expect(formatOrdinal(4)).toBe("4th");
    expect(formatOrdinal(5)).toBe("5th");
    expect(formatOrdinal(10)).toBe("10th");
  });

  it("formats teens correctly", () => {
    expect(formatOrdinal(11)).toBe("11th");
    expect(formatOrdinal(12)).toBe("12th");
    expect(formatOrdinal(13)).toBe("13th");
  });

  it("formats 21st, 22nd, 23rd", () => {
    expect(formatOrdinal(21)).toBe("21st");
    expect(formatOrdinal(22)).toBe("22nd");
    expect(formatOrdinal(23)).toBe("23rd");
  });

  it("formats larger numbers", () => {
    expect(formatOrdinal(100)).toBe("100th");
    expect(formatOrdinal(101)).toBe("101st");
    expect(formatOrdinal(111)).toBe("111th");
  });
});

describe("formatSetNumber", () => {
  it("formats set number", () => {
    expect(formatSetNumber(1)).toBe("Set 1");
    expect(formatSetNumber(5)).toBe("Set 5");
  });
});

describe("pluralize", () => {
  it("uses singular for count of 1", () => {
    expect(pluralize(1, "point")).toBe("1 point");
    expect(pluralize(1, "match")).toBe("1 match");
  });

  it("uses plural for count other than 1", () => {
    expect(pluralize(0, "point")).toBe("0 points");
    expect(pluralize(2, "point")).toBe("2 points");
    expect(pluralize(100, "point")).toBe("100 points");
  });

  it("uses custom plural form", () => {
    expect(pluralize(2, "match", "matches")).toBe("2 matches");
    expect(pluralize(5, "person", "people")).toBe("5 people");
  });

  it("handles negative numbers", () => {
    expect(pluralize(-1, "point")).toBe("-1 points");
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(30000)).toBe("30s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(65000)).toBe("1m 5s");
    expect(formatDuration(120000)).toBe("2m 0s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600000)).toBe("1h 0m");
    expect(formatDuration(3900000)).toBe("1h 5m");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("truncate", () => {
  it("returns string unchanged if shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates with ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
    expect(truncate("a very long string", 10)).toBe("a very ...");
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("handles maxLength of 3 or less", () => {
    expect(truncate("hello", 3)).toBe("...");
    expect(truncate("hello", 4)).toBe("h...");
  });
});
