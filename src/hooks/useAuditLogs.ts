import { useQuery } from "@tanstack/react-query";
import { api, getAuthToken } from "@/lib/api";
import type { AuditLogFilters, AuditLogListResponse, AuditLogStats } from "@/types/audit-log";

function buildQueryString(filters: AuditLogFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

export function useAuditLogs(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => api.get<AuditLogListResponse>("/audit-logs", filters),
    staleTime: 30000,
    refetchInterval: 60000,
    enabled,
  });
}

export function useAuditStats(enabled = true) {
  return useQuery({
    queryKey: ["audit-logs", "stats"],
    queryFn: () => api.get<AuditLogStats>("/audit-logs/stats"),
    enabled,
  });
}

export function useAuditFailureCount24h(enabled = true) {
  const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: ["audit-logs", "failures-24h", dateFrom],
    queryFn: () =>
      api.get<AuditLogListResponse>("/audit-logs", {
        success: false,
        dateFrom,
        page: 1,
        limit: 1,
    }),
    staleTime: 300000,
    refetchInterval: 300000,
    enabled,
  });
}

export async function exportAuditLogs(filters: AuditLogFilters) {
  const token = getAuthToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ascend-back-end-ohtq.onrender.com";
  const queryString = buildQueryString(filters);
  const url = `${baseUrl}/audit-logs/export${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("Falha ao exportar logs de auditoria.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `audit-logs-${filters.dateFrom ?? "inicio"}-${filters.dateTo ?? "fim"}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
