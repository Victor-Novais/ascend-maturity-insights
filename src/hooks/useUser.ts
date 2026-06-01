import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    retry: false,
  });
}

export function useUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: usersService.list,
    enabled:
      user?.role === "ADMIN" ||
      user?.role === "AVALIADOR" ||
      user?.role === "COLLABORATOR",
    retry: false,
  });
}
