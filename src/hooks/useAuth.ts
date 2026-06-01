import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from "@/lib/types";

function decodeJwtPayload<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function decodeUserFromToken(accessToken: string): User | null {
  const payload = decodeJwtPayload<{
    id?: string;
    email?: string;
    role?: UserRole;
    name?: string | null;
    createdAt?: string;
  }>(accessToken);

  if (!payload?.id || !payload?.email || !payload?.role) {
    return null;
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name ?? null,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };
}

async function normalizeAuthResponse(response: AuthResponse): Promise<AuthResponse> {
  if (response.user) {
    return response;
  }

  const user = decodeUserFromToken(response.accessToken);
  return {
    ...response,
    user: user ?? undefined,
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const response = await authService.login(payload);
      return normalizeAuthResponse(response);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      const response = await authService.register(payload);
      return normalizeAuthResponse(response);
    },
  });
}
