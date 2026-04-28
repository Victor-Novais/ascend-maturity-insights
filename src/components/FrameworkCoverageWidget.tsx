import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { frameworkColors, frameworkLabels, frameworkShortLabels } from "@/lib/frameworks";
import { useAuth } from "@/contexts/AuthContext";
import type { FrameworkType } from "@/lib/types";
import { useFrameworkCoverage } from "@/hooks/useQuestions";

const frameworkOrder: FrameworkType[] = ["COBIT", "ITIL", "ISO_27000", "PROPRIO"];

const chartConfig = {
  COBIT: { label: frameworkShortLabels.COBIT, color: frameworkColors.COBIT },
  ITIL: { label: frameworkShortLabels.ITIL, color: frameworkColors.ITIL },
  ISO_27000: { label: frameworkShortLabels.ISO_27000, color: frameworkColors.ISO_27000 },
  PROPRIO: { label: frameworkShortLabels.PROPRIO, color: frameworkColors.PROPRIO },
};

export default function FrameworkCoverageWidget() {
  const { user } = useAuth();
  const coverageQuery = useFrameworkCoverage();

  if (user?.role !== "ADMIN") {
    return null;
  }

  const data = useMemo(
    () =>
      frameworkOrder.map((frameworkType) => ({
        frameworkType,
        label: frameworkLabels[frameworkType],
        value: coverageQuery.data?.[frameworkType] ?? 0,
        fill: frameworkColors[frameworkType],
      })),
    [coverageQuery.data],
  );

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const mappedTotal = data
    .filter((item) => item.frameworkType !== "PROPRIO")
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Cobertura de Frameworks</CardTitle>
          <p className="text-sm text-muted-foreground">Distribuição das questões por framework</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{mappedTotal}/{total}</p>
          <p className="text-xs text-muted-foreground">mapeadas vs total geral</p>
        </div>
      </CardHeader>
      <CardContent>
        {coverageQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Carregando cobertura...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto h-64 max-w-md">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="frameworkType" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="frameworkType" innerRadius={55} outerRadius={90} strokeWidth={4} />
              <ChartLegend content={<ChartLegendContent nameKey="frameworkType" />} />
            </PieChart>
          </ChartContainer>
        )}
        {!coverageQuery.isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {data.map((item) => (
              <div key={item.frameworkType} className="rounded-xl border bg-muted/20 px-3 py-2">
                <p className="text-muted-foreground">{frameworkShortLabels[item.frameworkType]}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
