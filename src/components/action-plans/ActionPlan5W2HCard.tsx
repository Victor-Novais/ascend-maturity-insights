import { Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  actionPlanPriorityLabels,
  actionPlanStatusLabels,
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "@/components/action-plans/action-plan-utils";
import type { ActionPlan } from "@/types/action-plan";

const priorityToneClasses: Record<string, string> = {
  ALTA: "bg-red-500/10 text-red-700 border-red-200",
  MEDIA: "bg-orange-500/10 text-orange-700 border-orange-200",
  BAIXA: "bg-slate-500/10 text-slate-700 border-slate-200",
};

const valueFallback = "Não informado";

interface Props {
  plan: ActionPlan;
  onEdit: (plan: ActionPlan) => void;
  onDelete: (planId: number) => void;
}

export default function ActionPlan5W2HCard({ plan, onEdit, onDelete }: Props) {
  const costValue = plan.howMuchCost !== undefined ? `${plan.howMuchCost}` : valueFallback;
  const currency = plan.howMuchCurrency ?? "";
  const amountText = currency ? `${costValue} ${currency}` : costValue;

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-sm">
      <CardHeader className={cn("border-b px-4 py-4", priorityToneClasses[plan.priority])}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{plan.title}</CardTitle>
            <p className="text-sm text-muted-foreground">#{plan.id} • {plan.company?.name ?? "Empresa não informada"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border px-2.5 py-1 text-[10px] font-semibold", getPriorityBadgeClass(plan.priority))}>
              {actionPlanPriorityLabels[plan.priority]}
            </Badge>
            <Badge className={cn("border px-2.5 py-1 text-[10px] font-semibold", getStatusBadgeClass(plan.status))}>
              {actionPlanStatusLabels[plan.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-4">
        <div className="grid gap-2 md:grid-cols-2">
          {[
            { label: "O QUÊ", value: plan.whatObjective ?? valueFallback },
            { label: "POR QUÊ", value: plan.whyJustification ?? valueFallback },
            { label: "QUEM", value: plan.responsible?.name ?? "Não atribuído" },
            { label: "ONDE", value: plan.whereLocation ?? valueFallback },
            { label: "QUANDO", value: plan.dueDate ? format(parseISO(plan.dueDate), "dd/MM/yyyy", { locale: ptBR }) : valueFallback },
            { label: "COMO", value: plan.howMethod ?? valueFallback },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-slate-50/70 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="text-sm text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">QUANTO CUSTA</p>
              <p className="mt-1 text-sm font-semibold text-amber-950">{amountText}</p>
            </div>
            <div className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
              {plan.howMuchCurrency ?? "Sem moeda"}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">{plan.category} • {plan.frameworkRef || "Sem framework"}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(plan)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(plan.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
