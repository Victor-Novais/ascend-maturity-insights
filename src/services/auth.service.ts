import { api } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest, UserRole } from "@/lib/types";

export interface MeResponse {
  id: string;
  email: string;
  role: UserRole;
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
