import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessments } from "@/hooks/useAssessments";
import { useCompanies } from "@/hooks/useCompanies";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import {
  Building2,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();

  const isLoading = loadingCompanies || loadingAssessments;
  const company = companies?.[0];
  const activeAssessments =
    assessments?.filter((a) => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED") || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Painel do colaborador — responda às avaliações atribuídas.</p>
      </div>

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

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Avaliações atribuídas a você
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
                      {a.questionnaireTemplate && "name" in a.questionnaireTemplate
                        ? a.questionnaireTemplate.name
                        : "Avaliação"}
                      {" · "}
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

      <div className="ascend-card border-dashed bg-muted/30">
        <p className="text-sm text-muted-foreground">
          O score final e o relatório consolidado são calculados no servidor após todos os colaboradores
          enviarem as respostas. O responsável da empresa (CLIENTE) visualiza o resultado completo.
        </p>
      </div>
    </div>
  );
}
