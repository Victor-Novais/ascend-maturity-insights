import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessment, useParticipantSubmit, useUpsertAssessmentResponses } from "@/hooks/useAssessments";
import type { MaturityLevel, QuestionCategory, QuestionTemplate } from "@/lib/types";
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

type LocalResponse = {
  responseValue: string;
  observation: string;
  evidence: string;
};

function getQuestionnaireQuestions(
  assessment: { questionnaireTemplate?: { questions?: QuestionTemplate[] | null } | null } | null | undefined,
): QuestionTemplate[] {
  const tmpl = assessment?.questionnaireTemplate;
  if (!tmpl) return [];
  if (Array.isArray(tmpl.questions)) return tmpl.questions;
  return [];
}

function normalizeType(q: QuestionTemplate): "text" | "multiple_choice" | "scale" | null {
  const t = q.type ?? undefined;
  if (!t) return null;
  const lowered = t.toLowerCase();
  if (lowered.includes("text")) return "text";
  if (lowered.includes("scale")) return "scale";
  if (lowered.includes("multi") || lowered.includes("choice")) return "multiple_choice";
  return null;
}

export default function AssessmentStepper() {
  const { id } = useParams();
  const assessmentId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assessment, isLoading, error } = useAssessment(assessmentId);
  const upsertResponses = useUpsertAssessmentResponses();
  const submit = useParticipantSubmit();

  const questions = useMemo(() => (assessment ? getQuestionnaireQuestions(assessment) : []), [assessment]);

  const myAssignment = useMemo(() => {
    if (!assessment?.assignments || !user?.id) return undefined;
    return assessment.assignments.find((a) => a.userId === user.id);
  }, [assessment, user?.id]);

  const alreadySubmitted = myAssignment?.status === "SUBMITTED";

  const [local, setLocal] = useState<Record<number, LocalResponse>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill saved responses from backend for this user.
  // (Presentation-only: no local scoring and no status inference.)
  const prefilled = useMemo(() => {
    if (!assessment || !user?.id) return {};
    const out: Record<number, LocalResponse> = {};
    for (const r of assessment.responses ?? []) {
      if (r.questionTemplateId == null) continue;
      if (r.userId !== user.id) continue;
      out[r.questionTemplateId] = {
        responseValue: r.responseValue ?? "",
        observation: r.observation ?? "",
        evidence: r.evidence ?? "",
      };
    }
    return out;
  }, [assessment, user?.id]);

  useEffect(() => {
    // Sync local draft once after backend prefilled responses are available.
    if (alreadySubmitted) return;
    if (Object.keys(local).length > 0) return;
    if (Object.keys(prefilled).length === 0) return;
    setLocal(prefilled);
    // Intentionally ignore `local` updates beyond the initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilled, alreadySubmitted]);

  const latestScore = assessment?.totalScore != null ? Number(assessment.totalScore) : null;
  const maturity = assessment?.maturityLevel ? maturityConfig[assessment.maturityLevel as MaturityLevel] : null;

  const setValue = (questionId: number, patch: Partial<LocalResponse>) => {
    setLocal((prev) => ({
      ...prev,
      [questionId]: {
        responseValue: prev[questionId]?.responseValue ?? "",
        observation: prev[questionId]?.observation ?? "",
        evidence: prev[questionId]?.evidence ?? "",
        ...patch,
      },
    }));
  };

  const saveOne = async (question: QuestionTemplate, nextValue: string) => {
    if (!assessment) return;
    try {
      setSaving(true);
      await upsertResponses.mutateAsync({
        assessmentId,
        payload: {
          responses: [
            {
              questionTemplateId: question.id,
              responseValue: nextValue,
              observation: local[question.id]?.observation || undefined,
              evidence: local[question.id]?.evidence || undefined,
            },
          ],
        },
      });
      // Let react-query re-render from backend values (no local business logic).
      // The hooks already invalidate `assessment-detail` on success.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar resposta";
      if (e instanceof ApiError && e.status === 403) toast.error("Você não tem acesso a esta avaliação/empresa");
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!assessment) return;
    if (alreadySubmitted) return;
    try {
      setSubmitting(true);

      const responsesToSave: Array<{
        questionTemplateId: number;
        responseValue: string;
        observation?: string;
        evidence?: string;
      }> = [];

      for (const q of questions) {
        const r = local[q.id];
        if (!r || !r.responseValue.trim()) continue;
        responsesToSave.push({
          questionTemplateId: q.id,
          responseValue: r.responseValue,
          observation: r.observation || undefined,
          evidence: r.evidence || undefined,
        });
      }

      await upsertResponses.mutateAsync({
        assessmentId,
        payload: { responses: responsesToSave },
      });

      await submit.mutateAsync(assessmentId);
      toast.success("Respostas enviadas. Obrigado!");
      navigate(`/dashboard/reports/${assessmentId}`);
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Erro ao enviar respostas";
      if (e instanceof ApiError && e.status === 403) msg = "Você não tem acesso a esta empresa";
      if (e instanceof ApiError && e.status === 404) msg = "Assessment não encontrado";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
  if (!assessment) {
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
            Status: <span className="font-medium text-foreground">{assessment.status}</span>
          </p>
          {assessment.questionnaireTemplate && "name" in assessment.questionnaireTemplate && (
            <p className="text-sm text-muted-foreground">
              Modelo: <span className="font-medium text-foreground">{assessment.questionnaireTemplate.name}</span>
            </p>
          )}
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
        {saving && <p className="text-xs text-muted-foreground mt-2">Salvando resposta...</p>}
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const cfg = categoryConfig[q.category];
          const qType = normalizeType(q);
          const selected = local[q.id]?.responseValue ?? prefilled[q.id]?.responseValue ?? "";

          return (
            <div key={q.id} className="ascend-card animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{q.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1")}>
                      <cfg.icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">Weight: {q.weight}</span>
                  </div>
                  {q.hint && <p className="text-xs text-muted-foreground mt-1">{q.hint}</p>}
                </div>
              </div>

              <div className="space-y-3">
                {qType === "text" && (
                  <textarea
                    className="ascend-input w-full text-sm min-h-[90px] resize-y"
                    placeholder="Digite sua resposta"
                    value={selected}
                    onChange={(e) => setValue(q.id, { responseValue: e.target.value })}
                    onBlur={(e) => void saveOne(q, e.target.value)}
                    disabled={submitting}
                  />
                )}

                {(qType === "multiple_choice" || qType === "scale") && q.options?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {q.options
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((opt) => {
                        const isSelected = selected === opt.scoreValue;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm border transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary/50",
                            )}
                            onClick={() => {
                              setValue(q.id, { responseValue: opt.scoreValue });
                              void saveOne(q, opt.scoreValue);
                            }}
                            disabled={submitting}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                  </div>
                )}

                {qType === null ? (
                  <p className="text-xs text-warning mt-1">Tipo da pergunta não informado pelo backend.</p>
                ) : null}

                {q.evidenceRequired && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">
                    <input
                      className="bg-transparent outline-none flex-1"
                      placeholder="Evidência (obrigatória)"
                      value={local[q.id]?.evidence ?? prefilled[q.id]?.evidence ?? ""}
                      onChange={(e) => setValue(q.id, { evidence: e.target.value })}
                      onBlur={(e) => {
                        const next = local[q.id]?.responseValue ?? prefilled[q.id]?.responseValue ?? "";
                        void upsertResponses.mutateAsync({
                          assessmentId,
                          payload: {
                            responses: [
                              {
                                questionTemplateId: q.id,
                                responseValue: next,
                                evidence: e.target.value || undefined,
                                observation: local[q.id]?.observation || undefined,
                              },
                            ],
                          },
                        });
                      }}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="text-xs text-muted-foreground">
          As respostas são calculadas automaticamente no servidor.
        </div>
        <Button
          type="button"
          onClick={() => void handleSubmitFinal()}
          disabled={submitting || upsertResponses.isPending || submit.isPending}
          className="rounded-lg"
        >
          {(submitting || upsertResponses.isPending || submit.isPending) && <span className="mr-2">...</span>}
          Enviar respostas finais
          <CheckCircle2 className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

