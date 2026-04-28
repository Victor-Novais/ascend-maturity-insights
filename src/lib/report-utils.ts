import { getFrameworkType } from "@/lib/frameworks";
import type { AssessmentWithRelations, FrameworkType, MaturityLevel, QuestionCategory } from "@/lib/types";

/** Backend persists strengths/weaknesses as structured JSON (not plain strings). */
export interface ReportStrengthWeaknessItem {
  category: QuestionCategory;
  score: number;
  title: string;
  summary: string;
  frameworkType?: FrameworkType;
  frameworkRef?: string;
  frameworkNote?: string;
  questionText?: string;
}

export interface ReportRecommendationItem {
  id: string;
  priority: string;
  category: QuestionCategory | "GLOBAL";
  title: string;
  action: string;
  rationale: string;
}

export interface PersistedReport {
  id: number;
  assessmentId: number;
  totalScore: string;
  maturityLevel: MaturityLevel;
  categoryScores: Record<QuestionCategory, number>;
  strengths: ReportStrengthWeaknessItem[] | unknown;
  weaknesses: ReportStrengthWeaknessItem[] | unknown;
  recommendations: ReportRecommendationItem[] | unknown;
  generatedAt: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeFrameworkType(value: unknown): FrameworkType | undefined {
  if (value === "COBIT" || value === "ITIL" || value === "ISO_27000" || value === "PROPRIO") {
    return getFrameworkType(value);
  }
  return undefined;
}

export function getCategoryScores(
  assessment: AssessmentWithRelations,
): Record<QuestionCategory, number> | undefined {
  const r = assessment.report as PersistedReport | null | undefined;
  if (r?.categoryScores && isRecord(r.categoryScores)) {
    return r.categoryScores as Record<QuestionCategory, number>;
  }
  return undefined;
}

export function getTotalScoreNumber(assessment: AssessmentWithRelations): number | null {
  const raw = assessment.totalScore ?? (assessment.report as PersistedReport | undefined)?.totalScore;
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function getMaturityLevel(assessment: AssessmentWithRelations): MaturityLevel | null {
  return (
    assessment.maturityLevel ??
    (assessment.report as PersistedReport | undefined)?.maturityLevel ??
    null
  );
}

export function normalizeStrengthsWeaknesses(
  raw: unknown,
): Array<{
  title: string;
  summary: string;
  frameworkType?: FrameworkType;
  frameworkRef?: string;
  frameworkNote?: string;
  questionText?: string;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { title: item, summary: "" };
    if (isRecord(item)) {
      const question = isRecord(item.question) ? item.question : undefined;
      const framework = isRecord(item.framework) ? item.framework : undefined;
      const title =
        typeof item.title === "string"
          ? item.title
          : typeof item.questionText === "string"
            ? item.questionText
            : typeof question?.text === "string"
              ? question.text
              : String(item);

      return {
        title,
        summary: typeof item.summary === "string" ? item.summary : "",
        frameworkType: normalizeFrameworkType(
          item.frameworkType ??
            framework?.type ??
            question?.frameworkType,
        ),
        frameworkRef:
          typeof item.frameworkRef === "string"
            ? item.frameworkRef
            : typeof framework?.ref === "string"
              ? framework.ref
              : typeof question?.frameworkRef === "string"
                ? question.frameworkRef
                : undefined,
        frameworkNote:
          typeof item.frameworkNote === "string"
            ? item.frameworkNote
            : typeof framework?.note === "string"
              ? framework.note
              : typeof question?.frameworkNote === "string"
                ? question.frameworkNote
                : undefined,
        questionText:
          typeof item.questionText === "string"
            ? item.questionText
            : typeof question?.text === "string"
              ? question.text
              : undefined,
      };
    }
    return { title: String(item), summary: "" };
  });
}

export function normalizeRecommendations(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return item;
    if (isRecord(item) && typeof item.action === "string") {
      return item.title ? `${item.title}: ${item.action}` : item.action;
    }
    return String(item);
  });
}
