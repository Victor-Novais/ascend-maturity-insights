type ReportSummaryProps = {
  score: number;
  maturityLevel: string;
  description: string;
};

const maturityColorMap: Record<string, string> = {
  ARTESANAL: "bg-destructive/10 text-destructive",
  EFICIENTE: "bg-warning/10 text-warning",
  EFICAZ: "bg-primary/10 text-primary",
  ESTRATEGICO: "bg-success/10 text-success",
};

export default function ReportSummary({ score, maturityLevel, description }: ReportSummaryProps) {
  const badgeStyle = maturityColorMap[maturityLevel] ?? "bg-muted text-muted-foreground";

  return (
    <div className="ascend-card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Score final</p>
        <p className="text-5xl font-bold leading-none">{score.toFixed(0)}%</p>
      </div>

      <div className="sm:text-right">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}>
          {maturityLevel}
        </span>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
    </div>
  );
}
