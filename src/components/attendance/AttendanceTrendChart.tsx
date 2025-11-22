import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceTrendChartProps {
  data: Array<{
    month: string;
    attendanceRate: number;
    totalSessions: number;
    presentSessions: number;
  }>;
  className?: string;
}

const chartConfig = {
  attendanceRate: {
    label: "Tỷ lệ điểm danh",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function AttendanceTrendChart({ data, className }: AttendanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Xu hướng điểm danh</CardTitle>
          <CardDescription>
            Không có đủ dữ liệu để hiển thị biểu đồ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Chưa có dữ liệu điểm danh
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const recentRates = data.slice(-3).map(d => d.attendanceRate);
  const previousRates = data.slice(-6, -3).map(d => d.attendanceRate);
  const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
  const previousAvg = previousRates.length > 0
    ? previousRates.reduce((a, b) => a + b, 0) / previousRates.length
    : recentAvg;

  const trend = recentAvg - previousAvg;
  const TrendIcon = trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
  const trendColor = trend > 2 ? "text-success" : trend < -2 ? "text-destructive" : "text-muted-foreground";
  const trendText = trend > 2 ? "Cải thiện" : trend < -2 ? "Giảm" : "Ổn định";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Xu hướng điểm danh</CardTitle>
            <CardDescription>
              Tỷ lệ điểm danh theo tháng trong 6 tháng gần nhất
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon className={cn("h-4 w-4", trendColor)} />
            <span className={cn("text-sm font-medium", trendColor)}>
              {trendText}
            </span>
            <span className="text-sm text-muted-foreground">
              ({trend > 0 ? "+" : ""}{trend.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Tháng ${label}`}
                  formatter={(value, name) => {
                    if (name === "attendanceRate") {
                      return [`${Number(value).toFixed(1)}%`, "Tỷ lệ điểm danh"];
                    }
                    return [value, name];
                  }}
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="attendanceRate"
              fill="var(--color-attendanceRate)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}