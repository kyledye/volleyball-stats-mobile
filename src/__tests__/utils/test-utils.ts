// Test utilities and mock factories

import type { LocalTeam, LocalPlayer, LocalMatch, LocalSet, LocalPlay } from "../../lib/localStorage";

export const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "COACH",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    id: "admin-user-id",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Factory functions for creating test data
export function createMockPlayer(
  overrides: Partial<LocalPlayer> = {}
): LocalPlayer {
  return {
    id: overrides.id ?? `player-${Math.random().toString(36).slice(2)}`,
    teamId: overrides.teamId ?? "team-1",
    number: overrides.number ?? Math.floor(Math.random() * 99) + 1,
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "Player",
    position: overrides.position ?? undefined,
    isLibero: overrides.isLibero ?? false,
  };
}

export function createMockTeam(overrides: Partial<LocalTeam> = {}): LocalTeam {
  return {
    id: overrides.id ?? `team-${Math.random().toString(36).slice(2)}`,
    name: overrides.name ?? "Test Team",
    school: overrides.school ?? undefined,
    season: overrides.season ?? undefined,
    isOpponent: overrides.isOpponent ?? false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

export function createMockPlay(overrides: Partial<LocalPlay> = {}): LocalPlay {
  return {
    id: overrides.id ?? `play-${Math.random().toString(36).slice(2)}`,
    matchId: overrides.matchId ?? "match-1",
    setId: overrides.setId ?? "set-1",
    playerId: overrides.playerId ?? "player-1",
    type: overrides.type ?? "ATTACK",
    result: overrides.result ?? "KILL",
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  };
}

export function createMockSet(overrides: Partial<LocalSet> = {}): LocalSet {
  return {
    id: overrides.id ?? `set-${Math.random().toString(36).slice(2)}`,
    matchId: overrides.matchId ?? "match-1",
    setNumber: overrides.setNumber ?? 1,
    homeScore: overrides.homeScore ?? 0,
    awayScore: overrides.awayScore ?? 0,
    winnerId: overrides.winnerId ?? undefined,
    homeServesFirst: overrides.homeServesFirst ?? true,
    homeIsServing: overrides.homeIsServing ?? true,
    plays: overrides.plays ?? [],
    courtPositions: overrides.courtPositions ?? undefined,
    rotationCount: overrides.rotationCount ?? 0,
    subCount: overrides.subCount ?? 0,
  };
}

export function createMockMatch(
  overrides: Partial<LocalMatch> = {}
): LocalMatch {
  return {
    id: overrides.id ?? `match-${Math.random().toString(36).slice(2)}`,
    homeTeamId: overrides.homeTeamId ?? "home-team-id",
    awayTeamId: overrides.awayTeamId ?? "away-team-id",
    homeTeamName: overrides.homeTeamName ?? "Home Team",
    awayTeamName: overrides.awayTeamName ?? "Away Team",
    date: overrides.date ?? new Date().toISOString(),
    location: overrides.location ?? "Test Gym",
    matchType: overrides.matchType ?? "BEST_OF_3",
    notes: overrides.notes ?? undefined,
    status: overrides.status ?? "SCHEDULED",
    homeSetsWon: overrides.homeSetsWon ?? 0,
    awaySetsWon: overrides.awaySetsWon ?? 0,
    sets: overrides.sets ?? [],
    lineup: overrides.lineup ?? undefined,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

// Create a lineup with players
export function createMockLineup(playerIds: string[] = []) {
  return playerIds.map((playerId, index) => ({
    playerId,
    isStarter: index < 6,
    isLibero: false,
    servingOrder: index < 6 ? index + 1 : undefined,
  }));
}

// Create a court positions array
export function createMockCourtPositions(
  playerIds: string[] = ["p1", "p2", "p3", "p4", "p5", "p6"]
) {
  return playerIds.slice(0, 6).map((playerId, index) => ({
    playerId,
    position: index + 1,
  }));
}

// Helper to generate multiple players
export function createMockRoster(
  teamId: string,
  count: number = 12
): LocalPlayer[] {
  const positions = [
    "SETTER",
    "OUTSIDE_HITTER",
    "MIDDLE_BLOCKER",
    "OPPOSITE",
    "LIBERO",
    "DEFENSIVE_SPECIALIST",
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `${teamId}-player-${index + 1}`,
    teamId,
    number: index + 1,
    firstName: `Player`,
    lastName: `${index + 1}`,
    position: positions[index % positions.length],
    isLibero: index === 4, // 5th player is libero
  }));
}

// Helper to create a complete match with sets
export function createCompleteMatch(
  homeScore: number,
  awayScore: number
): LocalMatch {
  const sets: LocalSet[] = [];
  let homeSetsWon = 0;
  let awaySetsWon = 0;

  // Create sets based on score
  const totalSets = homeScore + awayScore;
  for (let i = 0; i < totalSets; i++) {
    const homeWins = homeSetsWon < homeScore && (awaySetsWon >= awayScore || i % 2 === 0);
    sets.push(
      createMockSet({
        setNumber: i + 1,
        homeScore: homeWins ? 25 : 20,
        awayScore: homeWins ? 20 : 25,
        winnerId: homeWins ? "home-team-id" : "away-team-id",
      })
    );
    if (homeWins) homeSetsWon++;
    else awaySetsWon++;
  }

  return createMockMatch({
    status: "COMPLETED",
    homeSetsWon,
    awaySetsWon,
    sets,
  });
}
