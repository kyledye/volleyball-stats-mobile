/**
 * Tests for test utilities
 */

import {
  mockSession,
  mockAdminSession,
  createMockPlayer,
  createMockTeam,
  createMockPlay,
  createMockSet,
  createMockMatch,
  createMockLineup,
  createMockCourtPositions,
  createMockRoster,
  createCompleteMatch,
} from "./test-utils";

describe("mockSession", () => {
  it("has user with COACH role", () => {
    expect(mockSession.user.role).toBe("COACH");
  });

  it("has valid expires date in future", () => {
    const expires = new Date(mockSession.expires);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("has required user fields", () => {
    expect(mockSession.user.id).toBeDefined();
    expect(mockSession.user.email).toBeDefined();
    expect(mockSession.user.name).toBeDefined();
  });
});

describe("mockAdminSession", () => {
  it("has user with ADMIN role", () => {
    expect(mockAdminSession.user.role).toBe("ADMIN");
  });
});

describe("createMockPlayer", () => {
  it("creates player with default values", () => {
    const player = createMockPlayer();

    expect(player.id).toBeDefined();
    expect(player.teamId).toBe("team-1");
    expect(player.number).toBeGreaterThanOrEqual(1);
    expect(player.number).toBeLessThanOrEqual(99);
    expect(player.firstName).toBe("Test");
    expect(player.lastName).toBe("Player");
  });

  it("allows overriding all fields", () => {
    const player = createMockPlayer({
      id: "custom-id",
      teamId: "custom-team",
      number: 7,
      firstName: "John",
      lastName: "Doe",
      position: "SETTER",
      isLibero: true,
    });

    expect(player.id).toBe("custom-id");
    expect(player.teamId).toBe("custom-team");
    expect(player.number).toBe(7);
    expect(player.firstName).toBe("John");
    expect(player.lastName).toBe("Doe");
    expect(player.position).toBe("SETTER");
    expect(player.isLibero).toBe(true);
  });

  it("generates unique IDs", () => {
    const player1 = createMockPlayer();
    const player2 = createMockPlayer();

    expect(player1.id).not.toBe(player2.id);
  });
});

describe("createMockTeam", () => {
  it("creates team with default values", () => {
    const team = createMockTeam();

    expect(team.id).toBeDefined();
    expect(team.name).toBe("Test Team");
    expect(team.isOpponent).toBe(false);
    expect(team.createdAt).toBeDefined();
  });

  it("allows overriding fields", () => {
    const team = createMockTeam({
      id: "opponent-1",
      name: "Rival Team",
      school: "Rival High",
      season: "2024",
      isOpponent: true,
    });

    expect(team.id).toBe("opponent-1");
    expect(team.name).toBe("Rival Team");
    expect(team.school).toBe("Rival High");
    expect(team.season).toBe("2024");
    expect(team.isOpponent).toBe(true);
  });
});

describe("createMockPlay", () => {
  it("creates play with default values", () => {
    const play = createMockPlay();

    expect(play.id).toBeDefined();
    expect(play.matchId).toBe("match-1");
    expect(play.setId).toBe("set-1");
    expect(play.playerId).toBe("player-1");
    expect(play.type).toBe("ATTACK");
    expect(play.result).toBe("KILL");
    expect(play.timestamp).toBeDefined();
  });

  it("allows overriding fields", () => {
    const play = createMockPlay({
      type: "SERVE",
      result: "ACE",
      playerId: "server-1",
    });

    expect(play.type).toBe("SERVE");
    expect(play.result).toBe("ACE");
    expect(play.playerId).toBe("server-1");
  });
});

describe("createMockSet", () => {
  it("creates set with default values", () => {
    const set = createMockSet();

    expect(set.id).toBeDefined();
    expect(set.matchId).toBe("match-1");
    expect(set.setNumber).toBe(1);
    expect(set.homeScore).toBe(0);
    expect(set.awayScore).toBe(0);
    expect(set.plays).toEqual([]);
    expect(set.homeServesFirst).toBe(true);
    expect(set.rotationCount).toBe(0);
  });

  it("allows overriding fields", () => {
    const set = createMockSet({
      setNumber: 3,
      homeScore: 25,
      awayScore: 23,
      winnerId: "home-team",
    });

    expect(set.setNumber).toBe(3);
    expect(set.homeScore).toBe(25);
    expect(set.awayScore).toBe(23);
    expect(set.winnerId).toBe("home-team");
  });
});

describe("createMockMatch", () => {
  it("creates match with default values", () => {
    const match = createMockMatch();

    expect(match.id).toBeDefined();
    expect(match.homeTeamId).toBe("home-team-id");
    expect(match.awayTeamId).toBe("away-team-id");
    expect(match.homeTeamName).toBe("Home Team");
    expect(match.awayTeamName).toBe("Away Team");
    expect(match.status).toBe("SCHEDULED");
    expect(match.matchType).toBe("BEST_OF_3");
    expect(match.homeSetsWon).toBe(0);
    expect(match.awaySetsWon).toBe(0);
    expect(match.sets).toEqual([]);
  });

  it("allows overriding fields", () => {
    const match = createMockMatch({
      status: "IN_PROGRESS",
      homeSetsWon: 1,
      awaySetsWon: 1,
    });

    expect(match.status).toBe("IN_PROGRESS");
    expect(match.homeSetsWon).toBe(1);
    expect(match.awaySetsWon).toBe(1);
  });
});

describe("createMockLineup", () => {
  it("creates empty lineup with no players", () => {
    const lineup = createMockLineup();
    expect(lineup).toEqual([]);
  });

  it("marks first 6 players as starters", () => {
    const playerIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
    const lineup = createMockLineup(playerIds);

    expect(lineup).toHaveLength(8);

    // First 6 are starters
    for (let i = 0; i < 6; i++) {
      expect(lineup[i].isStarter).toBe(true);
      expect(lineup[i].servingOrder).toBe(i + 1);
    }

    // Rest are bench
    for (let i = 6; i < 8; i++) {
      expect(lineup[i].isStarter).toBe(false);
      expect(lineup[i].servingOrder).toBeUndefined();
    }
  });

  it("assigns correct player IDs", () => {
    const playerIds = ["alice", "bob", "carol"];
    const lineup = createMockLineup(playerIds);

    expect(lineup[0].playerId).toBe("alice");
    expect(lineup[1].playerId).toBe("bob");
    expect(lineup[2].playerId).toBe("carol");
  });
});

describe("createMockCourtPositions", () => {
  it("creates positions for 6 players by default", () => {
    const positions = createMockCourtPositions();

    expect(positions).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      expect(positions[i].position).toBe(i + 1);
    }
  });

  it("uses provided player IDs", () => {
    const playerIds = ["a", "b", "c", "d", "e", "f"];
    const positions = createMockCourtPositions(playerIds);

    expect(positions[0].playerId).toBe("a");
    expect(positions[5].playerId).toBe("f");
  });

  it("limits to 6 positions even with more players", () => {
    const playerIds = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const positions = createMockCourtPositions(playerIds);

    expect(positions).toHaveLength(6);
  });
});

describe("createMockRoster", () => {
  it("creates roster with specified number of players", () => {
    const roster = createMockRoster("team-1", 8);

    expect(roster).toHaveLength(8);
  });

  it("creates roster with default 12 players", () => {
    const roster = createMockRoster("team-1");

    expect(roster).toHaveLength(12);
  });

  it("assigns correct team ID to all players", () => {
    const roster = createMockRoster("my-team", 5);

    roster.forEach((player) => {
      expect(player.teamId).toBe("my-team");
    });
  });

  it("assigns sequential numbers", () => {
    const roster = createMockRoster("team-1", 6);

    for (let i = 0; i < 6; i++) {
      expect(roster[i].number).toBe(i + 1);
    }
  });

  it("assigns 5th player as libero", () => {
    const roster = createMockRoster("team-1", 6);

    expect(roster[4].isLibero).toBe(true);
    expect(roster[4].position).toBe("LIBERO");
  });

  it("cycles through positions", () => {
    const roster = createMockRoster("team-1", 6);

    expect(roster[0].position).toBe("SETTER");
    expect(roster[1].position).toBe("OUTSIDE_HITTER");
    expect(roster[2].position).toBe("MIDDLE_BLOCKER");
    expect(roster[3].position).toBe("OPPOSITE");
    expect(roster[4].position).toBe("LIBERO");
    expect(roster[5].position).toBe("DEFENSIVE_SPECIALIST");
  });
});

describe("createCompleteMatch", () => {
  it("creates 2-0 match (home wins)", () => {
    const match = createCompleteMatch(2, 0);

    expect(match.status).toBe("COMPLETED");
    expect(match.homeSetsWon).toBe(2);
    expect(match.awaySetsWon).toBe(0);
    expect(match.sets).toHaveLength(2);
  });

  it("creates 2-1 match", () => {
    const match = createCompleteMatch(2, 1);

    expect(match.homeSetsWon).toBe(2);
    expect(match.awaySetsWon).toBe(1);
    expect(match.sets).toHaveLength(3);
  });

  it("creates 0-2 match (away wins)", () => {
    const match = createCompleteMatch(0, 2);

    expect(match.homeSetsWon).toBe(0);
    expect(match.awaySetsWon).toBe(2);
    expect(match.sets).toHaveLength(2);
  });

  it("creates 3-2 match", () => {
    const match = createCompleteMatch(3, 2);

    expect(match.homeSetsWon).toBe(3);
    expect(match.awaySetsWon).toBe(2);
    expect(match.sets).toHaveLength(5);
  });

  it("sets have correct winner IDs", () => {
    const match = createCompleteMatch(2, 1);

    const homeWins = match.sets.filter(
      (s) => s.winnerId === "home-team-id"
    ).length;
    const awayWins = match.sets.filter(
      (s) => s.winnerId === "away-team-id"
    ).length;

    expect(homeWins).toBe(2);
    expect(awayWins).toBe(1);
  });
});
