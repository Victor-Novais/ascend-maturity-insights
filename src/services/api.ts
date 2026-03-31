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
  options: WizardQuestionOption[];
};

export type AssessmentResultCategory = {
  category: string;
  score: number;
};

export type AssessmentResultResponse = {
  score: number;
  maturityLevel: string;
  categories: AssessmentResultCategory[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

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
    return api.get<AssessmentResultResponse>(`/assessments/${assessmentId}/result`);
  },
};
