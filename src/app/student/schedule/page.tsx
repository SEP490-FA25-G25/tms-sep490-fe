import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MapPinIcon,
  NotebookPenIcon,
  RefreshCcwIcon,
  UsersIcon,
} from 'lucide-react'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  type DayOfWeek,
  type SessionSummaryDTO,
  type TimeSlotDTO,
  useGetCurrentWeekQuery,
  useGetSessionDetailQuery,
  useGetWeeklyScheduleQuery,
} from '@/store/services/studentScheduleApi'

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
}

const SESSION_STATUS_STYLES: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  PLANNED: { label: 'Đã lên lịch', className: 'text-amber-600 bg-amber-50 ring-amber-200' },
  DONE: { label: 'Hoàn thành', className: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'text-rose-600 bg-rose-50 ring-rose-200' },
}

const ATTENDANCE_STATUS_STYLES: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  PLANNED: { label: 'Chờ điểm danh', className: 'text-slate-600 bg-slate-100' },
  PRESENT: { label: 'Có mặt', className: 'text-emerald-600 bg-emerald-100' },
  ABSENT: { label: 'Vắng mặt', className: 'text-rose-600 bg-rose-100' },
  LATE: { label: 'Đi trễ', className: 'text-amber-600 bg-amber-100' },
  EXCUSED: { label: 'Có phép', className: 'text-indigo-600 bg-indigo-100' },
  MAKEUP: { label: 'Buổi bù', className: 'text-purple-600 bg-purple-100' },
}

const HOMEWORK_STATUS_STYLES: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  COMPLETED: { label: 'Đã hoàn thành', className: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
  INCOMPLETE: { label: 'Chưa hoàn thành', className: 'text-amber-600 bg-amber-50 ring-amber-200' },
  NO_HOMEWORK: { label: 'Không có bài tập', className: 'text-slate-600 bg-slate-100 ring-slate-200' },
}

