"use client"

import {
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { TrendData } from "@/types/qa"

interface TrendChartProps {
  data: TrendData | null | undefined
  metricLabel: string
  className?: string
}

const chartConfig = {
  value: {
    label: "Giá trị",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TrendChart({ data, metricLabel, className }: TrendChartProps) {
  if (!data || !data.dataPoints || data.dataPoints.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground text-sm", className)}>
        Không có dữ liệu xu hướng để hiển thị
      </div>
    )
  }

  const chartData = data.dataPoints.map((point) => ({
    week: `Tuần ${point.weekNumber}`,
    value: point.value,
  }))

  // Calculate trend info
  const getTrendIcon = () => {
    if (!data.changePercent) return <Minus className="h-3 w-3" />
    if (data.changePercent > 0) return <TrendingUp className="h-3 w-3" />
    if (data.changePercent < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendVariant = (): "default" | "destructive" | "secondary" => {
    if (!data.changePercent) return "secondary"
    if (data.changePercent > 0) return "default"
    if (data.changePercent < 0) return "destructive"
    return "secondary"
  }

  return (
    <div className={cn("", className)}>
      {/* Insight Badge */}
      {data.insight && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={getTrendVariant()} className="gap-1">
            {getTrendIcon()}
            {data.changePercent !== null && data.changePercent !== undefined && (
              <span>
                {data.changePercent > 0 ? "+" : ""}
                {data.changePercent.toFixed(1)}%
              </span>
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">{data.insight}</span>
        </div>
      )}

      <ChartContainer config={chartConfig} className="h-56 w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11 }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "5 5" }}
            content={
              <ChartTooltipContent
                className="w-[140px]"
                formatter={(value) => (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{metricLabel}:</span>
                    <span className="font-medium">{Number(value).toFixed(1)}%</span>
                  </div>
                )}
              />
            }
          />
          <ReferenceLine
            y={80}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            label={{
              value: "Ngưỡng 80%",
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="transparent"
            fill="url(#trendGradient)"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
            activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
