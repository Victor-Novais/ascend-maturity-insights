import { api } from "@/lib/api";
import type { Question } from "@/lib/types";

export const questionsService = {
  list() {
    return api.get<Question[]>("/questions");
  },
};
