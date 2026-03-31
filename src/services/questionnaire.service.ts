import { api } from "@/lib/api";
import type { QuestionnaireTemplateListItem, QuestionnaireTemplateWithQuestions } from "@/lib/types";

/**
 * Global questionnaire templates (backend: GET /questionnaire-templates).
 */
export const questionnaireService = {
  list() {
    return api
      .get<{ count: number; items: QuestionnaireTemplateListItem[] }>("/questionnaire-templates")
      .then((res) => res.items);
  },
  getById(id: number) {
    return api.get<QuestionnaireTemplateWithQuestions>(`/questionnaire-templates/${id}`);
  },
};
