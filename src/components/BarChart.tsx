import {
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart as RechartsBarChart,
} from "recharts";

type BarPoint = {
  category: string;
  score: number;
};

type Props = {
  data: BarPoint[];
};

function getBarColor(score: number) {
  if (score < 50) return "#dc2626";
  if (score < 75) return "#f59e0b";
  return "#16a34a";
}

export default function BarChart({ data }: Props) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.category} fill={getBarColor(item.score)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
