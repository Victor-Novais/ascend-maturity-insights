import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { downloadFileFromApi } from "@/utils/downloadFile";
import { format } from "date-fns";
import type { RiskFilters } from "@/types/risk";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface DownloadMutationContext {
  filename: string;
}

/**
 * Hook para baixar PDTI em formato Word (.docx)
 */
export function useDownloadPdtiDocx() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken") || "";

  return useMutation({
    mutationFn: async (pdtiId: number): Promise<DownloadMutationContext> => {
      const filename = `PDTI_${pdtiId}_${format(new Date(), "yyyy-MM-dd")}.docx`;
      const url = `${API_BASE_URL}/exports/pdti/${pdtiId}/docx`;

      await downloadFileFromApi(url, filename, token);

      return { filename };
    },
  });
}

/**
 * Hook para baixar PDTI em formato PDF
 */
export function useDownloadPdtiPdf() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken") || "";

  return useMutation({
    mutationFn: async (pdtiId: number): Promise<DownloadMutationContext> => {
      const filename = `PDTI_${pdtiId}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      const url = `${API_BASE_URL}/exports/pdti/${pdtiId}/pdf`;

      await downloadFileFromApi(url, filename, token);

      return { filename };
    },
  });
}

/**
 * Hook para baixar Relatório de Avaliação em PDF
 */
export function useDownloadReportPdf() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken") || "";

  return useMutation({
    mutationFn: async (assessmentId: number): Promise<DownloadMutationContext> => {
      const filename = `Relatorio_Avaliacao_${assessmentId}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`;
      const url = `${API_BASE_URL}/exports/report/${assessmentId}/pdf`;

      await downloadFileFromApi(url, filename, token);

      return { filename };
    },
  });
}

/**
 * Hook para baixar Riscos em formato Excel (.xlsx)
 */
export function useDownloadRisksXlsx() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken") || "";

  return useMutation({
    mutationFn: async (filters?: RiskFilters): Promise<DownloadMutationContext> => {
      const filename = `Riscos_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      const url = new URL(`${API_BASE_URL}/exports/risks/xlsx`);

      // Adicionar filtros como query params se existirem
      if (filters) {
        if (filters.assessmentId) url.searchParams.append("assessmentId", String(filters.assessmentId));
        if (filters.companyId) url.searchParams.append("companyId", String(filters.companyId));
        if (filters.level) url.searchParams.append("level", filters.level);
        if (filters.status) url.searchParams.append("status", filters.status);
        if (filters.category) url.searchParams.append("category", filters.category);
      }

      await downloadFileFromApi(url.toString(), filename, token);

      return { filename };
    },
  });
}
