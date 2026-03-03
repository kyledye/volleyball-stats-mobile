

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, buildQueryString } from "../lib/api";
import type {
  Match,
  MatchWithDetails,
  MatchStatusFilter,
  CreateMatchRequest,
} from "../types/api";

// Query keys for cache management
export const matchKeys = {
  all: ["matches"] as const,
  lists: () => [...matchKeys.all, "list"] as const,
  list: (filters?: { teamId?: string; status?: MatchStatusFilter }) =>
    [...matchKeys.lists(), filters] as const,
  details: () => [...matchKeys.all, "detail"] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
  stats: (id: string) => [...matchKeys.detail(id), "stats"] as const,
  plays: (id: string) => [...matchKeys.detail(id), "plays"] as const,
};

// Fetch all matches (with optional filters)
export function useMatches(filters?: { teamId?: string; status?: MatchStatusFilter }) {
  return useQuery({
    queryKey: matchKeys.list(filters),
    queryFn: () =>
      fetchApi<Match[]>(
        `/matches${buildQueryString({
          teamId: filters?.teamId,
          status: filters?.status,
        })}`
      ),
  });
}

// Fetch single match by ID
export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: matchKeys.detail(id!),
    queryFn: () => fetchApi<MatchWithDetails>(`/matches/${id}`),
    enabled: !!id,
  });
}

// Fetch match stats
export function useMatchStats(matchId: string | undefined) {
  return useQuery({
    queryKey: matchKeys.stats(matchId!),
    queryFn: () => fetchApi<unknown>(`/matches/${matchId}/stats`),
    enabled: !!matchId,
  });
}

// Fetch match plays
export function useMatchPlays(matchId: string | undefined) {
  return useQuery({
    queryKey: matchKeys.plays(matchId!),
    queryFn: () => fetchApi<unknown>(`/matches/${matchId}/plays`),
    enabled: !!matchId,
  });
}

// Create a new match
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMatchRequest) =>
      fetchApi<Match>("/matches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate all match lists to refetch
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

// Update match status
export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) =>
      fetchApi<Match>(`/matches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (match) => {
      // Update the specific match in cache
      queryClient.setQueryData(matchKeys.detail(match.id), match);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

// Delete a match
export function useDeleteMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/matches/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: matchKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}
