import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["users"],
    queryFn: usersService.list,
  });
}
