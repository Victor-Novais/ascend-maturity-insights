import { api } from "@/lib/api";
import type {
  AssessmentQuestion,
  AssessmentResultData,
  AssessmentWithRelations,
  CreateAssessmentRequest,
  MaturityLevel,
  QuestionCategory,
} from "@/lib/types";

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
  getResult(id: number) {
    return api.get<AssessmentWithRelations>(`/assessments/${id}`).then((assessment) => {
      const report = assessment.report;
      const scoreRaw = assessment.totalScore ?? report?.totalScore ?? null;
      const score = Number(scoreRaw);
      const maturityLevel = (assessment.maturityLevel ?? report?.maturityLevel ?? null) as MaturityLevel | null;
      const categoryScores = report?.categoryScores as Record<QuestionCategory, number> | undefined;

      if (!Number.isFinite(score) || !maturityLevel || !categoryScores) {
        throw new Error("Assessment result not available");
      }

      return {
        score,
        maturityLevel,
        categoryScores,
      } satisfies AssessmentResultData;
    });
  },
  getQuestions(id: number) {
    return api
      .get<{ assessmentQuestions?: AssessmentQuestion[] } | AssessmentQuestion[]>(
        `/assessments/${id}/questions`,
      )
      .then((res) => (Array.isArray(res) ? res : res.assessmentQuestions ?? []));
  },
  create(payload: CreateAssessmentRequest) {
    return api.post<AssessmentWithRelations>("/assessments", payload);
  },
};
