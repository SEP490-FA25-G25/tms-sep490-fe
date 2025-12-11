import { Badge } from '@/components/ui/badge'
import { ClassStatusBadge } from '@/components/qa/ClassStatusBadge'
import type { ClassDetailDTO } from '@/store/services/classApi'
import { BookOpen, Calendar, Clock, MapPin, Users, CheckCircle, BookCheck, Phone, Building2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface ClassInfoHeaderProps {
  classData: ClassDetailDTO
  actions?: ReactNode
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getModalityLabel = (modality: string) => {
  switch (modality) {
    case 'ONLINE':
      return 'Trực tuyến'
    case 'OFFLINE':
      return 'Trực tiếp'
    default:
      return modality
  }
}

export function ClassInfoHeader({ classData, actions }: ClassInfoHeaderProps) {
  const enrollment = classData.enrollmentSummary?.currentEnrolled ?? 0
  const capacity = classData.enrollmentSummary?.maxCapacity ?? classData.maxCapacity ?? 0
  const completedSessions = classData.sessionSummary?.completedSessions ?? 0
  const totalSessions = classData.sessionSummary?.totalSessions ?? 0
  const attendanceRate = classData.performanceMetrics?.attendanceRate ?? 0
  const homeworkRate = classData.performanceMetrics?.homeworkCompletionRate ?? 0

  // Build schedule display from scheduleDetails
  const scheduleDisplay = classData.scheduleDetails && classData.scheduleDetails.length > 0
    ? classData.scheduleDetails.map(d => `${d.day} ${d.startTime}-${d.endTime}`).join(', ')
    : classData.scheduleSummary || 'Chưa có lịch'

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <ClassStatusBadge status={classData.status} />
                <Badge variant="outline" className="text-xs">
                  {getModalityLabel(classData.modality)}
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classData.name}
                </h1>
                <p className="text-lg text-muted-foreground">{classData.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Khóa học: {classData.subject?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Chi nhánh: {classData.branch?.name}</span>
                </div>
                {classData.branch?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {classData.branch.address}
                      {classData.branch.district && `, ${classData.branch.district}`}
                      {classData.branch.city && `, ${classData.branch.city}`}
                    </span>
                  </div>
                )}
                {classData.branch?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{classData.branch.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Bắt đầu: {formatDate(classData.startDate)}</span>
                </div>
                {(classData.plannedEndDate || classData.actualEndDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Kết thúc: {formatDate(classData.actualEndDate || classData.plannedEndDate)}</span>
                  </div>
                )}
              </div>
              {/* Schedule display - separate line */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Lịch học: {scheduleDisplay}</span>
                </div>
              </div>
            </div>

            {/* Action Button slot */}
            {actions && <div className="shrink-0">{actions}</div>}
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
