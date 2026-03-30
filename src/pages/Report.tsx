import { useParams, Link } from "react-router-dom";
import { useAssessment } from "@/hooks/useAssessments";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { ArrowLeft, Award, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { MaturityLevel } from "@/lib/types";
import { ApiError } from "@/lib/api";

const maturityConfig: Record<MaturityLevel, { label: string; color: string; bg: string }> = {
  ARTESANAL: { label: "Artesanal", color: "text-destructive", bg: "bg-destructive/10" },
  EFICIENTE: { label: "Eficiente", color: "text-warning", bg: "bg-warning/10" },
  EFICAZ: { label: "Eficaz", color: "text-primary", bg: "bg-primary/10" },
  ESTRATEGICO: { label: "Estratégico", color: "text-success", bg: "bg-success/10" },
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
  const { data: assessment, isLoading, error } = useAssessment(Number(id));

  if (isLoading) return <SkeletonCard />;
  if (error instanceof ApiError && error.status === 403) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Você não tem acesso a esta empresa.</div>;
  }
  if (error instanceof ApiError && error.status === 404) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Assessment não encontrado.</div>;
  }
  if (!assessment) {
    return (
      <div className="ascend-card text-center py-16">
        <p className="text-muted-foreground">Relatório não encontrado. A avaliação pode ainda não estar concluída.</p>
        <Link to="/dashboard/assessments" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
          Voltar para Avaliações
        </Link>
      </div>
    );
  }

  if (!assessment.maturityLevel || assessment.totalScore === null || assessment.totalScore === undefined) {
    return (
      <div className="ascend-card text-center py-16">
        <p className="text-muted-foreground">O resultado ainda está sendo calculado automaticamente.</p>
      </div>
    );
  }

  const maturity = maturityConfig[assessment.maturityLevel];

  const categoryScores = Object.entries(assessment.categoryScores || {}).map(
    ([category, score]) => ({
      category,
      score,
    }),
  );

  const chartData = categoryScores.map((cs) => ({
    category: categoryLabels[cs.category] || cs.category,
    score: cs.score,
    fullMark: 100,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/assessments"
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Relatório da Avaliação #{id}</h1>
          <p className="text-sm text-muted-foreground">Resultados completos da avaliação de maturidade</p>
        </div>
      </div>

      {/* Score and Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ascend-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{Number(assessment.totalScore).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Score Total</p>
          </div>
        </div>
        <div className="ascend-card flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${maturity.bg} flex items-center justify-center`}>
            <TrendingUp className={`w-7 h-7 ${maturity.color}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${maturity.color}`}>{maturity.label}</p>
            <p className="text-sm text-muted-foreground">Nível de Maturidade</p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Maturidade por Categoria</h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Detalhamento por Categoria</h2>
        <div className="space-y-3">
          {categoryScores.map((cs) => (
            <div key={cs.category} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 flex-shrink-0">
                {categoryLabels[cs.category]}
              </span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full ascend-gradient transition-all duration-500"
                  style={{ width: `${cs.score}%` }}
                />
              </div>
              <span className="text-sm font-bold text-foreground w-12 text-right">
                {cs.score.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths, Weaknesses, Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(assessment.strengths || []).length > 0 && (
          <div className="ascend-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h3 className="font-semibold">Pontos Fortes</h3>
            </div>
            <ul className="space-y-2">
              {(assessment.strengths || []).map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(assessment.weaknesses || []).length > 0 && (
          <div className="ascend-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold">Pontos de Atenção</h3>
            </div>
            <ul className="space-y-2">
              {(assessment.weaknesses || []).map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(assessment.recommendations || []).length > 0 && (
        <div className="ascend-card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Recomendações</h3>
          </div>
          <ul className="space-y-2">
            {(assessment.recommendations || []).map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
