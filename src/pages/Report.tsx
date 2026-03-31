import { useParams, Link } from "react-router-dom";
import { useAssessment } from "@/hooks/useAssessments";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  getCategoryScores,
  getMaturityLevel,
  getTotalScoreNumber,
  normalizeRecommendations,
  normalizeStrengthsWeaknesses,
} from "@/lib/report-utils";

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
  const { user } = useAuth();
  const { data: assessment, isLoading, error } = useAssessment(Number(id));

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

  if (isLoading) return <SkeletonCard />;
  if (error instanceof ApiError && error.status === 403) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Você não tem acesso a este relatório.</div>;
  }
  if (error instanceof ApiError && error.status === 404) {
    return <div className="ascend-card text-center py-16 text-muted-foreground">Avaliação não encontrada.</div>;
  }
  if (!assessment) {
    return (
      <div className="ascend-card text-center py-16">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Link to="/dashboard/assessments" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
          Voltar para Avaliações
        </Link>
      </div>
    );
  }

  const totalScore = getTotalScoreNumber(assessment);
  const maturityLevel = getMaturityLevel(assessment);
  const categoryScores = getCategoryScores(assessment);

  if (totalScore === null || !maturityLevel || !categoryScores) {
    return (
      <div className="ascend-card text-center py-16">
        <p className="text-muted-foreground">
          O resultado consolidado ainda não está disponível. Aguarde o fechamento da avaliação no servidor.
        </p>
      </div>
    );
  }

  const maturity = maturityConfig[maturityLevel];

  const chartRows = Object.entries(categoryScores).map(([category, score]) => ({
    category: categoryLabels[category] || category,
    score,
    fullMark: 100,
  }));

  const strengths = normalizeStrengthsWeaknesses(assessment.report?.strengths);
  const weaknesses = normalizeStrengthsWeaknesses(assessment.report?.weaknesses);
  const recommendations = normalizeRecommendations(assessment.report?.recommendations);

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
          <p className="text-sm text-muted-foreground">Resultados gerados pelo motor de maturidade (servidor)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ascend-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{totalScore.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Score total</p>
          </div>
        </div>
        <div className="ascend-card flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${maturity.bg} flex items-center justify-center`}>
            <TrendingUp className={`w-7 h-7 ${maturity.color}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${maturity.color}`}>{maturity.label}</p>
            <p className="text-sm text-muted-foreground">Nível de maturidade</p>
          </div>
        </div>
      </div>

      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Maturidade por categoria</h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartRows}>
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

      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Detalhamento por categoria</h2>
        <div className="space-y-3">
          {Object.entries(categoryScores).map(([cat, score]) => (
            <div key={cat} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 flex-shrink-0">{categoryLabels[cat]}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="ascend-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h3 className="font-semibold">Pontos fortes</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">{s.title}</span>
                    {s.summary ? <span className="block mt-0.5">{s.summary}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses.length > 0 && (
          <div className="ascend-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold">Pontos de atenção</h3>
            </div>
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-foreground">{w.title}</span>
                    {w.summary ? <span className="block mt-0.5">{w.summary}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="ascend-card">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Recomendações</h3>
          </div>
          <ul className="space-y-2">
            {recommendations.map((r, i) => (
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
