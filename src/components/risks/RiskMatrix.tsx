import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RiskLevel, type RiskMatrixCell } from "@/types/risk";
import {
  getRiskLevelBadgeClass,
  getRiskMatrixColor,
  getRiskMatrixLabel,
} from "@/components/risks/risk-utils";

const impactLabels = ["Muito Baixo", "Baixo", "Medio", "Alto", "Muito Alto"];
const probabilityLabels = ["Muito Baixa", "Baixa", "Media", "Alta", "Muito Alta"];

type Props = {
  cells: RiskMatrixCell[];
  selectedCell: { probability: number; impact: number } | null;
  onSelectCell: (cell: { probability: number; impact: number } | null) => void;
};

export default function RiskMatrix({ cells, selectedCell, onSelectCell }: Props) {
  const getCell = (probability: number, impact: number) =>
    cells.find((cell) => cell.probability === probability && cell.impact === impact) ?? {
      probability,
      impact,
      score: probability * impact,
      riskLevel: RiskLevel.BAIXO,
      count: 0,
    };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={getRiskLevelBadgeClass(RiskLevel.BAIXO)}>Baixo 1-5</Badge>
        <Badge className={getRiskLevelBadgeClass(RiskLevel.MEDIO)}>Medio 6-11</Badge>
        <Badge className={getRiskLevelBadgeClass(RiskLevel.ALTO)}>Alto 12-19</Badge>
        <Badge className={getRiskLevelBadgeClass(RiskLevel.CRITICO)}>Critico 20-25</Badge>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[120px_repeat(5,minmax(92px,1fr))] gap-2">
          <div />
          {impactLabels.map((label, index) => (
            <div key={label} className="rounded-xl border bg-muted/20 px-3 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Impacto {index + 1}</p>
              <p className="mt-1 text-sm font-medium">{label}</p>
            </div>
          ))}

          {Array.from({ length: 5 }, (_, reverseIndex) => 5 - reverseIndex).map((probability) => (
            <>
              <div
                key={`label-${probability}`}
                className="flex items-center rounded-xl border bg-muted/20 px-3 py-2"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Probabilidade {probability}</p>
                  <p className="text-sm font-medium">{probabilityLabels[probability - 1]}</p>
                </div>
              </div>

              {Array.from({ length: 5 }, (_, impactIndex) => impactIndex + 1).map((impact) => {
                const cell = getCell(probability, impact);
                const active = selectedCell?.probability === probability && selectedCell?.impact === impact;
                return (
                  <button
                    key={`${probability}-${impact}`}
                    type="button"
                    title={getRiskMatrixLabel(probability, impact)}
                    onClick={() =>
                      onSelectCell(active ? null : { probability: cell.probability, impact: cell.impact })
                    }
                    className={cn(
                      "relative flex min-h-[96px] flex-col items-center justify-center rounded-2xl border-2 p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5",
                      active ? "border-foreground ring-2 ring-foreground/20" : "border-transparent",
                    )}
                    style={{ backgroundColor: getRiskMatrixColor(cell.score) }}
                  >
                    <span className="text-xs font-medium text-white/90">Score {cell.score}</span>
                    <span className="mt-2 text-3xl font-bold text-white">{cell.count}</span>
                    <span className="mt-1 text-xs text-white/90">{cell.riskLevel}</span>
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
