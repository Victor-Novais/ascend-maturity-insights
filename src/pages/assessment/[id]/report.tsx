import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { assessmentFlowApi } from "@/services/api";
import { useGenerateFromAssessment } from "@/hooks/useActionPlans";
import RadarChart from "@/components/RadarChart";
import ReportInsights from "@/components/ReportInsights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const maturityDescription: Record<string, string> = {
  ARTESANAL: "Processos informais com baixa padronizacao e alto risco operacional.",
  EFICIENTE: "Operacao estruturada em fundamentos, com espaco para governanca mais forte.",
  EFICAZ: "Praticas consistentes, com boa previsibilidade de resultado.",
  ESTRATEGICO: "Maturidade elevada com melhoria continua orientada por dados.",
};

function scoreTone(score: number) {
  if (score < 50) return "text-red-600";
  if (score < 75) return "text-amber-500";
  return "text-emerald-600";
}

function maturityTone(level: string) {
  if (level === "ARTESANAL") return "bg-red-100 text-red-700";
  if (level === "EFICIENTE") return "bg-amber-100 text-amber-700";
  if (level === "EFICAZ") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AssessmentReportByIdPage() {
  const { id } = useParams();
  const assessmentId = Number(id);
  const navigate = useNavigate();
  const generateFromAssessment = useGenerateFromAssessment();
  const reportQuery = useQuery({
    queryKey: ["assessment-report-by-id", assessmentId],
    queryFn: () => assessmentFlowApi.getResult(assessmentId),
    enabled: Number.isFinite(assessmentId) && assessmentId > 0,
    staleTime: 60000,
  });

  const description = useMemo(() => {
    if (!reportQuery.data?.maturityLevel) return "";
    return (
      maturityDescription[reportQuery.data.maturityLevel] ??
      "Nivel de maturidade calculado automaticamente a partir das respostas."
    );
  }, [reportQuery.data?.maturityLevel]);

  if (reportQuery.isLoading) {
    return <div className="ascend-card py-16 text-center text-muted-foreground">Carregando relatório executivo...</div>;
  }

  if (reportQuery.isError || !reportQuery.data) {
    const isNotFinalized = reportQuery.error instanceof ApiError && reportQuery.error.status === 404;
    return (
      <div className="ascend-card py-16 text-center text-destructive">
        {isNotFinalized
          ? "Avaliação ainda não finalizada"
          : (reportQuery.error as Error)?.message ?? "Falha ao carregar relatório."}
      </div>
    );
  }

  const report = reportQuery.data;

  const handleGenerateActionPlans = async () => {
    try {
      const response = await generateFromAssessment.mutateAsync(assessmentId);
      toast.success(`${response.count} planos de acao gerados automaticamente!`);
      navigate("/action-plans");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar planos de acao.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Report</h1>
          <p className="text-sm text-muted-foreground">Avaliacao #{assessmentId} com leitura completa de maturidade.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void handleGenerateActionPlans()} disabled={generateFromAssessment.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Planos de Acao
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to={`/assessment/${assessmentId}/details`}>View Details</Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className={`text-5xl font-bold ${scoreTone(report.score)}`}>{report.score.toFixed(1)}</p>
          <Badge className={`rounded-full px-3 py-1 ${maturityTone(report.maturityLevel)}`}>
            {report.maturityLevel}
          </Badge>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.categories.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.category}</span>
                <span className={scoreTone(item.score)}>{item.score.toFixed(1)}%</span>
              </div>
              <Progress value={item.score} className="h-2 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Radar Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <RadarChart data={report.categories} />
        </CardContent>
      </Card>

      <ReportInsights
        strengths={report.strengths ?? []}
        weaknesses={report.weaknesses ?? []}
        recommendations={report.recommendations ?? []}
      />
    </div>
  );
}
