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
  listMy() {
    return api.get<AssessmentWithRelations[]>("/assessments/my");
  },
  getById(id: number) {
    return api.get<AssessmentWithRelations>(`/assessments/${id}`);
  },
  create(payload: CreateAssessmentRequest) {
    return api.post<AssessmentWithRelations>("/assessments", payload);
  },
};
