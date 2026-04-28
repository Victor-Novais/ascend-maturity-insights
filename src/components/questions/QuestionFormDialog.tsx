import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { frameworkOptions } from "@/lib/frameworks";
import type { Question, QuestionCategory, ResponseType } from "@/lib/types";
import type { UpsertQuestionPayload } from "@/services/questions.service";

const categoryOptions: Array<{ value: QuestionCategory; label: string }> = [
  { value: "GOVERNANCA", label: "Governanca" },
  { value: "SEGURANCA", label: "Seguranca" },
  { value: "PROCESSOS", label: "Processos" },
  { value: "INFRAESTRUTURA", label: "Infraestrutura" },
  { value: "CULTURA", label: "Cultura" },
];

const responseTypeOptions: Array<{ value: ResponseType; label: string }> = [
  { value: "YES_NO", label: "Sim ou nao" },
  { value: "SCALE", label: "Escala" },
];

const questionSchema = z
  .object({
    text: z.string().min(1, "Informe o enunciado da questao"),
    category: z.enum(["GOVERNANCA", "SEGURANCA", "PROCESSOS", "INFRAESTRUTURA", "CULTURA"]),
    weight: z.string().min(1, "Informe o peso"),
    responseType: z.enum(["YES_NO", "SCALE"]),
    evidenceRequired: z.boolean(),
    hint: z.string().optional(),
    isActive: z.boolean(),
    frameworkType: z.enum(["COBIT", "ITIL", "ISO_27000", "PROPRIO"]).default("PROPRIO"),
    frameworkRef: z.string().max(100, "A referencia deve ter no maximo 100 caracteres").optional(),
    frameworkNote: z.string().max(500, "A justificativa deve ter no maximo 500 caracteres").optional(),
  })
  .refine((data) => {
    if (data.frameworkType !== "PROPRIO" && !data.frameworkRef?.trim()) return false;
    return true;
  }, {
    message: "Referência obrigatória para frameworks externos",
    path: ["frameworkRef"],
  });

type FormValues = z.infer<typeof questionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  isSubmitting: boolean;
  onSubmit: (payload: UpsertQuestionPayload) => Promise<void>;
};

function getDefaultValues(question?: Question | null): FormValues {
  return {
    text: question?.text ?? "",
    category: question?.category ?? "GOVERNANCA",
    weight: question?.weight ?? "1",
    responseType: question?.responseType ?? "YES_NO",
    evidenceRequired: question?.evidenceRequired ?? false,
    hint: question?.hint ?? "",
    isActive: question?.isActive ?? true,
    frameworkType: question?.frameworkType ?? "PROPRIO",
    frameworkRef: question?.frameworkRef ?? "",
    frameworkNote: question?.frameworkNote ?? "",
  };
}

export default function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  isSubmitting,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: getDefaultValues(question),
  });

  const frameworkType = useWatch({
    control: form.control,
    name: "frameworkType",
  });

  useEffect(() => {
    form.reset(getDefaultValues(question));
  }, [form, question, open]);

  const handleSubmit = async (values: FormValues) => {
    const payload: UpsertQuestionPayload = {
      text: values.text,
      category: values.category,
      weight: values.weight,
      responseType: values.responseType,
      evidenceRequired: values.evidenceRequired,
      isActive: values.isActive,
      frameworkType: values.frameworkType,
      hint: values.hint?.trim() || undefined,
      frameworkRef: values.frameworkType === "PROPRIO" ? undefined : values.frameworkRef?.trim(),
      frameworkNote: values.frameworkNote?.trim() || undefined,
    };

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{question ? "Editar questao" : "Nova questao"}</DialogTitle>
          <DialogDescription>
            Configure o enunciado, comportamento de resposta e o mapeamento de framework.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Enunciado</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva a questao..." className="min-h-28" {...field} />
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
                        {categoryOptions.map((option) => (
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
                name="responseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de resposta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {responseTypeOptions.map((option) => (
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
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dica</FormLabel>
                    <FormControl>
                      <Input placeholder="Orientacao opcional para a resposta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4">
                <h3 className="font-semibold">Mapeamento de Framework</h3>
                <p className="text-sm text-muted-foreground">
                  Vincule a questao a um framework externo ou mantenha no modelo proprio.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="frameworkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Framework</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o framework" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frameworkOptions.map((option) => (
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

                {frameworkType !== "PROPRIO" ? (
                  <FormField
                    control={form.control}
                    name="frameworkRef"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referência do Controle</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: APO12.01, A.9.1.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="frameworkNote"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nota de Justificativa</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Justificativa da associação a este controle..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Campo opcional usado em relatorios e auditoria interna.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="evidenceRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-4">
                    <div className="space-y-1">
                      <FormLabel>Evidencia obrigatoria</FormLabel>
                      <FormDescription>Exige anexo ou comprovacao durante o assessment.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-4">
                    <div className="space-y-1">
                      <FormLabel>Questao ativa</FormLabel>
                      <FormDescription>Questoes inativas nao entram em novos fluxos.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {question ? "Salvar alteracoes" : "Criar questao"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
