import { api } from "@/lib/api";
import type { AssessmentWithRelations, UpsertAssessmentResponsesRequest } from "@/lib/types";

/**
 * Responses + collaborator finalization (backend: PUT /assessments/:id/responses, POST .../participant-submit).
 */
export const answerService = {
  upsertResponses(assessmentId: number, payload: UpsertAssessmentResponsesRequest) {
    return api.put<AssessmentWithRelations>(
      `/assessments/${assessmentId}/responses`,
      payload,
    );
  },
  /** Template assessments: collaborator marks their questionnaire complete; backend auto-closes when all submit. */
  participantSubmit(assessmentId: number) {
    return api.post<AssessmentWithRelations>(
      `/assessments/${assessmentId}/participant-submit`,
    );
  },
};
