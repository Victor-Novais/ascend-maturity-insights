export interface AuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: { before?: any; after?: any };
  success: boolean;
  errorMsg?: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditStats {
  totalActions: number;
  failedActions: number;
  uniqueUsers: number;
  topEntities: { entity: string; count: number }[];
  topActions: { action: string; count: number }[];
}

export interface AuditLogFilters {
  userId?: string;
  entity?: string;
  action?: string;
  success?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}
