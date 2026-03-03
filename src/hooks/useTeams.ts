

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, buildQueryString } from "../lib/api";
import type {
  Team,
  TeamFilter,
  CreateTeamRequest,
  UpdateTeamRequest,
} from "../types/api";

// Query keys for cache management
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (filter?: TeamFilter) => [...teamKeys.lists(), { filter }] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

// Fetch all teams (with optional filter)
export function useTeams(filter?: TeamFilter) {
  return useQuery({
    queryKey: teamKeys.list(filter),
    queryFn: () =>
      fetchApi<Team[]>(`/teams${buildQueryString({ filter })}`),
  });
}

// Fetch single team by ID
export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: teamKeys.detail(id!),
    queryFn: () => fetchApi<Team>(`/teams/${id}`),
    enabled: !!id,
  });
}

// Create a new team
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamRequest) =>
      fetchApi<Team>("/teams", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate all team lists to refetch
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

// Update an existing team
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamRequest }) =>
      fetchApi<Team>(`/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (team) => {
      // Update the specific team in cache
      queryClient.setQueryData(teamKeys.detail(team.id), team);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

// Delete a team
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/teams/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: teamKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}
