import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { isBefore, isToday, parseISO, startOfDay } from "date-fns";
import {
  ActionPlanCategory,
  ActionPlanPriority,
  ActionPlanStatus,
  type ActionPlan,
} from "@/types/action-plan";

export const actionPlanCategoryLabels: Record<ActionPlanCategory, string> = {
  [ActionPlanCategory.GOVERNANCA]: "Governanca",
  [ActionPlanCategory.SEGURANCA]: "Seguranca",
  [ActionPlanCategory.PROCESSOS]: "Processos",
  [ActionPlanCategory.INFRAESTRUTURA]: "Infraestrutura",
  [ActionPlanCategory.CULTURA]: "Cultura",
};

export const actionPlanPriorityLabels: Record<ActionPlanPriority, string> = {
  [ActionPlanPriority.ALTA]: "Alta",
  [ActionPlanPriority.MEDIA]: "Média",
  [ActionPlanPriority.BAIXA]: "Baixa",
};

export const actionPlanStatusLabels: Record<ActionPlanStatus, string> = {
  [ActionPlanStatus.PENDENTE]: "Pendente",
  [ActionPlanStatus.EM_ANDAMENTO]: "Em andamento",
  [ActionPlanStatus.CONCLUIDO]: "Concluído",
  [ActionPlanStatus.CANCELADO]: "Cancelado",
};

export const actionPlanPriorityOptions = Object.values(ActionPlanPriority).map((value) => ({
  value,
  label: actionPlanPriorityLabels[value],
}));

export const actionPlanStatusOptions = Object.values(ActionPlanStatus).map((value) => ({
  value,
  label: actionPlanStatusLabels[value],
}));

export const actionPlanCategoryOptions = Object.values(ActionPlanCategory).map((value) => ({
  value,
  label: actionPlanCategoryLabels[value],
}));

export function getCategoryBadgeClass(category: string) {
  if (category === ActionPlanCategory.GOVERNANCA) return "border-violet-200 bg-violet-50 text-violet-700";
  if (category === ActionPlanCategory.SEGURANCA) return "border-red-200 bg-red-50 text-red-700";
  if (category === ActionPlanCategory.PROCESSOS) return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (category === ActionPlanCategory.INFRAESTRUTURA) return "border-sky-200 bg-sky-50 text-sky-700";
  if (category === ActionPlanCategory.CULTURA) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function getPriorityBadgeClass(priority: ActionPlanPriority) {
  if (priority === ActionPlanPriority.ALTA) return "border-red-200 bg-red-50 text-red-700";
  if (priority === ActionPlanPriority.MEDIA) return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function getStatusBadgeClass(status: ActionPlanStatus) {
  if (status === ActionPlanStatus.PENDENTE) return "border-yellow-200 bg-yellow-50 text-yellow-700";
  if (status === ActionPlanStatus.EM_ANDAMENTO) return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === ActionPlanStatus.CONCLUIDO) return "border-green-200 bg-green-50 text-green-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export function getStatusIcon(status: ActionPlanStatus): LucideIcon {
  if (status === ActionPlanStatus.PENDENTE) return Clock3;
  if (status === ActionPlanStatus.EM_ANDAMENTO) return PlayCircle;
  if (status === ActionPlanStatus.CONCLUIDO) return CheckCircle2;
  return CircleDashed;
}

export function getDueDateBadgeClass(plan: Pick<ActionPlan, "dueDate" | "status">) {
  if (!plan.dueDate) return "border-slate-200 bg-slate-100 text-slate-700";
  if (plan.status === ActionPlanStatus.CONCLUIDO) return "border-green-200 bg-green-50 text-green-700";

  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(plan.dueDate));
  const sevenDaysAhead = new Date(today);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

  if (isBefore(dueDate, today) && !isToday(dueDate)) return "border-red-200 bg-red-50 text-red-700";
  if (isBefore(dueDate, sevenDaysAhead) || isToday(dueDate)) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }
  return "border-green-200 bg-green-50 text-green-700";
}

export function getDueDateLabel(plan: Pick<ActionPlan, "dueDate" | "status">) {
  if (!plan.dueDate) return "Sem prazo";
  if (plan.status === ActionPlanStatus.CONCLUIDO) return "Concluido no prazo";

  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(plan.dueDate));
  const sevenDaysAhead = new Date(today);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

  if (isBefore(dueDate, today) && !isToday(dueDate)) return "Prazo vencido";
  if (isBefore(dueDate, sevenDaysAhead) || isToday(dueDate)) return "Prazo proximo";
  return "Dentro do prazo";
}

export function getTimelineIcon(type: "created" | "updated" | "completed") {
  if (type === "created") return AlertCircle;
  if (type === "updated") return PlayCircle;
  return CheckCircle2;
}
