import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  PlayCircle,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ActionPlanDetail from "@/components/action-plans/ActionPlanDetail";
import ActionPlanForm from "@/components/action-plans/ActionPlanForm";
import {
  actionPlanCategoryLabels,
  actionPlanPriorityLabels,
  actionPlanStatusLabels,
  actionPlanStatusOptions,
  getCategoryBadgeClass,
  getDueDateBadgeClass,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  getStatusIcon,
} from "@/components/action-plans/action-plan-utils";
import FrameworkBadge from "@/components/FrameworkBadge";
import { SkeletonBlock, SkeletonTable } from "@/components/ui/skeleton-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useActionPlan, useActionPlans, useActionPlanStats, useCreateActionPlan, useDeleteActionPlan, useGenerateFromAssessment, useUpdateActionPlan } from "@/hooks/useActionPlans";
import { useAssessments } from "@/hooks/useAssessments";
import { useCompanies } from "@/hooks/useCompanies";
import { useUsers } from "@/hooks/useUser";
import type { AssessmentWithRelations, CompanyWithRelations, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ActionPlanPriority,
  ActionPlanStatus,
  type ActionPlan,
  type CreateActionPlanInput,
  type UpdateActionPlanInput,
} from "@/types/action-plan";

function getResponsibleUsers(users: User[] | undefined) {
  return (users ?? []).filter((user) => {
    const role = String(user.role ?? "").toUpperCase();
    return role.includes("AVALIADOR") || role.includes("COLLABORATOR") || role.includes("COLABORADOR");
  });
}

function formatDueDate(value?: string | null) {
  if (!value) return "Sem prazo";
  return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
}

function ActionPlansStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border bg-card p-5">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-4 h-8 w-16" />
          <SkeletonBlock className="mt-3 h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
      <Target className="h-12 w-12 text-muted-foreground/40" />
      <h3 className="mt-4 text-lg font-semibold">Nenhum plano de acao encontrado</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Crie um plano manualmente ou gere planos automaticamente a partir de um assessment.
      </p>
    </div>
  );
}

