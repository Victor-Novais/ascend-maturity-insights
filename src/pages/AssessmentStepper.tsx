import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAssessment,
  useAssessmentQuestions,
  useFinishAssessment,
  useSubmitAssessmentAnswers,
} from "@/hooks/useAssessments";
import type { AssessmentQuestion, MaturityLevel, QuestionCategory } from "@/lib/types";
import { AlertTriangle, ArrowLeft, CheckCircle2, Cog, Lock, Shield, Server, Users } from "lucide-react";

const categoryConfig: Record<QuestionCategory, { label: string; icon: ComponentType<{ className?: string }>; color: string }> = {
  GOVERNANCA: { label: "Governança", icon: Shield, color: "text-chart-governance" },
  SEGURANCA: { label: "Segurança", icon: Lock, color: "text-chart-security" },
  PROCESSOS: { label: "Processos", icon: Cog, color: "text-chart-processes" },
  INFRAESTRUTURA: { label: "Infraestrutura", icon: Server, color: "text-chart-infrastructure" },
  CULTURA: { label: "Cultura", icon: Users, color: "text-chart-culture" },
};

const maturityConfig: Record<MaturityLevel, { label: string; color: string; bg: string }> = {
  ARTESANAL: { label: "Artesanal", color: "text-destructive", bg: "bg-destructive/10" },
  EFICIENTE: { label: "Eficiente", color: "text-warning", bg: "bg-warning/10" },
  EFICAZ: { label: "Eficaz", color: "text-primary", bg: "bg-primary/10" },
  ESTRATEGICO: { label: "Estratégico", color: "text-success", bg: "bg-success/10" },
};

export default function AssessmentStepper() {
  const { id } = useParams();
  const assessmentId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assessment, isLoading: loadingAssessment, error } = useAssessment(assessmentId);
  const { data: assessmentQuestions, isLoading: loadingQuestions } = useAssessmentQuestions(assessmentId);
  const submitAnswers = useSubmitAssessmentAnswers();
  const finishAssessment = useFinishAssessment();
  const currentAssessment = assessment ?? null;
  const questions = useMemo<AssessmentQuestion[]>(() => assessmentQuestions ?? [], [assessmentQuestions]);

  const myAssignment = useMemo(() => {
    if (!assessment?.assignments || !user?.id) return undefined;
    return assessment.assignments.find((a) => a.userId === user.id);
  }, [assessment, user?.id]);

  const alreadySubmitted = myAssignment?.status === "SUBMITTED";
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const latestScore = currentAssessment?.totalScore != null ? Number(currentAssessment.totalScore) : null;
  const maturity = currentAssessment?.maturityLevel
    ? maturityConfig[currentAssessment.maturityLevel as MaturityLevel]
    : null;
  const isLoading = loadingAssessment || loadingQuestions;
  const allQuestionsAnswered = questions.length > 0 && questions.every((q) => Number.isFinite(answers[q.id]));
  const isSubmitting = submitAnswers.isPending || finishAssessment.isPending;
  const canSubmit = !alreadySubmitted && allQuestionsAnswered && !isSubmitting;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentAnswered = Number.isFinite(currentAnswer);
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!questions.length) return;
    if (currentIndex > questions.length - 1) {
      setCurrentIndex(questions.length - 1);
    }
  }, [currentIndex, questions.length]);

  const handleSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitFinal = async () => {
    if (!currentAssessment) return;
    if (alreadySubmitted) return;
    if (!allQuestionsAnswered) {
      toast.error("Responda todas as perguntas antes de enviar.");
      return;
    }

    try {
      await submitAnswers.mutateAsync({
        assessmentId,
        answers: Object.entries(answers).map(([qId, optId]) => ({
          assessmentQuestionId: Number(qId),
          selectedOptionId: optId,
        })),
      });
      await finishAssessment.mutateAsync(assessmentId);
      toast.success("Assessment finalizado com sucesso.");
      navigate(`/dashboard/reports/${assessmentId}`);
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Erro ao finalizar assessment";
      if (e instanceof ApiError && e.status === 403) msg = "Você não tem acesso a esta empresa";
      if (e instanceof ApiError && e.status === 404) msg = "Assessment não encontrado";
      toast.error(msg);
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!isCurrentAnswered) {
      toast.error("Selecione uma opção para continuar.");
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading) return <SkeletonCard />;

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Você não tem acesso a esta empresa.</p>
      </div>
    );
  }
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Assessment não encontrado.</p>
      </div>
    );
  }
  if (!currentAssessment) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Avaliação não encontrada.</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Nenhuma pergunta disponível para este assessment.</p>
      </div>
    );
  }

  if (!myAssignment) {
    return (
      <div className="max-w-xl mx-auto ascend-card text-center py-12 space-y-3">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
        <p className="font-medium">Você não possui assignment nesta avaliação.</p>
        <Button variant="outline" className="rounded-lg" onClick={() => navigate("/dashboard")}>
          Voltar ao painel
        </Button>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-xl mx-auto ascend-card text-center py-12 space-y-3">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
        <p className="font-medium">Você já enviou suas respostas.</p>
        <p className="text-sm text-muted-foreground">O resultado consolidado é calculado no servidor.</p>
        <Button asChild variant="outline" className="rounded-lg w-full sm:w-auto">
          <Link to={`/dashboard/reports/${assessmentId}`}>Ver relatório</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Sua avaliação #{assessmentId}</h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{currentAssessment.status}</span>
          </p>
        </div>
      </div>

      <div className="ascend-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm">
            Auto Calculated Score: {latestScore != null ? latestScore.toFixed(1) : "—"}
          </span>
          {maturity && (
            <span className={cn("px-2.5 py-1 rounded-full text-sm", maturity.bg, maturity.color)}>
              Real-time Maturity Level: {maturity.label}
            </span>
          )}
        </div>
      </div>

      <div className="ascend-card space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="min-h-[300px] flex flex-col justify-center">
            <div className="max-w-2xl mx-auto w-full space-y-5">
              <div className="text-center space-y-3">
                {currentQuestion.category ? (
                  <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground items-center gap-1">
                    {(() => {
                      const cfg = categoryConfig[currentQuestion.category as QuestionCategory];
                      if (!cfg) return <>Sem categoria</>;
                      return (
                        <>
                          <cfg.icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </>
                      );
                    })()}
                  </span>
                ) : (
                  <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Sem categoria
                  </span>
                )}
                <h2 className="text-xl font-semibold text-foreground">{currentQuestion.text}</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options
                  ?.slice()
                  .sort((a, b) => a.weight - b.weight)
                  .map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/30",
                        )}
                        onClick={() => handleSelect(currentQuestion.id, opt.id)}
                        disabled={isSubmitting}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isSubmitting}
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button type="button" className="rounded-lg" onClick={handleNext} disabled={isSubmitting}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleSubmitFinal()} disabled={!canSubmit} className="rounded-lg">
              {isSubmitting && <span className="mr-2">...</span>}
              Finish Assessment
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

