import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentsService } from "@/services/assessments.service";
import { questionsService } from "@/services/questions.service";
import type {
  CreateAssessmentRequest,
  UpsertAssessmentResponsesRequest,
} from "@/lib/types";

export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: assessmentsService.list,
  });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => assessmentsService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssessmentRequest) => assessmentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useUpsertAssessmentResponses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      payload,
    }: {
      assessmentId: number;
      payload: UpsertAssessmentResponsesRequest;
    }) => assessmentsService.upsertResponses({ ...payload, assessmentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({
        queryKey: ["assessments", variables.assessmentId],
      });
    },
  });
}

export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: questionsService.list,
  });
}
