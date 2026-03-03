/**
 * Tests for /lib/lineup-utils
 */

import {
  CourtPlayer,
  BenchPlayer,
  LineupEntry,
  getPlayerAtCourtPosition,
  getServer,
  getFrontRowPlayers,
  getBackRowPlayers,
  courtToPositionsRecord,
  positionsRecordToCourt,
  swapCourtPositions,
  substitutePlayer,
  isValidLineup,
  findLibero,
  isLiberoOnCourt,
  getLiberoEntryPositions,
  sortByNumber,
  sortByPosition,
  createLineupEntries,
  getStarterIds,
  getBenchIds,
  getLiberoId,
} from "../../lib/lineup-utils";

// Test data
const mockOnCourt: CourtPlayer[] = [
  { id: "p1", number: 1, firstName: "Alice", lastName: "A", position: 1 },
  { id: "p2", number: 2, firstName: "Bob", lastName: "B", position: 2 },
  { id: "p3", number: 3, firstName: "Carol", lastName: "C", position: 3 },
  { id: "p4", number: 4, firstName: "David", lastName: "D", position: 4 },
  { id: "p5", number: 5, firstName: "Eve", lastName: "E", position: 5 },
  { id: "p6", number: 6, firstName: "Frank", lastName: "F", position: 6 },
];

const mockBench: BenchPlayer[] = [
  { id: "p7", number: 7, firstName: "Grace", lastName: "G" },
  { id: "p8", number: 8, firstName: "Henry", lastName: "H" },
  { id: "p9", number: 9, firstName: "Ivy", lastName: "I", isLibero: true },
];

describe("getPlayerAtCourtPosition", () => {
  it("returns player at specified position", () => {
    const player = getPlayerAtCourtPosition(mockOnCourt, 3);
    expect(player?.id).toBe("p3");
    expect(player?.firstName).toBe("Carol");
  });

  it("returns undefined for empty position", () => {
    const player = getPlayerAtCourtPosition(mockOnCourt, 7);
    expect(player).toBeUndefined();
  });

  it("returns undefined for empty court", () => {
    const player = getPlayerAtCourtPosition([], 1);
    expect(player).toBeUndefined();
  });
});

describe("getServer", () => {
  it("returns player at position 1", () => {
    const server = getServer(mockOnCourt);
    expect(server?.id).toBe("p1");
    expect(server?.position).toBe(1);
  });

  it("returns undefined if no player at position 1", () => {
    const courtWithoutServer = mockOnCourt.filter((p) => p.position !== 1);
    const server = getServer(courtWithoutServer);
    expect(server).toBeUndefined();
  });
});

describe("getFrontRowPlayers", () => {
  it("returns players at positions 2, 3, 4", () => {
    const frontRow = getFrontRowPlayers(mockOnCourt);
    expect(frontRow).toHaveLength(3);
    expect(frontRow.map((p) => p.position).sort()).toEqual([2, 3, 4]);
  });

  it("returns empty array for empty court", () => {
    expect(getFrontRowPlayers([])).toEqual([]);
  });
});

describe("getBackRowPlayers", () => {
  it("returns players at positions 1, 5, 6", () => {
    const backRow = getBackRowPlayers(mockOnCourt);
    expect(backRow).toHaveLength(3);
    expect(backRow.map((p) => p.position).sort()).toEqual([1, 5, 6]);
  });

  it("returns empty array for empty court", () => {
    expect(getBackRowPlayers([])).toEqual([]);
  });
});

describe("courtToPositionsRecord", () => {
  it("converts court players to positions record", () => {
    const record = courtToPositionsRecord(mockOnCourt);
    expect(record[1]).toBe("p1");
    expect(record[2]).toBe("p2");
    expect(record[3]).toBe("p3");
    expect(record[4]).toBe("p4");
    expect(record[5]).toBe("p5");
    expect(record[6]).toBe("p6");
  });

  it("handles empty court", () => {
    const record = courtToPositionsRecord([]);
    expect(Object.keys(record)).toHaveLength(0);
  });
});

