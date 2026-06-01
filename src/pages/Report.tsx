import { useParams, Link, useNavigate } from "react-router-dom";
import { useAssessment, useAssessmentResult } from "@/hooks/useAssessments";
import { useGenerateFromAssessment } from "@/hooks/useActionPlans";
import { useGenerateRisksFromAssessment } from "@/hooks/useRisks";
import { analyticsService } from "@/services/analytics.service";
import { useAuth } from "@/contexts/AuthContext";
import FrameworkBadge from "@/components/FrameworkBadge";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import MaturityChart from "@/components/MaturityChart";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Award, Download, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { ApiError } from "@/lib/api";
import { normalizeStrengthsWeaknesses } from "@/lib/report-utils";
import { toast } from "sonner";
import { generateAssessmentPdf } from "@/utils/generatePdf";
import { useDownloadReportPdf } from "@/hooks/useExports";

const maturityConfig: Record<string, { label: string; color: string; bg: string }> = {
  Inicial: { label: "Inicial", color: "text-destructive", bg: "bg-destructive/10" },
  Básico: { label: "Básico", color: "text-warning", bg: "bg-warning/10" },
  Intermediário: { label: "Intermediário", color: "text-primary", bg: "bg-primary/10" },
  Avançado: { label: "Avançado", color: "text-success", bg: "bg-success/10" },
  Otimizado: { label: "Otimizado", color: "text-success", bg: "bg-success/10" },
};

const categoryLabels: Record<string, string> = {
  GOVERNANCA: "Governança",
  SEGURANCA: "Segurança",
  PROCESSOS: "Processos",
  INFRAESTRUTURA: "Infraestrutura",
  CULTURA: "Cultura",
};

export default function ReportPage() {
  const { id } = useParams();
  const assessmentId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assessment, isLoading: isLoadingAssessment } = useAssessment(assessmentId);
  const { data: result, isLoading, error } = useAssessmentResult(assessmentId);
  const generateFromAssessment = useGenerateFromAssessment();
  const generateRisksFromAssessment = useGenerateRisksFromAssessment();
  const downloadReportPdf = useDownloadReportPdf();

  if (user?.role === "COLLABORATOR") {
    return (
      <div className="ascend-card max-w-lg mx-auto text-center py-16 space-y-3">
        <p className="text-muted-foreground">
          O relatório consolidado da empresa fica disponível para o responsável (CLIENTE) após o fechamento
          automático da avaliação.
        </p>
        <Link to="/dashboard/assessments" className="text-primary text-sm font-medium hover:underline inline-block">
          Voltar às avaliações
        </Link>
      </div>
    );
  }

  if (isLoading || isLoadingAssessment) return <SkeletonCard />;
  if (error instanceof ApiError && error.status === 403) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Você não tem acesso a este relatório.</div>;
  }
  if (error instanceof ApiError && error.status === 404) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Avaliação não encontrada.</div>;
  }
  if (!result) {
    return (
      <div className="ascend-card text-center py-16">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Link to="/dashboard/assessments" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
          Voltar para Avaliações
        </Link>
      </div>
    );
  }

  const maturity = maturityConfig[result.maturityLevel] ?? {
    label: result.maturityLevel,
    color: "text-primary",
    bg: "bg-primary/10",
  };
  const companyName = assessment?.company?.name ?? "Unknown Company";
  const categoryRows = Object.entries(result.categoryScores).map(([category, score]) => ({
    key: category,
    label: categoryLabels[category] ?? category,
    score,
  }));
  const insights = categoryRows
    .filter(({ score }) => score < 50 || score > 70)
    .map(({ label, score }) =>
      score < 50 ? `Needs improvement in ${label}` : `Strong performance in ${label}`,
    );
  const weaknesses = normalizeStrengthsWeaknesses(assessment?.report?.weaknesses);

  const handleGenerateActionPlans = async () => {
    try {
      const response = await generateFromAssessment.mutateAsync(assessmentId);
      toast.success(`${response.count} planos criados automaticamente!`);
      navigate("/action-plans");
    } catch (generateError) {
      toast.error(generateError instanceof Error ? generateError.message : "Falha ao gerar planos de acao.");
    }
  };

  const handleGenerateRiskMatrix = async () => {
    try {
      const response = await generateRisksFromAssessment.mutateAsync(assessmentId);
      toast.success(`${response.count} riscos identificados e adicionados à matriz!`);
      navigate("/risks");
    } catch (generateError) {
      toast.error(generateError instanceof Error ? generateError.message : "Falha ao gerar matriz de riscos.");
    }
  };

  const handleExportPdf = async () => {
    try {
      const toastId = toast.loading("📋 Gerando PDF... isso pode levar alguns segundos");
      
      try {
        // Tentar usar o endpoint do servidor primeiro
        await downloadReportPdf.mutateAsync(assessmentId);
        toast.dismiss(toastId);
        toast.success("PDF do relatório baixado com sucesso!");
      } catch (apiError) {
        // Fallback: gerar PDF localmente se o servidor falhar
        toast.dismiss(toastId);
        toast.info("Usando geração local de PDF como fallback...");
        
        if (!assessment?.companyId) {
          throw new Error("Empresa não encontrada para exportação.");
        }

        const reportExport = await analyticsService.getCompanyReportExport(assessment.companyId);
        generateAssessmentPdf(reportExport);
        toast.success("Relatório PDF exportado com sucesso (geração local).");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar PDF.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/assessments"
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Assessment Report</h1>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => void handleExportPdf()}
            disabled={downloadReportPdf.isPending}
          >
            {downloadReportPdf.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
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
      </div>

      <div className="ascend-card flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-5xl font-bold text-foreground leading-none">{result.score.toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground mt-2">Main score</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${maturity.bg} flex items-center justify-center`}>
            <TrendingUp className={`w-7 h-7 ${maturity.color}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${maturity.color}`}>{maturity.label}</p>
            <p className="text-sm text-muted-foreground">Nível de maturidade</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ascend-card">
          <h2 className="text-lg font-semibold mb-4">Category Analysis</h2>
          <MaturityChart categoryScores={result.categoryScores} />
        </div>
        <div className="ascend-card">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="space-y-3">
            {categoryRows.map(({ key, label, score }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-sm font-medium w-32 flex-shrink-0">{label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full ascend-gradient transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-foreground w-12 text-right">{score.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Insights</h2>
        {insights.length > 0 ? (
          <div className="space-y-2">
            {insights.map((insight) => (
              <div key={insight} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                {insight}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Balanced performance across all categories.
          </div>
        )}
      </div>

      {weaknesses.length > 0 ? (
        <div className="ascend-card">
          <h2 className="text-lg font-semibold mb-4">Gaps identificados</h2>
          <div className="space-y-3">
            {weaknesses.map((item) => (
              <div key={`${item.title}-${item.frameworkRef ?? item.frameworkType ?? "gap"}`} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.questionText ?? item.title}</span>
                  <FrameworkBadge
                    frameworkType={item.frameworkType}
                    frameworkRef={item.frameworkRef}
                    frameworkNote={item.frameworkNote}
                  />
                </div>
                {item.summary ? <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
