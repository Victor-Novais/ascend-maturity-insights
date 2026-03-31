import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { assessmentFlowApi } from "@/services/api";
import { Button } from "@/components/ui/button";

type AssessmentWizardProps = {
  onCreated: (assessmentId: number) => void;
};

const wizardSteps = [
  "Selecionar empresa",
  "Selecionar template",
  "Criar assessment",
];

export default function AssessmentWizard({ onCreated }: AssessmentWizardProps) {
  const [step, setStep] = useState(1);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["wizard-companies"],
    queryFn: assessmentFlowApi.getCompanies,
  });
  const templatesQuery = useQuery({
    queryKey: ["wizard-templates"],
    queryFn: assessmentFlowApi.getTemplates,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      assessmentFlowApi.createAssessment({
        companyId: Number(companyId),
        questionnaireTemplateId: Number(templateId),
      }),
    onSuccess: (data) => onCreated(data.id),
    onError: (error) =>
      setErrorMessage(error instanceof Error ? error.message : "Erro ao criar assessment"),
  });

  const progress = useMemo(() => (step / wizardSteps.length) * 100, [step]);
  const isLoadingLists = companiesQuery.isLoading || templatesQuery.isLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="ascend-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Etapa {step} de {wizardSteps.length}</span>
          <span>{wizardSteps[step - 1]}</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isLoadingLists ? (
        <div className="ascend-card py-16 text-center text-muted-foreground">Carregando dados do backend...</div>
      ) : (
        <>
          {step === 1 && (
            <div className="ascend-card space-y-4">
              <h1 className="text-2xl font-bold">Selecione a empresa</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(companiesQuery.data ?? []).map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setCompanyId(company.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      companyId === company.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{company.name}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button disabled={!companyId} onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="ascend-card space-y-4">
              <h1 className="text-2xl font-bold">Selecione o template</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(templatesQuery.data ?? []).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      templateId === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.questionCount} perguntas
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button disabled={!templateId} onClick={() => setStep(3)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="ascend-card space-y-4">
              <h1 className="text-2xl font-bold">Criar assessment</h1>
              <p className="text-sm text-muted-foreground">
                Empresa #{companyId} e template #{templateId} serão enviados para o backend.
              </p>
              {errorMessage && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} disabled={createMutation.isPending}>
                  Voltar
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar e iniciar
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
