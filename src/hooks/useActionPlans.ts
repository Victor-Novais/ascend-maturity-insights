import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actionPlansService } from "@/services/action-plans.service";
import type {
  ActionPlanFilters,
  CreateActionPlanInput,
  UpdateActionPlanInput,
} from "@/types/action-plan";

export function useActionPlans(filters?: ActionPlanFilters) {
  return useQuery({
    queryKey: ["action-plans", filters],
    queryFn: () => actionPlansService.list(filters),
  });
}

export function useActionPlan(id: number) {
  return useQuery({
    queryKey: ["action-plans", id],
    queryFn: () => actionPlansService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useActionPlanStats(companyId?: number) {
  return useQuery({
    queryKey: ["action-plans", "stats", companyId],
    queryFn: () => actionPlansService.getStats(companyId),
  });
}

export function useCreateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActionPlanInput) => actionPlansService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
  });
}

export function useGenerateFromAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => actionPlansService.generateFromAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
  });
}

export function useUpdateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActionPlanInput }) =>
      actionPlansService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      queryClient.invalidateQueries({ queryKey: ["action-plans", variables.id] });
    },
  });
}

export function useDeleteActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => actionPlansService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
  });
}
