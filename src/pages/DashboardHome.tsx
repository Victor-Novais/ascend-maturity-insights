import { useAuth } from "@/contexts/AuthContext";
import { useCompanies, useAssessments } from "@/hooks/use-api";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Building2, ClipboardCheck, TrendingUp, AlertTriangle } from "lucide-react";

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();

  const completedAssessments = assessments?.filter((a) => a.status === "COMPLETED") || [];
  const inProgressAssessments = assessments?.filter((a) => a.status === "IN_PROGRESS") || [];

  const stats = [
    {
      label: "Empresas",
      value: companies?.length ?? 0,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Avaliações Concluídas",
      value: completedAssessments.length,
      icon: ClipboardCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Em Progresso",
      value: inProgressAssessments.length,
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Pendentes",
      value: (companies?.length ?? 0) - (assessments?.length ?? 0),
      icon: AlertTriangle,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ];

  const isLoading = loadingCompanies || loadingAssessments;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo da sua plataforma ASCEND.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => (
              <div key={stat.label} className="ascend-card flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Recent Assessments */}
      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Avaliações Recentes</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
            ))}
          </div>
        ) : assessments && assessments.length > 0 ? (
          <div className="space-y-2">
            {assessments.slice(0, 5).map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Avaliação #{assessment.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Empresa ID: {assessment.companyId}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    assessment.status === "COMPLETED"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {assessment.status === "COMPLETED" ? "Concluída" : "Em progresso"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma avaliação encontrada. Comece avaliando uma empresa!
          </p>
        )}
      </div>
    </div>
  );
}
