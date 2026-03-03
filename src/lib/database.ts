import * as SQLite from 'expo-sqlite';

// Open database synchronously (expo-sqlite v14+)
let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('volleyball_stats.db');
    await initializeDatabase(db);
  }
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if abbreviation column exists on teams table
  try {
    const tableInfo = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(teams)"
    );
    const hasAbbreviation = tableInfo.some(col => col.name === 'abbreviation');
    if (!hasAbbreviation && tableInfo.length > 0) {
      // Table exists but without abbreviation column - add it
      await database.execAsync('ALTER TABLE teams ADD COLUMN abbreviation TEXT');
    }
  } catch {
    // Table doesn't exist yet, will be created below
  }
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;`);

  // Run migrations for existing databases
  await runMigrations(database);

  await database.execAsync(`

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT,
      school TEXT,
      season TEXT,
      is_opponent INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      number INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      position TEXT,
      is_libero INTEGER DEFAULT 0,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      home_team_name TEXT NOT NULL,
      away_team_name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      match_type TEXT DEFAULT 'BEST_OF_3',
      notes TEXT,
      status TEXT DEFAULT 'SCHEDULED',
      home_sets_won INTEGER DEFAULT 0,
      away_sets_won INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (home_team_id) REFERENCES teams(id),
      FOREIGN KEY (away_team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS match_lineup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      is_starter INTEGER DEFAULT 0,
      is_libero INTEGER DEFAULT 0,
      serving_order INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      home_score INTEGER DEFAULT 0,
      away_score INTEGER DEFAULT 0,
      winner_id TEXT,
      home_serves_first INTEGER DEFAULT 1,
      home_is_serving INTEGER DEFAULT 1,
      libero_id TEXT,
      libero_is_on_court INTEGER DEFAULT 0,
      libero_replacing_id TEXT,
      rotation_count INTEGER DEFAULT 0,
      sub_count INTEGER DEFAULT 0,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS court_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS plays (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      type TEXT NOT NULL,
      result TEXT NOT NULL,
      assisting_player_id TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
    CREATE INDEX IF NOT EXISTS idx_sets_match ON sets(match_id);
    CREATE INDEX IF NOT EXISTS idx_plays_match ON plays(match_id);
    CREATE INDEX IF NOT EXISTS idx_plays_set ON plays(set_id);
    CREATE INDEX IF NOT EXISTS idx_plays_player ON plays(player_id);
    CREATE INDEX IF NOT EXISTS idx_court_positions_set ON court_positions(set_id);
  `);
}

// Types matching the old localStorage types for compatibility
export interface LocalTeam {
  id: string;
  name: string;
  abbreviation?: string;
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
  assistingPlayerId?: string;
  timestamp: string;
}

export interface CourtPosition {
  playerId: string;
  position: number;
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
  lineup?: LineupEntry[];
  createdAt: string;
}

// ============ TEAMS ============

export async function getLocalTeams(): Promise<LocalTeam[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    abbreviation: string | null;
    school: string | null;
    season: string | null;
    is_opponent: number;
    created_at: string;
  }>('SELECT * FROM teams ORDER BY created_at DESC');

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation || undefined,
    school: row.school || undefined,
    season: row.season || undefined,
    isOpponent: row.is_opponent === 1,
    createdAt: row.created_at,
  }));
}

export async function getLocalTeam(id: string): Promise<LocalTeam | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    abbreviation: string | null;
    school: string | null;
    season: string | null;
    is_opponent: number;
    created_at: string;
  }>('SELECT * FROM teams WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation || undefined,
    school: row.school || undefined,
    season: row.season || undefined,
    isOpponent: row.is_opponent === 1,
    createdAt: row.created_at,
  };
}

export async function saveLocalTeam(team: LocalTeam): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO teams (id, name, abbreviation, school, season, is_opponent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [team.id, team.name, team.abbreviation || null, team.school || null, team.season || null, team.isOpponent ? 1 : 0, team.createdAt]
  );
}

export async function deleteLocalTeam(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM teams WHERE id = ?', [id]);
}

// ============ PLAYERS ============

export async function getLocalPlayers(teamId?: string): Promise<LocalPlayer[]> {
  const db = await getDatabase();
  const query = teamId
    ? 'SELECT * FROM players WHERE team_id = ? ORDER BY number'
    : 'SELECT * FROM players ORDER BY number';
  const params = teamId ? [teamId] : [];

  const rows = await db.getAllAsync<{
    id: string;
    team_id: string;
    number: number;
    first_name: string;
    last_name: string;
    position: string | null;
    is_libero: number;
  }>(query, params);

  return rows.map(row => ({
    id: row.id,
    teamId: row.team_id,
    number: row.number,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.position || undefined,
    isLibero: row.is_libero === 1,
  }));
}

export async function getLocalPlayer(id: string): Promise<LocalPlayer | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    team_id: string;
    number: number;
    first_name: string;
    last_name: string;
    position: string | null;
    is_libero: number;
  }>('SELECT * FROM players WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    teamId: row.team_id,
    number: row.number,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.position || undefined,
    isLibero: row.is_libero === 1,
  };
}

export async function saveLocalPlayer(player: LocalPlayer): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO players (id, team_id, number, first_name, last_name, position, is_libero)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [player.id, player.teamId, player.number, player.firstName, player.lastName, player.position || null, player.isLibero ? 1 : 0]
  );
}

export async function deleteLocalPlayer(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM players WHERE id = ?', [id]);
}

// ============ MATCHES ============

export async function getLocalMatches(): Promise<LocalMatch[]> {
  const db = await getDatabase();
  const matchRows = await db.getAllAsync<{
    id: string;
    home_team_id: string;
    away_team_id: string;
    home_team_name: string;
    away_team_name: string;
    date: string;
    location: string | null;
    match_type: string | null;
    notes: string | null;
    status: string;
    home_sets_won: number;
    away_sets_won: number;
    created_at: string;
  }>('SELECT * FROM matches ORDER BY date DESC');

  const matches: LocalMatch[] = [];

  for (const row of matchRows) {
    const sets = await getMatchSets(row.id);
    const lineup = await getMatchLineup(row.id);

    matches.push({
      id: row.id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name,
      awayTeamName: row.away_team_name,
      date: row.date,
      location: row.location || undefined,
      matchType: (row.match_type as 'BEST_OF_3' | 'BEST_OF_5') || 'BEST_OF_3',
      notes: row.notes || undefined,
      status: row.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
      homeSetsWon: row.home_sets_won,
      awaySetsWon: row.away_sets_won,
      sets,
      lineup,
      createdAt: row.created_at,
    });
  }

  return matches;
}

export async function getLocalMatch(id: string): Promise<LocalMatch | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    home_team_id: string;
    away_team_id: string;
    home_team_name: string;
    away_team_name: string;
    date: string;
    location: string | null;
    match_type: string | null;
    notes: string | null;
    status: string;
    home_sets_won: number;
    away_sets_won: number;
    created_at: string;
  }>('SELECT * FROM matches WHERE id = ?', [id]);

  if (!row) return null;

  const sets = await getMatchSets(row.id);
  const lineup = await getMatchLineup(row.id);

  return {
    id: row.id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeTeamName: row.home_team_name,
    awayTeamName: row.away_team_name,
    date: row.date,
    location: row.location || undefined,
    matchType: (row.match_type as 'BEST_OF_3' | 'BEST_OF_5') || 'BEST_OF_3',
    notes: row.notes || undefined,
    status: row.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
    homeSetsWon: row.home_sets_won,
    awaySetsWon: row.away_sets_won,
    sets,
    lineup,
    createdAt: row.created_at,
  };
}

async function getMatchSets(matchId: string): Promise<LocalSet[]> {
  const db = await getDatabase();
  const setRows = await db.getAllAsync<{
    id: string;
    match_id: string;
    set_number: number;
    home_score: number;
    away_score: number;
    winner_id: string | null;
    home_serves_first: number;
    home_is_serving: number;
    libero_id: string | null;
    libero_is_on_court: number;
    libero_replacing_id: string | null;
    rotation_count: number;
    sub_count: number;
  }>('SELECT * FROM sets WHERE match_id = ? ORDER BY set_number', [matchId]);

  const sets: LocalSet[] = [];

  for (const row of setRows) {
    const plays = await getSetPlays(row.id);
    const courtPositions = await getSetCourtPositions(row.id);

    sets.push({
      id: row.id,
      matchId: row.match_id,
      setNumber: row.set_number,
      homeScore: row.home_score,
      awayScore: row.away_score,
      winnerId: row.winner_id || undefined,
      homeServesFirst: row.home_serves_first === 1,
      homeIsServing: row.home_is_serving === 1,
      plays,
      courtPositions,
      liberoId: row.libero_id || undefined,
      liberoIsOnCourt: row.libero_is_on_court === 1,
      liberoReplacingId: row.libero_replacing_id || undefined,
      rotationCount: row.rotation_count,
      subCount: row.sub_count,
    });
  }

  return sets;
}

async function getSetPlays(setId: string): Promise<LocalPlay[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    match_id: string;
    set_id: string;
    player_id: string;
    type: string;
    result: string;
    assisting_player_id: string | null;
    timestamp: string;
  }>('SELECT * FROM plays WHERE set_id = ? ORDER BY timestamp', [setId]);

  return rows.map(row => ({
    id: row.id,
    matchId: row.match_id,
    setId: row.set_id,
    playerId: row.player_id,
    type: row.type,
    result: row.result,
    assistingPlayerId: row.assisting_player_id || undefined,
    timestamp: row.timestamp,
  }));
}

async function getSetCourtPositions(setId: string): Promise<CourtPosition[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    player_id: string;
    position: number;
  }>('SELECT player_id, position FROM court_positions WHERE set_id = ?', [setId]);

  return rows.map(row => ({
    playerId: row.player_id,
    position: row.position,
  }));
}

async function getMatchLineup(matchId: string): Promise<LineupEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    player_id: string;
    is_starter: number;
    is_libero: number;
    serving_order: number | null;
  }>('SELECT * FROM match_lineup WHERE match_id = ?', [matchId]);

  return rows.map(row => ({
    playerId: row.player_id,
    isStarter: row.is_starter === 1,
    isLibero: row.is_libero === 1,
    servingOrder: row.serving_order || undefined,
  }));
}

export async function saveLocalMatch(match: LocalMatch): Promise<void> {
  const db = await getDatabase();

  // Save match
  await db.runAsync(
    `INSERT OR REPLACE INTO matches
     (id, home_team_id, away_team_id, home_team_name, away_team_name, date, location, match_type, notes, status, home_sets_won, away_sets_won, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      match.id,
      match.homeTeamId,
      match.awayTeamId,
      match.homeTeamName,
      match.awayTeamName,
      match.date,
      match.location || null,
      match.matchType || 'BEST_OF_3',
      match.notes || null,
      match.status,
      match.homeSetsWon,
      match.awaySetsWon,
      match.createdAt,
    ]
  );

  // Save lineup
  await db.runAsync('DELETE FROM match_lineup WHERE match_id = ?', [match.id]);
  if (match.lineup) {
    for (const entry of match.lineup) {
      await db.runAsync(
        `INSERT INTO match_lineup (match_id, player_id, is_starter, is_libero, serving_order)
         VALUES (?, ?, ?, ?, ?)`,
        [match.id, entry.playerId, entry.isStarter ? 1 : 0, entry.isLibero ? 1 : 0, entry.servingOrder || null]
      );
    }
  }

  // Save sets
  for (const set of match.sets) {
    await db.runAsync(
      `INSERT OR REPLACE INTO sets
       (id, match_id, set_number, home_score, away_score, winner_id, home_serves_first, home_is_serving, libero_id, libero_is_on_court, libero_replacing_id, rotation_count, sub_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        set.id,
        set.matchId,
        set.setNumber,
        set.homeScore,
        set.awayScore,
        set.winnerId || null,
        set.homeServesFirst ? 1 : 0,
        set.homeIsServing ? 1 : 0,
        set.liberoId || null,
        set.liberoIsOnCourt ? 1 : 0,
        set.liberoReplacingId || null,
        set.rotationCount || 0,
        set.subCount || 0,
      ]
    );

    // Save court positions
    await db.runAsync('DELETE FROM court_positions WHERE set_id = ?', [set.id]);
    if (set.courtPositions) {
      for (const pos of set.courtPositions) {
        await db.runAsync(
          'INSERT INTO court_positions (set_id, player_id, position) VALUES (?, ?, ?)',
          [set.id, pos.playerId, pos.position]
        );
      }
    }

    // Save plays
    for (const play of set.plays) {
      await db.runAsync(
        `INSERT OR REPLACE INTO plays (id, match_id, set_id, player_id, type, result, assisting_player_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [play.id, play.matchId, play.setId, play.playerId, play.type, play.result, play.assistingPlayerId || null, play.timestamp]
      );
    }
  }
}

