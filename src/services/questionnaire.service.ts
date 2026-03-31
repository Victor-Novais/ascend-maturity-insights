import { api } from "@/lib/api";
import type { QuestionnaireTemplateWithQuestions } from "@/lib/types";

/**
 * Global questionnaire templates (backend: GET /questionnaire-templates).
 */
export const questionnaireService = {
  list() {
    return api.get<QuestionnaireTemplateWithQuestions[]>("/questionnaire-templates");
  },
  getById(id: number) {
    return api.get<QuestionnaireTemplateWithQuestions>(`/questionnaire-templates/${id}`);
  },
};