describe("positionsRecordToCourt", () => {
  it("converts positions record to court players", () => {
    const positions = { 1: "p1", 2: "p2", 3: "p3", 4: "p4", 5: "p5", 6: "p6" };
    const playersMap = new Map<string, Omit<CourtPlayer, "position">>();
    mockOnCourt.forEach((p) => {
      playersMap.set(p.id, {
        id: p.id,
        number: p.number,
        firstName: p.firstName,
        lastName: p.lastName,
      });
    });

    const court = positionsRecordToCourt(positions, playersMap);
    expect(court).toHaveLength(6);
    expect(court.find((p) => p.position === 1)?.id).toBe("p1");
  });

  it("skips missing players", () => {
    const positions = { 1: "p1", 2: "missing" };
    const playersMap = new Map<string, Omit<CourtPlayer, "position">>();
    playersMap.set("p1", {
      id: "p1",
      number: 1,
      firstName: "Test",
      lastName: "Player",
    });

    const court = positionsRecordToCourt(positions, playersMap);
    expect(court).toHaveLength(1);
  });
});

describe("swapCourtPositions", () => {
  it("swaps two positions", () => {
    const swapped = swapCourtPositions(mockOnCourt, 1, 6);

    const pos1 = swapped.find((p) => p.position === 1);
    const pos6 = swapped.find((p) => p.position === 6);

    expect(pos1?.id).toBe("p6"); // Originally at position 6
    expect(pos6?.id).toBe("p1"); // Originally at position 1
  });

  it("does not modify original array", () => {
    const original = [...mockOnCourt];
    swapCourtPositions(mockOnCourt, 1, 2);
    expect(mockOnCourt).toEqual(original);
  });

  it("handles swapping with same position", () => {
    const swapped = swapCourtPositions(mockOnCourt, 3, 3);
    expect(swapped.find((p) => p.position === 3)?.id).toBe("p3");
  });
});

describe("substitutePlayer", () => {
  it("substitutes bench player for court player", () => {
    const result = substitutePlayer(mockOnCourt, mockBench, "p1", "p7");

    // p7 should be on court at position 1
    const newCourt = result.onCourt.find((p) => p.position === 1);
    expect(newCourt?.id).toBe("p7");
    expect(newCourt?.number).toBe(7);

    // p1 should be on bench
    const onBench = result.bench.find((p) => p.id === "p1");
    expect(onBench).toBeDefined();
    expect(onBench?.number).toBe(1);
  });

  it("returns unchanged if court player not found", () => {
    const result = substitutePlayer(mockOnCourt, mockBench, "missing", "p7");
    expect(result.onCourt).toBe(mockOnCourt);
    expect(result.bench).toBe(mockBench);
  });

  it("returns unchanged if bench player not found", () => {
    const result = substitutePlayer(mockOnCourt, mockBench, "p1", "missing");
    expect(result.onCourt).toBe(mockOnCourt);
    expect(result.bench).toBe(mockBench);
  });
});

describe("isValidLineup", () => {
  it("returns valid for correct lineup", () => {
    const result = isValidLineup(mockOnCourt);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns invalid for wrong number of players", () => {
    const tooFew = mockOnCourt.slice(0, 5);
    const result = isValidLineup(tooFew);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("exactly 6 players");
  });

  it("returns invalid for missing position", () => {
    const missingPos = mockOnCourt.map((p) =>
      p.position === 4 ? { ...p, position: 1 } : p
    );
    const result = isValidLineup(missingPos);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Position 4"))).toBe(true);
  });

  it("returns invalid for duplicate player", () => {
    const duplicate = mockOnCourt.map((p) =>
      p.position === 6 ? { ...p, id: "p1" } : p
    );
    const result = isValidLineup(duplicate);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate player"))).toBe(true);
  });
});

describe("findLibero", () => {
  it("finds libero on bench", () => {
    const libero = findLibero(mockOnCourt, mockBench);
    expect(libero?.id).toBe("p9");
    expect(libero?.isLibero).toBe(true);
  });

  it("finds libero on court", () => {
    const courtWithLibero: CourtPlayer[] = mockOnCourt.map((p) =>
      p.id === "p1" ? { ...p, isLibero: true } : p
    );
    const libero = findLibero(courtWithLibero, mockBench);
    expect(libero?.id).toBe("p1");
  });

  it("returns undefined if no libero", () => {
    const benchNoLibero = mockBench.filter((p) => !p.isLibero);
    const libero = findLibero(mockOnCourt, benchNoLibero);
    expect(libero).toBeUndefined();
  });
});

