import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { LoginRequest, RegisterRequest } from "@/lib/types";

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  });
}
