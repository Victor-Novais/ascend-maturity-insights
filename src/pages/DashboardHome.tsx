import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useCompanies";
import { useAssessments } from "@/hooks/useAssessments";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Building2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCategoryScores,
  getTotalScoreNumber,
  normalizeRecommendations,
} from "@/lib/report-utils";

export default function DashboardHome() {
  const { user } = useAuth();
  const isOwner = user?.role === "CLIENTE";
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();

  const completedAssessments = assessments?.filter((a) => a.status === "SUBMITTED") || [];
  const latestByCompany = (companies || [])
    .map((company) => {
      const companyAssessments = (assessments || [])
        .filter((assessment) => assessment.companyId === company.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { company, latest: companyAssessments[0] };
    })
    .filter((item) => item.latest);

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

      {isOwner && companies && companies.length === 0 && !loadingCompanies && (
        <div className="ascend-card border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Cadastre sua empresa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Como proprietário (CLIENTE), crie a empresa no painel para gerar o código de convite e iniciar avaliações.
            </p>
          </div>
          <Button asChild className="rounded-lg shrink-0">
            <Link to="/dashboard/companies/new">Cadastrar empresa</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <h2 className="text-lg font-semibold mb-4">Último diagnóstico por empresa</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
            ))}
          </div>
        ) : latestByCompany.length > 0 ? (
          <div className="space-y-2">
            {latestByCompany.slice(0, 5).map(({ company, latest }) => (
              <div
                key={latest!.id}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">Assessment #{latest!.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {getTotalScoreNumber(latest!) !== null
                        ? getTotalScoreNumber(latest!)!.toFixed(1)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latest!.maturityLevel || "Nível indisponível"}
                    </p>
                  </div>
                </div>
                {getCategoryScores(latest!) && (
                  <div className="space-y-1">
                    {Object.entries(getCategoryScores(latest!)!).map(([category, score]) => (
                      <div key={category} className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground w-24">{category}</span>
                        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {normalizeRecommendations(latest!.report?.recommendations).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Recomendação: {normalizeRecommendations(latest!.report?.recommendations)[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : companies && companies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Você ainda não possui empresas cadastradas.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum diagnóstico automático encontrado. Inicie uma avaliação para começar.
          </p>
        )}
      </div>
    </div>
  );
}
