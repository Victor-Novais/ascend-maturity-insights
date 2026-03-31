import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import QuestionAccordion, { type QuestionGroup } from "@/components/QuestionAccordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assessmentFlowApi } from "@/services/api";
import { assessmentService } from "@/services/assessment.service";
import { api } from "@/lib/api";

type AnswerPayload = {
  assessmentQuestionId?: number;
  selectedOptionId?: number;
  selectedOption?: {
    text?: string;
    weight?: number;
  } | null;
  score?: string | number | null;
};

function toAnswerList(raw: unknown): AnswerPayload[] {
  if (Array.isArray(raw)) return raw as AnswerPayload[];
  if (raw && typeof raw === "object" && "items" in raw && Array.isArray((raw as { items: unknown[] }).items)) {
    return (raw as { items: AnswerPayload[] }).items;
  }
  return [];
}

export default function AssessmentDetailsPage() {
  const { id } = useParams();
  const assessmentId = Number(id);

  const questionsQuery = useQuery({
    queryKey: ["assessment-details-questions", assessmentId],
    queryFn: () => assessmentFlowApi.getQuestions(assessmentId),
    enabled: Number.isFinite(assessmentId) && assessmentId > 0,
    staleTime: 60000,
  });

  const answersQuery = useQuery({
    queryKey: ["assessment-details-answers", assessmentId],
    queryFn: async () => {
      try {
        const fromAnswersEndpoint = await api.get<unknown>("/answers", { assessmentId });
        const parsed = toAnswerList(fromAnswersEndpoint);
        if (parsed.length > 0) return parsed;
      } catch {
        // fallback below when /answers list is unavailable
      }
      const assessment = await assessmentService.getById(assessmentId);
      return (assessment.responses ?? []).map((response) => ({
        assessmentQuestionId: response.assessmentQuestionId ?? undefined,
        selectedOptionId: response.selectedOptionId ?? undefined,
        selectedOption: {
          text:
            response.questionTemplate?.options?.find((option) => option.id === response.selectedOptionId)?.label ??
            response.responseValue,
          weight: Number(response.score),
        },
        score: response.score,
      }));
    },
    enabled: Number.isFinite(assessmentId) && assessmentId > 0,
    staleTime: 60000,
  });

  const grouped: QuestionGroup[] = useMemo(() => {
    if (!questionsQuery.data?.length) return [];
    const answersByQuestion = new Map<number, AnswerPayload>();
    for (const answer of answersQuery.data ?? []) {
      if (typeof answer.assessmentQuestionId === "number") {
        answersByQuestion.set(answer.assessmentQuestionId, answer);
      }
    }

    const groupsMap = new Map<string, QuestionGroup["items"]>();
    for (const question of questionsQuery.data) {
      const category = question.category ?? "Sem categoria";
      const current = groupsMap.get(category) ?? [];
      const selected = answersByQuestion.get(question.id);
      const selectedByOption =
        question.options.find((option) => option.id === selected?.selectedOptionId)?.text ??
        selected?.selectedOption?.text ??
        "Nao respondida";
      const scoreRaw = selected?.score ?? selected?.selectedOption?.weight ?? null;
      const score = scoreRaw === null ? null : Number(scoreRaw);

      current.push({
        id: question.id,
        question: question.text,
        selectedAnswer: selectedByOption,
        score: Number.isFinite(score) ? score : null,
      });
      groupsMap.set(category, current);
    }

    return Array.from(groupsMap.entries()).map(([category, items]) => ({ category, items }));
  }, [answersQuery.data, questionsQuery.data]);

  const isLoading = questionsQuery.isLoading || answersQuery.isLoading;
  const hasError = questionsQuery.isError || answersQuery.isError;

  if (isLoading) {
    return <div className="ascend-card py-16 text-center text-muted-foreground">Carregando respostas detalhadas...</div>;
  }

  if (hasError) {
    return (
      <div className="ascend-card py-16 text-center text-destructive">
        Falha ao carregar detalhes das respostas.
      </div>
    );
  }

  if (!grouped.length) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold">Nenhum detalhe encontrado</p>
          <p className="mt-2 text-sm text-muted-foreground">As respostas ainda nao foram registradas para esta avaliacao.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessment Details</h1>
          <p className="text-sm text-muted-foreground">Perguntas, respostas selecionadas e score por item.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to={`/assessment/${assessmentId}/report`}>Voltar ao relatório</Link>
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">View Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionAccordion groups={grouped} />
        </CardContent>
      </Card>
    </div>
  );
}
