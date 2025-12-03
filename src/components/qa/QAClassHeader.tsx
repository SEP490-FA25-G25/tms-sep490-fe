import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClassStatusBadge } from '@/components/qa/ClassStatusBadge'
import type { QAClassDetailDTO } from '@/types/qa'
import { BookOpen, Calendar, Clock, MapPin, Users, CheckCircle, BookCheck, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QAClassHeaderProps {
  classInfo: QAClassDetailDTO
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function QAClassHeader({ classInfo }: QAClassHeaderProps) {
  const enrollment = classInfo.currentEnrollment ?? 0
  const capacity = classInfo.maxCapacity ?? 0
  const completedSessions = classInfo.sessionSummary?.completedSessions ?? 0
  const totalSessions = classInfo.sessionSummary?.totalSessions ?? 0
  const attendanceRate = classInfo.performanceMetrics?.attendanceRate ?? 0
  const homeworkRate = classInfo.performanceMetrics?.homeworkCompletionRate ?? 0

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <ClassStatusBadge status={classInfo.status} />
                <Badge variant="outline" className="text-xs">
                  {classInfo.modality}
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classInfo.className}
                </h1>
                <p className="text-lg text-muted-foreground">{classInfo.classCode}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Khóa học: {classInfo.courseName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Chi nhánh: {classInfo.branchName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Bắt đầu: {formatDate(classInfo.startDate)}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0">
              <Button asChild>
                <Link to={`/qa/reports/create?classId=${classInfo.classId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Báo Cáo QA
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats grid - responsive */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-card shadow-sm p-2 sm:p-3 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate">Sĩ số</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {enrollment}/{capacity}
              </p>
            </div>

            <div className="rounded-lg border bg-card shadow-sm p-2 sm:p-3 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate">Tiến độ</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {completedSessions}/{totalSessions}
              </p>
            </div>

            <div className="rounded-lg border bg-card shadow-sm p-2 sm:p-3 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate">Điểm danh</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {attendanceRate.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-lg border bg-card shadow-sm p-2 sm:p-3 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate">Bài tập</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {homeworkRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
