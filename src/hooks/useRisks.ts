import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { risksService } from "@/services/risks.service";
import type { CreateRiskInput, RiskFilters, UpdateRiskInput } from "@/types/risk";

export function useRisks(filters?: RiskFilters, enabled = true) {
  return useQuery({
    queryKey: ["risks", filters],
    queryFn: () => risksService.list(filters),
    enabled,
  });
}

export function useRisk(id: number) {
  return useQuery({
    queryKey: ["risks", id],
    queryFn: () => risksService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useRiskStats(companyId?: number, enabled = true) {
  return useQuery({
    queryKey: ["risks", "stats", companyId],
    queryFn: () => risksService.getStats(companyId),
    enabled,
  });
}

export function useRiskMatrix(companyId?: number, enabled = true) {
  return useQuery({
    queryKey: ["risks", "matrix", companyId],
    queryFn: () => risksService.getMatrix(companyId),
    enabled,
  });
}

export function useCreateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRiskInput) => risksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

export function useGenerateRisksFromAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => risksService.generateFromAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}

export function useUpdateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRiskInput }) =>
      risksService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      queryClient.invalidateQueries({ queryKey: ["risks", variables.id] });
    },
  });
}

export function useDeleteRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => risksService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risks"] });
    },
  });
}
