"use client"

import {
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { CombinedTrendData } from "@/types/qa"

interface CombinedTrendChartProps {
  data: CombinedTrendData | null | undefined
  className?: string
}

const chartConfig = {
  attendance: {
    label: "Điểm danh",
    color: "hsl(var(--chart-1))",
  },
  homework: {
    label: "BTVN",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function CombinedTrendChart({ data, className }: CombinedTrendChartProps) {
  if (!data || !data.dataPoints || data.dataPoints.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground text-sm", className)}>
        Không có dữ liệu xu hướng để hiển thị
      </div>
    )
  }

  const chartData = data.dataPoints.map((point) => ({
    week: `Tuần ${point.weekNumber}`,
    attendance: point.attendanceRate,
    homework: point.homeworkRate,
  }))

  // Helper functions for insight badges
  const getTrendIcon = (changePercent: number | null | undefined) => {
    if (changePercent === null || changePercent === undefined) return <Minus className="h-3 w-3" />
    if (changePercent > 0) return <TrendingUp className="h-3 w-3" />
    if (changePercent < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendVariant = (changePercent: number | null | undefined): "default" | "destructive" | "secondary" => {
    if (changePercent === null || changePercent === undefined) return "secondary"
    if (changePercent > 0) return "default"
    if (changePercent < 0) return "destructive"
    return "secondary"
  }

  return (
    <div className={cn("", className)}>
      {/* Legend + Insight Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span className="text-muted-foreground">Điểm danh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span className="text-muted-foreground">BTVN</span>
          </div>
        </div>
        {(data.attendanceInsight || data.homeworkInsight) && (
          <div className="flex flex-wrap items-center gap-2">
            {data.attendanceInsight && (
              <Badge variant={getTrendVariant(data.attendanceChangePercent)} className="gap-1 text-xs">
                {getTrendIcon(data.attendanceChangePercent)}
                <span>{data.attendanceInsight}</span>
              </Badge>
            )}
            {data.homeworkInsight && (
              <Badge variant={getTrendVariant(data.homeworkChangePercent)} className="gap-1 text-xs">
                {getTrendIcon(data.homeworkChangePercent)}
                <span>{data.homeworkInsight}</span>
              </Badge>
            )}
          </div>
        )}
      </div>

      <ChartContainer config={chartConfig} className="h-52 w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
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
                className="w-[160px]"
                formatter={(value, name) => (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-muted-foreground">
                      {name === "attendance" ? "Điểm danh" : "BTVN"}:
                    </span>
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
              value: "80%",
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
            activeDot={{ r: 5, fill: "hsl(var(--chart-1))" }}
          />
          <Line
            type="monotone"
            dataKey="homework"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--chart-2))" }}
            activeDot={{ r: 5, fill: "hsl(var(--chart-2))" }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
