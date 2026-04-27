import { api } from "@/lib/api";

export type WizardCompany = {
  id: number;
  name: string;
};

export type WizardTemplate = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  questionCount: number;
};

export type WizardQuestionOption = {
  id: number;
  text: string;
  weight: number;
};

export type WizardQuestion = {
  id: number;
  text: string;
  category: string | null;
  frameworkType?: "COBIT" | "ITIL" | "ISO_27000" | "PROPRIO";
  frameworkRef?: string;
  frameworkNote?: string;
  options: WizardQuestionOption[];
};

export type AssessmentResultCategory = {
  category: string;
  score: number;
};

type BackendAssessmentResultResponse = {
  totalScore: number;
  categoryScores: Record<string, number>;
  categoryWeights: Record<string, number>;
  strengths?: unknown[];
  weaknesses?: unknown[];
  recommendations?: unknown[];
};

export type AssessmentResultResponse = {
  totalScore: number;
  categoryScores: Record<string, number>;
  categoryWeights: Record<string, number>;
  score: number;
  maturityLevel: string;
  categories: AssessmentResultCategory[];
  strengths: unknown[];
  weaknesses: unknown[];
  recommendations: unknown[];
};

function getMaturity(score: number) {
  if (score < 20) return "Inicial";
  if (score < 40) return "Básico";
  if (score < 60) return "Intermediário";
  if (score < 80) return "Avançado";
  return "Otimizado";
}

export const assessmentFlowApi = {
  getCompanies() {
    return api.get<WizardCompany[]>("/companies");
  },
  getTemplates() {
    return api
      .get<{ count: number; items: WizardTemplate[] }>("/questionnaire-templates")
      .then((response) => response.items.filter((template) => template.isActive));
  },
  createAssessment(payload: { companyId: number; questionnaireTemplateId: number }) {
    return api.post<{ id: number }>("/assessments", payload);
  },
  getQuestions(assessmentId: number) {
    return api
      .get<{ assessmentQuestions?: WizardQuestion[] } | WizardQuestion[]>(
        `/assessments/${assessmentId}/questions`,
      )
      .then((response) => (Array.isArray(response) ? response : response.assessmentQuestions ?? []));
  },
  submitAnswer(payload: {
    assessmentId: number;
    assessmentQuestionId: number;
    selectedOptionId: number;
  }) {
    return api.post("/answers", payload);
  },
  finalizeAssessment(assessmentId: number) {
    return api.post(`/assessments/${assessmentId}/finalize`);
  },
  getResult(assessmentId: number) {
    return api
      .get<BackendAssessmentResultResponse>(`/assessments/${assessmentId}/result`)
      .then((data) => {
        // Temporary debug log requested for endpoint validation.
        console.log("API result:", data);

        const totalScore = Number(data.totalScore ?? 0);
        const categoryScores = data.categoryScores ?? {};
        const categoryWeights = data.categoryWeights ?? {};

        return {
          totalScore,
          categoryScores,
          categoryWeights,
          score: totalScore,
          maturityLevel: getMaturity(totalScore),
          categories: Object.entries(categoryScores).map(([category, score]) => ({
            category,
            score: Number(score),
          })),
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        } satisfies AssessmentResultResponse;
      });
  },
};
