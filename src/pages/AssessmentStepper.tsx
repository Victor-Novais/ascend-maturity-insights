import { useEffect, useMemo, useState } from "react";
import {
  useAssessment,
  useUpsertAssessmentResponses,
  useParticipantSubmit,
  useSubmitLegacyAssessment,
  useQuestions,
} from "@/hooks/useAssessments";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import type { AssessmentWithRelations, QuestionCategory, QuestionTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const categoryConfig: Record<
  QuestionCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  GOVERNANCA: { label: "Governança", icon: Shield, color: "text-chart-governance" },
  SEGURANCA: { label: "Segurança", icon: Lock, color: "text-chart-security" },
  PROCESSOS: { label: "Processos", icon: Cog, color: "text-chart-processes" },
  INFRAESTRUTURA: { label: "Infraestrutura", icon: Server, color: "text-chart-infrastructure" },
  CULTURA: { label: "Cultura", icon: Users, color: "text-chart-culture" },
};

const categories: QuestionCategory[] = ["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"];

type LocalResponse = { value: string; comments: string; evidence: string };

function TemplateClientProgressView({ assessment }: { assessment: AssessmentWithRelations }) {
  const { user } = useAuth();
  const tmpl = assessment.questionnaireTemplate;
  const name = tmpl && "name" in tmpl ? tmpl.name : "—";
  const total = assessment.assignments?.length ?? 0;
  const done = assessment.assignments?.filter((a) => a.status === "SUBMITTED").length ?? 0;
  const showReportLink =
    assessment.status === "SUBMITTED" &&
    (user?.role === "CLIENTE" || user?.role === "ADMIN" || user?.role === "AVALIADOR");

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Avaliação #{assessment.id}</h1>
          <p className="text-sm text-muted-foreground">
            Modelo: <span className="font-medium text-foreground">{name}</span>
          </p>
        </div>
      </div>

      <div className="ascend-card space-y-4">
        <h2 className="font-semibold">Progresso dos colaboradores</h2>
        <p className="text-sm text-muted-foreground">
          O fechamento e o score são calculados automaticamente no servidor quando todos os colaboradores
          enviarem as respostas.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums">
            {done}/{total}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Status da avaliação:{" "}
          <span className="font-medium text-foreground">{assessment.status}</span>
        </p>
        {showReportLink && (
          <Button asChild className="rounded-lg w-full sm:w-auto">
            <Link to={`/dashboard/reports/${assessment.id}`}>Ver relatório consolidado</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function CollaboratorTemplateAssessment({
  assessment,
  refetch,
}: {
  assessment: AssessmentWithRelations;
  refetch: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assessmentId = assessment.id;
  const upsert = useUpsertAssessmentResponses();
  const participantSubmit = useParticipantSubmit();

  const template = assessment.questionnaireTemplate;
  const questions: QuestionTemplate[] = useMemo(() => {
    if (template && "questions" in template && Array.isArray(template.questions)) {
      return [...template.questions].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    }
    return [];
  }, [template]);

  const myAssignment = assessment.assignments?.find((a) => a.userId === user?.id);
  const alreadySubmitted = myAssignment?.status === "SUBMITTED";

  const [responses, setResponses] = useState<Record<number, LocalResponse>>({});
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const next: Record<number, LocalResponse> = {};
    for (const r of assessment.responses) {
      if (r.questionTemplateId && r.userId === user?.id) {
        next[r.questionTemplateId] = {
          value: r.responseValue,
          comments: r.observation || "",
          evidence: r.evidence || "",
        };
      }
    }
    setResponses(next);
  }, [assessment.responses, user?.id]);

  const questionsByCategory = useMemo(() => {
    const grouped: Partial<Record<QuestionCategory, QuestionTemplate[]>> = {};
    for (const cat of categories) {
      const qs = questions.filter((q) => q.category === cat);
      if (qs.length) grouped[cat] = qs;
    }
    return grouped;
  }, [questions]);

  const activeCategories = useMemo(
    () => categories.filter((c) => (questionsByCategory[c]?.length ?? 0) > 0),
    [questionsByCategory],
  );

  const currentCategory = activeCategories[currentStep] ?? activeCategories[0];
  const currentQuestions = currentCategory ? questionsByCategory[currentCategory] ?? [] : [];

  const updateField = (qid: number, field: keyof LocalResponse, val: string) => {
    setResponses((prev) => ({
      ...prev,
      [qid]: {
        value: prev[qid]?.value ?? "",
        comments: prev[qid]?.comments ?? "",
        evidence: prev[qid]?.evidence ?? "",
        [field]: val,
      },
    }));
  };

  const sendOne = async (qt: QuestionTemplate, value: string) => {
    try {
      await upsert.mutateAsync({
        assessmentId,
        payload: {
          responses: [
            {
              questionTemplateId: qt.id,
              responseValue: value,
              observation: responses[qt.id]?.comments || undefined,
              evidence: responses[qt.id]?.evidence || undefined,
            },
          ],
        },
      });
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar resposta");
    }
  };

  const handleFinalize = async () => {
    const missing = questions.filter((q) => !(responses[q.id]?.value?.trim()));
    if (missing.length > 0) {
      toast.error("Responda todas as perguntas antes de enviar.");
      return;
    }

    const batch = questions.map((q) => ({
      questionTemplateId: q.id,
      responseValue: responses[q.id]!.value,
      observation: responses[q.id]?.comments || undefined,
      evidence: responses[q.id]?.evidence || undefined,
    }));

    try {
      await upsert.mutateAsync({ assessmentId, payload: { responses: batch } });
      await participantSubmit.mutateAsync(assessmentId);
      toast.success("Respostas enviadas. Obrigado!");
      navigate("/dashboard/assessments");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao finalizar");
    }
  };

  if (!questions.length) {
    return (
      <div className="ascend-card text-center py-12 text-muted-foreground">
        Nenhuma pergunta neste modelo. Aguarde a configuração do administrador.
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-xl mx-auto ascend-card text-center py-12 space-y-3">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
        <p className="font-medium">Você já enviou suas respostas nesta avaliação.</p>
        <p className="text-sm text-muted-foreground">
          O resultado consolidado é calculado no servidor e fica disponível para o responsável da empresa.
        </p>
        <Button variant="outline" className="rounded-lg" onClick={() => navigate("/dashboard")}>
          Voltar ao painel
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
        <div>
          <h1 className="text-2xl font-bold">Sua avaliação #{assessmentId}</h1>
          <p className="text-sm text-muted-foreground">
            Responda por conta própria. O score final é gerado no servidor após todos os colaboradores
            concluírem.
          </p>
        </div>
      </div>

      <div className="ascend-card text-sm text-muted-foreground">
        As respostas são salvas ao selecionar cada opção. Ao final, clique em <strong>Enviar respostas finais</strong>.
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {activeCategories.map((cat, i) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                i === currentStep
                  ? "bg-primary text-primary-foreground shadow-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {currentQuestions.map((qt, idx) => (
          <div key={qt.id} className="ascend-card animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{qt.text}</p>
                {qt.hint && <p className="text-xs text-muted-foreground mt-1">{qt.hint}</p>}
              </div>
            </div>

            <div className="ml-10 space-y-3">
              {qt.options.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {qt.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        updateField(qt.id, "value", String(opt.id));
                        void sendOne(qt, String(opt.id));
                      }}
                      className={cn(
                        "text-left px-4 py-2.5 rounded-lg text-sm border transition-all",
                        responses[qt.id]?.value === String(opt.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:border-primary/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : qt.responseType === "YES_NO" ? (
                <div className="flex gap-3">
                  {[
                    { label: "Sim", value: "YES" },
                    { label: "Não", value: "NO" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        updateField(qt.id, "value", opt.value);
                        void sendOne(qt, opt.value);
                      }}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-medium border transition-all",
                        responses[qt.id]?.value === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        updateField(qt.id, "value", String(val));
                        void sendOne(qt, String(val));
                      }}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-bold border transition-all",
                        responses[qt.id]?.value === String(val)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              <input
                className="ascend-input w-full text-xs"
                placeholder="Comentários (opcional)"
                value={responses[qt.id]?.comments || ""}
                onChange={(e) => updateField(qt.id, "comments", e.target.value)}
              />

              {qt.evidenceRequired && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    className="bg-transparent outline-none flex-1"
                    placeholder="Evidência obrigatória (texto)"
                    value={responses[qt.id]?.evidence || ""}
                    onChange={(e) => updateField(qt.id, "evidence", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button
          variant="outline"
          type="button"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>

        {currentStep < activeCategories.length - 1 ? (
          <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="rounded-lg">
            Próximo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleFinalize()}
            disabled={upsert.isPending || participantSubmit.isPending}
            className="rounded-lg"
          >
            {(upsert.isPending || participantSubmit.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Enviar respostas finais
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LegacyAssessmentFlow({
  assessment,
  refetch,
}: {
  assessment: AssessmentWithRelations;
  refetch: () => void;
}) {
  const navigate = useNavigate();
  const assessmentId = assessment.id;
  const { data: questions, isLoading: loadingQuestions } = useQuestions();
  const upsert = useUpsertAssessmentResponses();
  const submitLegacy = useSubmitLegacyAssessment();

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, LocalResponse>>({});
  const [isRecalculating, setIsRecalculating] = useState(false);

  const questionsByCategory = useMemo(() => {
    if (!questions) return {};
    const grouped: Record<string, typeof questions> = {};
    categories.forEach((cat) => {
      grouped[cat] = questions.filter((q) => q.category === cat && q.isActive);
    });
    return grouped;
  }, [questions]);

  const activeCategories = useMemo(() => {
    return categories.filter((c) => (questionsByCategory[c]?.length ?? 0) > 0);
  }, [questionsByCategory]);

  const currentCategory = activeCategories[currentStep];
  const currentQuestions = currentCategory ? questionsByCategory[currentCategory] || [] : [];

  useEffect(() => {
    const next: Record<number, LocalResponse> = {};
    for (const r of assessment.responses) {
      if (r.questionId != null && r.userId == null) {
        next[r.questionId] = {
          value: r.responseValue,
          comments: r.observation || "",
          evidence: r.evidence || "",
        };
      }
    }
    setResponses(next);
  }, [assessment.responses]);

  const updateField = (qid: number, field: keyof LocalResponse, val: string) => {
    setResponses((prev) => ({
      ...prev,
      [qid]: {
        value: prev[qid]?.value ?? "",
        comments: prev[qid]?.comments ?? "",
        evidence: prev[qid]?.evidence ?? "",
        [field]: val,
      },
    }));
  };

  const sendSingleResponse = async (questionId: number, value: string) => {
    if (!value.trim()) return;
    try {
      setIsRecalculating(true);
      await upsert.mutateAsync({
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
      void refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleFinalize = async () => {
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

    try {
      await upsert.mutateAsync({ assessmentId, payload });
      await submitLegacy.mutateAsync(assessmentId);
      toast.success("Avaliação concluída");
      navigate(`/dashboard/reports/${assessmentId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar");
    }
  };

  if (loadingQuestions) return <SkeletonCard />;

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
        <div>
          <h1 className="text-2xl font-bold">Avaliação #{assessmentId}</h1>
          <p className="text-sm text-muted-foreground">
            Fluxo legado: o sistema recalcula o score no servidor após cada resposta e ao finalizar.
          </p>
        </div>
      </div>

      {isRecalculating && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando com o servidor...
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {activeCategories.map((cat, i) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                i === currentStep
                  ? "bg-primary text-primary-foreground shadow-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

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
                  {question.hint && <p className="text-xs text-muted-foreground mt-1">{question.hint}</p>}
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
                      type="button"
                      onClick={() => {
                        updateField(question.id, "value", opt.value);
                        void sendSingleResponse(question.id, opt.value);
                      }}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-medium border transition-all",
                        responses[question.id]?.value === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 ml-10">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        updateField(question.id, "value", String(val));
                        void sendSingleResponse(question.id, String(val));
                      }}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-bold border transition-all",
                        responses[question.id]?.value === String(val)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
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
                  onChange={(e) => updateField(question.id, "comments", e.target.value)}
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

      <div className="flex justify-between">
        <Button
          variant="outline"
          type="button"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>

        {currentStep < activeCategories.length - 1 ? (
          <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="rounded-lg">
            Próximo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleFinalize()}
            disabled={upsert.isPending || submitLegacy.isPending}
            className="rounded-lg"
          >
            Finalizar e ver relatório
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AssessmentStepper() {
  const { user } = useAuth();
  const { id } = useParams();
  const assessmentId = Number(id);
  const {
    data: assessment,
    isLoading: loadingAssessment,
    refetch: refetchAssessment,
    error: assessmentError,
  } = useAssessment(assessmentId);

  if (loadingAssessment) return <SkeletonCard />;
  if (assessmentError instanceof ApiError && assessmentError.status === 403) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Você não tem acesso a esta avaliação.</p>
      </div>
    );
  }
  if (!assessment) {
    return (
      <div className="ascend-card text-center py-12">
        <p className="text-muted-foreground">Avaliação não encontrada.</p>
      </div>
    );
  }

  if (assessment.questionnaireTemplateId) {
    if (user?.role === "COLLABORATOR") {
      return <CollaboratorTemplateAssessment assessment={assessment} refetch={refetchAssessment} />;
    }
    return <TemplateClientProgressView assessment={assessment} />;
  }

  return <LegacyAssessmentFlow assessment={assessment} refetch={refetchAssessment} />;
}
