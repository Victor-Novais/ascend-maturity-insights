import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Flag, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ActionPlanCategory,
  ActionPlanPriority,
  ActionPlanStatus,
  type ActionPlan,
  type CreateActionPlanInput,
  type UpdateActionPlanInput,
} from "@/types/action-plan";
import {
  actionPlanCategoryLabels,
  actionPlanCategoryOptions,
  actionPlanPriorityLabels,
  getPriorityBadgeClass,
} from "@/components/action-plans/action-plan-utils";

const actionPlanSchema = z.object({
  title: z.string().min(5, "Informe um titulo com pelo menos 5 caracteres"),
  description: z.string().min(10, "Descreva o plano com pelo menos 10 caracteres"),
  category: z.nativeEnum(ActionPlanCategory),
  frameworkRef: z.string().optional(),
  priority: z.nativeEnum(ActionPlanPriority),
  responsibleId: z.string().optional(),
  dueDate: z.date().optional(),
  observations: z.string().optional(),
  companyId: z.number().int().positive("Selecione uma empresa"),
  assessmentId: z.number().int().positive().optional().nullable(),
});

type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;

type Option = {
  id: number;
  name: string;
};

type ResponsibleOption = {
  id: string;
  name: string;
  email: string;
  role: string;
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
  companies: Option[];
  responsibles: ResponsibleOption[];
  assessments: AssessmentOption[];
  fixedCompanyId?: number;
  fixedAssessmentId?: number;
};

function getDefaultValues(
  plan: ActionPlan | null | undefined,
  fixedCompanyId?: number,
  fixedAssessmentId?: number,
): ActionPlanFormValues {
  return {
    title: plan?.title ?? "",
    description: plan?.description ?? "",
    category: (plan?.category as ActionPlanCategory) ?? ActionPlanCategory.GOVERNANCA,
    frameworkRef: plan?.frameworkRef ?? "",
    priority: plan?.priority ?? ActionPlanPriority.MEDIA,
    responsibleId: plan?.responsibleId ?? "",
    dueDate: plan?.dueDate ? new Date(plan.dueDate) : undefined,
    observations: plan?.observations ?? "",
    companyId: plan?.companyId ?? fixedCompanyId ?? 0,
    assessmentId: plan?.assessmentId ?? fixedAssessmentId ?? null,
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
  fixedAssessmentId,
}: Props) {
  const form = useForm<ActionPlanFormValues>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: getDefaultValues(plan, fixedCompanyId, fixedAssessmentId),
  });

  const companyId = form.watch("companyId");

  useEffect(() => {
    form.reset(getDefaultValues(plan, fixedCompanyId, fixedAssessmentId));
  }, [fixedAssessmentId, fixedCompanyId, form, open, plan]);

  useEffect(() => {
    if (!companyId) return;
    const assessmentId = form.getValues("assessmentId");
    if (!assessmentId) return;
    const assessmentBelongsToCompany = assessments.some(
      (assessment) => assessment.id === assessmentId && assessment.companyId === companyId,
    );
    if (!assessmentBelongsToCompany) {
      form.setValue("assessmentId", null);
    }
  }, [assessments, companyId, form]);

  const filteredAssessments = companyId
    ? assessments.filter((assessment) => assessment.companyId === companyId)
    : assessments;

  const handleSubmit = async (values: ActionPlanFormValues) => {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      frameworkRef: values.frameworkRef?.trim() || null,
      priority: values.priority,
      responsibleId: values.responsibleId || null,
      dueDate: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : null,
      observations: values.observations?.trim() || null,
      companyId: values.companyId,
      assessmentId: values.assessmentId ?? null,
      status: plan?.status ?? ActionPlanStatus.PENDENTE,
    } satisfies CreateActionPlanInput;

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plano de acao" : "Novo plano de acao"}</DialogTitle>
          <DialogDescription>
            Registre titulo, responsavel, prioridade e prazo para acompanhar a execucao.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Titulo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Implantar politica de backup testado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descricao</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-28" placeholder="Descreva o objetivo, escopo e entregas." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {actionPlanCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                      <Input placeholder="Ex: ISO 27001 A.8.13" {...field} />
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
                      disabled={!!fixedCompanyId}
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
                      onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                      value={field.value ? String(field.value) : "none"}
                      disabled={!!fixedAssessmentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vincule a um assessment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem vinculo</SelectItem>
                        {filteredAssessments.map((assessment) => (
                          <SelectItem key={assessment.id} value={String(assessment.id)}>
                            {assessment.companyName
                              ? `#${assessment.id} - ${assessment.companyName}`
                              : `Assessment #${assessment.id}`}
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
                    <FormLabel>Responsavel</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsavel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nao atribuido</SelectItem>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("justify-between font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                            <CalendarIcon className="h-4 w-4 opacity-70" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <RadioGroup
                      className="grid gap-3 sm:grid-cols-3"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      {Object.values(ActionPlanPriority).map((priority) => (
                        <label
                          key={priority}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                            field.value === priority ? getPriorityBadgeClass(priority) : "border-border hover:bg-muted/40",
                          )}
                        >
                          <RadioGroupItem value={priority} />
                          <Flag className="h-4 w-4" />
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
                  <FormLabel>Observacoes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-24" placeholder="Informacoes adicionais, dependencias ou riscos." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {plan ? "Salvar alteracoes" : "Criar plano"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
