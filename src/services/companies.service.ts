import { api } from "@/lib/api";
import type {
  Company,
  CompanyWithRelations,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/lib/types";

export const companiesService = {
  list() {
    return api.get<CompanyWithRelations[]>("/companies");
  },
  getById(id: number) {
    return api.get<CompanyWithRelations>(`/companies/${id}`);
  },
  create(payload: CreateCompanyRequest) {
    return api.post<Company>("/companies", payload);
  },
  update(id: number, payload: UpdateCompanyRequest) {
    return api.patch<Company>(`/companies/${id}`, payload);
  },
  remove(id: number) {
    return api.delete<Company>(`/companies/${id}`);
  },
};
