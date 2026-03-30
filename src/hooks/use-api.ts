import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  User,
  Company,
  Assessment,
  Question,
  Report,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/lib/types";

// Auth
export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => api.post<AuthResponse>("/auth/register", data),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<User>("/auth/me"),
    retry: false,
  });
}

// Companies
export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => api.get<Company[]>("/companies"),
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => api.get<Company>(`/companies/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Company>) => api.post<Company>("/companies", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Company> & { id: number }) =>
      api.patch<Company>(`/companies/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

// Assessments
export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: () => api.get<Assessment[]>("/assessments"),
  });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => api.get<Assessment>(`/assessments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { companyId: number }) => api.post<Assessment>("/assessments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
}

// Questions
export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: () => api.get<Question[]>("/questions"),
  });
}

// Reports
export function useReport(assessmentId: number) {
  return useQuery({
    queryKey: ["report", assessmentId],
    queryFn: () => api.get<Report>(`/report/${assessmentId}`),
    enabled: !!assessmentId,
  });
}

// Score
export function useCalculateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: number) => api.post(`/score/calculate/${assessmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["report"] });
    },
  });
}
