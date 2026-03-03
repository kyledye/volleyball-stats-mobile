

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import type {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
} from "../types/api";

// Query keys for cache management
export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  list: (teamId: string) => [...playerKeys.lists(), teamId] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (teamId: string, playerId: string) =>
    [...playerKeys.details(), teamId, playerId] as const,
};

// Fetch all players for a team
export function usePlayers(teamId: string | undefined) {
  return useQuery({
    queryKey: playerKeys.list(teamId!),
    queryFn: () => fetchApi<Player[]>(`/api/teams/${teamId}/players`),
    enabled: !!teamId,
  });
}

// Fetch single player by ID
export function usePlayer(teamId: string | undefined, playerId: string | undefined) {
  return useQuery({
    queryKey: playerKeys.detail(teamId!, playerId!),
    queryFn: () => fetchApi<Player>(`/api/teams/${teamId}/players/${playerId}`),
    enabled: !!teamId && !!playerId,
  });
}

// Create a new player
export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: CreatePlayerRequest }) =>
      fetchApi<Player>(`/api/teams/${teamId}/players`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { teamId }) => {
      // Invalidate the players list for this team
      queryClient.invalidateQueries({ queryKey: playerKeys.list(teamId) });
    },
  });
}

// Update an existing player
export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      playerId,
      data,
    }: {
      teamId: string;
      playerId: string;
      data: UpdatePlayerRequest;
    }) =>
      fetchApi<Player>(`/api/teams/${teamId}/players/${playerId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (player, { teamId, playerId }) => {
      // Update the specific player in cache
      queryClient.setQueryData(playerKeys.detail(teamId, playerId), player);
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: playerKeys.list(teamId) });
    },
  });
}

// Delete a player (soft delete - sets isActive to false)
export function useDeletePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, playerId }: { teamId: string; playerId: string }) =>
      fetchApi<void>(`/api/teams/${teamId}/players/${playerId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, { teamId, playerId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: playerKeys.detail(teamId, playerId),
      });
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: playerKeys.list(teamId) });
    },
  });
}
