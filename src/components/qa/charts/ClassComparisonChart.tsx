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
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const navigate = useNavigate()

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

  // Handle bar click to navigate to class detail
  const handleBarClick = (data: { classId: number }) => {
    navigate(`/qa/classes/${data.classId}`)
  }

  // Calculate dynamic height based on number of classes
  const barHeight = 40 // Height per bar in pixels
  const minHeight = 200
  const maxVisibleBars = 8
  const totalBars = chartData.length
  
  // If more than maxVisibleBars, use scroll with fixed container height
  const needsScroll = totalBars > maxVisibleBars
  const chartHeight = needsScroll 
    ? totalBars * barHeight 
    : Math.max(minHeight, totalBars * barHeight)
  const containerHeight = needsScroll 
    ? maxVisibleBars * barHeight 
    : chartHeight

  // Custom tick component for YAxis to handle long class codes
  const CustomYAxisTick = (props: { x: number; y: number; payload: { value: string } }) => {
    const { x, y, payload } = props
    const text = payload.value || ""
    
    // If text is short enough, render normally
    if (text.length <= 12) {
      return (
        <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="currentColor">
          {text}
        </text>
      )
    }
    
    // For longer text, split and wrap
    const midPoint = Math.ceil(text.length / 2)
    // Find a good break point (prefer hyphen or near middle)
    let breakIndex = text.lastIndexOf('-', midPoint + 3)
    if (breakIndex < midPoint - 5 || breakIndex === -1) {
      breakIndex = midPoint
    } else {
      breakIndex += 1 // Include the hyphen in first line
    }
    
    const line1 = text.slice(0, breakIndex)
    const line2 = text.slice(breakIndex)
    
    return (
      <text x={x} y={y} textAnchor="end" fontSize={10} fill="currentColor">
        <tspan x={x} dy={-4}>{line1}</tspan>
        <tspan x={x} dy={12}>{line2}</tspan>
      </text>
    )
  }

  return (
    <div className={cn("", className)}>
      {/* Scrollable chart container */}
      <ScrollArea 
        className="w-full" 
        style={{ height: containerHeight + 40 }} // +40 for x-axis
      >
        <ChartContainer config={chartConfig} style={{ height: chartHeight + 40, width: '100%' }} className="cursor-pointer">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 50, left: 10, bottom: 10 }}
            onClick={(state) => {
              if (state?.activePayload?.[0]?.payload?.classId) {
                handleBarClick({ classId: state.activePayload[0].payload.classId })
              }
            }}
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
              tick={CustomYAxisTick}
              width={110}
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
                    <div className="text-xs text-muted-foreground text-center mt-1 pt-1 border-t">
                      Nhấn để xem chi tiết
                    </div>
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
      </ScrollArea>
      
      {/* Show scroll hint when needed */}
      {needsScroll && (
        <div className="text-center text-xs text-muted-foreground mt-1">
          Hiển thị {totalBars} lớp • Cuộn để xem thêm
        </div>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))] shrink-0" />
          <span>Đạt ngưỡng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[hsl(var(--destructive))] shrink-0" />
          <span>Dưới ngưỡng</span>
        </div>
      </div>
    </div>
  )
}
