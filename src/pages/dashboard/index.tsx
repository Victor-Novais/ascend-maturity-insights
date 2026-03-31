import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import DashboardCards from "@/components/DashboardCards";
import RadarChart from "@/components/RadarChart";
import BarChart from "@/components/BarChart";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssessments } from "@/hooks/useAssessments";
import { assessmentFlowApi } from "@/services/api";

type HistoricalPoint = {
  name: string;
  score: number;
};

export default function DashboardAnalyticsPage() {
  const assessmentsQuery = useAssessments();
  const completedAssessments = useMemo(
    () =>
      (assessmentsQuery.data ?? [])
        .filter((assessment) => assessment.status === "COMPLETED" || assessment.status === "SUBMITTED")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [assessmentsQuery.data],
  );

  const latestAssessment = completedAssessments[0];
  const topAssessmentIds = completedAssessments.slice(0, 6).map((item) => item.id);

  const resultQueries = useQueries({
    queries: topAssessmentIds.map((id) => ({
      queryKey: ["assessment-dashboard-result", id],
      queryFn: () => assessmentFlowApi.getResult(id),
      staleTime: 60000,
    })),
  });

  const latestResult = resultQueries[0]?.data ?? null;
  const hasResultError = resultQueries.some((query) => query.isError);
  const isLoadingResults = resultQueries.some((query) => query.isLoading);

  const categoriesData = latestResult?.categories ?? [];
  const historicalData: HistoricalPoint[] = resultQueries
    .map((query, index) => {
      if (!query.data) return null;
      const assessment = completedAssessments[index];
      return {
        name: `#${assessment.id}`,
        score: query.data.score,
      };
    })
    .filter((item): item is HistoricalPoint => item !== null)
    .reverse();

  if (assessmentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (assessmentsQuery.isError) {
    return (
      <Card className="rounded-2xl border-destructive/30">
        <CardContent className="flex items-center gap-3 p-6 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Falha ao carregar avaliações.
        </CardContent>
      </Card>
    );
  }

  if (!completedAssessments.length) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold">Sem avaliações finalizadas</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Assim que uma avaliação for concluída, o dashboard exibirá KPIs e gráficos executivos.
          </p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/dashboard/assessments">Ir para avaliações</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maturity Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão estratégica do desempenho mais recente da empresa.</p>
        </div>
        {latestAssessment && (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={`/assessment/${latestAssessment.id}/report`}>Ver relatório</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to={`/assessment/${latestAssessment.id}/details`}>View Details</Link>
            </Button>
          </div>
        )}
      </div>

      <DashboardCards
        score={latestResult?.score ?? null}
        maturityLevel={latestResult?.maturityLevel ?? null}
        totalAssessments={completedAssessments.length}
      />

      {hasResultError && (
        <Card className="rounded-2xl border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Algumas análises não puderam ser carregadas no momento. Exibindo dados disponíveis.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Radar de Maturidade</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingResults ? (
              <div className="h-80 animate-pulse rounded-xl bg-muted" />
            ) : categoriesData.length ? (
              <RadarChart data={categoriesData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma categoria disponível para o radar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Comparativo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingResults ? (
              <div className="h-80 animate-pulse rounded-xl bg-muted" />
            ) : categoriesData.length ? (
              <BarChart data={categoriesData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem dados para gráfico de barras.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Evolução Histórica (últimas avaliações)</CardTitle>
        </CardHeader>
        <CardContent>
          {historicalData.length ? (
            <BarChart data={historicalData.map((point) => ({ category: point.name, score: point.score }))} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Dados históricos insuficientes para visualização.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
