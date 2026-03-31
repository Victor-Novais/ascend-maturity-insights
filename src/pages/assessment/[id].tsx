import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { assessmentFlowApi } from "@/services/api";

export default function AssessmentQuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const assessmentId = Number(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finalized, setFinalized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const questionsQuery = useQuery({
    queryKey: ["assessment-flow-questions", assessmentId],
    queryFn: () => assessmentFlowApi.getQuestions(assessmentId),
    enabled: Number.isFinite(assessmentId) && assessmentId > 0,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (payload: { assessmentQuestionId: number; selectedOptionId: number }) =>
      assessmentFlowApi.submitAnswer({
        assessmentId,
        assessmentQuestionId: payload.assessmentQuestionId,
        selectedOptionId: payload.selectedOptionId,
      }),
    onError: (error) =>
      setErrorMessage(error instanceof Error ? error.message : "Erro ao enviar resposta"),
  });

  const finalizeMutation = useMutation({
    mutationFn: () => assessmentFlowApi.finalizeAssessment(assessmentId),
    onSuccess: () => {
      setFinalized(true);
      navigate(`/assessment/${assessmentId}/report`);
    },
    onError: (error) =>
      setErrorMessage(error instanceof Error ? error.message : "Erro ao finalizar assessment"),
  });

  const questions = questionsQuery.data ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Number.isFinite(answers[question.id])).length,
    [answers, questions],
  );

  useEffect(() => {
    if (!questions.length || finalized) return;
    if (answeredCount === questions.length && !finalizeMutation.isPending) {
      void finalizeMutation.mutateAsync();
    }
  }, [answeredCount, finalized, finalizeMutation, questions.length]);

  const handleSelectOption = async (selectedOptionId: number) => {
    if (!currentQuestion) return;
    setErrorMessage(null);
    await submitAnswerMutation.mutateAsync({
      assessmentQuestionId: currentQuestion.id,
      selectedOptionId,
    });
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: selectedOptionId,
    }));
  };

  if (questionsQuery.isLoading) {
    return <div className="ascend-card py-16 text-center text-muted-foreground">Carregando perguntas...</div>;
  }

  if (questionsQuery.isError) {
    return (
      <div className="ascend-card py-16 text-center text-destructive">
        {(questionsQuery.error as Error).message}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="ascend-card py-16 text-center text-muted-foreground">
        Nenhuma pergunta encontrada para esta avaliação.
      </div>
    );
  }

  const isBusy = submitAnswerMutation.isPending || finalizeMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="ascend-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Pergunta {currentIndex + 1} de {questions.length}</span>
          <span>{answeredCount} de {questions.length} respondidas</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <QuestionCard
        question={currentQuestion}
        selectedOptionId={answers[currentQuestion.id]}
        disabled={isBusy}
        onSelect={(optionId) => void handleSelectOption(optionId)}
      />

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={currentIndex === 0 || isBusy} onClick={() => setCurrentIndex((i) => i - 1)}>
          Anterior
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button disabled={isBusy} onClick={() => setCurrentIndex((i) => i + 1)}>
            Próxima
          </Button>
        ) : (
          <Button disabled={!isBusy}>
            {finalizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Finalizando...
          </Button>
        )}
      </div>
    </div>
  );
}
