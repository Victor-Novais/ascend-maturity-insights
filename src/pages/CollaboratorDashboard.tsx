import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessments } from "@/hooks/useAssessments";
import { useCompanies } from "@/hooks/useCompanies";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import {
  Building2,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const maturityLabels: Record<string, { label: string; color: string }> = {
  ARTESANAL: { label: "Artesanal", color: "text-destructive" },
  EFICIENTE: { label: "Eficiente", color: "text-warning" },
  EFICAZ: { label: "Eficaz", color: "text-primary" },
  ESTRATEGICO: { label: "Estratégico", color: "text-success" },
};

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();

  const isLoading = loadingCompanies || loadingAssessments;
  const company = companies?.[0];
  const activeAssessments = assessments?.filter((a) => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED") || [];
  const completedAssessments = assessments?.filter((a) => a.status === "SUBMITTED" || a.status === "COMPLETED") || [];
  const latestCompleted = completedAssessments[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao painel de colaborador.
        </p>
      </div>

      {/* Company card */}
      {isLoading ? (
        <SkeletonCard />
      ) : company ? (
        <div className="ascend-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-lg">{company.name}</p>
            <p className="text-sm text-muted-foreground">{company.segment}</p>
          </div>
          {company.size && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground hidden sm:block">
              {company.size}
            </span>
          )}
        </div>
      ) : (
        <div className="ascend-card flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground mb-1">Nenhuma empresa vinculada</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Peça ao responsável o código da empresa para se vincular.
          </p>
        </div>
      )}

      {/* Active assessments */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Avaliações pendentes
        </h2>
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : activeAssessments.length > 0 ? (
          <div className="grid gap-3">
            {activeAssessments.map((a) => (
              <div key={a.id} className="ascend-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Avaliação #{a.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.status === "NOT_STARTED" ? "Não iniciada" : "Em progresso"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link to={`/dashboard/assessments/${a.id}`}>
                    Responder <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="ascend-card flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-success/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma avaliação pendente no momento.</p>
          </div>
        )}
      </div>

      {/* Latest result */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-primary" />
          Último resultado
        </h2>
        {isLoading ? (
          <SkeletonCard />
        ) : latestCompleted ? (
          <div className="ascend-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Avaliação #{latestCompleted.id}</p>
                <p className="text-xs text-muted-foreground">
                  Concluída em{" "}
                  {latestCompleted.completedAt
                    ? new Date(latestCompleted.completedAt).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {latestCompleted.totalScore ? Number(latestCompleted.totalScore).toFixed(1) : "—"}
                </p>
                {latestCompleted.maturityLevel && (
                  <p className={`text-sm font-medium ${maturityLabels[latestCompleted.maturityLevel]?.color || "text-muted-foreground"}`}>
                    {maturityLabels[latestCompleted.maturityLevel]?.label || latestCompleted.maturityLevel}
                  </p>
                )}
              </div>
            </div>

            {latestCompleted.categoryScores && (
              <div className="space-y-2">
                {Object.entries(latestCompleted.categoryScores).map(([cat, score]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right">{score}%</span>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" className="rounded-lg w-full" asChild>
              <Link to={`/dashboard/reports/${latestCompleted.id}`}>
                <BarChart3 className="w-4 h-4 mr-2" /> Ver relatório completo
              </Link>
            </Button>
          </div>
        ) : (
          <div className="ascend-card flex flex-col items-center justify-center py-10 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum resultado disponível. Complete uma avaliação para ver seus resultados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
