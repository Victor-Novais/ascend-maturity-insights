import { useState, useMemo } from "react";
import { useQuestions, useAssessment, useCalculateScore } from "@/hooks/use-api";
import { api } from "@/lib/api";
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
} from "lucide-react";
import type { QuestionCategory, AssessmentResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryConfig: Record<QuestionCategory, { label: string; icon: React.ComponentType<any>; color: string }> = {
  GOVERNANCA: { label: "Governança", icon: Shield, color: "text-chart-governance" },
  SEGURANCA: { label: "Segurança", icon: Lock, color: "text-chart-security" },
  PROCESSOS: { label: "Processos", icon: Cog, color: "text-chart-processes" },
  INFRAESTRUTURA: { label: "Infraestrutura", icon: Server, color: "text-chart-infrastructure" },
  CULTURA: { label: "Cultura", icon: Users, color: "text-chart-culture" },
};

const categories: QuestionCategory[] = ["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"];

export default function AssessmentStepper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: assessment, isLoading: loadingAssessment } = useAssessment(Number(id));
  const { data: questions, isLoading: loadingQuestions } = useQuestions();
  const calculateScore = useCalculateScore();

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, { value: string; comments: string }>>({});

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

  const updateResponse = (questionId: number, field: "value" | "comments", val: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], value: prev[questionId]?.value || "", comments: prev[questionId]?.comments || "", [field]: val },
    }));
  };

  const handleSubmit = async () => {
    try {
      // Submit responses
      const payload = Object.entries(responses).map(([questionId, data]) => ({
        assessmentId: Number(id),
        questionId: Number(questionId),
        value: data.value,
        comments: data.comments,
      }));
      await api.post(`/assessments/${id}/responses`, payload);
      // Calculate score
      await calculateScore.mutateAsync(Number(id));
      toast.success("Avaliação finalizada com sucesso!");
      navigate(`/dashboard/reports/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar avaliação");
    }
  };

  if (loadingAssessment || loadingQuestions) return <SkeletonCard />;

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
            Responda as perguntas de cada categoria
          </p>
        </div>
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
                  {["SIM", "NÃO"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateResponse(question.id, "value", opt)}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-medium border transition-all",
                        responses[question.id]?.value === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {opt === "SIM" ? "Sim" : "Não"}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 ml-10">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateResponse(question.id, "value", String(val))}
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
                  onChange={(e) => updateResponse(question.id, "comments", e.target.value)}
                />
              </div>

              {question.evidenceRequired && (
                <div className="mt-3 ml-10">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Anexar evidência
                    <input type="file" className="hidden" />
                  </label>
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
            disabled={calculateScore.isPending}
          >
            {calculateScore.isPending ? "Calculando..." : "Finalizar Avaliação"}
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
