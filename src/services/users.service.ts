import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export const usersService = {
  list() {
    return api.get<User[]>("/users");
  },
  getById(id: string) {
    return api.get<User>(`/users/${id}`);
  },
};
