import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import FrameworkBadge from "@/components/FrameworkBadge";
import {
  actionPlanCategoryLabels,
  actionPlanStatusLabels,
  actionPlanStatusOptions,
  getCategoryBadgeClass,
  getDueDateBadgeClass,
  getDueDateLabel,
  getStatusBadgeClass,
  getStatusIcon,
  getTimelineIcon,
} from "@/components/action-plans/action-plan-utils";
import type { ActionPlan, ActionPlanStatus } from "@/types/action-plan";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ActionPlan | null;
  onStatusChange: (status: ActionPlanStatus) => Promise<void>;
  isUpdatingStatus: boolean;
  onEdit: () => void;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Nao informado";
  return format(parseISO(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function formatDate(value?: string | null) {
  if (!value) return "Nao informado";
  return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
}

export default function ActionPlanDetail({
  open,
  onOpenChange,
  plan,
  onStatusChange,
  isUpdatingStatus,
  onEdit,
}: Props) {
  if (!plan) return null;

  const StatusIcon = getStatusIcon(plan.status);
  const timeline = [
    plan.createdAt
      ? {
          id: "created",
          label: "Criado",
          value: formatDateTime(plan.createdAt),
          type: "created" as const,
        }
      : null,
    plan.updatedAt
      ? {
          id: "updated",
          label: "Ultima atualizacao",
          value: formatDateTime(plan.updatedAt),
          type: "updated" as const,
        }
      : null,
    plan.completedAt
      ? {
          id: "completed",
          label: "Concluido em",
          value: formatDateTime(plan.completedAt),
          type: "completed" as const,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; value: string; type: "created" | "updated" | "completed" }>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-2">
              <SheetTitle className="text-xl">{plan.title}</SheetTitle>
              <SheetDescription>Plano #{plan.id} com detalhes operacionais e acompanhamento.</SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={getCategoryBadgeClass(String(plan.category))}>
              {actionPlanCategoryLabels[plan.category as keyof typeof actionPlanCategoryLabels] ?? plan.category}
            </Badge>
            <Badge className={getStatusBadgeClass(plan.status)}>
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {actionPlanStatusLabels[plan.status]}
            </Badge>
            <Badge className={getDueDateBadgeClass(plan)}>{getDueDateLabel(plan)}</Badge>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <section className="grid gap-4 rounded-2xl border bg-muted/10 p-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <Select
                onValueChange={(value) => void onStatusChange(value as ActionPlanStatus)}
                value={plan.status}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionPlanStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Prazo</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(plan.dueDate)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa</p>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{plan.company?.name ?? `Empresa #${plan.companyId}`}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsavel</p>
              <div className="flex items-center gap-2 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span>{plan.responsible?.name ?? "Nao atribuido"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assessment</p>
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span>{plan.assessmentId ? `#${plan.assessmentId}` : "Nao vinculado"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Framework</p>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                {plan.frameworkRef ? (
                  <FrameworkBadge frameworkRef={plan.frameworkRef} fallbackToDefault />
                ) : (
                  <span>Nao informado</span>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descricao</h3>
            <div className="rounded-2xl border bg-background p-4 text-sm leading-6 text-foreground">
              {plan.description}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Observacoes</h3>
            <div className="rounded-2xl border bg-background p-4 text-sm leading-6 text-foreground">
              {plan.observations?.trim() ? plan.observations : "Nenhuma observacao registrada."}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historico</h3>
            <div className="space-y-3">
              {timeline.length > 0 ? (
                timeline.map((item) => {
                  const Icon = getTimelineIcon(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-2xl border bg-background p-4">
                      <div className="mt-0.5 rounded-full bg-muted p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                  Nenhum evento de atualizacao disponivel.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-muted/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Campos tecnicos</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>ID do plano: #{plan.id}</p>
              <p>Criado em: {formatDateTime(plan.createdAt)}</p>
              <p>Atualizado em: {formatDateTime(plan.updatedAt)}</p>
              <p>Conclusao: {plan.completedAt ? formatDateTime(plan.completedAt) : "Nao concluido"}</p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
