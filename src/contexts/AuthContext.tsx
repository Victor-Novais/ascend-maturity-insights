import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { clearAuthTokens, registerAuthCallbacks, setAuthTokens } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";
import { authService } from "@/services/auth.service";

type AuthSessionPayload = AuthResponse & {
  user: User;
};

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (auth: AuthSessionPayload) => Promise<void>;
  logout: (options?: { silent?: boolean; redirectToLogin?: boolean }) => Promise<void>;
  renewSession: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeTokenExp(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: number };
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const warnedTokenRef = useRef<string | null>(null);

  const applyTokens = useCallback((nextAccessToken: string | null, nextRefreshToken: string | null) => {
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
    setAuthTokens({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });
  }, []);

  const clearSession = useCallback(() => {
    applyTokens(null, null);
    clearAuthTokens();
    setUser(null);
    warnedTokenRef.current = null;
  }, [applyTokens]);

  const refreshUser = useCallback(async () => {
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.me();
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        name: userData.name ?? null,
      });
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearSession]);

  const logout = useCallback(
    async (options?: { silent?: boolean; redirectToLogin?: boolean }) => {
      const currentRefreshToken = refreshToken;

      try {
        if (currentRefreshToken) {
          await authService.logout(currentRefreshToken);
        }
      } catch {
        // Clear local session regardless of revoke result.
      } finally {
        clearSession();
        if (!options?.silent) {
          toast.success("Sessao encerrada com seguranca");
        }
        if (options?.redirectToLogin !== false && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    },
    [clearSession, refreshToken],
  );

  const renewSession = useCallback(async () => {
    if (!refreshToken) {
      await logout({ silent: true });
      return false;
    }

    try {
      const refreshed = await authService.refresh(refreshToken);
      applyTokens(refreshed.accessToken, refreshed.refreshToken);
      warnedTokenRef.current = null;

      if (refreshed.user) {
        setUser({
          id: refreshed.user.id,
          email: refreshed.user.email,
          role: refreshed.user.role,
          createdAt: refreshed.user.createdAt,
          name: refreshed.user.name ?? null,
        });
        setIsLoading(false);
      } else {
        setIsLoading(true);
        await refreshUser();
      }

      return true;
    } catch {
      await logout({ silent: true });
      return false;
    }
  }, [applyTokens, logout, refreshToken, refreshUser]);

  const login = useCallback(
    async (auth: AuthSessionPayload) => {
      applyTokens(auth.accessToken, auth.refreshToken);
      warnedTokenRef.current = null;
      setUser({
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
        createdAt: auth.user.createdAt,
        name: auth.user.name ?? null,
      });
      setIsLoading(false);
    },
    [applyTokens],
  );

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    registerAuthCallbacks({
      onRefreshToken: async (currentRefreshToken) => {
        const refreshed = await authService.refresh(currentRefreshToken);
        setAccessToken(refreshed.accessToken);
        setRefreshToken(refreshed.refreshToken);
        warnedTokenRef.current = null;
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        };
      },
      onLogout: async () => {
        await logout({ silent: true });
      },
    });
  }, [logout]);

  useEffect(() => {
    if (!accessToken) return;

    const warnIfNeeded = () => {
      const exp = decodeTokenExp(accessToken);
      if (!exp) return;

      const remainingMs = exp * 1000 - Date.now();
      if (remainingMs <= 0) {
        void renewSession();
        return;
      }

      if (remainingMs <= 2 * 60 * 1000 && warnedTokenRef.current !== accessToken) {
        warnedTokenRef.current = accessToken;
        toast("Sua sessao expira em breve. Clique para renovar.", {
          duration: 15000,
          action: {
            label: "Renovar",
            onClick: () => {
              void renewSession();
            },
          },
        });
      }
    };

    warnIfNeeded();
    const intervalId = window.setInterval(warnIfNeeded, 30000);
    return () => window.clearInterval(intervalId);
  }, [accessToken, renewSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        renewSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
