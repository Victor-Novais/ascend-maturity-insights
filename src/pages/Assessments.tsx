import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAssessments, useCreateAssessment } from "@/hooks/useAssessments";
import { useQuestionnaireTemplates } from "@/hooks/useQuestionnaires";
import { useCompanies } from "@/hooks/useCompanies";
import { useAuth } from "@/contexts/AuthContext";
import type { AssessmentWithRelations } from "@/lib/types";
import { SkeletonTable } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardCheck, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assessments, isLoading } = useAssessments();
  const { data: companies } = useCompanies();
  const { data: templates, isLoading: loadingTemplates } = useQuestionnaireTemplates();
  const createAssessment = useCreateAssessment();
  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState<number>(0);
  const [templateId, setTemplateId] = useState<number>(0);

  const canCreateAssessment =
    user?.role === "ADMIN" || user?.role === "CLIENTE";

  useEffect(() => {
    if (companies?.length === 1 && companyId === 0) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  useEffect(() => {
    if (templates?.length === 1 && templateId === 0) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const getCompanyName = (cid: number) =>
    companies?.find((c) => c.id === cid)?.name || `Empresa #${cid}`;

  const getTemplateLabel = (assessment: AssessmentWithRelations) => {
    const t = assessment.questionnaireTemplate;
    if (t && "name" in t) return t.name;
    return "—";
  };

  const handleCreateAssessment = async () => {
    if (!companyId) {
      toast.error("Selecione uma empresa");
      return;
    }

    try {
      const payload =
        templateId > 0
          ? { companyId, questionnaireTemplateId: templateId }
          : { companyId };

      const assessment = await createAssessment.mutateAsync(payload);
      toast.success(
        templateId > 0 ? "Avaliação criada e atribuída aos colaboradores" : "Avaliação legada iniciada",
      );
      setShowCreate(false);
      setCompanyId(companies?.length === 1 ? companies[0].id : 0);
      setTemplateId(0);
      navigate(`/dashboard/assessments/${assessment.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar avaliação";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Instâncias por empresa; templates globais e fechamento automático no servidor
          </p>
        </div>
        {canCreateAssessment && (
          <Button className="rounded-lg h-10" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="w-4 h-4 mr-2" /> Nova avaliação
          </Button>
        )}
      </div>

      {showCreate && canCreateAssessment && (
        <div className="ascend-card grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="ascend-input w-full"
            value={companyId || ""}
            onChange={(e) => setCompanyId(Number(e.target.value))}
          >
            <option value="">Selecione a empresa</option>
            {(companies || []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            className="ascend-input w-full"
            value={templateId || ""}
            onChange={(e) => setTemplateId(Number(e.target.value))}
            disabled={loadingTemplates}
          >
            <option value="">Modelo de questionário (opcional — legado sem template)</option>
            {(templates || []).filter((t) => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button
              className="rounded-lg"
              onClick={() => void handleCreateAssessment()}
              disabled={createAssessment.isPending}
            >
              {createAssessment.isPending ? "Criando..." : "Criar avaliação"}
            </Button>
            <p className="text-xs text-muted-foreground w-full">
              Com modelo selecionado, a avaliação é distribuída automaticamente aos colaboradores da empresa.
              É necessário pelo menos um colaborador vinculado.
            </p>
          </div>
        </div>
      )}

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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                    Modelo
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">
                    Colaboradores
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Nível
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">#{a.id}</td>
                    <td className="px-4 py-3 text-foreground">{getCompanyName(a.companyId)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                      {getTemplateLabel(a)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          a.status === "SUBMITTED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell text-xs">
                      {a.assignments?.length ? `${a.assignments.length}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {a.maturityLevel || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {a.status !== "SUBMITTED" ? (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                            <Link to={`/dashboard/assessments/${a.id}`}>
                              <ClipboardCheck className="w-4 h-4" />
                            </Link>
                          </Button>
                        ) : user?.role === "COLLABORATOR" ? (
                          <span className="text-xs text-muted-foreground px-2">{a.status}</span>
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
