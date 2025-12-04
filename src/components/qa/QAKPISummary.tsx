"use client"

import { QAStatsCard } from "./QAStatsCard"
import { School, Users, UserCheck, BookOpen } from "lucide-react"
import type { KPISummary } from "@/types/qa"
import { cn } from "@/lib/utils"

interface QAKPISummaryProps {
  data: KPISummary | null | undefined
  className?: string
}

export function QAKPISummary({ data, className }: QAKPISummaryProps) {
  if (!data) {
    return null
  }

  // Format percentage display
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className={cn("grid gap-3 grid-cols-2 lg:grid-cols-4", className)}>
      {/* Số lớp đang giám sát */}
      <QAStatsCard
        title="Lớp đang giám sát"
        value={data.ongoingClassesCount}
        subtitle="lớp đang học"
        icon={School}
        iconClassName="bg-blue-100 dark:bg-blue-900/30"
      />

      {/* Tổng số học viên */}
      <QAStatsCard
        title="Học viên đang học"
        value={data.totalStudentsCount}
        subtitle="học viên enrolled"
        icon={Users}
        iconClassName="bg-green-100 dark:bg-green-900/30"
      />

      {/* Điểm danh TB */}
      <QAStatsCard
        title="Điểm danh TB"
        value={formatPercent(data.averageAttendanceRate)}
        subtitle={data.averageAttendanceRate >= 80 ? "đạt chuẩn" : "dưới ngưỡng 80%"}
        icon={UserCheck}
        iconClassName={data.averageAttendanceRate >= 80 
          ? "bg-emerald-100 dark:bg-emerald-900/30" 
          : "bg-amber-100 dark:bg-amber-900/30"}
      />

      {/* BTVN TB */}
      <QAStatsCard
        title="Hoàn thành BTVN"
        value={formatPercent(data.averageHomeworkRate)}
        subtitle={data.averageHomeworkRate >= 70 ? "đạt chuẩn" : "dưới ngưỡng 70%"}
        icon={BookOpen}
        iconClassName={data.averageHomeworkRate >= 70 
          ? "bg-violet-100 dark:bg-violet-900/30" 
          : "bg-amber-100 dark:bg-amber-900/30"}
      />
    </div>
  )
}
