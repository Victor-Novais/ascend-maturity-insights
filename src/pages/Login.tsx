import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight, BarChart3, Eye, EyeOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/lib/types";

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

function decodeUserFromToken(accessToken: string) {
  const payload = decodeJwtPayload<{ id?: string; email?: string; role?: UserRole; name?: string | null; createdAt?: string }>(accessToken);
  if (!payload?.id || !payload?.email || !payload?.role) return null;
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name ?? null,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      toast.error("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });
      const user = result.user ?? decodeUserFromToken(result.accessToken);
      if (!user) {
        throw new Error("Resposta de autenticação incompleta.");
      }
      await login({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user,
      });
      setAttempts(0);
      setLockUntil(null);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockUntil(Date.now() + 3 * 60 * 1000);
          toast.error("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
          return;
        }

        toast.error("E-mail ou senha incorretos");
        return;
      }

      toast.error(error instanceof Error ? error.message : "Falha ao realizar login.");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 ascend-gradient items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ASCEND</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Avaliacao de Maturidade Empresarial</h1>
          <p className="text-lg opacity-80 leading-relaxed">
            Meca, analise e evolua a maturidade da sua organizacao em Governanca, Seguranca, Processos, Infraestrutura e Cultura.
          </p>
          <div className="mt-10 grid grid-cols-5 gap-3">
            {["GOV", "SEG", "PROC", "INFRA", "CULT"].map((label, index) => (
              <div
                key={label}
                className="rounded-lg bg-primary-foreground/10 backdrop-blur-sm p-3 text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-xs font-medium opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl ascend-gradient flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">ASCEND</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mb-8">Entre com suas credenciais para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ascend-input w-full"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ascend-input w-full pr-10"
                  placeholder="********"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {attempts >= 5 && lockUntil && Date.now() < lockUntil ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.
              </div>
            ) : null}

            {attempts > 0 ? (
              <p className="text-xs text-muted-foreground">Tentativas falhas recentes: {attempts}/5</p>
            ) : null}

            <Button
              type="submit"
              className="w-full h-11 rounded-lg font-medium"
              disabled={loginMutation.isPending || (!!lockUntil && Date.now() < lockUntil)}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nao tem uma conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
