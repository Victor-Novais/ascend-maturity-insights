import { api } from "@/lib/api";
import type {
  AssessmentWithRelations,
  CreateAssessmentRequest,
  UpsertAssessmentResponsesRequest,
} from "@/lib/types";

export const assessmentsService = {
  list() {
    return api.get<AssessmentWithRelations[]>("/assessments");
  },
  getById(id: number) {
    return api.get<AssessmentWithRelations>(`/assessments/${id}`);
  },
  create(payload: CreateAssessmentRequest) {
    return api.post<AssessmentWithRelations>("/assessments", payload);
  },
  upsertResponses(assessmentId: number, payload: UpsertAssessmentResponsesRequest) {
    return api.put<AssessmentWithRelations>(
      `/assessments/${assessmentId}/responses`,
      payload,
    );
  },
  submit(assessmentId: number) {
    return api.post<unknown>(`/assessments/${assessmentId}/submit`);
  },
};
