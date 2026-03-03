// API response types for TanStack Query hooks
// These types match the responses from the API routes

// Enums (matching Prisma schema)
export type Role = "ADMIN" | "COACH" | "STATISTICIAN" | "VIEWER";
export type Position =
  | "SETTER"
  | "OUTSIDE_HITTER"
  | "MIDDLE_BLOCKER"
  | "OPPOSITE"
  | "LIBERO"
  | "DEFENSIVE_SPECIALIST";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchType = "BEST_OF_3" | "BEST_OF_5";
export type PlayType =
  | "SERVE"
  | "ATTACK"
  | "BLOCK"
  | "PASS"
  | "SERVE_RECEIVE"
  | "SECOND_TOUCH"
  | "FREE_BALL"
  | "OPP_ERROR";
export type PlayResult =
  | "IN_PLAY"
  | "ERROR"
  | "OPP_ERROR"
  | "ACE"
  | "KILL"
  | "PASS_4"
  | "PASS_3"
  | "PASS_2"
  | "PASS_1"
  | "OVER_PASS"
  | "ASSIST"
  | "PLAYABLE_SET"
  | "PLAYABLE_BUMP"
  | "POOR";

// Team types
export interface Team {
  id: string;
  name: string;
  school: string | null;
  season: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    players: number;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: Role;
}

// Player types
export interface Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: Position | null;
  isActive: boolean;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

// Match types
export interface Match {
  id: string;
  date: string;
  location: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeSetsWon: number;
  awaySetsWon: number;
  status: MatchStatus;
  matchType: MatchType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
}

export interface MatchWithDetails extends Match {
  sets: Set[];
  lineups: MatchLineup[];
  plays: Play[];
}

// Set types
export interface Set {
  id: string;
  matchId: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  winnerId: string | null;
  homeServesFirst: boolean | null;
  homeIsServing: boolean | null; // P2 fix: persisted serving state
  homeSubCount: number;
  awaySubCount: number;
}

export interface SetLineup {
  id: string;
  setId: string;
  teamId: string;
  position1: string;
  position2: string;
  position3: string;
  position4: string;
  position5: string;
  position6: string;
  rotationCount: number;
  liberoPlayerId: string | null;
  liberoInFor: string | null;
  liberoPosition: number | null;
  pointsPlayed: Record<string, number>;
}

// Lineup types
export interface MatchLineup {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  isStarter: boolean;
  isLibero: boolean;
  servingOrder: number | null;
  player?: Player;
}

// Play types
export interface Play {
  id: string;
  matchId: string;
  setId: string;
  playerId: string | null;
  teamId: string;
  type: PlayType;
  result: PlayResult;
  timestamp: string;
  homeScore: number;
  awayScore: number;
  notes: string | null;
  player?: Player;
}

// API request types
export interface CreateTeamRequest {
  name: string;
  school?: string;
  season?: string;
  isOpponent?: boolean;
}

export interface UpdateTeamRequest {
  name?: string;
  school?: string;
  season?: string;
}

export interface CreatePlayerRequest {
  number: number;
  firstName: string;
  lastName: string;
  position?: Position;
}

export interface UpdatePlayerRequest {
  number?: number;
  firstName?: string;
  lastName?: string;
  position?: Position | null;
  isActive?: boolean;
}

export interface CreateMatchRequest {
  date: string;
  location?: string;
  homeTeamId: string;
  awayTeamId: string;
  matchType?: MatchType;
  notes?: string;
}

// Filter types
export type TeamFilter = "mine" | "opponents";
export type MatchStatusFilter = MatchStatus;
