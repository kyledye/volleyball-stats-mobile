import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MATCHES: '@local_matches',
  TEAMS: '@local_teams',
  PLAYERS: '@local_players',
};

// Generic storage helpers
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set ${key}:`, error);
  }
}

// Match types for local storage
export interface LocalTeam {
  id: string;
  name: string;
  school?: string;
  season?: string;
  isOpponent?: boolean;
  createdAt: string;
}

export interface LocalPlayer {
  id: string;
  teamId: string;
  number: number;
  firstName: string;
  lastName: string;
  position?: string;
  isLibero?: boolean;
}

export interface LocalPlay {
  id: string;
  matchId: string;
  setId: string;
  playerId: string;
  type: string;
  result: string;
  timestamp: string;
}

export interface CourtPosition {
  playerId: string;
  position: number; // 1-6
}

export interface LocalSet {
  id: string;
  matchId: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  winnerId?: string;
  homeServesFirst?: boolean;
  homeIsServing?: boolean;
  plays: LocalPlay[];
  // Court state for this set
  courtPositions?: CourtPosition[];
  liberoId?: string;
  liberoIsOnCourt?: boolean;
  liberoReplacingId?: string;
  rotationCount?: number;
  subCount?: number;
}

export interface LineupEntry {
  playerId: string;
  isStarter: boolean;
  isLibero: boolean;
  servingOrder?: number;
}

export interface LocalMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  location?: string;
  matchType?: 'BEST_OF_3' | 'BEST_OF_5';
  notes?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  homeSetsWon: number;
  awaySetsWon: number;
  sets: LocalSet[];
  lineup?: LineupEntry[]; // Match-level lineup
  createdAt: string;
}

// Teams
export async function getLocalTeams(): Promise<LocalTeam[]> {
  return (await getItem<LocalTeam[]>(KEYS.TEAMS)) || [];
}

export async function saveLocalTeam(team: LocalTeam): Promise<void> {
  const teams = await getLocalTeams();
  const index = teams.findIndex(t => t.id === team.id);
  if (index >= 0) {
    teams[index] = team;
  } else {
    teams.push(team);
  }
  await setItem(KEYS.TEAMS, teams);
}

export async function deleteLocalTeam(id: string): Promise<void> {
  const teams = await getLocalTeams();
  await setItem(KEYS.TEAMS, teams.filter(t => t.id !== id));
}

// Players
export async function getLocalPlayers(teamId?: string): Promise<LocalPlayer[]> {
  const players = (await getItem<LocalPlayer[]>(KEYS.PLAYERS)) || [];
  if (teamId) {
    return players.filter(p => p.teamId === teamId);
  }
  return players;
}

export async function saveLocalPlayer(player: LocalPlayer): Promise<void> {
  const players = await getLocalPlayers();
  const index = players.findIndex(p => p.id === player.id);
  if (index >= 0) {
    players[index] = player;
  } else {
    players.push(player);
  }
  await setItem(KEYS.PLAYERS, players);
}

export async function deleteLocalPlayer(id: string): Promise<void> {
  const players = await getLocalPlayers();
  await setItem(KEYS.PLAYERS, players.filter(p => p.id !== id));
}

// Matches
export async function getLocalMatches(): Promise<LocalMatch[]> {
  return (await getItem<LocalMatch[]>(KEYS.MATCHES)) || [];
}

export async function getLocalMatch(id: string): Promise<LocalMatch | null> {
  const matches = await getLocalMatches();
  return matches.find(m => m.id === id) || null;
}

export async function saveLocalMatch(match: LocalMatch): Promise<void> {
  const matches = await getLocalMatches();
  const index = matches.findIndex(m => m.id === match.id);
  if (index >= 0) {
    matches[index] = match;
  } else {
    matches.push(match);
  }
  await setItem(KEYS.MATCHES, matches);
}

export async function deleteLocalMatch(id: string): Promise<void> {
  const matches = await getLocalMatches();
  await setItem(KEYS.MATCHES, matches.filter(m => m.id !== id));
}

// Generate unique IDs
export function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
