import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCcwIcon,
  MapPinIcon,
  NotebookPenIcon,
  UsersIcon,
} from 'lucide-react'

import { TeacherRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  useGetCurrentWeekQuery,
  useGetSessionDetailQuery,
  useGetWeeklyScheduleQuery,
} from '@/store/services/teacherScheduleApi'
import { TeacherCalendarView } from './components/TeacherCalendarView'

const SESSION_STATUS_STYLES: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PLANNED: {
    label: "Đã lên lịch",
    className: "text-amber-600 bg-amber-50 ring-amber-200",
  },
  DONE: {
    label: "Hoàn thành",
    className: "text-emerald-600 bg-emerald-50 ring-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "text-rose-600 bg-rose-50 ring-rose-200",
  },
};

const MODALITY_LABELS: Record<string, string> = {
  OFFLINE: "Học tại trung tâm",
  ONLINE: "Học trực tuyến",
  HYBRID: "Kết hợp",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8080" : "");

const MATERIAL_TYPE_STYLES: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  pdf: { label: "PDF", className: "bg-rose-50 text-rose-600 ring-rose-200" },
  ppt: {
    label: "Slide",
    className: "bg-amber-50 text-amber-600 ring-amber-200",
  },
  pptx: {
    label: "Slide",
    className: "bg-amber-50 text-amber-600 ring-amber-200",
  },
  doc: { label: "Tài liệu", className: "bg-sky-50 text-sky-600 ring-sky-200" },
  docx: { label: "Tài liệu", className: "bg-sky-50 text-sky-600 ring-sky-200" },
  xls: {
    label: "Bảng tính",
    className: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  xlsx: {
    label: "Bảng tính",
    className: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  mp4: {
    label: "Video",
    className: "bg-purple-50 text-purple-600 ring-purple-200",
  },
  mov: {
    label: "Video",
    className: "bg-purple-50 text-purple-600 ring-purple-200",
  },
  txt: {
    label: "Ghi chú",
    className: "bg-slate-50 text-slate-600 ring-slate-200",
  },
};

function getMaterialTypeMeta(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return (
    MATERIAL_TYPE_STYLES[ext] ?? {
      label: "Tài liệu học tập",
      className: "bg-muted text-muted-foreground ring-border/50",
    }
  );
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  ROOM: "Phòng học",
  VIRTUAL: "Lớp trực tuyến",
};

export default function TeacherSchedulePage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)

  const {
    data: currentWeekResponse,
    isLoading: isCurrentWeekLoading,
    isError: isCurrentWeekError,
    refetch: refetchCurrentWeek,
  } = useGetCurrentWeekQuery()

  // Initialize weekStart and selectedYear only on first load
  useEffect(() => {
    if (weekStart === null) {
      if (currentWeekResponse?.data) {
        setWeekStart(currentWeekResponse.data)
        // Set selected year based on current week
        const currentWeekDate = parseISO(currentWeekResponse.data)
        setSelectedYear(currentWeekDate.getFullYear())
      } else if (isCurrentWeekError) {
        const fallbackWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        setWeekStart(format(fallbackWeekStart, 'yyyy-MM-dd'))
        setSelectedYear(fallbackWeekStart.getFullYear())
      }
    }
  }, [currentWeekResponse?.data, isCurrentWeekError, weekStart])

  const {
    data: weeklyScheduleResponse,
    isFetching: isScheduleFetching,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useGetWeeklyScheduleQuery(
    {
      weekStart: weekStart ?? '',
    },
    {
      skip: !weekStart,
      refetchOnMountOrArgChange: true,
    }
  )

  const scheduleData = weeklyScheduleResponse?.data

  // Year options: previous year, current year, next year
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => [
    { value: currentYear - 1, label: `${currentYear - 1}` },
    { value: currentYear, label: `${currentYear}` },
    { value: currentYear + 1, label: `${currentYear + 1}` },
  ], [currentYear])

  // Get current week start for highlighting
  const currentWeekStartDate = useMemo(() => {
    return currentWeekResponse?.data
      ? parseISO(currentWeekResponse.data)
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  }, [currentWeekResponse?.data])

  // Generate all weeks for the selected year
  const weekOptionsForYear = useMemo(() => {
    const options: Array<{ value: string; label: string; isCurrentWeek: boolean }> = []
    
    // Start from first Monday of/before Jan 1st
    const jan1 = new Date(selectedYear, 0, 1)
    let weekStartDate = startOfWeek(jan1, { weekStartsOn: 1 })
    
    // If the week starts in previous year and has less than 4 days in selected year,
    // move to next week (ISO week numbering logic)
    if (weekStartDate.getFullYear() < selectedYear) {
      const daysInSelectedYear = 7 - weekStartDate.getDate() + 1
      if (daysInSelectedYear < 4) {
        weekStartDate = addDays(weekStartDate, 7)
      }
    }
    
    const nextYearStart = new Date(selectedYear + 1, 0, 1)
    let weekNumber = 1
    
    while (weekStartDate < nextYearStart) {
      const weekEndDate = addDays(weekStartDate, 6)
      const isCurrentWeek = format(weekStartDate, 'yyyy-MM-dd') === format(currentWeekStartDate, 'yyyy-MM-dd')
      
      // Format label with week number
      const startLabel = format(weekStartDate, 'dd/MM', { locale: vi })
      const endLabel = weekEndDate.getFullYear() !== weekStartDate.getFullYear()
        ? format(weekEndDate, 'dd/MM/yy', { locale: vi })
        : format(weekEndDate, 'dd/MM', { locale: vi })
      
      options.push({
        value: format(weekStartDate, 'yyyy-MM-dd'),
        label: `Tuần ${weekNumber} (${startLabel} - ${endLabel})`,
        isCurrentWeek,
      })
      
      weekStartDate = addDays(weekStartDate, 7)
      weekNumber++
    }
    
    return options
  }, [selectedYear, currentWeekStartDate])

  const handleYearChange = useCallback((value: string) => {
    const year = parseInt(value, 10)
    setSelectedYear(year)
    
    // If changing to current year, select current week
    // Otherwise, select first week of the year
    if (year === currentWeekStartDate.getFullYear()) {
      setWeekStart(format(currentWeekStartDate, 'yyyy-MM-dd'))
    } else {
      // Select first week of selected year
      const jan1 = new Date(year, 0, 1)
      let firstWeekStart = startOfWeek(jan1, { weekStartsOn: 1 })
      if (firstWeekStart.getFullYear() < year) {
        const daysInYear = 7 - firstWeekStart.getDate() + 1
        if (daysInYear < 4) {
          firstWeekStart = addDays(firstWeekStart, 7)
        }
      }
      setWeekStart(format(firstWeekStart, 'yyyy-MM-dd'))
    }
  }, [currentWeekStartDate])

  const handleWeekSelect = useCallback((value: string) => {
    setWeekStart(value)
    setWeekPickerOpen(false)
  }, [])

  // Get selected week label for trigger button
  const selectedWeekLabel = useMemo(() => {
    if (!weekStart) return 'Chọn tuần'
    const selectedOption = weekOptionsForYear.find(opt => opt.value === weekStart)
    if (selectedOption) return selectedOption.label
    // If week not in current year options, format it manually
    const start = parseISO(weekStart)
    const end = addDays(start, 6)
    return `${format(start, 'dd/MM', { locale: vi })} - ${format(end, 'dd/MM', { locale: vi })}`
  }, [weekStart, weekOptionsForYear])

  const handleWeekChange = useCallback(
    (direction: 'prev' | 'next' | 'current') => {
      if (direction === 'current') {
        if (currentWeekResponse?.data) {
          setWeekStart(currentWeekResponse.data)
          setSelectedYear(parseISO(currentWeekResponse.data).getFullYear())
        } else {
          const fallbackWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
          setWeekStart(format(fallbackWeekStart, 'yyyy-MM-dd'))
          setSelectedYear(fallbackWeekStart.getFullYear())
        }
        return
      }

      // For prev/next, use weekStart state or fallback
      let baseDate: Date
      if (weekStart) {
        baseDate = parseISO(weekStart)
      } else if (scheduleData?.weekStart) {
        baseDate = parseISO(scheduleData.weekStart)
      } else if (currentWeekResponse?.data) {
        baseDate = parseISO(currentWeekResponse.data)
      } else {
        baseDate = startOfWeek(new Date(), { weekStartsOn: 1 })
      }

      const newDate = direction === 'prev' ? addDays(baseDate, -7) : addDays(baseDate, 7)
      const newWeekStart = format(newDate, 'yyyy-MM-dd')
      setWeekStart(newWeekStart)
      
      // Update selected year if navigated to a different year
      const newYear = newDate.getFullYear()
      if (newYear !== selectedYear) {
        setSelectedYear(newYear)
      }
    },
    [currentWeekResponse?.data, scheduleData, weekStart, selectedYear]
  )

  const handleRetry = useCallback(() => {
    refetchCurrentWeek()
    refetchSchedule()
  }, [refetchCurrentWeek, refetchSchedule])

  const isLoading = (!weekStart && !isCurrentWeekError) || isCurrentWeekLoading || isScheduleLoading
  const hasError = isScheduleError || (isCurrentWeekError && !weekStart && !isCurrentWeekLoading)

  return (
    <TeacherRoute>
      <DashboardLayout>
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <header className="flex items-center justify-between border-b px-6 py-4 bg-background">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Lịch dạy của tôi
              </h1>
              <p className="text-sm text-muted-foreground">
                Theo dõi lịch dạy, tài liệu và trạng thái điểm danh
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Prev Week Button */}
                <Button
                  variant="ghost"
                  size="sm"
                className="h-8 px-2"
                onClick={() => handleWeekChange('prev')}
                disabled={!weekStart || isScheduleFetching}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              
              {/* Week Picker Popover */}
              <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                  size="sm"
                    className="h-8 min-w-[200px] justify-between font-medium"
                    disabled={isScheduleFetching}
                >
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 text-left truncate">{selectedWeekLabel}</span>
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="center">
                  {/* Year Selector */}
                  <div className="p-3 border-b">
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={handleYearChange}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue placeholder="Chọn năm" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                            className={cn(option.value === currentYear && 'font-semibold')}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Week List */}
                  <ScrollArea className="h-[300px]">
                    <div className="p-2">
                      {weekOptionsForYear.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleWeekSelect(option.value)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            weekStart === option.value && "bg-accent text-accent-foreground",
                            option.isCurrentWeek && "font-semibold"
                          )}
                        >
                          <span>{option.label}</span>
                          {option.isCurrentWeek && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                              Tuần này
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              
              {/* Next Week Button */}
                <Button
                  variant="ghost"
                  size="sm"
                className="h-8 px-2"
                onClick={() => handleWeekChange('next')}
                disabled={!weekStart || isScheduleFetching}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>

              <div className="h-8 w-px bg-border mx-1" />

              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-2 hidden sm:flex"
                onClick={() => handleWeekChange('current')}
                disabled={isScheduleFetching}
                title="Về tuần hiện tại"
              >
                <RefreshCcwIcon className={cn("h-4 w-4", isScheduleFetching && "animate-spin")} />
              </Button>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-hidden bg-muted/10 min-h-0">
            {isLoading && !hasError && (
              <div className="h-full w-full rounded-xl border bg-background p-6">
                <Skeleton className="h-full w-full" />
              </div>
            )}

            {hasError && (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <RefreshCcwIcon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">Không thể tải lịch dạy</h3>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng kiểm tra kết nối và thử lại.
                  </p>
                </div>
                <Button onClick={handleRetry} variant="outline">
                  Thử lại
                </Button>
              </div>
            )}

            {!isLoading && !hasError && scheduleData && (
              <TeacherCalendarView
                scheduleData={scheduleData}
                onSessionClick={setSelectedSessionId}
                className="h-full"
              />
            )}
          </div>
        </div>
      </DashboardLayout>
      <SessionDetailDialog
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        navigate={navigate}
      />
    </TeacherRoute>
  );
}

