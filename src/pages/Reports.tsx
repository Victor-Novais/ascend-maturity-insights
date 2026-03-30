import { Link } from "react-router-dom";
import { useAssessments, useCompanies } from "@/hooks/use-api";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { FileBarChart, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const { data: assessments, isLoading } = useAssessments();
  const { data: companies } = useCompanies();

  const completed = assessments?.filter((a) => a.status === "COMPLETED") || [];
  const getCompanyName = (id: number) => companies?.find((c) => c.id === id)?.name || `Empresa #${id}`;

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Visualize os resultados das avaliações concluídas</p>
      </div>

      {completed.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((a) => (
            <div key={a.id} className="ascend-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileBarChart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Avaliação #{a.id}</p>
                    <p className="text-xs text-muted-foreground">{getCompanyName(a.companyId)}</p>
                  </div>
                </div>
                {a.maturityLevel && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                    {a.maturityLevel}
                  </span>
                )}
              </div>
              <Button asChild variant="outline" className="mt-4 rounded-lg w-full">
                <Link to={`/dashboard/reports/${a.id}`}>
                  <BarChart3 className="w-4 h-4 mr-2" /> Ver Relatório
                </Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="ascend-card flex flex-col items-center justify-center py-16">
          <FileBarChart className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum relatório disponível</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Complete uma avaliação para gerar relatórios</p>
        </div>
      )}
    </div>
  );
}
