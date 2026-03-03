import { useQuery } from "@tanstack/react-query";
import { fetchApi, buildQueryString } from "../lib/api";

// Stats types (simplified for mobile)
export interface PlayerStats {
  playerId: string;
  firstName: string;
  lastName: string;
  teamId: string;
  kills: number;
  attackErrors: number;
  attackAttempts: number;
  aces: number;
  serviceErrors: number;
  serviceAttempts: number;
  assists: number;
  digs: number;
  blockSolos: number;
  blockAssists: number;
  receptions: number;
  receptionErrors: number;
  points: number;
}

// Query keys for cache management
export const statsKeys = {
  all: ["stats"] as const,
  season: () => [...statsKeys.all, "season"] as const,
  match: (matchId: string) => [...statsKeys.all, "match", matchId] as const,
};

// Fetch season stats for all players
export function useSeasonStats(teamId?: string) {
  return useQuery({
    queryKey: [...statsKeys.season(), teamId],
    queryFn: () =>
      fetchApi<PlayerStats[]>(
        `/stats${buildQueryString({ teamId })}`
      ),
  });
}

// Fetch match stats
export function useMatchStats(matchId: string) {
  return useQuery({
    queryKey: statsKeys.match(matchId),
    queryFn: () =>
      fetchApi<PlayerStats[]>(`/matches/${matchId}/stats`),
    enabled: !!matchId,
  });
}
