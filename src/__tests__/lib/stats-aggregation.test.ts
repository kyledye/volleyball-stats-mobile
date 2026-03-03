/**
 * Tests for /lib/stats-aggregation
 */

import {
  Play,
  PlayerStats,
  groupPlaysByPlayer,
  groupPlaysByTeam,
  calculatePlayerStats,
  calculateAllPlayerStats,
  calculateTeamStats,
  filterPlaysByType,
  filterPlaysByResult,
  countPlaysByType,
  countPlaysByResult,
  getTopPerformers,
  filterByMinAttempts,
  calculateTotals,
  calculateEfficiency,
  comparePlayerStats,
  getStatSummary,
} from "../../lib/stats-aggregation";

// Test data
const testPlays: Play[] = [
  { type: "ATTACK", result: "KILL", playerId: "p1", teamId: "t1" },
  { type: "ATTACK", result: "ERROR", playerId: "p1", teamId: "t1" },
  { type: "ATTACK", result: "IN_PLAY", playerId: "p1", teamId: "t1" },
  { type: "SERVE", result: "ACE", playerId: "p2", teamId: "t1" },
  { type: "SERVE", result: "IN_PLAY", playerId: "p2", teamId: "t1" },
  { type: "PASS", result: "PASS_4", playerId: "p3", teamId: "t1" },
  { type: "PASS", result: "PASS_3", playerId: "p3", teamId: "t1" },
  { type: "SECOND_TOUCH", result: "ASSIST", playerId: "p4", teamId: "t1" },
  { type: "ATTACK", result: "KILL", playerId: "p5", teamId: "t2" },
];

describe("groupPlaysByPlayer", () => {
  it("groups plays by player ID", () => {
    const grouped = groupPlaysByPlayer(testPlays);

    expect(grouped.get("p1")).toHaveLength(3);
    expect(grouped.get("p2")).toHaveLength(2);
    expect(grouped.get("p3")).toHaveLength(2);
    expect(grouped.get("p4")).toHaveLength(1);
    expect(grouped.get("p5")).toHaveLength(1);
  });

  it("ignores plays without player ID", () => {
    const playsWithNull: Play[] = [
      { type: "ATTACK", result: "KILL", playerId: "p1" },
      { type: "ATTACK", result: "KILL", playerId: null },
      { type: "ATTACK", result: "KILL" },
    ];

    const grouped = groupPlaysByPlayer(playsWithNull);
    expect(grouped.size).toBe(1);
    expect(grouped.get("p1")).toHaveLength(1);
  });

  it("returns empty map for empty plays", () => {
    const grouped = groupPlaysByPlayer([]);
    expect(grouped.size).toBe(0);
  });
});

describe("groupPlaysByTeam", () => {
  it("groups plays by team ID", () => {
    const grouped = groupPlaysByTeam(testPlays);

    expect(grouped.get("t1")).toHaveLength(8);
    expect(grouped.get("t2")).toHaveLength(1);
  });

  it("ignores plays without team ID", () => {
    const playsWithNull: Play[] = [
      { type: "ATTACK", result: "KILL", teamId: "t1" },
      { type: "ATTACK", result: "KILL" },
    ];

    const grouped = groupPlaysByTeam(playsWithNull);
    expect(grouped.size).toBe(1);
  });
});

describe("calculatePlayerStats", () => {
  it("calculates stats for a player", () => {
    const playerPlays: Play[] = [
      { type: "ATTACK", result: "KILL", playerId: "p1" },
      { type: "ATTACK", result: "KILL", playerId: "p1" },
      { type: "ATTACK", result: "ERROR", playerId: "p1" },
      { type: "SERVE", result: "ACE", playerId: "p1" },
    ];

    const stats = calculatePlayerStats("p1", playerPlays);

    expect(stats.playerId).toBe("p1");
    expect(stats.plays).toHaveLength(4);
    expect(stats.hitting.breakdown.kills).toBe(2);
    expect(stats.hitting.breakdown.errors).toBe(1);
    expect(stats.serving.breakdown.aces).toBe(1);
  });

  it("returns null ratings for empty plays", () => {
    const stats = calculatePlayerStats("p1", []);

    expect(stats.hitting.rating).toBeNull();
    expect(stats.serving.rating).toBeNull();
    expect(stats.overallRating).toBeNull();
  });
});

describe("calculateAllPlayerStats", () => {
  it("calculates stats for all players", () => {
    const stats = calculateAllPlayerStats(testPlays);

    expect(stats).toHaveLength(5); // 5 unique players
    expect(stats.find((s) => s.playerId === "p1")).toBeDefined();
    expect(stats.find((s) => s.playerId === "p5")).toBeDefined();
  });

  it("returns empty array for empty plays", () => {
    const stats = calculateAllPlayerStats([]);
    expect(stats).toHaveLength(0);
  });
});

