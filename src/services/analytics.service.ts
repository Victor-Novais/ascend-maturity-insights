import jsPDF from "jspdf";
import { format } from "date-fns";
import { api } from "@/lib/api";
import type {
  AnalyticsReportExport,
  BenchmarkData,
  CompanyComparisonItem,
  CompanyEvolutionPoint,
  CompanyRadarData,
  CompanyRadarDataPoint,
  PlatformStats,
} from "@/types/analytics";

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
      averageScore?: number;
      mediaGeral?: number;
      categoryAverages?: Record<string, number>;
      mediasPorCategoria?: Record<string, number>;
      sampleSize?: number;
      totalCompanies?: number;
    };

type PlatformStatsResponse =
  | PlatformStats
  | {
      totalCompanies?: number;
      totalAssessments?: number;
      averageScore?: number;
      scoreMedio?: number;
      activeUsers?: number;
      usuariosAtivos?: number;
      assessmentsByMonth?: Array<{ month: string; count: number }>;
      avaliacoesPorMes?: Array<{ month: string; count: number }>;
      maturityDistribution?: Array<{ level: string; count: number }>;
      distribuicaoMaturidade?: Array<{ level: string; count: number }>;
      recentActivity?: Array<{ id: string | number; actor: string; action: string; entity: string; createdAt: string }>;
      atividadeRecente?: Array<{ id: string | number; actor: string; action: string; entity: string; createdAt: string }>;
    };

type RadarResponse =
  | CompanyRadarData
  | CompanyRadarDataPoint[]
  | {
      companyId?: number;
      companyName?: string;
      segment?: string;
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
    averageScore: Number(response.averageScore ?? response.mediaGeral ?? 0),
    categoryAverages: response.categoryAverages ?? response.mediasPorCategoria ?? {},
    sampleSize: Number(response.sampleSize ?? response.totalCompanies ?? 0),
  };
}

function normalizePlatformStats(response: PlatformStatsResponse): PlatformStats {
  return {
    totalCompanies: Number(response.totalCompanies ?? 0),
    totalAssessments: Number(response.totalAssessments ?? 0),
    averageScore: Number(response.averageScore ?? response.scoreMedio ?? 0),
    activeUsers: Number(response.activeUsers ?? response.usuariosAtivos ?? 0),
    assessmentsByMonth: response.assessmentsByMonth ?? response.avaliacoesPorMes ?? [],
    maturityDistribution: response.maturityDistribution ?? response.distribuicaoMaturidade ?? [],
    recentActivity: response.recentActivity ?? response.atividadeRecente ?? [],
  };
}

function normalizeRadar(companyId: number, response: RadarResponse): CompanyRadarData {
  if (Array.isArray(response)) {
    return {
      companyId,
      companyName: `Empresa #${companyId}`,
      radar: response,
    };
  }

  if (response.radar || response.data) {
    return {
      companyId: response.companyId ?? companyId,
      companyName: response.companyName ?? `Empresa #${companyId}`,
      segment: response.segment,
      radar: response.radar ?? response.data ?? [],
    };
  }

  const company = response.company ?? {};
  const benchmark = response.benchmark ?? {};
  const keys = Array.from(new Set([...Object.keys(company), ...Object.keys(benchmark)]));
  return {
    companyId,
    companyName: response.companyName ?? `Empresa #${companyId}`,
    segment: response.segment,
    radar: keys.map((key) => ({
      category: key,
      companyScore: Number(company[key] ?? 0),
      benchmarkScore: Number(benchmark[key] ?? 0),
    })),
  };
}

function getLevelColor(level: string) {
  if (level === "CRITICO" || level === "ARTESANAL" || level === "Inicial") return [220, 38, 38] as const;
  if (level === "ALTO" || level === "EFICIENTE" || level === "Basico") return [234, 88, 12] as const;
  if (level === "MEDIO" || level === "EFICAZ" || level === "Intermediario") return [234, 179, 8] as const;
  return [34, 197, 94] as const;
}

export const analyticsService = {
  getCompanyEvolution(companyId: number) {
    return api
      .get<EvolutionResponse>(`/analytics/company/${companyId}/evolution`)
      .then(normalizeEvolution);
  },
  getComparison(companyIds: number[]) {
    return api
      .get<ComparisonResponse>("/analytics/comparison", { ids: companyIds.join(",") })
      .then(normalizeComparison);
  },
  getBenchmark(segment: string) {
    return api
      .get<BenchmarkResponse>(`/analytics/benchmark/${encodeURIComponent(segment)}`)
      .then(normalizeBenchmark);
  },
  getPlatformStats() {
    return api
      .get<PlatformStatsResponse>("/analytics/platform-stats")
      .then(normalizePlatformStats);
  },
  getCompanyRadar(companyId: number) {
    return api
      .get<RadarResponse>(`/analytics/company/${companyId}/radar`)
      .then((response) => normalizeRadar(companyId, response));
  },
  getCompanyReportExport(companyId: number) {
    return api.get<AnalyticsReportExport>(`/analytics/company/${companyId}/report-export`);
  },
  async exportCompanyReportPdf(companyId: number) {
    const report = await analyticsService.getCompanyReportExport(companyId);
    const pdf = new jsPDF();
    const accent = getLevelColor(report.maturityLevel);
    const generationDate = format(new Date(), "dd/MM/yyyy");

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, 210, 40, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("ASCEND", 14, 18);
    pdf.setFontSize(14);
    pdf.text("Relatorio Analitico", 14, 28);

    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(18);
    pdf.text(report.companyName, 14, 56);
    pdf.setFontSize(11);
    pdf.text(`Data: ${generationDate}`, 14, 64);
    pdf.text(`Nivel de maturidade: ${report.maturityLevel}`, 14, 71);

    pdf.setFillColor(...accent);
    pdf.roundedRect(140, 50, 56, 24, 6, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text("Score Geral", 168, 59, { align: "center" });
    pdf.setFontSize(20);
    pdf.text(`${report.totalScore.toFixed(1)}`, 168, 69, { align: "center" });

    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(14);
    pdf.text("Scores por categoria", 14, 90);

    let currentY = 98;
    Object.entries(report.categoryScores).forEach(([category, score]) => {
      pdf.setFontSize(11);
      pdf.text(category, 14, currentY);
      pdf.text(Number(score).toFixed(1), 110, currentY, { align: "right" });
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, currentY + 2, 110, currentY + 2);
      currentY += 10;
    });

    const sections: Array<{ title: string; items: string[] }> = [
      { title: "Strengths", items: report.strengths ?? [] },
      { title: "Weaknesses", items: report.weaknesses ?? [] },
      { title: "Recommendations", items: report.recommendations ?? [] },
    ];

    currentY += 6;
    sections.forEach((section) => {
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.setFontSize(14);
      pdf.text(section.title, 14, currentY);
      currentY += 8;
      pdf.setFontSize(10);
      const lines = section.items.length > 0 ? section.items : ["Nenhum item registrado."];
      lines.forEach((item) => {
        const wrapped = pdf.splitTextToSize(`- ${item}`, 180);
        pdf.text(wrapped, 16, currentY);
        currentY += wrapped.length * 5 + 2;
      });
      currentY += 4;
    });

    const footerY = 285;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Gerado em ${generationDate}${report.evaluatorName ? ` • Avaliador: ${report.evaluatorName}` : ""}`,
      14,
      footerY,
    );

    const fileSafeCompany = report.companyName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    pdf.save(`ASCEND_Relatorio_${fileSafeCompany}_${generationDate.replace(/\//g, "-")}.pdf`);
  },
};
