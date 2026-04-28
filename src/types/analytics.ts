import type { QuestionCategory } from "@/lib/types";

export type AnalyticsCategoryScores = Record<QuestionCategory | string, number>;

export interface CompanyEvolutionPoint {
  assessmentId: number;
  completedAt: string;
  totalScore: number;
  maturityLevel: string;
  categoryScores: AnalyticsCategoryScores;
}

export interface CompanyComparisonItem {
  companyId: number;
  companyName: string;
  segment?: string;
  totalScore: number;
  maturityLevel?: string;
  categoryScores: AnalyticsCategoryScores;
}

export interface BenchmarkMaturityDistribution {
  level: string;
  count: number;
}

export interface BenchmarkData {
  segment: string;
  avgTotalScore: number;
  avgCategoryScores: AnalyticsCategoryScores;
  totalCompanies: number;
  maturityDistribution: BenchmarkMaturityDistribution[];
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

export interface PlatformTopSegment {
  segment: string;
  count: number;
  avgScore: number;
}

export interface PlatformStats {
  totalCompanies: number;
  totalAssessments: number;
  completedAssessments: number;
  totalUsers: number;
  avgTotalScore: number;
  assessmentsByMonth: PlatformAssessmentsByMonth[];
  maturityDistribution: PlatformMaturityDistribution[];
  recentActivity: PlatformRecentActivity[];
  topSegments: PlatformTopSegment[];
}

export interface CompanyRadarDataPoint {
  category: string;
  companyScore: number;
  benchmarkScore: number;
}

export interface CompanyRadarData {
  companyName: string;
  segment?: string;
  categories: string[];
  categoryScores: AnalyticsCategoryScores;
  segmentAvgScores: AnalyticsCategoryScores;
  radar: CompanyRadarDataPoint[];
}

export interface ReportExportData {
  companyId: number;
  companyName: string;
  segment?: string;
  responsible?: string;
  responsibleEmail?: string;
  reportDate: string;
  totalScore: number;
  maturityLevel: string;
  categoryScores: AnalyticsCategoryScores;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