describe("calculateTeamStats", () => {
  it("calculates stats for a team", () => {
    const teamPlays = testPlays.filter((p) => p.teamId === "t1");
    const stats = calculateTeamStats("t1", teamPlays);

    expect(stats.teamId).toBe("t1");
    expect(stats.plays).toHaveLength(8);
    expect(stats.hitting.count).toBeGreaterThan(0);
    expect(stats.serving.count).toBeGreaterThan(0);
  });
});

describe("filterPlaysByType", () => {
  it("filters plays by single type", () => {
    const attacks = filterPlaysByType(testPlays, ["ATTACK"]);
    expect(attacks.every((p) => p.type === "ATTACK")).toBe(true);
    expect(attacks).toHaveLength(4);
  });

  it("filters plays by multiple types", () => {
    const filtered = filterPlaysByType(testPlays, ["ATTACK", "SERVE"]);
    expect(filtered.every((p) => ["ATTACK", "SERVE"].includes(p.type))).toBe(
      true
    );
    expect(filtered).toHaveLength(6);
  });

  it("returns empty for no matches", () => {
    const filtered = filterPlaysByType(testPlays, ["BLOCK"]);
    expect(filtered).toHaveLength(0);
  });
});

describe("filterPlaysByResult", () => {
  it("filters plays by result", () => {
    const kills = filterPlaysByResult(testPlays, ["KILL"]);
    expect(kills.every((p) => p.result === "KILL")).toBe(true);
    expect(kills).toHaveLength(2);
  });

  it("filters plays by multiple results", () => {
    const filtered = filterPlaysByResult(testPlays, ["KILL", "ACE"]);
    expect(filtered).toHaveLength(3);
  });
});

describe("countPlaysByType", () => {
  it("counts plays by type", () => {
    const counts = countPlaysByType(testPlays);

    expect(counts.get("ATTACK")).toBe(4);
    expect(counts.get("SERVE")).toBe(2);
    expect(counts.get("PASS")).toBe(2);
    expect(counts.get("SECOND_TOUCH")).toBe(1);
  });

  it("returns empty map for empty plays", () => {
    const counts = countPlaysByType([]);
    expect(counts.size).toBe(0);
  });
});

describe("countPlaysByResult", () => {
  it("counts plays by result", () => {
    const counts = countPlaysByResult(testPlays);

    expect(counts.get("KILL")).toBe(2);
    expect(counts.get("ACE")).toBe(1);
    expect(counts.get("IN_PLAY")).toBe(2);
  });
});

