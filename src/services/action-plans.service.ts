import { api } from "@/lib/api";
import {
  ActionPlanPriority,
  ActionPlanStatus,
  type ActionPlan,
  type ActionPlanFilters,
  type ActionPlanStats,
  type CreateActionPlanInput,
  type GenerateActionPlansResponse,
  type UpdateActionPlanInput,
} from "@/types/action-plan";

type ActionPlanListResponse = ActionPlan[] | { items?: ActionPlan[]; data?: ActionPlan[] };

type ActionPlanStatsResponse =
  | ActionPlanStats
  | {
      total?: number;
      pending?: number;
      inProgress?: number;
      completed?: number;
      canceled?: number;
      pendentes?: number;
      emAndamento?: number;
      concluidos?: number;
      cancelados?: number;
      byPriority?: Partial<Record<ActionPlanPriority, number>>;
      priorities?: Partial<Record<ActionPlanPriority, number>>;
      porPrioridade?: Partial<Record<ActionPlanPriority, number>>;
    };

type GenerateResponse =
  | GenerateActionPlansResponse
  | ActionPlan[]
  | { count?: number; createdCount?: number; items?: ActionPlan[]; data?: ActionPlan[] };

function normalizeList(response: ActionPlanListResponse): ActionPlan[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.data ?? [];
}

function normalizeStats(response: ActionPlanStatsResponse): ActionPlanStats {
  const byPriority =
    response.byPriority ??
    response.priorities ??
    response.porPrioridade ?? {
      [ActionPlanPriority.ALTA]: 0,
      [ActionPlanPriority.MEDIA]: 0,
      [ActionPlanPriority.BAIXA]: 0,
    };

  return {
    total: Number(response.total ?? 0),
    pending: Number(response.pending ?? response.pendentes ?? 0),
    inProgress: Number(response.inProgress ?? response.emAndamento ?? 0),
    completed: Number(response.completed ?? response.concluidos ?? 0),
    canceled: Number(response.canceled ?? response.cancelados ?? 0),
    byPriority: {
      [ActionPlanPriority.ALTA]: Number(byPriority[ActionPlanPriority.ALTA] ?? 0),
      [ActionPlanPriority.MEDIA]: Number(byPriority[ActionPlanPriority.MEDIA] ?? 0),
      [ActionPlanPriority.BAIXA]: Number(byPriority[ActionPlanPriority.BAIXA] ?? 0),
    },
  };
}

function normalizeGenerateResponse(response: GenerateResponse): GenerateActionPlansResponse {
  if (Array.isArray(response)) {
    return { count: response.length, items: response };
  }

  const items = response.items ?? response.data ?? [];
  return {
    count: Number(response.count ?? response.createdCount ?? items.length),
    items,
  };
}

export const actionPlansService = {
  list(filters?: ActionPlanFilters) {
    return api
      .get<ActionPlanListResponse>("/action-plans", filters)
      .then(normalizeList);
  },
  getById(id: number) {
    return api.get<ActionPlan>(`/action-plans/${id}`);
  },
  getStats(companyId?: number) {
    return api
      .get<ActionPlanStatsResponse>("/action-plans/stats", companyId ? { companyId } : undefined)
      .then(normalizeStats);
  },
  create(payload: CreateActionPlanInput) {
    return api.post<ActionPlan>("/action-plans", payload);
  },
  generateFromAssessment(assessmentId: number) {
    return api
      .post<GenerateResponse>(`/action-plans/from-assessment/${assessmentId}`)
      .then(normalizeGenerateResponse);
  },
  update(id: number, payload: UpdateActionPlanInput) {
    return api.patch<ActionPlan>(`/action-plans/${id}`, payload);
  },
  remove(id: number) {
    return api.delete<void>(`/action-plans/${id}`);
  },
  updateStatus(id: number, status: ActionPlanStatus) {
    return api.patch<ActionPlan>(`/action-plans/${id}`, { status });
  },
};
