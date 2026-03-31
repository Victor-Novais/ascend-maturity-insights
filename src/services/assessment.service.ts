import { api } from "@/lib/api";
import type {
  AssessmentQuestion,
  AssessmentResultData,
  AssessmentWithRelations,
  CreateAssessmentRequest,
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
    return api
      .get<{
        totalScore: number;
        categoryScores: Record<string, number>;
      }>(`/assessments/${id}/result`)
      .then((data) => {
        // Temporary debug log requested for endpoint validation.
        console.log("API result:", data);
        const score = Number(data.totalScore ?? 0);

        const getMaturity = (value: number) => {
          if (value < 20) return "Inicial";
          if (value < 40) return "Básico";
          if (value < 60) return "Intermediário";
          if (value < 80) return "Avançado";
          return "Otimizado";
        };

        return {
          score,
          maturityLevel: getMaturity(score),
          categoryScores: data.categoryScores ?? {},
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
  finish(id: number) {
    return api.post<AssessmentWithRelations>(`/assessments/${id}/finish`);
  },
};
