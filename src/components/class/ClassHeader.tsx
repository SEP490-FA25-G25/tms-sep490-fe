import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ClassDetailDTO, ClassStatus, SessionDTO } from '@/types/studentClass'
import { CLASS_STATUSES, MODALITIES } from '@/types/studentClass'
import { BookOpen, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { AttendanceProgressRing } from './AttendanceProgressRing'

interface ClassHeaderProps {
  classDetail: ClassDetailDTO
  attendanceRate?: number
  sessionStats?: { 
    completed: number; 
    total: number;
    present: number;
    absent: number;
    excused?: number;
    future: number;
    attendanceRate?: number;
  }
  nextSession?: SessionDTO
}

const STATUS_STYLES: Record<ClassStatus, string> = {
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  DRAFT: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatNextSession = (nextSession?: SessionDTO, status?: ClassStatus) => {
  if (!nextSession) {
    if (status === 'COMPLETED' || status === 'CANCELLED') return 'Đã kết thúc'
    return 'Chưa có lịch'
  }

  const date = new Date(nextSession.date).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })

  return `${date} • ${nextSession.startTime} - ${nextSession.endTime}`
}

export function ClassHeader({ classDetail, attendanceRate, sessionStats, nextSession }: ClassHeaderProps) {
  const primaryTeacher = classDetail.teachers.find((t) => t.isPrimaryInstructor) ?? classDetail.teachers[0]
  const teacherCount = classDetail.teachers.length
  const attendanceAlert = attendanceRate !== undefined && attendanceRate < 80
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
                <Badge className={cn('text-xs', STATUS_STYLES[classDetail.status])}>
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

            <div className="flex flex-col items-start lg:items-end gap-3">
              <div className="space-y-1 text-left lg:text-right">
                <div className="text-sm text-muted-foreground mb-4">Điểm danh & tiến độ</div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1 text-sm">
                     <div className="text-muted-foreground">
                        Đã học: <span className="font-medium text-foreground">{sessionStats?.completed ?? 0}/{sessionStats?.total ?? 0}</span>
                     </div>
                     <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5" title="Có mặt">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span>{sessionStats?.present ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Vắng">
                           <div className="w-2 h-2 rounded-full bg-rose-500" />
                           <span>{sessionStats?.absent ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Vắng có phép">
                           <div className="w-2 h-2 rounded-full bg-indigo-500" />
                           <span>{sessionStats?.excused ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Chưa diễn ra">
                           <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                           <span>{sessionStats?.future ?? 0}</span>
                        </div>
                     </div>
                  </div>

                  <AttendanceProgressRing 
                    present={sessionStats?.present || 0}
                    absent={sessionStats?.absent || 0}
                    excused={sessionStats?.excused || 0}
                    future={sessionStats?.future || 0}
                    size={64}
                    strokeWidth={6}
                    textClassName={attendanceAlert ? 'text-destructive' : 'text-primary'}
                  />
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  Tiếp theo: <span className="text-foreground">{formatNextSession(nextSession, classDetail.status)}</span>
                </p>
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
