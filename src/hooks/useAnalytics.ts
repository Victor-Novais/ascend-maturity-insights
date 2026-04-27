import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export function useCompanyEvolution(companyId: number) {
  return useQuery({
    queryKey: ["analytics", "company-evolution", companyId],
    queryFn: () => analyticsService.getCompanyEvolution(companyId),
    enabled: Number.isFinite(companyId) && companyId > 0,
  });
}

export function useCompanyComparison(companyIds: number[]) {
  return useQuery({
    queryKey: ["analytics", "comparison", companyIds],
    queryFn: () => analyticsService.getComparison(companyIds),
    enabled: companyIds.length > 0,
  });
}

export function useBenchmark(segment: string) {
  return useQuery({
    queryKey: ["analytics", "benchmark", segment],
    queryFn: () => analyticsService.getBenchmark(segment),
    enabled: !!segment,
  });
}

export function usePlatformStats(enabled: boolean) {
  return useQuery({
    queryKey: ["analytics", "platform-stats"],
    queryFn: () => analyticsService.getPlatformStats(),
    enabled,
  });
}

export function useCompanyRadar(companyId: number) {
  return useQuery({
    queryKey: ["analytics", "company-radar", companyId],
    queryFn: () => analyticsService.getCompanyRadar(companyId),
    enabled: Number.isFinite(companyId) && companyId > 0,
  });
}
