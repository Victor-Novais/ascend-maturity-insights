import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonBlock, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-card";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformStats, useBenchmark, useCompanyEvolution, useCompanyRadar } from "@/hooks/useAnalytics";
import { useCompanies } from "@/hooks/useCompanies";
import { useAssessments } from "@/hooks/useAssessments";
import { analyticsService } from "@/services/analytics.service";
import type { CompanyWithRelations } from "@/lib/types";

const maturityColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

function DashboardStatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCollaborator = user?.role === "COLLABORATOR";
  const companiesQuery = useCompanies();
  const assessmentsQuery = useAssessments();
  const platformStatsQuery = usePlatformStats(isAdmin);

  const companies = (companiesQuery.data ?? []) as CompanyWithRelations[];
  const primaryCompany = companies[0];
  const primaryRadarQuery = useCompanyRadar(primaryCompany?.id ?? 0);
  const benchmarkQuery = useBenchmark(primaryCompany?.segment ?? "");
  const primaryEvolutionQuery = useCompanyEvolution(primaryCompany?.id ?? 0);

  const companyEvolutionQueries = useQueries({
    queries: companies.slice(0, 6).map((company) => ({
      queryKey: ["dashboard", "company-evolution-card", company.id],
      queryFn: () => analyticsService.getCompanyEvolution(company.id),
      enabled: isCollaborator,
      staleTime: 60000,
    })),
  });

  const clientCurrentScore = primaryEvolutionQuery.data?.at(-1)?.totalScore ?? 0;
  const clientCategoryRows = primaryRadarQuery.data?.radar ?? [];

  const collaboratorCards = companies.slice(0, 6).map((company, index) => {
    const points = companyEvolutionQueries[index]?.data ?? [];
    const latest = points.at(-1);
    const previous = points.at(-2);
    const delta = latest && previous ? latest.totalScore - previous.totalScore : 0;
    return {
      company,
      latest,
      previous,
      delta,
    };
  });

  const segmentComparisonData = useMemo(() => {
    const benchmark = benchmarkQuery.data?.categoryAverages ?? {};
    return Object.entries(benchmark).map(([category, average]) => ({
      category,
      empresa:
        primaryRadarQuery.data?.radar.find((item) => item.category === category)?.companyScore ?? 0,
      segmento: Number(average ?? 0),
    }));
  }, [benchmarkQuery.data?.categoryAverages, primaryRadarQuery.data?.radar]);

  if (isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao consolidada da plataforma ASCEND com atividade e maturidade geral.
          </p>
        </div>

        {platformStatsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard title="Total Empresas" value={platformStatsQuery.data?.totalCompanies ?? 0} icon={Building2} />
            <DashboardStatCard title="Total Assessments" value={platformStatsQuery.data?.totalAssessments ?? 0} icon={ClipboardCheck} />
            <DashboardStatCard title="Score Medio Geral" value={`${(platformStatsQuery.data?.averageScore ?? 0).toFixed(1)}`} icon={TrendingUp} />
            <DashboardStatCard title="Usuarios Ativos" value={platformStatsQuery.data?.activeUsers ?? 0} icon={Users} />
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Assessments por mes</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {platformStatsQuery.isLoading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformStatsQuery.data?.assessmentsByMonth ?? []}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[10, 10, 0, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Distribuicao de maturidade</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {platformStatsQuery.isLoading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformStatsQuery.data?.maturityDistribution ?? []}
                      dataKey="count"
                      nameKey="level"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      isAnimationActive
                    >
                      {(platformStatsQuery.data?.maturityDistribution ?? []).map((entry, index) => (
                        <Cell key={entry.level} fill={maturityColors[index % maturityColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividade recente</CardTitle>
            <Button asChild variant="outline">
              <Link to="/audit-logs">Ver auditoria</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {platformStatsQuery.isLoading ? (
              <SkeletonTable rows={5} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quando</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ator</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acao</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(platformStatsQuery.data?.recentActivity ?? []).slice(0, 10).map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="px-4 py-3">{row.createdAt}</td>
                        <td className="px-4 py-3">{row.actor}</td>
                        <td className="px-4 py-3">{row.action}</td>
                        <td className="px-4 py-3">{row.entity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCollaborator) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Minhas empresas e a evolucao mais recente das avaliacoes acompanhadas.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {companiesQuery.isLoading
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
            : collaboratorCards.map(({ company, latest, previous, delta }) => (
                <Card key={company.id} className="rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.segment}</p>
                      </div>
                      {delta >= 0 ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          {delta.toFixed(1)}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          {Math.abs(delta).toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Ultimo score</p>
                      <p className="mt-2 text-4xl font-bold">{latest ? latest.totalScore.toFixed(1) : "--"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{latest?.maturityLevel ?? "Sem maturityLevel"}</p>
                      {previous ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Assessment anterior: {previous.totalScore.toFixed(1)}
                        </p>
                      ) : null}
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link to="/analytics">Abrir Analytics</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o score atual da sua empresa e compare com o benchmark do segmento.
        </p>
      </div>

      {companiesQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : primaryCompany ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Score atual</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: "Score", value: clientCurrentScore, fill: "#2563eb" }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={16} isAnimationActive />
                    <Tooltip />
                    <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-4xl font-bold">
                      {clientCurrentScore.toFixed(1)}
                    </text>
                    <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                      Score Geral
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Scores por categoria</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={clientCategoryRows}>
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis dataKey="category" type="category" width={110} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="companyScore" fill="#2563eb" radius={[0, 10, 10, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Comparativo com a media do segmento</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={segmentComparisonData}>
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="category" type="category" width={110} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="empresa" fill="#2563eb" radius={[0, 10, 10, 0]} isAnimationActive />
                  <Bar dataKey="segmento" fill="#94a3b8" radius={[0, 10, 10, 0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center text-muted-foreground">
            Nenhuma empresa disponivel para exibir o painel.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