describe("isLiberoOnCourt", () => {
  it("returns false when libero is on bench", () => {
    expect(isLiberoOnCourt(mockOnCourt)).toBe(false);
  });

  it("returns true when libero is on court", () => {
    const courtWithLibero: CourtPlayer[] = [
      ...mockOnCourt.slice(0, 5),
      { ...mockOnCourt[5], isLibero: true },
    ];
    expect(isLiberoOnCourt(courtWithLibero)).toBe(true);
  });
});

describe("getLiberoEntryPositions", () => {
  it("returns back row positions (1, 5, 6)", () => {
    const positions = getLiberoEntryPositions(mockOnCourt);
    expect(positions.sort()).toEqual([1, 5, 6]);
  });

  it("returns empty for empty court", () => {
    expect(getLiberoEntryPositions([])).toEqual([]);
  });
});

describe("sortByNumber", () => {
  const unsorted = [
    { number: 5, name: "Eve" },
    { number: 1, name: "Alice" },
    { number: 3, name: "Carol" },
  ];

  it("sorts players by number ascending", () => {
    const sorted = sortByNumber(unsorted);
    expect(sorted.map((p) => p.number)).toEqual([1, 3, 5]);
  });

  it("does not modify original array", () => {
    const original = [...unsorted];
    sortByNumber(unsorted);
    expect(unsorted).toEqual(original);
  });
});

describe("sortByPosition", () => {
  const unsorted = [
    { position: 4, name: "David" },
    { position: 1, name: "Alice" },
    { position: 6, name: "Frank" },
  ];

  it("sorts players by position ascending", () => {
    const sorted = sortByPosition(unsorted);
    expect(sorted.map((p) => p.position)).toEqual([1, 4, 6]);
  });

  it("does not modify original array", () => {
    const original = [...unsorted];
    sortByPosition(unsorted);
    expect(unsorted).toEqual(original);
  });
});

describe("createLineupEntries", () => {
  it("creates entries for starters and bench", () => {
    const entries = createLineupEntries(
      ["s1", "s2", "s3", "s4", "s5", "s6"],
      ["b1", "b2"],
      "s3"
    );

    expect(entries).toHaveLength(8);

    const starters = entries.filter((e) => e.isStarter);
    expect(starters).toHaveLength(6);
    expect(starters[0].servingOrder).toBe(1);
    expect(starters[5].servingOrder).toBe(6);

    const bench = entries.filter((e) => !e.isStarter);
    expect(bench).toHaveLength(2);
    expect(bench[0].servingOrder).toBeUndefined();

    const libero = entries.find((e) => e.isLibero);
    expect(libero?.playerId).toBe("s3");
  });

  it("handles no libero", () => {
    const entries = createLineupEntries(["s1"], [], undefined);
    expect(entries.every((e) => !e.isLibero)).toBe(true);
  });
});

describe("getStarterIds", () => {
  const lineup: LineupEntry[] = [
    { playerId: "s2", isStarter: true, isLibero: false, servingOrder: 2 },
    { playerId: "b1", isStarter: false, isLibero: false },
    { playerId: "s1", isStarter: true, isLibero: false, servingOrder: 1 },
    { playerId: "s3", isStarter: true, isLibero: true, servingOrder: 3 },
  ];

  it("returns starter IDs sorted by serving order", () => {
    const starters = getStarterIds(lineup);
    expect(starters).toEqual(["s1", "s2", "s3"]);
  });
});

describe("getBenchIds", () => {
  const lineup: LineupEntry[] = [
    { playerId: "s1", isStarter: true, isLibero: false },
    { playerId: "b1", isStarter: false, isLibero: false },
    { playerId: "b2", isStarter: false, isLibero: true },
  ];

  it("returns bench player IDs", () => {
    const bench = getBenchIds(lineup);
    expect(bench).toEqual(["b1", "b2"]);
  });
});

describe("getLiberoId", () => {
  it("returns libero ID when exists", () => {
    const lineup: LineupEntry[] = [
      { playerId: "s1", isStarter: true, isLibero: false },
      { playerId: "lib", isStarter: false, isLibero: true },
    ];
    expect(getLiberoId(lineup)).toBe("lib");
  });

  it("returns undefined when no libero", () => {
    const lineup: LineupEntry[] = [
      { playerId: "s1", isStarter: true, isLibero: false },
    ];
    expect(getLiberoId(lineup)).toBeUndefined();
  });
});
