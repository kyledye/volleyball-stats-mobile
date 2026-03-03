import { useState, useEffect, useCallback } from 'react';
import {
  getLocalMatches,
  getLocalMatch,
  saveLocalMatch,
  deleteLocalMatch,
  getLocalTeams,
  getLocalPlayers,
  LocalMatch,
  LocalTeam,
  LocalPlayer,
  generateId,
} from '../lib/database';

export function useLocalMatches() {
  const [matches, setMatches] = useState<LocalMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getLocalMatches();
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load matches'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { matches, isLoading, error, refresh };
}

export function useLocalMatch(id: string | undefined) {
  const [match, setMatch] = useState<LocalMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setMatch(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getLocalMatch(id);
      setMatch(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load match'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateMatch = useCallback(async (updates: Partial<LocalMatch>) => {
    if (!match) return;
    const updated = { ...match, ...updates };
    await saveLocalMatch(updated);
    setMatch(updated);
  }, [match]);

  return { match, isLoading, error, refresh, updateMatch };
}

export function useCreateLocalMatch() {
  const [isCreating, setIsCreating] = useState(false);

  const createMatch = async (data: {
    homeTeamName: string;
    awayTeamName: string;
    date?: string;
  }): Promise<LocalMatch> => {
    setIsCreating(true);
    try {
      const match: LocalMatch = {
        id: generateId(),
        homeTeamId: generateId(),
        awayTeamId: generateId(),
        homeTeamName: data.homeTeamName,
        awayTeamName: data.awayTeamName,
        date: data.date || new Date().toISOString(),
        status: 'IN_PROGRESS',
        homeSetsWon: 0,
        awaySetsWon: 0,
        sets: [{
          id: generateId(),
          matchId: '',
          setNumber: 1,
          homeScore: 0,
          awayScore: 0,
          plays: [],
        }],
        createdAt: new Date().toISOString(),
      };
      match.sets[0].matchId = match.id;

      await saveLocalMatch(match);
      return match;
    } finally {
      setIsCreating(false);
    }
  };

  return { createMatch, isCreating };
}

export { getLocalTeams, getLocalPlayers, saveLocalMatch, deleteLocalMatch };
