import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonBlock, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton-card";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBenchmark,
  useCompanyComparison,
  useCompanyEvolution,
  useCompanyRadar,
} from "@/hooks/useAnalytics";
import { useCompanies } from "@/hooks/useCompanies";
import { analyticsService } from "@/services/analytics.service";
import type { CompanyWithRelations } from "@/lib/types";
import { generateAssessmentPdf } from "@/utils/generatePdf";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const categoryKeys = ["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"] as const;
const RECHARTS_COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#0891b2", "#0f766e", "#ca8a04"];
const linePalette: Record<string, string> = {
  totalScore: "#2563eb",
  GOVERNANCA: "#7c3aed",
  SEGURANCA: "#dc2626",
  PROCESSOS: "#0891b2",
  INFRAESTRUTURA: "#0f766e",
  CULTURA: "#ca8a04",
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdminOrCollaborator = user?.role === "ADMIN" || user?.role === "COLLABORATOR";
  const companiesQuery = useCompanies();
  const companies = (companiesQuery.data ?? []) as CompanyWithRelations[];
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(companies[0]?.id ?? null);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [comparisonCompanyIds, setComparisonCompanyIds] = useState<number[]>([]);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? companies[0];
  const availableSegments = Array.from(new Set(companies.map((company) => company.segment).filter(Boolean)));
  const benchmarkSegment = selectedSegment || selectedCompany?.segment || "";

  const evolutionQuery = useCompanyEvolution(selectedCompany?.id ?? 0);
  const radarQuery = useCompanyRadar(selectedCompany?.id ?? 0);
  const comparisonQuery = useCompanyComparison(comparisonCompanyIds);
  const benchmarkQuery = useBenchmark(benchmarkSegment);

  const evolutionData = useMemo(
    () =>
      (evolutionQuery.data ?? []).map((point) => ({
        date: point.date,
        totalScore: point.totalScore,
        maturityLevel: point.maturityLevel,
        ...point.categoryScores,
      })),
    [evolutionQuery.data],
  );

  const currentScore = evolutionQuery.data?.at(-1)?.totalScore ?? 0;
  const benchmarkComparisonData = useMemo(() => {
    const averages = benchmarkQuery.data?.avgCategoryScores ?? {};
    return categoryKeys.map((category) => ({
      category,
      empresa: radarQuery.data?.radar.find((item) => item.category === category)?.companyScore ?? 0,
      segmento: Number(averages[category] ?? 0),
    }));
  }, [benchmarkQuery.data?.avgCategoryScores, radarQuery.data?.radar]);

  const handleExportPdf = async () => {
    if (!selectedCompany?.id) {
      toast.error("Selecione uma empresa para exportar.");
      return;
    }

    try {
      const report = await analyticsService.getCompanyReportExport(selectedCompany.id);
      generateAssessmentPdf(report);
      toast.success("Relatorio PDF exportado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar PDF.");
    }
  };

  const toggleComparisonCompany = (companyId: number) => {
    setComparisonCompanyIds((current) => {
      if (current.includes(companyId)) return current.filter((id) => id !== companyId);
      if (current.length >= 5) return current;
      return [...current, companyId];
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evolucao temporal, benchmark e comparacao entre empresas em um painel analitico unico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <BarChart2 className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <Button onClick={() => void handleExportPdf()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatorio PDF
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Evolucao Temporal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Score total e categorias ao longo dos assessments realizados.
            </p>
          </div>
          <Select
            value={selectedCompany?.id ? String(selectedCompany.id) : undefined}
            onValueChange={(value) => setSelectedCompanyId(Number(value))}
          >
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={String(company.id)}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["totalScore", ...categoryKeys].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setHiddenLines((current) => ({ ...current, [key]: !current[key] }))}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  hiddenLines[key] ? "bg-muted text-muted-foreground" : "bg-background text-foreground"
                }`}
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: linePalette[key] }} />
                {key === "totalScore" ? "Score Total" : key}
              </button>
            ))}
          </div>

          <div className="h-[380px]">
            {evolutionQuery.isLoading ? (
              <SkeletonBlock className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "dd/MM/yy")} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0]?.payload as { maturityLevel?: string; totalScore?: number };
                      return (
                        <div className="rounded-xl border bg-background p-3 shadow-lg">
                          <p className="font-medium">{format(new Date(String(label)), "dd/MM/yyyy")}</p>
                          <div className="mt-1">
                            <Badge variant="outline">{item.maturityLevel}</Badge>
                          </div>
                          {payload.map((entry) => (
                            <div key={String(entry.dataKey)} className="mt-1 flex items-center justify-between gap-3 text-sm">
                              <span>{entry.name}</span>
                              <span className="font-medium">{Number(entry.value ?? 0).toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    onClick={(event) => {
                      if (!event?.dataKey) return;
                      const key = String(event.dataKey);
                      setHiddenLines((current) => ({ ...current, [key]: !current[key] }));
                    }}
                  />
                  <ReferenceLine y={currentScore} stroke="#0f172a" strokeDasharray="6 6" />
                  {!hiddenLines.totalScore ? (
                    <Line type="monotone" dataKey="totalScore" name="Score Total" stroke={linePalette.totalScore} strokeWidth={3} dot={{ r: 3 }} isAnimationActive />
                  ) : null}
                  {categoryKeys.map((key) =>
                    hiddenLines[key] ? null : (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={key}
                        stroke={linePalette[key]}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                      />
                    ),
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Radar Comparativo</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            {radarQuery.isLoading ? (
              <SkeletonBlock className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarQuery.data?.radar ?? []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name={radarQuery.data?.companyName ?? "Empresa"} dataKey="companyScore" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} isAnimationActive />
                  <Radar name="Benchmark" dataKey="benchmarkScore" stroke="#64748b" fill="#64748b" fillOpacity={0.08} strokeDasharray="6 6" isAnimationActive />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Benchmark por Segmento</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Compare a empresa atual com a media do segmento.</p>
            </div>
            <Select value={benchmarkSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="min-w-[220px]">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {availableSegments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryKeys.map((category) => (
                <div key={category} className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{category}</p>
                  <p className="mt-2 text-2xl font-bold">
                    {(benchmarkQuery.data?.categoryAverages?.[category] ?? 0).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>

            <div className="h-[240px]">
              {benchmarkQuery.isLoading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benchmarkComparisonData}>
                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="empresa" fill="#2563eb" radius={[10, 10, 0, 0]} isAnimationActive />
                    <Bar dataKey="segmento" fill="#94a3b8" radius={[10, 10, 0, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdminOrCollaborator ? (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Comparacao Entre Empresas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Escolha ate 5 empresas para comparar categoria por categoria.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {companies.slice(0, 12).map((company) => (
                <label key={company.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Checkbox
                    checked={comparisonCompanyIds.includes(company.id)}
                    onCheckedChange={() => toggleComparisonCompany(company.id)}
                  />
                  <span>{company.name}</span>
                </label>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[360px]">
              {comparisonQuery.isLoading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : comparisonCompanyIds.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  Selecione empresas para comparar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryKeys.map((category) => {
                    const row: Record<string, string | number> = { category };
                    (comparisonQuery.data ?? []).forEach((company) => {
                      row[company.companyName] = company.categoryScores[category] ?? 0;
                    });
                    return row;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    {(comparisonQuery.data ?? []).map((company, index) => (
                      <Bar
                        key={company.companyId}
                        dataKey={company.companyName}
                        fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]}
                        isAnimationActive
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ranking</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empresa</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score Total</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Maturidade</th>
                  </tr>
                </thead>
                <tbody>
                  {(comparisonQuery.data ?? [])
                    .slice()
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((row, index) => (
                      <tr key={row.companyId} className="border-b border-border/50">
                        <td className="px-4 py-3">#{index + 1}</td>
                        <td className="px-4 py-3">{row.companyName}</td>
                        <td className="px-4 py-3">{row.totalScore.toFixed(1)}</td>
                        <td className="px-4 py-3">{row.maturityLevel ?? "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
