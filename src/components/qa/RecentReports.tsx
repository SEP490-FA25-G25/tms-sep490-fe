"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText, ChevronRight, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { QAReportStatusBadge } from "./QAReportStatusBadge"
import type { RecentReport } from "@/types/qa"

// Map report type to Vietnamese
const reportTypeLabels: Record<string, string> = {
  CLASSROOM_OBSERVATION: "Quan sát lớp học",
  PHASE_REVIEW: "Đánh giá giai đoạn",
  CLO_ACHIEVEMENT_ANALYSIS: "Phân tích CLO",
  STUDENT_FEEDBACK_ANALYSIS: "Phân tích feedback",
  ATTENDANCE_ENGAGEMENT_REVIEW: "Đánh giá chuyên cần",
  TEACHING_QUALITY_ASSESSMENT: "Đánh giá chất lượng GD",
}

interface RecentReportsProps {
  data: RecentReport[] | null | undefined
  className?: string
}

export function RecentReports({ data, className }: RecentReportsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Báo Cáo Đã Submit
          </CardTitle>
          <Link to="/qa/reports/create">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Tạo mới
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Chưa có báo cáo nào được submit.
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((report) => (
              <Link
                key={report.reportId}
                to={`/qa/reports/${report.reportId}`}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {reportTypeLabels[report.reportType] || report.reportType}
                    </span>
                    <QAReportStatusBadge status={report.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{report.classCode}</span>
                    {report.createdDate && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(report.createdDate).toLocaleDateString('vi-VN')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
            
            <Link to="/qa/reports" className="block">
              <Button variant="ghost" size="sm" className="w-full h-8 text-xs mt-2">
                Xem tất cả báo cáo
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
