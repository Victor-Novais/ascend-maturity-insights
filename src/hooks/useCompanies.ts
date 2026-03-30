import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companiesService } from "@/services/companies.service";
import type { CreateCompanyRequest, UpdateCompanyRequest } from "@/lib/types";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: companiesService.list,
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companiesService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyRequest) => companiesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCompanyRequest }) =>
      companiesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", variables.id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companiesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
