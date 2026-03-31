import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import RadarChartComponent from "@/components/RadarChartComponent";
import ReportSummary from "@/components/ReportSummary";
import { assessmentFlowApi } from "@/services/api";
import { ApiError } from "@/lib/api";

const maturityDescription: Record<string, string> = {
  ARTESANAL: "Processos informais e não padronizados",
  EFICIENTE: "Processos básicos definidos",
  EFICAZ: "Processos estruturados com controle",
  ESTRATEGICO: "Alta maturidade e otimização contínua",
};

export default function AssessmentReportPage() {
  const [searchParams] = useSearchParams();
  const assessmentId = Number(searchParams.get("id"));

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ascend-card">
          <h3 className="text-lg font-semibold mb-3">Strengths</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.strengths.map((item) => (
              <li key={item} className="rounded-lg bg-muted/50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="ascend-card">
          <h3 className="text-lg font-semibold mb-3">Weaknesses</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.weaknesses.map((item) => (
              <li key={item} className="rounded-lg bg-muted/50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="ascend-card">
          <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.recommendations.map((item) => (
              <li key={item} className="rounded-lg bg-muted/50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
