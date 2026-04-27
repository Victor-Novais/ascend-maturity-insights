import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionsService } from "@/services/questions.service";
import type { FrameworkType } from "@/lib/types";
import type { UpsertQuestionPayload } from "@/services/questions.service";

export function useQuestions(frameworkType: "ALL" | FrameworkType = "ALL") {
  return useQuery({
    queryKey: ["questions", frameworkType],
    queryFn: () => questionsService.list(frameworkType),
  });
}

export function useFrameworkCoverage() {
  return useQuery({
    queryKey: ["framework-coverage"],
    queryFn: questionsService.getFrameworkCoverage,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertQuestionPayload) => questionsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questions"] });
      void queryClient.invalidateQueries({ queryKey: ["framework-coverage"] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertQuestionPayload }) =>
      questionsService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questions"] });
      void queryClient.invalidateQueries({ queryKey: ["framework-coverage"] });
    },
  });
}
