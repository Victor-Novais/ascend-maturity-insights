import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  CalendarClock,
  FileWarning,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import FrameworkBadge from "@/components/FrameworkBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getRiskCategoryBadgeClass,
  getRiskLevelBadgeClass,
  getRiskLevelFromScore,
  getRiskStatusBadgeClass,
  riskCategoryLabels,
  riskLevelLabels,
  riskStatusLabels,
  riskTreatmentLabels,
} from "@/components/risks/risk-utils";
import type { Risk } from "@/types/risk";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: Risk | null;
  onEdit: () => void;
};

function formatDate(value?: string | null) {
  if (!value) return "Nao informado";
  return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
}

export default function RiskDetail({ open, onOpenChange, risk, onEdit }: Props) {
  if (!risk) return null;

  const level = risk.riskLevel ?? getRiskLevelFromScore(risk.riskScore);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-2">
              <SheetTitle className="text-xl">{risk.title}</SheetTitle>
              <SheetDescription>Risco #{risk.id} com score {risk.riskScore}.</SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getRiskCategoryBadgeClass(String(risk.category))}>
              {riskCategoryLabels[risk.category as keyof typeof riskCategoryLabels] ?? risk.category}
            </Badge>
            <Badge className={getRiskLevelBadgeClass(level)}>{riskLevelLabels[level]}</Badge>
            <Badge className={getRiskStatusBadgeClass(risk.status)}>
              {riskStatusLabels[risk.status as keyof typeof riskStatusLabels] ?? risk.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <section className="grid gap-4 rounded-2xl border bg-muted/10 p-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa</p>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{risk.company?.name ?? `Empresa #${risk.companyId}`}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsavel</p>
              <div className="flex items-center gap-2 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span>{risk.responsible?.name ?? "Nao atribuido"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Probabilidade</p>
              <p className="text-sm font-medium">{risk.probability}/5</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Impacto</p>
              <p className="text-sm font-medium">{risk.impact}/5</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tratamento</p>
              <p className="text-sm font-medium">
                {risk.treatment ? riskTreatmentLabels[risk.treatment as keyof typeof riskTreatmentLabels] ?? risk.treatment : "Nao informado"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Prazo de revisao</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(risk.reviewDate)}</span>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Framework</p>
              {risk.frameworkRef ? (
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <FrameworkBadge frameworkRef={risk.frameworkRef} fallbackToDefault />
                </div>
              ) : (
                <p className="text-sm">Nao informado</p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descricao</h3>
            <div className="rounded-2xl border bg-background p-4 text-sm leading-6">{risk.description}</div>
          </section>

          <section className="rounded-2xl border bg-muted/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileWarning className="h-4 w-4 text-muted-foreground" />
              <span>Campos tecnicos</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>Score: {risk.riskScore}</p>
              <p>Nivel: {riskLevelLabels[level]}</p>
              <p>Status: {riskStatusLabels[risk.status as keyof typeof riskStatusLabels] ?? risk.status}</p>
              <p>Atualizado em: {risk.updatedAt ? format(parseISO(risk.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nao informado"}</p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
