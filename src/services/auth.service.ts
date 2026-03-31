import { api } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest, UserRole } from "@/lib/types";

export interface MeResponse {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
}

export const authService = {
  login(payload: LoginRequest) {
    return api.post<AuthResponse>("/auth/login", payload);
  },
  register(payload: RegisterRequest) {
    return api.post<AuthResponse>("/auth/register", payload);
  },
  me() {
    return api.get<MeResponse>("/auth/me");
  },
};