interface SessionDetailDialogProps {
  sessionId: number | null;
  onClose: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

function SessionDetailDialog({
  sessionId,
  onClose,
  navigate,
}: SessionDetailDialogProps) {
  const { data, isLoading, isError, refetch } = useGetSessionDetailQuery(
    sessionId ?? 0,
    {
      skip: !sessionId,
    }
  );

  const detail = data?.data;
  const classroomResource = detail?.classroomResource ?? null;
  const sessionStatus = detail
    ? SESSION_STATUS_STYLES[detail.sessionInfo.sessionStatus]
    : null;

  // Determine session modality from resource type, fallback to class modality
  const sessionModality = detail
    ? classroomResource?.resourceType === "VIRTUAL"
      ? "ONLINE"
      : classroomResource?.resourceType === "ROOM"
        ? "OFFLINE"
        : detail.classInfo.modality
    : null;

  const locationDisplay = detail
    ? classroomResource?.resourceType === "VIRTUAL"
      ? classroomResource?.onlineLink ||
      classroomResource?.location ||
      detail.sessionInfo.location ||
      detail.sessionInfo.onlineLink ||
      ""
      : classroomResource?.location ||
      detail.sessionInfo.location ||
      detail.sessionInfo.onlineLink ||
      (sessionModality === "ONLINE"
        ? "Học trực tuyến"
        : detail.classInfo.branchName || "")
    : "Chưa cập nhật";
  const resourceTypeLabel = classroomResource
    ? RESOURCE_TYPE_LABELS[classroomResource.resourceType] ??
    classroomResource.resourceType
    : null;

  const resolveMaterialUrl = useCallback((fileUrl: string) => {
    if (!fileUrl) {
      return "#";
    }
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    return `${API_BASE_URL}${fileUrl}`;
  }, []);

  const handleViewAttendance = () => {
    if (detail?.sessionId) {
      navigate(`/teacher/attendance/${detail.sessionId}`);
      onClose();
    }
  };

  return (
    <Dialog open={!!sessionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-[calc(100%-2rem)] sm:max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {detail
              ? `${detail.classInfo.className} · ${detail.classInfo.classCode}`
              : "Chi tiết buổi dạy"}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${format(parseISO(detail.date), "EEEE, dd/MM/yyyy", {
                locale: vi,
              })} · ${detail.startTime.slice(0, 5)} - ${detail.endTime.slice(
                0,
                5
              )}`
              : "Đang tải thông tin"}
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
            <p className="font-medium text-destructive">
              Không thể tải chi tiết buổi dạy.
            </p>
            <p className="mt-1 text-sm text-destructive/80">
              Buổi dạy có thể đã bị xóa hoặc bạn không còn quyền truy cập.
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
                    "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ring-1",
                    sessionStatus.className
                  )}
                >
                  {sessionStatus.label}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
                {sessionModality
                  ? MODALITY_LABELS[sessionModality] ?? sessionModality
                  : MODALITY_LABELS[detail.classInfo.modality] ??
                  detail.classInfo.modality}
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
                value={detail.sessionInfo.topic || "Chưa cập nhật"}
                icon={
                  <NotebookPenIcon className="h-4 w-4 text-muted-foreground" />
                }
              />
              <InfoRow
                title="Lớp học"
                value={detail.classInfo.className}
                icon={
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                }
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
                  <h3 className="text-sm font-semibold text-foreground">
                    Thông tin phòng học
                  </h3>
                  {resourceTypeLabel && (
                    <Badge
                      variant="outline"
                      className="border-border/60 text-xs"
                    >
                      {resourceTypeLabel}
                    </Badge>
                  )}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Phòng / Lớp</p>
                    <p className="font-medium text-foreground">
                      {classroomResource.resourceName || "Chưa cập nhật"}
                    </p>
                    {classroomResource.resourceCode && (
                      <p className="text-xs text-muted-foreground">
                        Mã: {classroomResource.resourceCode}
                      </p>
                    )}
                  </div>
                  {typeof classroomResource.capacity === "number" &&
                    classroomResource.capacity > 0 && (
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
                      <p className="font-medium text-foreground">
                        {classroomResource.location}
                      </p>
                    </div>
                  )}
                </div>
                {classroomResource.onlineLink && (
                  <Button asChild variant="secondary" size="sm">
                    <a
                      href={classroomResource.onlineLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tham gia lớp trực tuyến
                    </a>
                  </Button>
                )}
              </div>
            )}

            {detail.sessionInfo.description && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/80 p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Nội dung buổi học
                </h3>
                <p className="text-sm text-muted-foreground">
                  {detail.sessionInfo.description}
                </p>
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Thống kê điểm danh
                </h3>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Tổng số học sinh</p>
                  <p className="font-medium text-foreground">
                    {detail.attendanceSummary.totalStudents}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Có mặt</p>
                  <p className="font-medium text-emerald-700">
                    {detail.attendanceSummary.presentCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vắng mặt</p>
                  <p className="font-medium text-rose-700">
                    {detail.attendanceSummary.absentCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Điểm danh</p>
                  <p className="font-medium text-foreground">
                    {detail.attendanceSummary.attendanceSubmitted
                      ? "Đã hoàn thành"
                      : "Chưa điểm danh"}
                  </p>
                </div>
              </div>
              {detail.attendanceSummary.attendanceSubmitted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAttendance}
                  className="mt-2"
                >
                  Xem chi tiết điểm danh
                </Button>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex items-center gap-2">
                <NotebookPenIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Tài liệu buổi học
                </h3>
              </div>
              {detail.materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có tài liệu cho buổi học này.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {detail.materials.map((material) => {
                    const typeMeta = getMaterialTypeMeta(material.fileName);
                    const uploadedLabel = material.uploadedAt
                      ? `Cập nhật ${format(
                        parseISO(material.uploadedAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: vi }
                      )}`
                      : "Chưa có thời gian tải lên";
                    return (
                      <li
                        key={material.materialId}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {material.fileName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                                typeMeta.className
                              )}
                            >
                              {typeMeta.label}
                            </span>
                            <span>{uploadedLabel}</span>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={resolveMaterialUrl(material.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Tải xuống
                          </a>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {detail.makeupInfo?.isMakeup && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <h3 className="font-semibold">Thông tin buổi học bù</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {detail.makeupInfo.originalDate && (
                    <p>
                      Ngày gốc:{" "}
                      {format(
                        parseISO(detail.makeupInfo.originalDate),
                        "dd/MM/yyyy",
                        {
                          locale: vi,
                        }
                      )}
                    </p>
                  )}
                  {detail.makeupInfo.originalStartTime &&
                    detail.makeupInfo.originalEndTime && (
                      <p>
                        Giờ học gốc:{" "}
                        {detail.makeupInfo.originalStartTime.slice(0, 5)} -{" "}
                        {detail.makeupInfo.originalEndTime.slice(0, 5)}
                      </p>
                    )}
                  {detail.makeupInfo.reason && (
                    <p>Lý do: {detail.makeupInfo.reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-transparent bg-background/80 px-3 py-2">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
