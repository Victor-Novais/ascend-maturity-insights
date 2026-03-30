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
  upsertResponses(payload: UpsertAssessmentResponsesRequest) {
    return api.post<AssessmentWithRelations>("/responses", payload);
  },
};
