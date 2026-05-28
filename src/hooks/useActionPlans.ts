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
    queryKey: ["action-plans-stats", companyId],
    queryFn: () => actionPlansService.getStats(companyId),
  });
}

export function useExport5W2H() {
  return useMutation({
    mutationFn: (filters?: ActionPlanFilters) => actionPlansService.export5W2H(filters),
  });
}

export function useCreateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateActionPlanInput) => actionPlansService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
    },
  });
}

export function useGenerateFromAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => actionPlansService.generateFromAssessment(assessmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
    },
  });
}

export function useUpdateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateActionPlanInput }) =>
      actionPlansService.update(id, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans", variables.id] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
    },
  });
}

export function useDeleteActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!window.confirm("Deseja realmente excluir este plano de ação?")) {
        throw new Error("__ACTION_PLAN_DELETE_CANCELLED__");
      }
      return actionPlansService.remove(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
    },
  });
}
