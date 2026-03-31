import { BarChart3, ClipboardCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardCardsProps = {
  score: number | null;
  maturityLevel: string | null;
  totalAssessments: number;
};

function getScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score < 50) return "text-red-600";
  if (score < 75) return "text-amber-500";
  return "text-emerald-600";
}

function getMaturityBadgeClass(level: string | null) {
  if (!level) return "bg-muted text-muted-foreground";
  if (level === "ARTESANAL") return "bg-red-100 text-red-700";
  if (level === "EFICIENTE") return "bg-amber-100 text-amber-700";
  if (level === "EFICAZ") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function DashboardCards({
  score,
  maturityLevel,
  totalAssessments,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Score geral
            <TrendingUp className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score !== null ? score.toFixed(1) : "--"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Média da avaliação mais recente</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Nível de maturidade
            <BarChart3 className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={`rounded-full px-3 py-1 text-sm ${getMaturityBadgeClass(maturityLevel)}`}>
            {maturityLevel ?? "Indisponível"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Total de avaliações
            <ClipboardCheck className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{totalAssessments}</p>
          <p className="mt-1 text-xs text-muted-foreground">Histórico consolidado</p>
        </CardContent>
      </Card>
    </div>
  );
}
