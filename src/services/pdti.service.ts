import { api } from "@/lib/api";
import type { PDTI, PDTIExportData, PDTIDiagnostic, PDTIIndicator, PDTIObjective, PDTIAction, CreatePDTIInput, UpdatePDTIInput } from "@/types/pdti";

type PDTIListResponse = PDTI[] | { items?: PDTI[]; data?: PDTI[] };
type PDTIResponse = PDTI | { data?: PDTI; item?: PDTI };
type PDTIGenerateResponse = PDTI | { data?: PDTI; item?: PDTI };

type PDTIExportResponse = PDTIExportData | { data?: PDTIExportData; item?: PDTIExportData };

function normalizeDiagnostic(value: PDTIDiagnostic | null | undefined): PDTIDiagnostic {
  return {
    strengths: Array.isArray(value?.strengths) ? value.strengths : [],
    improvements: Array.isArray(value?.improvements) ? value.improvements : [],
    opportunities: Array.isArray(value?.opportunities) ? value.opportunities : [],
    threats: Array.isArray(value?.threats) ? value.threats : [],
  };
}

function normalizeArray<T>(values?: T[] | null): T[] {
  return Array.isArray(values) ? values : [];
}

function normalizePDTI(payload: PDTIResponse | PDTIGenerateResponse | PDTIExportResponse): PDTI {
  const data = Array.isArray(payload)
    ? payload[0]
    : (payload as { data?: PDTI; item?: PDTI }).data ?? (payload as { data?: PDTI; item?: PDTI }).item ?? payload;

  const normalized = data as PDTI;
  return {
    ...normalized,
    diagnostic: normalizeDiagnostic(normalized.diagnostic),
    objectives: normalizeArray(normalized.objectives).map((objective: PDTIObjective) => ({
      ...objective,
      actions: normalizeArray(objective.actions),
    })),
    actions: normalizeArray(normalized.actions),
    indicators: normalizeArray(normalized.indicators),
  };
}

function normalizeList(response: PDTIListResponse): PDTI[] {
  if (Array.isArray(response)) return response.map((item) => normalizePDTI(item));
  return normalizeArray(response.items ?? response.data).map((item) => normalizePDTI(item));
}

export const pdtiService = {
  list(filters?: { companyId?: number; status?: string; assessmentId?: number }) {
    return api.get<PDTIListResponse>("/pdti", filters).then(normalizeList);
  },
  getById(id: number) {
    return api.get<PDTIResponse>(`/pdti/${id}`).then((response) => normalizePDTI(response));
  },
  create(payload: CreatePDTIInput) {
    return api.post<PDTIResponse>("/pdti", payload).then((response) => normalizePDTI(response));
  },
  update(id: number, payload: UpdatePDTIInput) {
    return api.patch<PDTIResponse>(`/pdti/${id}`, payload).then((response) => normalizePDTI(response));
  },
  remove(id: number) {
    return api.delete<void>(`/pdti/${id}`);
  },
  generateFromAssessment(assessmentId: number) {
    return api.post<PDTIGenerateResponse>(`/pdti/generate/${assessmentId}`).then((response) => normalizePDTI(response));
  },
  exportData(id: number) {
    return api.get<PDTIExportResponse>(`/pdti/${id}/export`).then((response) => normalizePDTI(response));
  },
};
