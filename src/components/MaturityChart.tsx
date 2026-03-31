import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";

type Props = {
  categoryScores: Record<string, number>;
};

const categoryLabels: Record<string, string> = {
  GOVERNANCA: "Governança",
  SEGURANCA: "Segurança",
  PROCESSOS: "Processos",
  INFRAESTRUTURA: "Infraestrutura",
  CULTURA: "Cultura",
};

export default function MaturityChart({ categoryScores }: Props) {
  const data = Object.entries(categoryScores).map(([category, value]) => ({
    category: categoryLabels[category] ?? category,
    score: value,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | string) => [`${Number(value).toFixed(0)}%`, "Score"]}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
