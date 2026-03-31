import { useState } from "react";
import { useCompanies, useDeleteCompany } from "@/hooks/useCompanies";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonTable } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, Trash2, Pencil, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import type { CompanySize } from "@/lib/types";

const sizeLabels: Record<CompanySize, string> = {
  MICRO: "Micro",
  PEQUENA: "Pequena",
  MEDIA: "Média",
  GRANDE: "Grande",
};

export default function CompaniesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: companies, isLoading } = useCompanies();
  const deleteMutation = useDeleteCompany();

  const isCollaborator = user?.role === "COLLABORATOR";
  const canManageCompanies =
    user?.role === "ADMIN" || user?.role === "CLIENTE";

  const filtered = companies?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.includes(search) ||
      c.segment?.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyCode?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const copyCompanyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar o código");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Empresa excluída com sucesso");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir empresa";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isCollaborator
              ? "Empresas às quais você tem acesso"
              : "Gerencie as empresas cadastradas na plataforma"}
          </p>
        </div>
        {canManageCompanies && (
          <Button asChild className="rounded-lg h-10">
            <Link to="/dashboard/companies/new">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ, código ou segmento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ascend-input w-full pl-10"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : filtered && filtered.length > 0 ? (
        <div className="ascend-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    <span title="Compartilhe com colaboradores no cadastro">Código</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Segmento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Porte</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Responsável</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {company.companyCode ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-sm font-semibold tracking-wide truncate">
                            {company.companyCode}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg"
                            title="Copiar código"
                            onClick={() => copyCompanyCode(company.companyCode!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{company.segment}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {company.size ? sizeLabels[company.size] : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{company.responsible}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                          <Link to={`/dashboard/companies/${company.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        {canManageCompanies && (
                          <>
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                              <Link to={`/dashboard/companies/${company.id}/edit`}>
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => handleDelete(company.id, company.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
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
          <Building2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhuma empresa encontrada</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search ? "Tente ajustar sua busca" : "Cadastre a primeira empresa"}
          </p>
        </div>
      )}
    </div>
  );
}
