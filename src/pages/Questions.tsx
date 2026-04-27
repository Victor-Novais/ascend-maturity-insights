import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import FrameworkBadge from "@/components/FrameworkBadge";
import FrameworkCoverageWidget from "@/components/FrameworkCoverageWidget";
import QuestionFormDialog from "@/components/questions/QuestionFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { frameworkFilterOptions } from "@/lib/frameworks";
import type { FrameworkType, Question } from "@/lib/types";
import { useCreateQuestion, useQuestions, useUpdateQuestion } from "@/hooks/useQuestions";

const categoryLabels: Record<Question["category"], string> = {
  GOVERNANCA: "Governanca",
  SEGURANCA: "Seguranca",
  PROCESSOS: "Processos",
  INFRAESTRUTURA: "Infraestrutura",
  CULTURA: "Cultura",
};

const responseTypeLabels: Record<Question["responseType"], string> = {
  YES_NO: "Sim/Nao",
  SCALE: "Escala",
};

export default function QuestionsPage() {
  const { user } = useAuth();
  const [selectedFramework, setSelectedFramework] = useState<"ALL" | FrameworkType>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const questionsQuery = useQuestions(selectedFramework);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();

  const questions = useMemo(() => questionsQuery.data ?? [], [questionsQuery.data]);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreate = () => {
    setEditingQuestion(null);
    setDialogOpen(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: Parameters<typeof createQuestion.mutateAsync>[0]) => {
    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({ id: editingQuestion.id, payload });
        toast.success("Questao atualizada com sucesso");
      } else {
        await createQuestion.mutateAsync(payload);
        toast.success("Questao criada com sucesso");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar questao");
      throw error;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banco de questoes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie questoes administrativas e o mapeamento de frameworks sem alterar rotas existentes.
          </p>
        </div>
        <Button onClick={handleCreate} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nova questao
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Filtros de framework</CardTitle>
                <p className="text-sm text-muted-foreground">Use os atalhos para consultar o endpoint dedicado.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {frameworkFilterOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedFramework === option.value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setSelectedFramework(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Questoes cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {questionsQuery.isLoading ? (
                <SkeletonCard />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pergunta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Framework</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-md">
                          <div className="space-y-1">
                            <p className="font-medium">{question.text}</p>
                            {question.hint ? (
                              <p className="text-xs text-muted-foreground">{question.hint}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{categoryLabels[question.category]}</TableCell>
                        <TableCell>{responseTypeLabels[question.responseType]}</TableCell>
                        <TableCell>
                          <FrameworkBadge
                            frameworkType={question.frameworkType}
                            frameworkRef={question.frameworkRef}
                            frameworkNote={question.frameworkNote}
                            fallbackToDefault
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={question.isActive ? "text-emerald-600 font-medium" : "text-muted-foreground font-medium"}
                          >
                            {question.isActive ? "Ativa" : "Inativa"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleEdit(question)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!questions.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Nenhuma questao encontrada para o filtro selecionado.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <FrameworkCoverageWidget />
        </div>
      </div>

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={editingQuestion}
        isSubmitting={createQuestion.isPending || updateQuestion.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
