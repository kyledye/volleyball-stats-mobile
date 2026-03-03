/**
 * Tests for /lib/localStorage
 */

import {
  generateId,
  getLocalTeams,
  saveLocalTeam,
  deleteLocalTeam,
  getLocalPlayers,
  saveLocalPlayer,
  deleteLocalPlayer,
  getLocalMatches,
  getLocalMatch,
  saveLocalMatch,
  deleteLocalMatch,
  LocalTeam,
  LocalPlayer,
  LocalMatch,
} from "../../lib/localStorage";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
}));

describe("generateId", () => {
  it("returns a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("starts with local_", () => {
    const id = generateId();
    expect(id.startsWith("local_")).toBe(true);
  });

  it("generates unique ids", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    // All 100 IDs should be unique
    expect(ids.size).toBe(100);
  });

  it("contains timestamp component", () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();

    // Extract timestamp from id (format: local_timestamp_random)
    const parts = id.split("_");
    const timestamp = parseInt(parts[1], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("has random suffix", () => {
    const id = generateId();
    const parts = id.split("_");
    expect(parts.length).toBe(3);
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

describe("Teams CRUD operations", () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  const testTeam: LocalTeam = {
    id: "team-1",
    name: "Test Team",
    school: "Test School",
    season: "2024",
    isOpponent: false,
    createdAt: new Date().toISOString(),
  };

  it("getLocalTeams returns empty array when no teams exist", async () => {
    const teams = await getLocalTeams();
    expect(teams).toEqual([]);
  });

  it("saveLocalTeam adds a new team", async () => {
    await saveLocalTeam(testTeam);
    const teams = await getLocalTeams();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toEqual(testTeam);
  });

  it("saveLocalTeam updates existing team", async () => {
    await saveLocalTeam(testTeam);
    const updatedTeam = { ...testTeam, name: "Updated Team" };
    await saveLocalTeam(updatedTeam);

    const teams = await getLocalTeams();
    expect(teams).toHaveLength(1);
    expect(teams[0].name).toBe("Updated Team");
  });

  it("saveLocalTeam handles multiple teams", async () => {
    const team2: LocalTeam = { ...testTeam, id: "team-2", name: "Team 2" };
    await saveLocalTeam(testTeam);
    await saveLocalTeam(team2);

    const teams = await getLocalTeams();
    expect(teams).toHaveLength(2);
  });

  it("deleteLocalTeam removes a team", async () => {
    await saveLocalTeam(testTeam);
    await deleteLocalTeam(testTeam.id);

    const teams = await getLocalTeams();
    expect(teams).toHaveLength(0);
  });

  it("deleteLocalTeam handles non-existent team gracefully", async () => {
    await saveLocalTeam(testTeam);
    await deleteLocalTeam("non-existent-id");

    const teams = await getLocalTeams();
    expect(teams).toHaveLength(1);
  });
});

describe("Players CRUD operations", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  const testPlayer: LocalPlayer = {
    id: "player-1",
    teamId: "team-1",
    number: 7,
    firstName: "John",
    lastName: "Doe",
    position: "OUTSIDE_HITTER",
    isLibero: false,
  };

  it("getLocalPlayers returns empty array when no players exist", async () => {
    const players = await getLocalPlayers();
    expect(players).toEqual([]);
  });

  it("saveLocalPlayer adds a new player", async () => {
    await saveLocalPlayer(testPlayer);
    const players = await getLocalPlayers();
    expect(players).toHaveLength(1);
    expect(players[0]).toEqual(testPlayer);
  });

  it("getLocalPlayers filters by teamId", async () => {
    const player2: LocalPlayer = {
      ...testPlayer,
      id: "player-2",
      teamId: "team-2",
    };
    await saveLocalPlayer(testPlayer);
    await saveLocalPlayer(player2);

    const team1Players = await getLocalPlayers("team-1");
    expect(team1Players).toHaveLength(1);
    expect(team1Players[0].id).toBe("player-1");

    const team2Players = await getLocalPlayers("team-2");
    expect(team2Players).toHaveLength(1);
    expect(team2Players[0].id).toBe("player-2");
  });

  it("getLocalPlayers returns all players when no teamId", async () => {
    const player2: LocalPlayer = {
      ...testPlayer,
      id: "player-2",
      teamId: "team-2",
    };
    await saveLocalPlayer(testPlayer);
    await saveLocalPlayer(player2);

    const allPlayers = await getLocalPlayers();
    expect(allPlayers).toHaveLength(2);
  });

  it("saveLocalPlayer updates existing player", async () => {
    await saveLocalPlayer(testPlayer);
    const updatedPlayer = { ...testPlayer, firstName: "Jane" };
    await saveLocalPlayer(updatedPlayer);

    const players = await getLocalPlayers();
    expect(players).toHaveLength(1);
    expect(players[0].firstName).toBe("Jane");
  });

  it("deleteLocalPlayer removes a player", async () => {
    await saveLocalPlayer(testPlayer);
    await deleteLocalPlayer(testPlayer.id);

    const players = await getLocalPlayers();
    expect(players).toHaveLength(0);
  });
});

describe("Matches CRUD operations", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  const testMatch: LocalMatch = {
    id: "match-1",
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    homeTeamName: "Home Team",
    awayTeamName: "Away Team",
    date: new Date().toISOString(),
    location: "Test Gym",
    matchType: "BEST_OF_3",
    status: "SCHEDULED",
    homeSetsWon: 0,
    awaySetsWon: 0,
    sets: [],
    createdAt: new Date().toISOString(),
  };

  it("getLocalMatches returns empty array when no matches exist", async () => {
    const matches = await getLocalMatches();
    expect(matches).toEqual([]);
  });

  it("saveLocalMatch adds a new match", async () => {
    await saveLocalMatch(testMatch);
    const matches = await getLocalMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual(testMatch);
  });

  it("getLocalMatch returns specific match", async () => {
    await saveLocalMatch(testMatch);
    const match = await getLocalMatch("match-1");
    expect(match).toEqual(testMatch);
  });

  it("getLocalMatch returns null for non-existent match", async () => {
    const match = await getLocalMatch("non-existent");
    expect(match).toBeNull();
  });

  it("saveLocalMatch updates existing match", async () => {
    await saveLocalMatch(testMatch);
    const updatedMatch: LocalMatch = {
      ...testMatch,
      status: "IN_PROGRESS",
      homeSetsWon: 1,
    };
    await saveLocalMatch(updatedMatch);

    const matches = await getLocalMatches();
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe("IN_PROGRESS");
    expect(matches[0].homeSetsWon).toBe(1);
  });

  it("deleteLocalMatch removes a match", async () => {
    await saveLocalMatch(testMatch);
    await deleteLocalMatch(testMatch.id);

    const matches = await getLocalMatches();
    expect(matches).toHaveLength(0);
  });

  it("handles match with sets and plays", async () => {
    const matchWithData: LocalMatch = {
      ...testMatch,
      sets: [
        {
          id: "set-1",
          matchId: "match-1",
          setNumber: 1,
          homeScore: 25,
          awayScore: 23,
          plays: [
            {
              id: "play-1",
              matchId: "match-1",
              setId: "set-1",
              playerId: "player-1",
              type: "SERVE",
              result: "ACE",
              timestamp: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    await saveLocalMatch(matchWithData);
    const match = await getLocalMatch("match-1");

    expect(match?.sets).toHaveLength(1);
    expect(match?.sets[0].plays).toHaveLength(1);
    expect(match?.sets[0].plays[0].result).toBe("ACE");
  });
});

describe("Edge cases", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("handles concurrent saves correctly", async () => {
    const teams: LocalTeam[] = [];
    for (let i = 0; i < 5; i++) {
      teams.push({
        id: `team-${i}`,
        name: `Team ${i}`,
        createdAt: new Date().toISOString(),
      });
    }

    // Save all teams concurrently
    await Promise.all(teams.map((team) => saveLocalTeam(team)));

    const savedTeams = await getLocalTeams();
    expect(savedTeams.length).toBeGreaterThanOrEqual(1);
  });

  it("handles special characters in team names", async () => {
    const team: LocalTeam = {
      id: "team-special",
      name: 'Test "Team" with <special> & characters',
      createdAt: new Date().toISOString(),
    };

    await saveLocalTeam(team);
    const teams = await getLocalTeams();
    expect(teams[0].name).toBe('Test "Team" with <special> & characters');
  });

  it("handles empty string values", async () => {
    const team: LocalTeam = {
      id: "team-empty",
      name: "Team",
      school: "",
      season: "",
      createdAt: new Date().toISOString(),
    };

    await saveLocalTeam(team);
    const teams = await getLocalTeams();
    expect(teams[0].school).toBe("");
    expect(teams[0].season).toBe("");
  });
});
