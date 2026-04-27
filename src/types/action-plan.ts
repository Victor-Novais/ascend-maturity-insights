import type { Company, QuestionCategory, User } from "@/lib/types";

export enum ActionPlanPriority {
  ALTA = "ALTA",
  MEDIA = "MEDIA",
  BAIXA = "BAIXA",
}

export enum ActionPlanStatus {
  PENDENTE = "PENDENTE",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  CONCLUIDO = "CONCLUIDO",
  CANCELADO = "CANCELADO",
}

export enum ActionPlanCategory {
  GOVERNANCA = "GOVERNANCA",
  SEGURANCA = "SEGURANCA",
  PROCESSOS = "PROCESSOS",
  INFRAESTRUTURA = "INFRAESTRUTURA",
  CULTURA = "CULTURA",
}

export interface ActionPlan {
  id: number;
  assessmentId: number | null;
  companyId: number;
  title: string;
  description: string;
  category: ActionPlanCategory | QuestionCategory | string;
  frameworkRef: string | null;
  priority: ActionPlanPriority;
  status: ActionPlanStatus;
  responsibleId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  observations: string | null;
  createdAt?: string;
  updatedAt?: string;
  responsible?: Pick<User, "id" | "name" | "email" | "role"> | null;
  company?: Pick<Company, "id" | "name" | "segment"> | null;
  assessment?: {
    id: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface ActionPlanStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  canceled: number;
  byPriority: Record<ActionPlanPriority, number>;
}

export interface ActionPlanFilters {
  companyId?: number;
  assessmentId?: number;
  responsibleId?: string;
  status?: ActionPlanStatus;
  priority?: ActionPlanPriority;
}

export interface CreateActionPlanInput {
  assessmentId?: number | null;
  companyId: number;
  title: string;
  description: string;
  category: ActionPlanCategory;
  frameworkRef?: string | null;
  priority: ActionPlanPriority;
  status?: ActionPlanStatus;
  responsibleId?: string | null;
  dueDate?: string | null;
  observations?: string | null;
}

export interface UpdateActionPlanInput {
  assessmentId?: number | null;
  companyId?: number;
  title?: string;
  description?: string;
  category?: ActionPlanCategory;
  frameworkRef?: string | null;
  priority?: ActionPlanPriority;
  status?: ActionPlanStatus;
  responsibleId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  observations?: string | null;
}

export interface GenerateActionPlansResponse {
  count: number;
  items: ActionPlan[];
}