export async function deleteLocalMatch(id: string): Promise<void> {
  const db = await getDatabase();
  // CASCADE will handle sets, plays, court_positions, lineup
  await db.runAsync('DELETE FROM matches WHERE id = ?', [id]);
}

// ============ UTILITIES ============

export function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Migration helper: import data from AsyncStorage
export async function migrateFromAsyncStorage(): Promise<{ teams: number; players: number; matches: number }> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);

  let teamsCount = 0;
  let playersCount = 0;
  let matchesCount = 0;

  try {
    // Migrate teams
    const teamsJson = await AsyncStorage.getItem('@local_teams');
    if (teamsJson) {
      const teams = JSON.parse(teamsJson) as LocalTeam[];
      for (const team of teams) {
        await saveLocalTeam(team);
        teamsCount++;
      }
    }

    // Migrate players
    const playersJson = await AsyncStorage.getItem('@local_players');
    if (playersJson) {
      const players = JSON.parse(playersJson) as LocalPlayer[];
      for (const player of players) {
        await saveLocalPlayer(player);
        playersCount++;
      }
    }

    // Migrate matches
    const matchesJson = await AsyncStorage.getItem('@local_matches');
    if (matchesJson) {
      const matches = JSON.parse(matchesJson) as LocalMatch[];
      for (const match of matches) {
        await saveLocalMatch(match);
        matchesCount++;
      }
    }

    // Clear AsyncStorage after successful migration
    if (teamsCount > 0 || playersCount > 0 || matchesCount > 0) {
      await AsyncStorage.multiRemove(['@local_teams', '@local_players', '@local_matches']);
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  return { teams: teamsCount, players: playersCount, matches: matchesCount };
}
