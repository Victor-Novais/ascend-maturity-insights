import FrameworkBadge from "@/components/FrameworkBadge";
import { normalizeRecommendations, normalizeStrengthsWeaknesses } from "@/lib/report-utils";

type Props = {
  strengths: unknown[];
  weaknesses: unknown[];
  recommendations: unknown[];
};

function InsightList({
  title,
  items,
  tone,
  showFramework,
}: {
  title: string;
  items: unknown[];
  tone: "green" | "red" | "blue";
  showFramework?: boolean;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
        ? "border-red-200 bg-red-50"
        : "border-blue-200 bg-blue-50";

  const normalizedItems = showFramework ? normalizeStrengthsWeaknesses(items) : normalizeRecommendations(items);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      {normalizedItems.length ? (
        <ul className="space-y-2">
          {showFramework
            ? normalizeStrengthsWeaknesses(items).map((item) => (
              <li key={`${item.title}-${item.frameworkRef ?? item.frameworkType ?? "plain"}`} className="rounded-lg bg-white/70 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{item.questionText ?? item.title}</span>
                  <FrameworkBadge
                    frameworkType={item.frameworkType}
                    frameworkRef={item.frameworkRef}
                    frameworkNote={item.frameworkNote}
                  />
                </div>
                {item.summary ? <p className="mt-2 text-muted-foreground">{item.summary}</p> : null}
              </li>
            ))
            : normalizeRecommendations(items).map((item) => (
              <li key={item} className="rounded-lg bg-white/70 px-3 py-2 text-sm">
                {item}
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum item disponivel.</p>
      )}
    </div>
  );
}

export default function ReportInsights({ strengths, weaknesses, recommendations }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <InsightList title="Strengths" items={strengths} tone="green" showFramework />
      <InsightList title="Weaknesses" items={weaknesses} tone="red" showFramework />
      <InsightList title="Recommendations" items={recommendations} tone="blue" />
    </div>
  );
}
