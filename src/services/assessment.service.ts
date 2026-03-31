import { api } from "@/lib/api";
import type { AssessmentWithRelations, CreateAssessmentRequest } from "@/lib/types";

/**
 * Assessment instances (backend: GET/POST /assessments).
 * Listing is role-scoped (collaborators only see assigned assessments).
 */
export const assessmentService = {
  list() {
    return api.get<AssessmentWithRelations[]>("/assessments");
  },
  getById(id: number) {
    return api.get<AssessmentWithRelations>(`/assessments/${id}`);
  },
  create(payload: CreateAssessmentRequest) {
    return api.post<AssessmentWithRelations>("/assessments", payload);
  },
  /** Legacy single-evaluator flow: closes assessment and triggers scoring. */
  submitLegacy(assessmentId: number) {
    return api.post<unknown>(`/assessments/${assessmentId}/submit`);
  },
};
