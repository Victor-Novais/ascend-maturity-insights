export type AuditEntity =
  | "User"
  | "Company"
  | "Question"
  | "Assessment"
  | "ActionPlan"
  | "Auth"
  | string;

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "ACCESS_DENIED"
  | "READ"
  | string;

export interface AuditLog {
  id: number;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | number | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  success: boolean;
  errorMsg: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  success?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditStatsItem {
  name: string;
  count: number;
}

export interface AuditLogStats {
  totalActions: number;
  failedActions: number;
  uniqueUsers: number;
  topEntities: AuditStatsItem[];
  topActions: AuditStatsItem[];
}
