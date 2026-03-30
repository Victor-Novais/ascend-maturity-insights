import { useEffect, useMemo, useState } from "react";
import { useQuestions, useAssessment, useUpsertAssessmentResponses } from "@/hooks/useAssessments";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Upload,
  Shield,
  Lock,
  Cog,
  Server,
  Users,
  Loader2,
} from "lucide-react";
import type { MaturityLevel, QuestionCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";

const categoryConfig: Record<QuestionCategory, { label: string; icon: React.ComponentType<any>; color: string }> = {
  GOVERNANCA: { label: "Governança", icon: Shield, color: "text-chart-governance" },
  SEGURANCA: { label: "Segurança", icon: Lock, color: "text-chart-security" },
  PROCESSOS: { label: "Processos", icon: Cog, color: "text-chart-processes" },
  INFRAESTRUTURA: { label: "Infraestrutura", icon: Server, color: "text-chart-infrastructure" },
  CULTURA: { label: "Cultura", icon: Users, color: "text-chart-culture" },
};

const categories: QuestionCategory[] = ["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"];
const maturityLabels: Record<MaturityLevel, string> = {
  ARTESANAL: "Artesanal",
  EFICIENTE: "Eficiente",
  EFICAZ: "Eficaz",
  ESTRATEGICO: "Estratégico",
};

export default function AssessmentStepper() {
  const { id } = useParams();
  const assessmentId = Number(id);
  const navigate = useNavigate();
  const {
    data: assessment,
    isLoading: loadingAssessment,
    refetch: refetchAssessment,
    error: assessmentError,
  } = useAssessment(assessmentId);
  const { data: questions, isLoading: loadingQuestions } = useQuestions();
  const upsertResponses = useUpsertAssessmentResponses();

  const [currentStep, setCurrentStep] = useState(0);
  const [currentCompany, setCurrentCompany] = useState<number | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [maturityLevel, setMaturityLevel] = useState<MaturityLevel | null>(null);
  const [categoryScores, setCategoryScores] = useState<Partial<Record<QuestionCategory, number>>>({});
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<
    Record<number, { value: string; comments: string; evidence: string }>
  >({});

  const questionsByCategory = useMemo(() => {
    if (!questions) return {};
    const grouped: Record<string, typeof questions> = {};
    categories.forEach((cat) => {
      grouped[cat] = questions.filter((q) => q.category === cat && q.isActive);
    });
    return grouped;
  }, [questions]);

  const currentCategory = categories[currentStep];
  const currentQuestions = questionsByCategory[currentCategory] || [];

  useEffect(() => {
    if (!assessment) return;
    setCurrentCompany(assessment.companyId);
    setCurrentAssessment(assessment.id);
    setLatestScore(assessment.totalScore ? Number(assessment.totalScore) : null);
    setMaturityLevel(assessment.maturityLevel || null);
    setCategoryScores(assessment.categoryScores || {});
  }, [assessment]);

  const updateResponseField = (questionId: number, field: "value" | "comments", val: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        value: prev[questionId]?.value || "",
        comments: prev[questionId]?.comments || "",
        evidence: prev[questionId]?.evidence || "",
        [field]: val,
      },
    }));
  };

  const sendSingleResponse = async (questionId: number, value: string) => {
    if (!value.trim()) return;
    try {
      setIsRecalculating(true);
      const result = await upsertResponses.mutateAsync({
        assessmentId,
        payload: {
          responses: [
            {
              questionId,
              responseValue: value,
              observation: responses[questionId]?.comments || undefined,
              evidence: responses[questionId]?.evidence || undefined,
            },
          ],
        },
      });
      setLatestScore(result.totalScore ? Number(result.totalScore) : null);
      setMaturityLevel(result.maturityLevel || null);
      setCategoryScores(result.categoryScores || {});
      void refetchAssessment();
    } catch (error) {
      let message = error instanceof Error ? error.message : "Erro ao recalcular resultado";
      if (error instanceof ApiError && error.status === 403) {
        message = "Você não tem acesso a esta empresa";
      }
      if (error instanceof ApiError && error.status === 404) {
        message = "Assessment não encontrado";
      }
      toast.error(message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        responses: Object.entries(responses)
          .filter(([, data]) => data.value.trim().length > 0)
          .map(([questionId, data]) => ({
        questionId: Number(questionId),
            responseValue: data.value,
            observation: data.comments || undefined,
            evidence: data.evidence || undefined,
          })),
      };

      if (payload.responses.length === 0) {
        toast.error("Responda ao menos uma pergunta para finalizar");
        return;
      }

      await upsertResponses.mutateAsync({
        assessmentId,
        payload,
      });

      await refetchAssessment();
      toast.success("Resultados atualizados automaticamente!");
      navigate(`/dashboard/reports/${assessmentId}`);
    } catch (error) {
      let message = error instanceof Error ? error.message : "Erro ao finalizar avaliação";
      if (error instanceof ApiError && error.status === 403) {
        message = "Você não tem acesso a esta empresa";
      }
      if (error instanceof ApiError && error.status === 404) {
        message = "Assessment não encontrado";
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAssessment || loadingQuestions) return <SkeletonCard />;
  if (assessmentError instanceof ApiError && assessmentError.status === 403) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Você não tem acesso a esta empresa.</p>
      </div>
    );
  }
  if (assessmentError instanceof ApiError && assessmentError.status === 404) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Assessment não encontrado.</p>
      </div>
    );
  }
  if (!assessment) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Assessment não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Avaliação #{id}</h1>
          <p className="text-sm text-muted-foreground">
            O sistema calcula a maturidade automaticamente após cada resposta.
          </p>
        </div>
      </div>

      <div className="ascend-card">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            Auto Calculated Score: {latestScore !== null ? latestScore.toFixed(1) : "—"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-success/10 text-success">
            Real-time Maturity Level: {maturityLevel ? maturityLabels[maturityLevel] : "—"}
          </span>
          {isRecalculating && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Recalculando...
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Empresa #{currentCompany} • Assessment #{currentAssessment} • System Generated Insights em tempo real.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {categories.map((cat, i) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          return (
            <button
              key={cat}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                i === currentStep
                  ? "bg-primary text-primary-foreground shadow-medium"
                  : i < currentStep
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {currentQuestions.length > 0 ? (
          currentQuestions.map((question, idx) => (
            <div key={question.id} className="ascend-card animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{question.text}</p>
                  {question.hint && (
                    <p className="text-xs text-muted-foreground mt-1">{question.hint}</p>
                  )}
                </div>
              </div>

              {question.responseType === "YES_NO" ? (
                <div className="flex gap-3 ml-10">
                  {[
                    { label: "Sim", value: "YES" },
                    { label: "Não", value: "NO" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateResponseField(question.id, "value", opt.value);
                        void sendSingleResponse(question.id, opt.value);
                      }}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-medium border transition-all",
                        responses[question.id]?.value === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 ml-10">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        updateResponseField(question.id, "value", String(val));
                        void sendSingleResponse(question.id, String(val));
                      }}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-bold border transition-all",
                        responses[question.id]?.value === String(val)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 ml-10">
                <input
                  className="ascend-input w-full text-xs"
                  placeholder="Comentários (opcional)"
                  value={responses[question.id]?.comments || ""}
                  onChange={(e) => updateResponseField(question.id, "comments", e.target.value)}
                />
              </div>

              {question.evidenceRequired && (
                <div className="mt-3 ml-10">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      className="bg-transparent outline-none flex-1"
                      placeholder="Descreva evidência obrigatória"
                      value={responses[question.id]?.evidence || ""}
                      onChange={(e) =>
                        setResponses((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            value: prev[question.id]?.value || "",
                            comments: prev[question.id]?.comments || "",
                            evidence: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="ascend-card text-center py-12">
            <p className="text-muted-foreground">Nenhuma pergunta nesta categoria</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>

        {currentStep < categories.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="rounded-lg"
          >
            Próximo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="rounded-lg"
            disabled={submitting || upsertResponses.isPending}
          >
            {submitting || upsertResponses.isPending ? "Atualizando..." : "Atualizar e ver relatório"}
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {!!Object.keys(categoryScores).length && (
        <div className="ascend-card">
          <h3 className="font-semibold mb-3">System Generated Insights</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-xs w-32">{categoryConfig[category].label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, categoryScores[category] || 0))}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {(categoryScores[category] || 0).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
