import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment.service";
import { answerService } from "@/services/answer.service";
import { questionsService } from "@/services/questions.service";
import type {
  CreateAssessmentRequest,
  UpsertAssessmentResponsesRequest,
} from "@/lib/types";

export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: assessmentService.list,
  });
}

export function useMyAssessments() {
  return useQuery({
    queryKey: ["assessments-my"],
    queryFn: assessmentService.listMy,
  });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: ["assessment-detail", id],
    queryFn: () => assessmentService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssessmentRequest) => assessmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments-my"] });
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
    }) => answerService.upsertResponses(assessmentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments-my"] });
      queryClient.invalidateQueries({
        queryKey: ["assessment-detail", variables.assessmentId],
      });
    },
  });
}

export function useParticipantSubmit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => answerService.participantSubmit(assessmentId),
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments-my"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-detail", assessmentId] });
    },
  });
}

export function useSubmitLegacyAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => assessmentService.submitLegacy(assessmentId),
    onSuccess: (_, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments-my"] });
      queryClient.invalidateQueries({ queryKey: ["assessment-detail", assessmentId] });
    },
  });
}

/** Legacy global question bank (no template). */
export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: questionsService.list,
  });
}
