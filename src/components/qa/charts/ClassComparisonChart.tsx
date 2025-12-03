"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { ClassComparisonData } from "@/types/qa"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface ClassComparisonChartProps {
  data: ClassComparisonData | null | undefined
  className?: string
}

const chartConfig = {
  value: {
    label: "Giá trị",
  },
  above: {
    label: "Đạt ngưỡng",
    color: "hsl(var(--chart-2))",
  },
  below: {
    label: "Dưới ngưỡng", 
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function ClassComparisonChart({ data, className }: ClassComparisonChartProps) {
  if (!data || !data.classes || data.classes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground text-sm", className)}>
        Không có dữ liệu để hiển thị
      </div>
    )
  }

  const chartData = data.classes.map((cls) => ({
    classCode: cls.classCode,
    classId: cls.classId,
    value: cls.value,
    isBelowThreshold: cls.isBelowThreshold,
    studentCount: cls.studentCount,
  }))

  const metricLabel = data.metricType === "ATTENDANCE" ? "Điểm danh" : "Bài tập"

  return (
    <div className={cn("", className)}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="classCode"
            tick={{ fontSize: 11 }}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            content={
              <ChartTooltipContent
                className="w-[180px]"
                formatter={(value, _name, item) => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{metricLabel}:</span>
                      <span className="font-medium">{Number(value).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Số học viên:</span>
                      <span>{item.payload.studentCount}</span>
                    </div>
                    <Link 
                      to={`/qa/classes/${item.payload.classId}`}
                      className="mt-1"
                    >
                      <Button variant="outline" size="sm" className="w-full h-6 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                )}
              />
            }
          />
          <ReferenceLine
            x={data.threshold}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            label={{
              value: `Ngưỡng ${data.threshold}%`,
              position: "top",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 10,
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isBelowThreshold ? "hsl(var(--destructive))" : "hsl(var(--chart-2))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))]" />
          <span>Đạt ngưỡng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[hsl(var(--destructive))]" />
          <span>Dưới ngưỡng</span>
        </div>
      </div>
    </div>
  )
}
