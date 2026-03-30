import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, ArrowLeft, BarChart3, Building2, Users } from "lucide-react";
import type { CompanySize } from "@/lib/types";

type UserType = "CLIENTE" | "COLLABORATOR" | null;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // CLIENTE fields
  const [companyName, setCompanyName] = useState("");
  const [companySegment, setCompanySegment] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");

  // COLLABORATOR fields
  const [companyCode, setCompanyCode] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (userType === "CLIENTE" && (!companyName.trim() || !companySegment.trim())) {
      toast.error("Preencha o nome e segmento da empresa");
      return;
    }
    if (userType === "COLLABORATOR" && !companyCode.trim()) {
      toast.error("Informe o código da empresa");
      return;
    }

    try {
      const payload: any = {
        name,
        email,
        password,
        userType,
        ...(userType === "CLIENTE" && {
          companyName,
          companySegment,
          ...(companySize && { companySize }),
        }),
        ...(userType === "COLLABORATOR" && { companyCode }),
      };
      const result = await registerMutation.mutateAsync(payload);
      login(result.accessToken);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
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
            {step === 1
              ? "Comece sua jornada de evolução"
              : userType === "CLIENTE"
              ? "Configure sua empresa"
              : "Entre na equipe"}
          </h1>
          <p className="text-lg opacity-80 leading-relaxed">
            {step === 1
              ? "Escolha como deseja usar a plataforma ASCEND para avaliação de maturidade empresarial."
              : userType === "CLIENTE"
              ? "Crie sua empresa e receba um código para convidar colaboradores."
              : "Use o código da empresa para se juntar à equipe e participar das avaliações."}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl ascend-gradient flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">ASCEND</span>
          </div>

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
              <p className="text-muted-foreground mb-8">Como você deseja usar o ASCEND?</p>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelectType("CLIENTE")}
                  className="w-full ascend-card !p-5 flex items-start gap-4 text-left hover:border-primary/40 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Sou dono de empresa</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie sua empresa, gerencie avaliações e convide colaboradores com um código exclusivo.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => handleSelectType("COLLABORATOR")}
                  className="w-full ascend-card !p-5 flex items-start gap-4 text-left hover:border-primary/40 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Sou colaborador</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Entre com o código da empresa e participe das avaliações de maturidade.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-1">
                {userType === "CLIENTE" ? "Dados da empresa" : "Entrar como colaborador"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {userType === "CLIENTE"
                  ? "Preencha seus dados e os da sua empresa"
                  : "Preencha seus dados e o código da empresa"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ascend-input w-full"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ascend-input w-full"
                    placeholder="seu@email.com"
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
                      placeholder="Mínimo 6 caracteres"
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

                {/* Divider */}
                <div className="pt-2 pb-1">
                  <div className="h-px bg-border" />
                </div>

                {userType === "CLIENTE" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Nome da empresa</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="ascend-input w-full"
                        placeholder="Nome da sua empresa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Segmento</label>
                      <input
                        type="text"
                        value={companySegment}
                        onChange={(e) => setCompanySegment(e.target.value)}
                        className="ascend-input w-full"
                        placeholder="Ex: Tecnologia, Saúde, Varejo..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Porte <span className="text-muted-foreground font-normal">(opcional)</span>
                      </label>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value as CompanySize | "")}
                        className="ascend-input w-full"
                      >
                        <option value="">Selecione o porte</option>
                        <option value="MICRO">Micro</option>
                        <option value="PEQUENA">Pequena</option>
                        <option value="MEDIA">Média</option>
                        <option value="GRANDE">Grande</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Código da empresa</label>
                    <input
                      type="text"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                      className="ascend-input w-full font-mono tracking-wider"
                      placeholder="Ex: ABC123"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Solicite o código ao responsável pela empresa.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg font-medium mt-2"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Criar conta <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
