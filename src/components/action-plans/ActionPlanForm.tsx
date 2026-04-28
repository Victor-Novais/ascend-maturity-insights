import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ActionPlanCategory,
  ActionPlanPriority,
  type ActionPlan,
  type ActionPlanCategory as ActionPlanCategoryType,
  type CreateActionPlanInput,
  type UpdateActionPlanInput,
} from "@/types/action-plan";
import {
  actionPlanCategoryLabels,
  actionPlanPriorityLabels,
  getPriorityBadgeClass,
} from "@/components/action-plans/action-plan-utils";

const categoryValues = Object.values(ActionPlanCategory);
const priorityValues = Object.values(ActionPlanPriority);

const actionPlanSchema = z.object({
  title: z.string().min(5, "Informe pelo menos 5 caracteres").max(200, "Máximo de 200 caracteres"),
  description: z.string().min(10, "Informe pelo menos 10 caracteres"),
  category: z.enum(["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"]),
  frameworkRef: z.string().max(100, "Máximo de 100 caracteres").optional(),
  priority: z.enum(["ALTA", "MEDIA", "BAIXA"]),
  responsibleId: z.string().uuid("Responsável inválido").optional().or(z.literal("")),
  dueDate: z.string().optional(),
  observations: z.string().optional(),
  companyId: z.coerce.number().int().positive("Selecione uma empresa"),
  assessmentId: z.coerce.number().int().positive().optional(),
});

type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;

type CompanyOption = {
  id: number;
  name: string;
};

type ResponsibleOption = {
  id: string;
  name: string;
  email: string;
};

type AssessmentOption = {
  id: number;
  companyId: number;
  companyName?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateActionPlanInput | UpdateActionPlanInput) => Promise<void>;
  isSubmitting: boolean;
  plan?: ActionPlan | null;
  companies: CompanyOption[];
  responsibles: ResponsibleOption[];
  assessments: AssessmentOption[];
  fixedCompanyId?: number;
};

function getDefaultValues(plan?: ActionPlan | null, fixedCompanyId?: number): ActionPlanFormValues {
  return {
    title: plan?.title ?? "",
    description: plan?.description ?? "",
    category: (plan?.category as ActionPlanCategoryType) ?? ActionPlanCategory.GOVERNANCA,
    frameworkRef: plan?.frameworkRef ?? "",
    priority: plan?.priority ?? ActionPlanPriority.MEDIA,
    responsibleId: plan?.responsibleId ?? "",
    dueDate: plan?.dueDate ?? "",
    observations: plan?.observations ?? "",
    companyId: plan?.companyId ?? fixedCompanyId ?? 0,
    assessmentId: plan?.assessmentId ?? undefined,
  };
}

export default function ActionPlanForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  plan,
  companies,
  responsibles,
  assessments,
  fixedCompanyId,
}: Props) {
  const form = useForm<ActionPlanFormValues>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: getDefaultValues(plan, fixedCompanyId),
  });

  const companyId = form.watch("companyId");

  useEffect(() => {
    form.reset(getDefaultValues(plan, fixedCompanyId));
  }, [fixedCompanyId, form, open, plan]);

  const filteredAssessments = companyId
    ? assessments.filter((assessment) => assessment.companyId === companyId)
    : assessments;

  const handleSubmit = async (values: ActionPlanFormValues) => {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      frameworkRef: values.frameworkRef?.trim() || undefined,
      priority: values.priority,
      responsibleId: values.responsibleId || undefined,
      dueDate: values.dueDate || undefined,
      observations: values.observations?.trim() || undefined,
      companyId: values.companyId,
      assessmentId: values.assessmentId || undefined,
    } satisfies CreateActionPlanInput;

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{plan ? "Editar plano" : "Novo plano"}</SheetTitle>
          <SheetDescription>Preencha os dados do plano de ação e defina prioridade, responsável e prazo.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="mt-6 space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Revisar política de backup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-28" placeholder="Descreva a ação a ser executada..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryValues.map((category) => (
                          <SelectItem key={category} value={category}>
                            {actionPlanCategoryLabels[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frameworkRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Framework</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: APO12.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
                      disabled={Boolean(fixedCompanyId)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "all" ? undefined : Number(value))}
                      value={field.value ? String(field.value) : "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o assessment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Sem vínculo</SelectItem>
                        {filteredAssessments.map((assessment) => (
                          <SelectItem key={assessment.id} value={String(assessment.id)}>
                            {assessment.companyName ? `#${assessment.id} - ${assessment.companyName}` : `Assessment #${assessment.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "all" ? "" : value)} value={field.value || "all"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Não atribuído</SelectItem>
                        {responsibles.map((responsible) => (
                          <SelectItem key={responsible.id} value={responsible.id}>
                            {responsible.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Prioridade</FormLabel>
                  <FormControl>
                    <RadioGroup className="grid gap-3 sm:grid-cols-3" onValueChange={field.onChange} value={field.value}>
                      {priorityValues.map((priority) => (
                        <label
                          key={priority}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                            field.value === priority ? getPriorityBadgeClass(priority) : "border-border hover:bg-muted/40",
                          )}
                        >
                          <RadioGroupItem value={priority} />
                          <span className="font-medium">{actionPlanPriorityLabels[priority]}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-24" placeholder="Anotações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {plan ? "Salvar alterações" : "Criar plano"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