describe("getTopPerformers", () => {
  const stats: PlayerStats[] = [
    {
      playerId: "p1",
      plays: [],
      hitting: { rating: 3.0, percent: 75, count: 10, breakdown: { kills: 7, inPlay: 2, errors: 1 } },
      serving: { rating: 2.0, percent: 50, count: 5, breakdown: { aces: 1, inPlay: 3, errors: 1 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 60,
    },
    {
      playerId: "p2",
      plays: [],
      hitting: { rating: 4.0, percent: 100, count: 5, breakdown: { kills: 5, inPlay: 0, errors: 0 } },
      serving: { rating: 3.5, percent: 87.5, count: 8, breakdown: { aces: 3, inPlay: 5, errors: 0 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 80,
    },
    {
      playerId: "p3",
      plays: [],
      hitting: { rating: 2.0, percent: 50, count: 20, breakdown: { kills: 10, inPlay: 5, errors: 5 } },
      serving: { rating: null, percent: null, count: 0, breakdown: { aces: 0, inPlay: 0, errors: 0 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 45,
    },
  ];

  it("returns top performers by hitting rating", () => {
    const top = getTopPerformers(stats, "hitting", 2);
    expect(top).toHaveLength(2);
    expect(top[0].playerId).toBe("p2"); // 4.0 rating
    expect(top[1].playerId).toBe("p1"); // 3.0 rating
  });

  it("returns top performers by overall rating", () => {
    const top = getTopPerformers(stats, "overall", 2);
    expect(top).toHaveLength(2);
    expect(top[0].playerId).toBe("p2"); // 80
    expect(top[1].playerId).toBe("p1"); // 60
  });

  it("filters out null ratings", () => {
    const top = getTopPerformers(stats, "serving", 5);
    expect(top).toHaveLength(2); // p3 has null serving rating
  });

  it("respects limit parameter", () => {
    const top = getTopPerformers(stats, "hitting", 1);
    expect(top).toHaveLength(1);
  });
});

describe("filterByMinAttempts", () => {
  const stats: PlayerStats[] = [
    {
      playerId: "p1",
      plays: [],
      hitting: { rating: 3.0, percent: 75, count: 10, breakdown: { kills: 7, inPlay: 2, errors: 1 } },
      serving: { rating: 2.0, percent: 50, count: 5, breakdown: { aces: 1, inPlay: 3, errors: 1 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 60,
    },
    {
      playerId: "p2",
      plays: [],
      hitting: { rating: 4.0, percent: 100, count: 5, breakdown: { kills: 5, inPlay: 0, errors: 0 } },
      serving: { rating: null, percent: null, count: 0, breakdown: { aces: 0, inPlay: 0, errors: 0 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 80,
    },
  ];

  it("filters by minimum hitting attempts", () => {
    const filtered = filterByMinAttempts(stats, "hitting", 8);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].playerId).toBe("p1");
  });

  it("returns all when min is 0", () => {
    const filtered = filterByMinAttempts(stats, "hitting", 0);
    expect(filtered).toHaveLength(2);
  });
});

describe("calculateTotals", () => {
  const stats: PlayerStats[] = [
    {
      playerId: "p1",
      plays: [{}, {}, {}] as Play[],
      hitting: { rating: 3.0, percent: 75, count: 3, breakdown: { kills: 2, inPlay: 0, errors: 1 } },
      serving: { rating: 2.0, percent: 50, count: 2, breakdown: { aces: 1, inPlay: 0, errors: 1 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: 3.0, percent: 75, count: 1, breakdown: { assists: 1, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 60,
    },
    {
      playerId: "p2",
      plays: [{}, {}] as Play[],
      hitting: { rating: 4.0, percent: 100, count: 2, breakdown: { kills: 2, inPlay: 0, errors: 0 } },
      serving: { rating: 3.0, percent: 75, count: 1, breakdown: { aces: 1, inPlay: 0, errors: 0 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: 4.0, percent: 100, count: 1, breakdown: { assists: 1, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 80,
    },
  ];

  it("calculates totals correctly", () => {
    const totals = calculateTotals(stats);

    expect(totals.totalPlays).toBe(5);
    expect(totals.totalKills).toBe(4);
    expect(totals.totalErrors).toBe(2); // 1 hitting + 1 serving from p1
    expect(totals.totalAces).toBe(2);
    expect(totals.totalAssists).toBe(2);
  });
});

describe("calculateEfficiency", () => {
  it("calculates efficiency correctly", () => {
    expect(calculateEfficiency(10, 5, 20)).toBe(0.25); // (10-5)/20
    expect(calculateEfficiency(5, 0, 10)).toBe(0.5); // 5/10
    expect(calculateEfficiency(0, 5, 10)).toBe(-0.5); // -5/10
  });

  it("returns null for zero attempts", () => {
    expect(calculateEfficiency(0, 0, 0)).toBeNull();
  });
});

describe("comparePlayerStats", () => {
  const statsA: PlayerStats = {
    playerId: "a",
    plays: [],
    hitting: { rating: 3.0, percent: 75, count: 10, breakdown: { kills: 7, inPlay: 2, errors: 1 } },
    serving: { rating: 2.0, percent: 50, count: 5, breakdown: { aces: 1, inPlay: 3, errors: 1 } },
    passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
    secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
    overallRating: 60,
  };

  const statsB: PlayerStats = {
    playerId: "b",
    plays: [],
    hitting: { rating: 4.0, percent: 100, count: 5, breakdown: { kills: 5, inPlay: 0, errors: 0 } },
    serving: { rating: 3.5, percent: 87.5, count: 8, breakdown: { aces: 3, inPlay: 5, errors: 0 } },
    passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
    secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
    overallRating: 80,
  };

  it("compares hitting ratings", () => {
    expect(comparePlayerStats(statsA, statsB, "hitting")).toBe(-1); // 3.0 - 4.0
  });

  it("compares overall ratings", () => {
    expect(comparePlayerStats(statsA, statsB, "overall")).toBe(-20); // 60 - 80
  });

  it("returns 0 for equal ratings", () => {
    expect(comparePlayerStats(statsA, statsA, "hitting")).toBe(0);
  });
});

describe("getStatSummary", () => {
  it("returns summary with all stats", () => {
    const stats: PlayerStats = {
      playerId: "p1",
      plays: [],
      hitting: { rating: 3.0, percent: 75, count: 10, breakdown: { kills: 7, inPlay: 2, errors: 1 } },
      serving: { rating: 2.0, percent: 50, count: 5, breakdown: { aces: 2, inPlay: 2, errors: 1 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: 3.0, percent: 75, count: 3, breakdown: { assists: 3, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: 60,
    };

    const summary = getStatSummary(stats);
    expect(summary).toContain("7K");
    expect(summary).toContain("2A");
    expect(summary).toContain("3AST");
  });

  it("returns 'No stats' for empty stats", () => {
    const stats: PlayerStats = {
      playerId: "p1",
      plays: [],
      hitting: { rating: null, percent: null, count: 0, breakdown: { kills: 0, inPlay: 0, errors: 0 } },
      serving: { rating: null, percent: null, count: 0, breakdown: { aces: 0, inPlay: 0, errors: 0 } },
      passing: { rating: null, percent: null, count: 0, breakdown: { p4: 0, p3: 0, p2: 0, p1: 0, p0: 0 } },
      secondTouch: { rating: null, percent: null, count: 0, breakdown: { assists: 0, playableSet: 0, playableBump: 0, poor: 0, errors: 0 } },
      overallRating: null,
    };

    expect(getStatSummary(stats)).toBe("No stats");
  });
});
