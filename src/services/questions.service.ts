import { api } from "@/lib/api";
import { getFrameworkType } from "@/lib/frameworks";
import type { FrameworkType, Question, QuestionCategory, ResponseType } from "@/lib/types";

export interface UpsertQuestionPayload {
  text: string;
  category: QuestionCategory;
  weight: string;
  responseType: ResponseType;
  evidenceRequired: boolean;
  hint?: string;
  isActive: boolean;
  frameworkType: FrameworkType;
  frameworkRef?: string;
  frameworkNote?: string;
}

type FrameworkCoverageResponse =
  | Partial<Record<FrameworkType, number>>
  | Array<{ frameworkType?: FrameworkType; type?: FrameworkType; count?: number; total?: number }>;

export const questionsService = {
  list(frameworkType: "ALL" | FrameworkType = "ALL") {
    if (frameworkType === "ALL") {
      return api.get<Question[]>("/questions");
    }
    return api.get<Question[]>(`/questions/framework/${frameworkType}`);
  },
  create(payload: UpsertQuestionPayload) {
    return api.post<Question>("/questions", payload);
  },
  update(id: number, payload: UpsertQuestionPayload) {
    return api.put<Question>(`/questions/${id}`, payload);
  },
  async getFrameworkCoverage() {
    const response = await api.get<FrameworkCoverageResponse>("/questions/framework-coverage");

    if (Array.isArray(response)) {
      return response.reduce<Record<FrameworkType, number>>(
        (acc, item) => {
          const type = getFrameworkType(item.frameworkType ?? item.type);
          acc[type] = Number(item.count ?? item.total ?? 0);
          return acc;
        },
        { COBIT: 0, ITIL: 0, ISO_27000: 0, PROPRIO: 0 },
      );
    }

    return {
      COBIT: Number(response.COBIT ?? 0),
      ITIL: Number(response.ITIL ?? 0),
      ISO_27000: Number(response.ISO_27000 ?? 0),
      PROPRIO: Number(response.PROPRIO ?? 0),
    };
  },
};