const MODALITY_LABELS: Record<string, string> = {
  OFFLINE: 'Học tại trung tâm',
  ONLINE: 'Học trực tuyến',
  HYBRID: 'Kết hợp',
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')

const MATERIAL_TYPE_STYLES: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  pdf: { label: 'PDF', className: 'bg-rose-50 text-rose-600 ring-rose-200' },
  ppt: { label: 'Slide', className: 'bg-amber-50 text-amber-600 ring-amber-200' },
  pptx: { label: 'Slide', className: 'bg-amber-50 text-amber-600 ring-amber-200' },
  doc: { label: 'Tài liệu', className: 'bg-sky-50 text-sky-600 ring-sky-200' },
  docx: { label: 'Tài liệu', className: 'bg-sky-50 text-sky-600 ring-sky-200' },
  xls: { label: 'Bảng tính', className: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  xlsx: { label: 'Bảng tính', className: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  mp4: { label: 'Video', className: 'bg-purple-50 text-purple-600 ring-purple-200' },
  mov: { label: 'Video', className: 'bg-purple-50 text-purple-600 ring-purple-200' },
  txt: { label: 'Ghi chú', className: 'bg-slate-50 text-slate-600 ring-slate-200' },
}

function getMaterialTypeMeta(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return (
    MATERIAL_TYPE_STYLES[ext] ?? { label: 'Tài liệu học tập', className: 'bg-muted text-muted-foreground ring-border/50' }
  )
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  ROOM: 'Phòng học',
  VIRTUAL: 'Lớp trực tuyến',
}

export default function StudentSchedulePage() {
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const {
    data: currentWeekResponse,
    isLoading: isCurrentWeekLoading,
    isError: isCurrentWeekError,
    refetch: refetchCurrentWeek,
  } = useGetCurrentWeekQuery()

  useEffect(() => {
    if (!weekStart && currentWeekResponse?.data) {
      setWeekStart(currentWeekResponse.data)
    }
  }, [currentWeekResponse?.data, weekStart])

  const {
    data: weeklyScheduleResponse,
    isFetching: isScheduleFetching,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useGetWeeklyScheduleQuery(weekStart ?? '', {
    skip: !weekStart,
  })

  const scheduleData = weeklyScheduleResponse?.data

  const dayDateMap = useMemo(() => {
    if (!scheduleData) {
      return null
    }
    const startDate = parseISO(scheduleData.weekStart)
    return DAYS.reduce<Record<DayOfWeek, Date>>((acc, day, index) => {
      acc[day] = addDays(startDate, index)
      return acc
    }, {} as Record<DayOfWeek, Date>)
  }, [scheduleData])

  const weekRangeLabel = useMemo(() => {
    if (!scheduleData) {
      return null
    }
    const start = parseISO(scheduleData.weekStart)
    const end = parseISO(scheduleData.weekEnd)
    return `${format(start, 'dd/MM', { locale: vi })} - ${format(end, 'dd/MM', { locale: vi })}`
  }, [scheduleData])

  const handleWeekChange = useCallback(
    (direction: 'prev' | 'next' | 'current') => {
      if (!scheduleData && direction !== 'current') {
        return
      }
      if (direction === 'current' && currentWeekResponse?.data) {
        setWeekStart(currentWeekResponse.data)
        return
      }
      if (scheduleData) {
        const baseDate = parseISO(scheduleData.weekStart)
        const newDate =
          direction === 'prev' ? addDays(baseDate, -7) : direction === 'next' ? addDays(baseDate, 7) : baseDate
        setWeekStart(format(newDate, 'yyyy-MM-dd'))
      }
    },
    [currentWeekResponse?.data, scheduleData]
  )

  const getSessionForCell = useCallback(
    (day: DayOfWeek, slot: TimeSlotDTO) => {
      if (!scheduleData) return null
      return scheduleData.schedule?.[day]?.find(
        (session: SessionSummaryDTO) => session.timeSlotTemplateId === slot.timeSlotTemplateId
      )
    },
    [scheduleData]
  )

  const isLoading = isCurrentWeekLoading || isScheduleLoading || !weekStart
  const hasError = isCurrentWeekError || isScheduleError
  const hasContent = !!scheduleData && scheduleData.timeSlots.length > 0

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <section className="flex flex-col gap-4 px-4 pb-6 pt-4 lg:px-6">
                <header className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Thời khóa biểu của tôi</h1>
                    <p className="text-muted-foreground">
                      Theo dõi lịch học từng buổi, di chuyển giữa các tuần và mở chi tiết để xem tài liệu, bài tập cùng
                      tình trạng tham gia.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Tuần: <span className="font-medium text-foreground">{weekRangeLabel ?? 'Đang xác định...'}</span>
                      </span>
                    </div>
                    {scheduleData?.studentName ? (
                      <div className="text-sm text-muted-foreground">
                        Sinh viên: <span className="font-medium text-foreground">{scheduleData.studentName}</span>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange('prev')}
                        disabled={!scheduleData || isScheduleFetching}
                        aria-label="Tuần trước"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleWeekChange('next')}
                        disabled={!scheduleData || isScheduleFetching}
                        aria-label="Tuần tiếp theo"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleWeekChange('current')}
                        disabled={!currentWeekResponse?.data || isScheduleFetching}
                      >
                        <RefreshCcwIcon className="mr-2 h-4 w-4" />
                        Tuần hiện tại
                      </Button>
                    </div>
                  </div>
                </header>

                {isLoading && (
                  <div className="space-y-3 rounded-3xl border border-border/60 bg-card/30 p-6">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                )}

                {hasError && (
                  <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
                    <p className="font-medium text-destructive">Không thể tải thời khóa biểu.</p>
                    <p className="mt-1 text-sm text-destructive/80">
                      Vui lòng kiểm tra kết nối và thử lại. Nếu lỗi tiếp diễn, hãy liên hệ bộ phận hỗ trợ.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => refetchSchedule()} variant="default">
                        Thử tải lại lịch
                      </Button>
                      <Button onClick={() => refetchCurrentWeek()} variant="outline">
                        Làm mới tuần hiện tại
                      </Button>
                    </div>
                  </div>
                )}

                {!isLoading && !hasError && !hasContent && (
                  <div className="rounded-3xl border border-dashed border-muted-foreground/40 bg-background/60 p-10 text-center">
                    <p className="text-lg font-medium text-foreground">Hiện chưa có thời khóa biểu</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Hệ thống sẽ hiển thị buổi học ngay khi bạn được xếp lịch. Hãy kiểm tra lại sau.
                    </p>
                  </div>
                )}

                {!isLoading && !hasError && hasContent && scheduleData && dayDateMap && (
                  <section className="rounded-3xl border border-border/60 bg-card/30">
                    <div className="overflow-x-auto">
                      <div className="min-w-[960px] divide-y divide-border/60">
                        <div
                          className="grid"
                          style={{
                            gridTemplateColumns: `160px repeat(${DAYS.length}, minmax(0, 1fr))`,
                          }}
                        >
                          <div className="bg-muted/40 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Khung giờ
                          </div>
                          {DAYS.map((day) => (
                            <div key={day} className="bg-muted/40 px-4 py-4">
                              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {DAY_LABELS[day]}
                              </div>
                              <div className="text-base font-semibold text-foreground">
                                {format(dayDateMap[day], 'dd/MM', { locale: vi })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {scheduleData.timeSlots.map((slot) => (
                          <div
                            key={slot.timeSlotTemplateId}
                            className="grid"
                            style={{
                              gridTemplateColumns: `160px repeat(${DAYS.length}, minmax(0, 1fr))`,
                            }}
                          >
                            <div className="border-r border-border/60 bg-muted/20 px-4 py-5">
                              <p className="text-sm font-semibold text-foreground">{slot.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                              </p>
                            </div>
                            {DAYS.map((day) => {
                              const session = getSessionForCell(day, slot)
                              const sessionStatus = session ? SESSION_STATUS_STYLES[session.sessionStatus] : null
                              const attendanceStatus = session
                                ? ATTENDANCE_STATUS_STYLES[session.attendanceStatus]
                                : null
                              const locationLabel = session
                                ? session.location?.trim() ||
                                  (session.modality === 'ONLINE' ? 'Học trực tuyến' : session.branchName)
                                : ''
                              return (
                                <button
                                  key={`${day}-${slot.timeSlotTemplateId}`}
                                  type="button"
                                  onClick={() => session && setSelectedSessionId(session.sessionId)}
                                  disabled={!session}
                                  className={cn(
                                    'group flex h-full w-full flex-col border-r border-border/60 p-4 text-left transition',
                                    session
                                      ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
                                      : 'opacity-80'
                                  )}
                                >
                                  {session ? (
                                    <div className="flex flex-1 flex-col rounded-2xl bg-primary/5 p-3 ring-1 ring-primary/15 group-hover:bg-primary/10">
                                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                        <span>{session.classCode}</span>
                                        {session.isMakeup && (
                                          <Badge variant="outline" className="border-purple-300 bg-purple-50 text-[10px] text-purple-700">
                                            Buổi bù
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                                        {session.topic || session.className}
                                      </p>
                                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                        {locationLabel}
                                      </p>
                                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                                        {sessionStatus ? (
                                          <span
                                            className={cn(
                                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                                              sessionStatus.className
                                            )}
                                          >
                                            {sessionStatus.label}
                                          </span>
                                        ) : null}
                                        {attendanceStatus ? (
                                          <span
                                            className={cn(
                                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                              attendanceStatus.className
                                            )}
                                          >
                                            {attendanceStatus.label}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/50 text-xs text-muted-foreground transition group-hover:border-muted-foreground/80">
                                      Không có buổi học
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <SessionDetailDialog sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </StudentRoute>
  )
}

interface SessionDetailDialogProps {
  sessionId: number | null
  onClose: () => void
}

function SessionDetailDialog({ sessionId, onClose }: SessionDetailDialogProps) {
  const { data, isLoading, isError, refetch } = useGetSessionDetailQuery(sessionId ?? 0, {
    skip: !sessionId,
  })

  const detail = data?.data
  const classroomResource = detail?.classroomResource ?? null
  const attendanceBadge = detail
    ? ATTENDANCE_STATUS_STYLES[detail.studentStatus.attendanceStatus] ?? null
    : null
  const homeworkBadge = detail ? HOMEWORK_STATUS_STYLES[detail.studentStatus.homeworkStatus] ?? null : null
  const sessionStatus = detail ? SESSION_STATUS_STYLES[detail.sessionInfo.sessionStatus] ?? null : null
  const locationDisplay = detail
    ? classroomResource?.location ||
      detail.sessionInfo.location ||
      detail.sessionInfo.onlineLink ||
      (detail.classInfo.modality === 'ONLINE' ? 'Học trực tuyến' : detail.classInfo.branchName)
    : 'Chưa cập nhật'
  const resourceTypeLabel = classroomResource
    ? RESOURCE_TYPE_LABELS[classroomResource.resourceType] ?? classroomResource.resourceType
    : null

  const resolveMaterialUrl = useCallback((fileUrl: string) => {
    if (!fileUrl) {
      return '#'
    }
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }
    return `${API_BASE_URL}${fileUrl}`
  }, [])

  return (
    <Dialog open={!!sessionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {detail ? `${detail.classInfo.className} · ${detail.classInfo.classCode}` : 'Chi tiết buổi học'}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${format(parseISO(detail.date), "EEEE, dd/MM/yyyy", { locale: vi })} · ${detail.startTime.slice(
                  0,
                  5
                )} - ${detail.endTime.slice(0, 5)}`
              : 'Đang tải thông tin'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="font-medium text-destructive">Không thể tải chi tiết buổi học.</p>
            <p className="mt-1 text-sm text-destructive/80">
              Buổi học có thể đã bị xóa hoặc bạn không còn quyền truy cập.
            </p>
            <Button className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {detail && !isLoading && !isError && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {sessionStatus ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ring-1',
                    sessionStatus.className
                  )}
                >
                  {sessionStatus.label}
                </span>
              ) : null}
              {attendanceBadge ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold',
                    attendanceBadge.className
                  )}
                >
                  {attendanceBadge.label}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
                {MODALITY_LABELS[detail.classInfo.modality] ?? detail.classInfo.modality}
              </span>
              {detail.makeupInfo?.isMakeup && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
                  Buổi học bù
                </span>
              )}
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/10 p-4 md:grid-cols-2">
              <InfoRow
                title="Chủ đề"
                value={detail.sessionInfo.topic || 'Chưa cập nhật'}
                icon={<NotebookPenIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <InfoRow
                title="Giảng viên"
                value={detail.classInfo.teacherName}
                icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <InfoRow
                title="Địa điểm / link"
                value={locationDisplay}
                icon={<MapPinIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <InfoRow
                title="Chi nhánh"
                value={detail.classInfo.branchName}
                icon={<MapPinIcon className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {classroomResource && (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Thông tin phòng học</h3>
                  {resourceTypeLabel && (
                    <Badge variant="outline" className="border-border/60 text-xs">
                      {resourceTypeLabel}
                    </Badge>
                  )}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Phòng / Lớp</p>
                    <p className="font-medium text-foreground">
                      {classroomResource.resourceName || 'Chưa cập nhật'}
                    </p>
                    {classroomResource.resourceCode && (
                      <p className="text-xs text-muted-foreground">Mã: {classroomResource.resourceCode}</p>
                    )}
                  </div>
                  {typeof classroomResource.capacity === 'number' && classroomResource.capacity > 0 && (
                    <div>
                      <p className="text-muted-foreground">Sức chứa</p>
                      <p className="flex items-center gap-1 font-medium text-foreground">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        {classroomResource.capacity} học viên
                      </p>
                    </div>
                  )}
                  {classroomResource.location && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Địa chỉ</p>
                      <p className="font-medium text-foreground">{classroomResource.location}</p>
                    </div>
                  )}
                </div>
                {classroomResource.onlineLink && (
                  <Button asChild variant="secondary" size="sm">
                    <a href={classroomResource.onlineLink} target="_blank" rel="noreferrer">
                      Tham gia lớp trực tuyến
                    </a>
                  </Button>
                )}
              </div>
            )}

            {detail.sessionInfo.description && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/80 p-4">
                <h3 className="text-sm font-semibold text-foreground">Nội dung buổi học</h3>
                <p className="text-sm text-muted-foreground">{detail.sessionInfo.description}</p>
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex items-center gap-2">
                <NotebookPenIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Trạng thái của tôi</h3>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Điểm danh</p>
                  <p className="font-medium text-foreground">
                    {attendanceBadge ? attendanceBadge.label : 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bài tập</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {homeworkBadge ? (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
                          homeworkBadge.className
                        )}
                      >
                        {homeworkBadge.label}
                      </span>
                    ) : (
                      <span className="font-medium text-foreground">{detail.studentStatus.homeworkStatus}</span>
                    )}
                  </div>
                </div>
              </div>
              {detail.studentStatus.homeworkDescription && (
                <p className="text-sm text-muted-foreground">📝 {detail.studentStatus.homeworkDescription}</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex items-center gap-2">
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Tài liệu buổi học</h3>
              </div>
              {detail.materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">Giáo viên chưa đăng tải tài liệu.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.materials.map((material) => {
                    const typeMeta = getMaterialTypeMeta(material.fileName)
                    const uploadedLabel = material.uploadedAt
                      ? `Cập nhật ${format(parseISO(material.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}`
                      : 'Chưa có thời gian tải lên'
                    return (
                      <li
                        key={material.materialId}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-foreground">{material.fileName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                                typeMeta.className
                              )}
                            >
                              {typeMeta.label}
                            </span>
                            <span>{uploadedLabel}</span>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <a href={resolveMaterialUrl(material.fileUrl)} target="_blank" rel="noreferrer">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Tải xuống
                          </a>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {detail.makeupInfo?.isMakeup && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <h3 className="font-semibold">Thông tin buổi học bù</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <p>Buổi gốc: #{detail.makeupInfo.originalSessionId}</p>
                  {detail.makeupInfo.originalDate && (
                    <p>
                      Ngày gốc:{' '}
                      {format(parseISO(detail.makeupInfo.originalDate), 'dd/MM/yyyy', {
                        locale: vi,
                      })}
                    </p>
                  )}
                  {detail.makeupInfo.reason && <p>Lý do: {detail.makeupInfo.reason}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-transparent bg-background/80 px-3 py-2">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
