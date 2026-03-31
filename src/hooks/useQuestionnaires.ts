import { useQuery } from "@tanstack/react-query";
import { questionnaireService } from "@/services/questionnaire.service";

export function useQuestionnaireTemplates() {
  return useQuery({
    queryKey: ["questionnaire-templates"],
    queryFn: questionnaireService.list,
  });
}

export function useQuestionnaireTemplate(id: number) {
  return useQuery({
    queryKey: ["questionnaire-templates", id],
    queryFn: () => questionnaireService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
