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
  const coverageQuery = useFrameworkCoverage();

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

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Cobertura de Frameworks</CardTitle>
          <p className="text-sm text-muted-foreground">Questoes ativas por framework</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">ativas</p>
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
      </CardContent>
    </Card>
  );
}
