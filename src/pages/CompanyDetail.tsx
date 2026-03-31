import { useParams, Link } from "react-router-dom";
import { useCompany } from "@/hooks/useCompanies";
import { useAssessments } from "@/hooks/useAssessments";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Pencil, ClipboardCheck, MapPin, Phone, Mail, Hash } from "lucide-react";
import { ApiError } from "@/lib/api";

const sizeLabels: Record<string, string> = {
  MICRO: "Micro",
  PEQUENA: "Pequena",
  MEDIA: "Média",
  GRANDE: "Grande",
};

export default function CompanyDetail() {
  const { user } = useAuth();
  const canEdit =
    user?.role === "ADMIN" || user?.role === "AVALIADOR" || user?.role === "CLIENTE";
  const { id } = useParams();
  const { data: company, isLoading, error } = useCompany(Number(id));
  const { data: assessments } = useAssessments();

  const companyAssessments = assessments?.filter((a) => a.companyId === Number(id)) || [];

  if (isLoading) return <SkeletonCard />;
  if (error instanceof ApiError && error.status === 403) {
    return <p className="text-muted-foreground text-center py-12">Você não tem acesso a esta empresa.</p>;
  }
  if (!company) return <p className="text-muted-foreground text-center py-12">Empresa não encontrada.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/companies"
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">{company.segment} • {company.size ? sizeLabels[company.size] : "—"}</p>
        </div>
        {canEdit && (
          <Button asChild variant="outline" className="rounded-lg">
            <Link to={`/dashboard/companies/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Informações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {company.companyCode && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">Código da empresa (convite)</p>
                <p className="font-mono font-semibold tracking-wide">{company.companyCode}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">CNPJ</p>
              <p className="font-medium">{company.cnpj || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Responsável</p>
              <p className="font-medium">{company.responsible || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">E-mail</p>
              <p className="font-medium">{company.responsibleEmail || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Telefone</p>
              <p className="font-medium">{company.responsiblePhone || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">Endereço</p>
              <p className="font-medium">{company.address || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="ascend-card">
        <h2 className="text-lg font-semibold mb-4">Histórico de Avaliações</h2>
        {companyAssessments.length > 0 ? (
          <div className="space-y-2">
            {companyAssessments.map((a) => (
              <Link
                key={a.id}
                to={`/dashboard/assessments/${a.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Avaliação #{a.id}</span>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    a.status === "SUBMITTED"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {a.status === "SUBMITTED" ? "Concluída" : "Em progresso"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma avaliação registrada para esta empresa.
          </p>
        )}
      </div>
    </div>
  );
}
