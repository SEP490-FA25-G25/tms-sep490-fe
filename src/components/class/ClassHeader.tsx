import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CLASS_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors'
import type { ClassDetailDTO } from '@/types/studentClass'
import { CLASS_STATUSES, MODALITIES } from '@/types/studentClass'
import { BookOpen, Calendar, Clock, MapPin, Users } from 'lucide-react'

interface ClassHeaderProps {
  classDetail: ClassDetailDTO
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ClassHeader({ classDetail }: ClassHeaderProps) {
  const primaryTeacher = classDetail.teachers.find((t) => t.isPrimaryInstructor) ?? classDetail.teachers[0]
  const teacherCount = classDetail.teachers.length
  const scheduleDisplay = classDetail.scheduleSummary || 'Chưa có lịch'
  const locationDisplay = classDetail.modality === 'ONLINE' ? 'Online' : classDetail.branch?.name || '—'
  const enrollment = classDetail.enrollmentSummary?.totalEnrolled ?? 0
  const capacity = classDetail.enrollmentSummary?.maxCapacity ?? classDetail.maxCapacity ?? 0

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn('text-xs', getStatusStyle(CLASS_STATUS_STYLES, classDetail.status))}>
                  {CLASS_STATUSES[classDetail.status]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {MODALITIES[classDetail.modality]}
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classDetail.name}
                </h1>
                <p className="text-lg text-muted-foreground">{classDetail.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Môn học: {classDetail.course?.name}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Giáo viên</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {primaryTeacher?.teacherName || 'Chưa phân công'}
                {teacherCount > 1 && (
                  <span className="text-xs text-muted-foreground"> +{teacherCount - 1}</span>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Lịch học</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{scheduleDisplay}</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Địa điểm</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{locationDisplay}</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Thời gian</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(classDetail.startDate)} - {formatDate(classDetail.plannedEndDate || classDetail.actualEndDate)}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Sĩ số</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {enrollment}/{capacity || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
