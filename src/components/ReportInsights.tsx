type Props = {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

function InsightList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
        ? "border-red-200 bg-red-50"
        : "border-blue-200 bg-blue-50";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-lg bg-white/70 px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum item disponível.</p>
      )}
    </div>
  );
}

export default function ReportInsights({ strengths, weaknesses, recommendations }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <InsightList title="Strengths" items={strengths} tone="green" />
      <InsightList title="Weaknesses" items={weaknesses} tone="red" />
      <InsightList title="Recommendations" items={recommendations} tone="blue" />
    </div>
  );
}
