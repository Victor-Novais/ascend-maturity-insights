import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import RadarChartComponent from "@/components/RadarChartComponent";
import ReportInsights from "@/components/ReportInsights";
import ReportSummary from "@/components/ReportSummary";
import { assessmentFlowApi } from "@/services/api";
import { ApiError } from "@/lib/api";
import { useGenerateFromAssessment } from "@/hooks/useActionPlans";
import { useGenerateRisksFromAssessment } from "@/hooks/useRisks";
import { useAssessment } from "@/hooks/useAssessments";
import { analyticsService } from "@/services/analytics.service";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

const maturityDescription: Record<string, string> = {
  ARTESANAL: "Processos informais e não padronizados",
  EFICIENTE: "Processos básicos definidos",
  EFICAZ: "Processos estruturados com controle",
  ESTRATEGICO: "Alta maturidade e otimização contínua",
};

export default function AssessmentReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assessmentId = Number(searchParams.get("id"));
  const generateFromAssessment = useGenerateFromAssessment();
  const generateRisksFromAssessment = useGenerateRisksFromAssessment();
  const assessmentQuery = useAssessment(assessmentId);

  const reportQuery = useQuery({
    queryKey: ["assessment-flow-report", assessmentId],
    queryFn: () => assessmentFlowApi.getResult(assessmentId),
    enabled: Number.isFinite(assessmentId) && assessmentId > 0,
  });

  const description = useMemo(() => {
    const level = reportQuery.data?.maturityLevel;
    if (!level) return "";
    return maturityDescription[level] ?? "Nível de maturidade identificado pelo backend.";
  }, [reportQuery.data?.maturityLevel]);

  if (reportQuery.isLoading) {
    return <div className="ascend-card py-16 text-center text-muted-foreground">Carregando relatório...</div>;
  }

  if (reportQuery.isError || !reportQuery.data) {
    const isNotFinalized = reportQuery.error instanceof ApiError && reportQuery.error.status === 404;
    return (
      <div className="ascend-card py-16 text-center text-destructive">
        {isNotFinalized
          ? "Avaliação ainda não finalizada"
          : (reportQuery.error as Error)?.message ?? "Falha ao carregar resultado."}
      </div>
    );
  }

  const report = reportQuery.data;

  const handleGenerateActionPlans = async () => {
    try {
      const response = await generateFromAssessment.mutateAsync(assessmentId);
      toast.success(`${response.count} planos criados automaticamente!`);
      navigate("/action-plans");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar planos de acao.");
    }
  };

  const handleGenerateRiskMatrix = async () => {
    try {
      const response = await generateRisksFromAssessment.mutateAsync(assessmentId);
      toast.success(`${response.count} riscos identificados e adicionados à matriz!`);
      navigate("/risks");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar matriz de riscos.");
    }
  };

  const handleExportPdf = async () => {
    const companyId = assessmentQuery.data?.companyId;
    if (!companyId) {
      toast.error("Empresa nao encontrada para exportacao.");
      return;
    }
    try {
      await analyticsService.exportCompanyReportPdf(companyId);
      toast.success("Relatorio PDF exportado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar PDF.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => void handleExportPdf()}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatorio PDF
        </Button>
        <Button variant="outline" onClick={() => void handleGenerateRiskMatrix()} disabled={generateRisksFromAssessment.isPending}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Gerar Matriz de Riscos
        </Button>
        <Button onClick={() => void handleGenerateActionPlans()} disabled={generateFromAssessment.isPending}>
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar Planos de Acao
        </Button>
      </div>

      <ReportSummary
        score={report.score}
        maturityLevel={report.maturityLevel}
        description={description}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ascend-card">
          <h2 className="text-lg font-semibold mb-4">Category Scores</h2>
          <RadarChartComponent categories={report.categories} />
        </div>

        <div className="ascend-card space-y-4">
          <h2 className="text-lg font-semibold">Detalhes por categoria</h2>
          {report.categories.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.category}</span>
                <span>{item.score.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <ReportInsights
        strengths={report.strengths ?? []}
        weaknesses={report.weaknesses ?? []}
        recommendations={report.recommendations ?? []}
      />
    </div>
  );
}
