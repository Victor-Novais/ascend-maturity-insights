import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { useRegister } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BarChart3, Building2, Eye, EyeOff, Users } from "lucide-react";

type UserType = "CLIENTE" | "COLLABORATOR" | null;

const registerSchema = z.object({
  name: z.string().min(1, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter letra maiúscula")
    .regex(/[a-z]/, "Deve conter letra minúscula")
    .regex(/[0-9]/, "Deve conter ao menos um número")
    .regex(/[@$!%*?&#]/, "Deve conter símbolo especial (@$!%*?&#)"),
  companyCode: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyCode: "",
    },
  });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    if (userType === "COLLABORATOR" && !values.companyCode?.trim()) {
      toast.error("Informe o codigo da empresa");
      return;
    }

    try {
      const body =
        userType === "CLIENTE"
          ? {
              name: values.name.trim(),
              email: values.email.trim(),
              password: values.password,
              userType: "CLIENTE" as const,
            }
          : {
              name: values.name.trim(),
              email: values.email.trim(),
              password: values.password,
              userType: "COLLABORATOR" as const,
              companyCode: values.companyCode?.trim(),
            };

      const result = await registerMutation.mutateAsync(body);
      if (!result.user) {
        throw new Error("Resposta de autenticação incompleta.");
      }
      await login({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar conta";
      toast.error(message);
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
          <h1 className="text-4xl font-bold leading-tight mb-4">
            {step === 1 ? "Comece sua jornada de evolucao" : userType === "CLIENTE" ? "Conta de proprietario" : "Entre na equipe"}
          </h1>
          <p className="text-lg opacity-80 leading-relaxed">
            {step === 1
              ? "Escolha como deseja usar a plataforma ASCEND para avaliacao de maturidade empresarial."
              : userType === "CLIENTE"
                ? "Cadastre-se como dono da empresa. Depois voce podera criar a empresa e o codigo de convite no painel."
                : "Use o codigo fornecido pela empresa para vincular sua conta ao tenant correto."}
          </p>
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

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
              <p className="text-muted-foreground mb-8">Como voce deseja usar o ASCEND?</p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleSelectType("CLIENTE")}
                  className="w-full ascend-card !p-5 flex items-start gap-4 text-left hover:border-primary/40 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Sou dono de empresa (CLIENTE)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie sua conta e, em seguida, cadastre a empresa no painel e convide colaboradores.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectType("COLLABORATOR")}
                  className="w-full ascend-card !p-5 flex items-start gap-4 text-left hover:border-primary/40 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Sou colaborador</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Entre com o codigo da empresa para participar das avaliacoes da sua organizacao.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-1">
                {userType === "CLIENTE" ? "Seus dados" : "Dados e codigo da empresa"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {userType === "CLIENTE"
                  ? "Apenas sua conta - a empresa sera cadastrada depois no dashboard."
                  : "Preencha seus dados e o codigo da empresa"}
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              className="pr-10"
                              placeholder="Minimo 8 caracteres"
                              autoComplete="new-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((current) => !current)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <PasswordStrengthIndicator password={password} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {userType === "COLLABORATOR" ? (
                    <FormField
                      control={form.control}
                      name="companyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Codigo da empresa</FormLabel>
                          <FormControl>
                            <Input
                              className="font-mono tracking-wider"
                              placeholder="Ex: ABC123"
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Solicite o codigo ao responsavel pela empresa.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <Button type="submit" className="w-full h-11 rounded-lg font-medium mt-2" disabled={registerMutation.isPending}>
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
              </Form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ja tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
