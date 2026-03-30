import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      login(result.accessToken);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 ascend-gradient items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ASCEND</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Avaliação de Maturidade Empresarial
          </h1>
          <p className="text-lg opacity-80 leading-relaxed">
            Meça, analise e evolua a maturidade da sua organização em Governança, Segurança, Processos, Infraestrutura e Cultura.
          </p>
          <div className="mt-10 grid grid-cols-5 gap-3">
            {["GOV", "SEG", "PROC", "INFRA", "CULT"].map((label, i) => (
              <div
                key={label}
                className="rounded-lg bg-primary-foreground/10 backdrop-blur-sm p-3 text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-xs font-medium opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
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
                onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="ascend-input w-full pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg font-medium"
              disabled={loginMutation.isPending}
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
            Não tem uma conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