export default function ActionPlansPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [statusFilter, setStatusFilter] = useState<ActionPlanStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<ActionPlanPriority | "ALL">("ALL");
  const [companyFilter, setCompanyFilter] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActionPlan | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const filters = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    priority: priorityFilter === "ALL" ? undefined : priorityFilter,
    companyId: isAdmin ? companyFilter ?? undefined : undefined,
  };

  const plansQuery = useActionPlans(filters);
  const statsQuery = useActionPlanStats(isAdmin ? companyFilter ?? undefined : undefined);
  const companiesQuery = useCompanies();
  const usersQuery = useUsers();
  const assessmentsQuery = useAssessments();
  const detailQuery = useActionPlan(selectedPlanId ?? 0);

  const createActionPlan = useCreateActionPlan();
  const updateActionPlan = useUpdateActionPlan();
  const deleteActionPlan = useDeleteActionPlan();
  const generateFromAssessment = useGenerateFromAssessment();

  const plans = plansQuery.data ?? [];
  const companies = (companiesQuery.data ?? []) as CompanyWithRelations[];
  const assessments = (assessmentsQuery.data ?? []) as AssessmentWithRelations[];
  const responsibleUsers = getResponsibleUsers(usersQuery.data);
  const selectedPlan = detailQuery.data ?? plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const chartData = [
    {
      name: actionPlanPriorityLabels[ActionPlanPriority.ALTA],
      value: statsQuery.data?.byPriority[ActionPlanPriority.ALTA] ?? 0,
      color: "#dc2626",
    },
    {
      name: actionPlanPriorityLabels[ActionPlanPriority.MEDIA],
      value: statsQuery.data?.byPriority[ActionPlanPriority.MEDIA] ?? 0,
      color: "#ea580c",
    },
    {
      name: actionPlanPriorityLabels[ActionPlanPriority.BAIXA],
      value: statsQuery.data?.byPriority[ActionPlanPriority.BAIXA] ?? 0,
      color: "#64748b",
    },
  ];

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.name,
  }));

  const assessmentOptions = assessments.map((assessment) => ({
    id: assessment.id,
    companyId: assessment.companyId,
    companyName: assessment.company?.name,
  }));

  const selectedCompanyIdForForm = editingPlan?.companyId ?? companyFilter ?? undefined;
  const selectedAssessment = selectedAssessmentId
    ? assessments.find((assessment) => assessment.id === selectedAssessmentId)
    : undefined;

  async function handleCreateOrUpdate(payload: CreateActionPlanInput | UpdateActionPlanInput) {
    try {
      if (editingPlan) {
        await updateActionPlan.mutateAsync({
          id: editingPlan.id,
          payload,
        });
        toast.success("Plano de acao atualizado com sucesso.");
      } else {
        await createActionPlan.mutateAsync(payload as CreateActionPlanInput);
        toast.success("Plano de acao criado com sucesso.");
      }
      setEditingPlan(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar plano de acao.");
    }
  }

  async function handleStatusChange(status: ActionPlanStatus) {
    if (!selectedPlan) return;
    try {
      await updateActionPlan.mutateAsync({
        id: selectedPlan.id,
        payload: { status },
      });
      toast.success("Status do plano atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteActionPlan.mutateAsync(deleteTarget.id);
      toast.success("Plano de acao removido com sucesso.");
      if (selectedPlanId === deleteTarget.id) {
        setSelectedPlanId(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir plano de acao.");
    }
  }

  async function handleGenerate() {
    if (!selectedAssessmentId) {
      toast.error("Selecione um assessment para gerar os planos.");
      return;
    }

    try {
      const response = await generateFromAssessment.mutateAsync(selectedAssessmentId);
      toast.success(`${response.count} planos de acao gerados automaticamente!`);
      setIsGenerateOpen(false);
      setSelectedAssessmentId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar planos automaticamente.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos de Acao</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as iniciativas corretivas geradas pelas avaliacoes e gerencie a execucao por prioridade.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setIsGenerateOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar do Assessment
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => {
              setEditingPlan(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      {statsQuery.isLoading ? (
        <ActionPlansStatsSkeleton />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Total de planos",
                value: statsQuery.data?.total ?? 0,
                icon: ListChecks,
                tone: "text-slate-700 bg-slate-100",
              },
              {
                title: "Pendentes",
                value: statsQuery.data?.pending ?? 0,
                icon: Clock,
                tone: "text-yellow-700 bg-yellow-100",
              },
              {
                title: "Em andamento",
                value: statsQuery.data?.inProgress ?? 0,
                icon: PlayCircle,
                tone: "text-blue-700 bg-blue-100",
              },
              {
                title: "Concluidos",
                value: statsQuery.data?.completed ?? 0,
                icon: CheckCircle2,
                tone: "text-green-700 bg-green-100",
              },
            ].map((item) => (
              <Card key={item.title} className="rounded-2xl border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-3 text-3xl font-bold">{item.value}</p>
                    </div>
                    <div className={cn("rounded-2xl p-3", item.tone)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribuicao por prioridade</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl border-border/70">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg">Planos cadastrados</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre por status, prioridade e empresa para localizar rapidamente as acoes abertas.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActionPlanStatus | "ALL")}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {actionPlanStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as ActionPlanPriority | "ALL")}
            >
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as prioridades</SelectItem>
                {Object.values(ActionPlanPriority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {actionPlanPriorityLabels[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin ? (
              <Select
                value={companyFilter ? String(companyFilter) : "ALL"}
                onValueChange={(value) => setCompanyFilter(value === "ALL" ? null : Number(value))}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {plansQuery.isLoading ? (
            <SkeletonTable rows={5} />
          ) : plans.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#ID</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const StatusIcon = getStatusIcon(plan.status);
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-semibold">#{plan.id}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left hover:text-primary"
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <span className="line-clamp-1 font-medium">{plan.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {plan.company?.name ?? `Empresa #${plan.companyId}`}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeClass(String(plan.category))}>
                          {actionPlanCategoryLabels[plan.category as keyof typeof actionPlanCategoryLabels] ?? plan.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.frameworkRef ? (
                          <FrameworkBadge frameworkRef={plan.frameworkRef} fallbackToDefault />
                        ) : (
                          <span className="text-sm text-muted-foreground">Nao informado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeClass(plan.priority)}>
                          {actionPlanPriorityLabels[plan.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(plan.status)}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {actionPlanStatusLabels[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.responsible?.name ?? "Nao atribuido"}</TableCell>
                      <TableCell>
                        <Badge className={getDueDateBadgeClass(plan)}>{formatDueDate(plan.dueDate)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedPlanId(plan.id)}>
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPlan(plan);
                              setIsFormOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(plan)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ActionPlanForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPlan(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createActionPlan.isPending || updateActionPlan.isPending}
        plan={editingPlan}
        companies={companyOptions}
        responsibles={responsibleUsers.map((responsible) => ({
          id: responsible.id,
          name: responsible.name ?? responsible.email,
          email: responsible.email,
          role: responsible.role,
        }))}
        assessments={assessmentOptions}
        fixedCompanyId={!editingPlan && !isAdmin ? selectedCompanyIdForForm : undefined}
      />

      <ActionPlanDetail
        open={!!selectedPlanId}
        onOpenChange={(open) => {
          if (!open) setSelectedPlanId(null);
        }}
        plan={selectedPlan}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={updateActionPlan.isPending}
        onEdit={() => {
          if (!selectedPlan) return;
          setEditingPlan(selectedPlan);
          setSelectedPlanId(null);
          setIsFormOpen(true);
        }}
      />

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar do Assessment</DialogTitle>
            <DialogDescription>
              Selecione um assessment para criar automaticamente os planos de acao sugeridos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={selectedAssessmentId ? String(selectedAssessmentId) : undefined}
              onValueChange={(value) => setSelectedAssessmentId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={String(assessment.id)}>
                    {assessment.company?.name
                      ? `#${assessment.id} - ${assessment.company.name}`
                      : `Assessment #${assessment.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAssessment ? (
              <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
                <p className="font-medium">Assessment selecionado</p>
                <p className="mt-1 text-muted-foreground">
                  Empresa: {selectedAssessment.company?.name ?? `Empresa #${selectedAssessment.companyId}`}
                </p>
                <p className="text-muted-foreground">Status: {selectedAssessment.status}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleGenerate()} disabled={generateFromAssessment.isPending}>
              {generateFromAssessment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerar planos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano de acao?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao remove permanentemente o plano
              {deleteTarget ? ` "${deleteTarget.title}"` : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
