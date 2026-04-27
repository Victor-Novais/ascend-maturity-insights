import type { QuestionCategory } from "@/lib/types";

export interface AnalyticsCategoryScore {
  category: QuestionCategory | string;
  score: number;
}

export interface CompanyEvolutionPoint {
  assessmentId: number;
  companyId: number;
  companyName?: string;
  segment?: string;
  date: string;
  totalScore: number;
  maturityLevel: string;
  categoryScores: Record<string, number>;
}

export interface CompanyComparisonItem {
  companyId: number;
  companyName: string;
  segment?: string;
  totalScore: number;
  maturityLevel?: string;
  categoryScores: Record<string, number>;
}

export interface BenchmarkData {
  segment: string;
  averageScore: number;
  categoryAverages: Record<string, number>;
  sampleSize?: number;
}

export interface PlatformAssessmentsByMonth {
  month: string;
  count: number;
}

export interface PlatformMaturityDistribution {
  level: string;
  count: number;
}

export interface PlatformRecentActivity {
  id: string | number;
  actor: string;
  action: string;
  entity: string;
  createdAt: string;
}

export interface PlatformStats {
  totalCompanies: number;
  totalAssessments: number;
  averageScore: number;
  activeUsers: number;
  assessmentsByMonth: PlatformAssessmentsByMonth[];
  maturityDistribution: PlatformMaturityDistribution[];
  recentActivity: PlatformRecentActivity[];
}

export interface CompanyRadarDataPoint {
  category: string;
  companyScore: number;
  benchmarkScore: number;
}

export interface CompanyRadarData {
  companyId: number;
  companyName: string;
  segment?: string;
  radar: CompanyRadarDataPoint[];
}

export interface AnalyticsReportExport {
  companyId: number;
  companyName: string;
  maturityLevel: string;
  totalScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  evaluatorName?: string;
  generatedAt?: string;
}
