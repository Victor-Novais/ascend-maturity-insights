import { api } from "@/lib/api";
import type {
  BenchmarkData,
  CompanyComparisonItem,
  CompanyEvolutionPoint,
  CompanyRadarData,
  CompanyRadarDataPoint,
  PlatformStats,
  ReportExportData,
} from "@/types/analytics";
import { generateAssessmentPdf } from "@/utils/generatePdf";

type EvolutionResponse =
  | CompanyEvolutionPoint[]
  | {
      items?: CompanyEvolutionPoint[];
      data?: CompanyEvolutionPoint[];
    };

type ComparisonResponse =
  | CompanyComparisonItem[]
  | {
      items?: CompanyComparisonItem[];
      data?: CompanyComparisonItem[];
      companies?: CompanyComparisonItem[];
    };

type BenchmarkResponse =
  | BenchmarkData
  | {
      segment: string;
      avgTotalScore?: number;
      averageScore?: number;
      mediaGeral?: number;
      avgCategoryScores?: Record<string, number>;
      categoryAverages?: Record<string, number>;
      mediasPorCategoria?: Record<string, number>;
      totalCompanies?: number;
      sampleSize?: number;
      maturityDistribution?: Array<{ level: string; count: number }>;
    };

type PlatformStatsResponse =
  | PlatformStats
  | {
      totalCompanies?: number;
      totalAssessments?: number;
      completedAssessments?: number;
      totalUsers?: number;
      activeUsers?: number;
      usuariosAtivos?: number;
      avgTotalScore?: number;
      averageScore?: number;
      scoreMedio?: number;
      assessmentsByMonth?: Array<{ month: string; count: number }>;
      avaliacoesPorMes?: Array<{ month: string; count: number }>;
      maturityDistribution?: Array<{ level: string; count: number }>;
      distribuicaoMaturidade?: Array<{ level: string; count: number }>;
      recentActivity?: Array<{ id: string | number; actor: string; action: string; entity: string; createdAt: string }>;
      atividadeRecente?: Array<{ id: string | number; actor: string; action: string; entity: string; createdAt: string }>;
      topSegments?: Array<{ segment: string; count: number; avgScore: number }>;
    };

type RadarResponse =
  | CompanyRadarData
  | CompanyRadarDataPoint[]
  | {
      companyName?: string;
      segment?: string;
      categories?: string[];
      categoryScores?: Record<string, number>;
      segmentAvgScores?: Record<string, number>;
      radar?: CompanyRadarDataPoint[];
      data?: CompanyRadarDataPoint[];
      company?: Record<string, number>;
      benchmark?: Record<string, number>;
    };

function normalizeEvolution(response: EvolutionResponse): CompanyEvolutionPoint[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.data ?? [];
}

function normalizeComparison(response: ComparisonResponse): CompanyComparisonItem[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.data ?? response.companies ?? [];
}

function normalizeBenchmark(response: BenchmarkResponse): BenchmarkData {
  return {
    segment: response.segment,
    avgTotalScore: Number(response.avgTotalScore ?? response.averageScore ?? response.mediaGeral ?? 0),
    avgCategoryScores: response.avgCategoryScores ?? response.categoryAverages ?? response.mediasPorCategoria ?? {},
    totalCompanies: Number(response.totalCompanies ?? response.sampleSize ?? 0),
    maturityDistribution: response.maturityDistribution ?? [],
  };
}

function normalizePlatformStats(response: PlatformStatsResponse): PlatformStats {
  return {
    totalCompanies: Number(response.totalCompanies ?? 0),
    totalAssessments: Number(response.totalAssessments ?? 0),
    completedAssessments: Number(response.completedAssessments ?? 0),
    totalUsers: Number(response.totalUsers ?? response.activeUsers ?? response.usuariosAtivos ?? 0),
    avgTotalScore: Number(response.avgTotalScore ?? response.averageScore ?? response.scoreMedio ?? 0),
    assessmentsByMonth: response.assessmentsByMonth ?? response.avaliacoesPorMes ?? [],
    maturityDistribution: response.maturityDistribution ?? response.distribuicaoMaturidade ?? [],
    recentActivity: response.recentActivity ?? response.atividadeRecente ?? [],
    topSegments: response.topSegments ?? [],
  };
}

function normalizeRadar(companyId: number, response: RadarResponse): CompanyRadarData {
  if (Array.isArray(response)) {
    return {
      companyName: `Empresa #${companyId}`,
      categories: response.map((item) => item.category),
      categoryScores: Object.fromEntries(response.map((item) => [item.category, item.companyScore])),
      segmentAvgScores: Object.fromEntries(response.map((item) => [item.category, item.benchmarkScore])),
      radar: response,
    };
  }

  if (response.radar || response.data) {
    const radar = response.radar ?? response.data ?? [];
    return {
      companyName: response.companyName ?? `Empresa #${companyId}`,
      segment: response.segment,
      categories: response.categories ?? radar.map((item) => item.category),
      categoryScores: response.categoryScores ?? Object.fromEntries(radar.map((item) => [item.category, item.companyScore])),
      segmentAvgScores: response.segmentAvgScores ?? Object.fromEntries(radar.map((item) => [item.category, item.benchmarkScore])),
      radar,
    };
  }

  const company = response.company ?? {};
  const benchmark = response.benchmark ?? {};
  const keys = Array.from(new Set([...Object.keys(company), ...Object.keys(benchmark)]));
  return {
    companyName: response.companyName ?? `Empresa #${companyId}`,
    segment: response.segment,
    categories: keys,
    categoryScores: Object.fromEntries(keys.map((key) => [key, Number(company[key] ?? 0)])),
    segmentAvgScores: Object.fromEntries(keys.map((key) => [key, Number(benchmark[key] ?? 0)])),
    radar: keys.map((key) => ({
      category: key,
      companyScore: Number(company[key] ?? 0),
      benchmarkScore: Number(benchmark[key] ?? 0),
    })),
  };
}

export const analyticsService = {
  getCompanyEvolution(companyId: number) {
    return api.get<EvolutionResponse>(`/analytics/company/${companyId}/evolution`).then(normalizeEvolution);
  },
  getComparison(companyIds: number[]) {
    return api.get<ComparisonResponse>("/analytics/comparison", { ids: companyIds.join(",") }).then(normalizeComparison);
  },
  getBenchmark(segment: string) {
    return api.get<BenchmarkResponse>(`/analytics/benchmark/${encodeURIComponent(segment)}`).then(normalizeBenchmark);
  },
  getPlatformStats() {
    return api.get<PlatformStatsResponse>("/analytics/platform-stats").then(normalizePlatformStats);
  },
  getCompanyRadar(companyId: number) {
    return api.get<RadarResponse>(`/analytics/company/${companyId}/radar`).then((response) => normalizeRadar(companyId, response));
  },
  getCompanyReportExport(companyId: number) {
    return api.get<ReportExportData>(`/analytics/company/${companyId}/report-export`);
  },
  async exportCompanyReportPdf(companyId: number) {
    const report = await analyticsService.getCompanyReportExport(companyId);
    generateAssessmentPdf(report);
  },
};
