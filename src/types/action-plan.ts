export type ActionPlanStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
export type ActionPlanPriority = "ALTA" | "MEDIA" | "BAIXA";
export type ActionPlanCategory =
  | "GOVERNANCA"
  | "SEGURANCA"
  | "PROCESSOS"
  | "INFRAESTRUTURA"
  | "CULTURA";

export const ActionPlanStatus = {
  PENDENTE: "PENDENTE",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO",
} as const satisfies Record<ActionPlanStatus, ActionPlanStatus>;

export const ActionPlanPriority = {
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAIXA: "BAIXA",
} as const satisfies Record<ActionPlanPriority, ActionPlanPriority>;

export const ActionPlanCategory = {
  GOVERNANCA: "GOVERNANCA",
  SEGURANCA: "SEGURANCA",
  PROCESSOS: "PROCESSOS",
  INFRAESTRUTURA: "INFRAESTRUTURA",
  CULTURA: "CULTURA",
} as const satisfies Record<ActionPlanCategory, ActionPlanCategory>;

export interface ActionPlan {
  id: number;
  assessmentId: number;
  companyId: number;
  title: string;
  description: string;
  category: string;
  frameworkRef?: string;
  priority: ActionPlanPriority;
  status: ActionPlanStatus;
  responsibleId?: string;
  responsible?: { id: string; name: string; email: string };
  dueDate?: string;
  completedAt?: string;
  observations?: string;
  whatObjective?: string;
  whyJustification?: string;
  whereLocation?: string;
  howMethod?: string;
  howMuchCost?: number;
  howMuchCurrency?: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: number; name: string; segment?: string };
  assessment?: { id: number; status?: string; createdAt?: string; updatedAt?: string };
}

export interface ActionPlan5W2HDto extends ActionPlan {}

export interface ActionPlanStats {
  total: number;
  porStatus: Record<ActionPlanStatus, number>;
  porPrioridade: Record<ActionPlanPriority, number>;
  vencendo_em_7_dias: number;
}

export interface ActionPlanFilters {
  companyId?: number;
  assessmentId?: number;
  status?: ActionPlanStatus;
  priority?: ActionPlanPriority;
}

export interface CreateActionPlanInput {
  assessmentId?: number;
  companyId: number;
  title: string;
  description: string;
  category: ActionPlanCategory;
  frameworkRef?: string;
  priority: ActionPlanPriority;
  status?: ActionPlanStatus;
  responsibleId?: string;
  dueDate?: string;
  observations?: string;
  whatObjective?: string;
  whyJustification?: string;
  whereLocation?: string;
  howMethod?: string;
  howMuchCost?: number;
  howMuchCurrency?: string;
}

export interface UpdateActionPlanInput {
  assessmentId?: number;
  companyId?: number;
  title?: string;
  description?: string;
  category?: ActionPlanCategory;
  frameworkRef?: string;
  priority?: ActionPlanPriority;
  status?: ActionPlanStatus;
  responsibleId?: string;
  dueDate?: string;
  completedAt?: string;
  observations?: string;
  whatObjective?: string;
  whyJustification?: string;
  whereLocation?: string;
  howMethod?: string;
  howMuchCost?: number;
  howMuchCurrency?: string;
}

export interface GenerateActionPlansResponse {
  count: number;
  items: ActionPlan[];
}
