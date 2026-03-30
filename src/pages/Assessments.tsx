import { Link } from "react-router-dom";
import { useAssessments, useCompanies } from "@/hooks/use-api";
import { SkeletonTable } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardCheck, Eye, BarChart3 } from "lucide-react";

export default function AssessmentsPage() {
  const { data: assessments, isLoading } = useAssessments();
  const { data: companies } = useCompanies();

  const getCompanyName = (companyId: number) =>
    companies?.find((c) => c.id === companyId)?.name || `Empresa #${companyId}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie as avaliações de maturidade</p>
        </div>
        <Button asChild className="rounded-lg h-10">
          <Link to="/dashboard/assessments/new">
            <Plus className="w-4 h-4 mr-2" /> Nova Avaliação
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : assessments && assessments.length > 0 ? (
        <div className="ascend-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Nível</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">#{a.id}</td>
                    <td className="px-4 py-3 text-foreground">{getCompanyName(a.companyId)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        a.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {a.status === "COMPLETED" ? "Concluída" : "Em progresso"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {a.maturityLevel || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "IN_PROGRESS" ? (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                            <Link to={`/dashboard/assessments/${a.id}`}>
                              <ClipboardCheck className="w-4 h-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                            <Link to={`/dashboard/reports/${a.id}`}>
                              <BarChart3 className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="ascend-card flex flex-col items-center justify-center py-16">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhuma avaliação encontrada</p>
        </div>
      )}
    </div>
  );
}
