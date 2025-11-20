import { Fragment, useMemo, useState, useEffect } from 'react'
import {
  useAssignTeacherMutation,
  useGetTeacherAvailabilityQuery,
  useGetTeachersAvailableByDayQuery,
  useGetClassSessionsQuery,
} from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WizardFooter } from './WizardFooter'
import { toast } from 'sonner'
import type {
  ScheduleInfo,
  TeacherAvailability,
  TeacherDayAvailabilityInfo,
} from '@/types/classCreation'
import { cn } from '@/lib/utils'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Step5AssignTeacherProps {
  classId: number | null
  onBack: () => void
  onContinue: () => void
  onCancelKeepDraft: () => void
  onCancelDelete: () => Promise<void> | void
}

interface DayOption {
  value: number
  label: string
}

interface DayTeacherEntry {
  teacherId: number
  fullName: string
  email: string
  skills: string[]
  dayInfo: TeacherDayAvailabilityInfo
}

const normalizeDayValue = (value: string | number | undefined | null): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return ((value % 7) + 7) % 7
  }
  if (!value) return undefined
  const normalized = value
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
  const map: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
    'THU HAI': 1,
    'THU BA': 2,
    'THU TU': 3,
    'THU NAM': 4,
    'THU SAU': 5,
    'THU BAY': 6,
    'CHU NHAT': 0,
  }
  return map[normalized]
}

const resolveSessionDay = (session: {
  dayOfWeekNumber?: number | null
  dayOfWeek?: string | null
  date?: string | null
}): number | undefined => {
  if (typeof session.dayOfWeekNumber === 'number' && Number.isFinite(session.dayOfWeekNumber)) {
    return normalizeDayValue(session.dayOfWeekNumber)
  }
  if (session.date) {
    const parsed = new Date(session.date)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getDay()
    }
  }
  if (session.dayOfWeek) {
    return normalizeDayValue(session.dayOfWeek)
  }
  return undefined
}

const getSessionTeacherNames = (session: {
  teachers?: { fullName?: string | null }[] | null
  teacherNames?: string | null
  teacherName?: string | null
  hasTeacher?: boolean
}): string[] => {
  const names = new Set<string>()
  session.teachers?.forEach((teacher) => {
    if (teacher?.fullName) {
      names.add(teacher.fullName.trim())
    }
  })
  const pushDelimited = (value?: string | null) => {
    value
      ?.split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => names.add(name))
  }
  pushDelimited(session.teacherName)
  pushDelimited(session.teacherNames)
  return Array.from(names)
}

const apiDayToClientDay = (day?: number | null) => {
  if (typeof day !== 'number' || Number.isNaN(day)) return undefined
  return ((day % 7) + 7) % 7
}

const formatDateDisplay = (value?: string | null) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return value
  }
}

const STATUS_LABELS: Record<TeacherAvailability['availabilityStatus'], string> = {
  FULLY_AVAILABLE: 'Giáo viên khuyến nghị',
  PARTIALLY_AVAILABLE: 'Giáo viên có xung đột',
  UNAVAILABLE: 'Giáo viên không khả dụng',
}

const getShiftLabel = (timeSlot: string) => {
  const lower = timeSlot.toLowerCase()
  if (lower.includes('morning') || lower.includes('sáng')) return 'Sáng'
  if (lower.includes('afternoon') || lower.includes('chiều')) return 'Chiều'
  if (lower.includes('evening') || lower.includes('tối')) return 'Tối'
  return 'Cả ngày'
}

const formatSchedule = (schedule: ScheduleInfo | undefined | null) => {
  if (!schedule) return null
  const shift = getShiftLabel(schedule.timeSlot)
  const location = schedule.location ? ` (${schedule.location})` : ''
  return `${schedule.days.join('/')} ${shift}${location}`
}

interface UnavailabilityReason {
  title: string
  description?: string
  type: 'TEACHING_CONFLICT' | 'LEAVE_CONFLICT' | 'SCHEDULE_MISMATCH' | 'NO_AVAILABILITY' | 'SKILL_MISMATCH' | 'UNKNOWN'
  teacherScheduleLabel?: string | null
  classScheduleLabel?: string | null
}

const getUnavailabilityReason = (teacher: TeacherAvailability): UnavailabilityReason => {
  const { conflicts, teacherSchedule, classSchedule, totalSessions } = teacher
  const teacherScheduleLabel = formatSchedule(teacherSchedule)
  const classScheduleLabel = formatSchedule(classSchedule)

  if (conflicts.teachingConflict > 0) {
    return {
      type: 'TEACHING_CONFLICT',
      title: 'Trùng lịch với lớp khác',
      description: `${conflicts.teachingConflict} buổi đã phân công lớp khác`,
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  if (conflicts.leaveConflict > 0) {
    return {
      type: 'LEAVE_CONFLICT',
      title: 'Đang xin nghỉ',
      description: `${conflicts.leaveConflict} buổi đã được phê duyệt nghỉ`,
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  if (
    conflicts.noAvailability > 0 &&
    teacherScheduleLabel &&
    classScheduleLabel
  ) {
    return {
      type: 'SCHEDULE_MISMATCH',
      title: 'Lịch dạy chưa phù hợp',
      description: 'Cần cập nhật lịch để trùng với yêu cầu lớp',
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  if (conflicts.noAvailability === totalSessions) {
    return {
      type: 'NO_AVAILABILITY',
      title: 'Chưa đăng ký lịch làm việc',
      description: `${conflicts.noAvailability} buổi chưa đăng ký`,
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  if (conflicts.noAvailability > 0) {
    return {
      type: 'NO_AVAILABILITY',
      title: 'Lịch dạy chưa phù hợp',
      description: `${conflicts.noAvailability} buổi chưa đăng ký`,
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  if (conflicts.skillMismatch > 0) {
    return {
      type: 'SKILL_MISMATCH',
      title: 'Không đủ chuyên môn',
      description: `${conflicts.skillMismatch} buổi không khớp kỹ năng`,
      teacherScheduleLabel,
      classScheduleLabel,
    }
  }

  return {
    type: 'UNKNOWN',
    title: 'Chưa rõ nguyên nhân',
    description: 'Chưa nhận được dữ liệu xung đột từ hệ thống',
    teacherScheduleLabel,
    classScheduleLabel,
  }
}

const AvailabilityProgress = ({ teacher }: { teacher: TeacherAvailability }) => {
  const percent = Math.round(teacher.availabilityPercentage)
  const clamped = Math.max(0, Math.min(100, percent))
  const barColor =
    teacher.availabilityStatus === 'FULLY_AVAILABLE'
      ? 'bg-emerald-500'
      : teacher.availabilityStatus === 'PARTIALLY_AVAILABLE'
        ? 'bg-amber-500'
        : 'bg-rose-500'

  return (
    <div className="space-y-1">
      <div className="rounded-full bg-muted">
        <div className={cn('h-2 rounded-full transition-all', barColor)} style={{ width: `${clamped}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {teacher.availableSessions}/{teacher.totalSessions} buổi • {percent}% khả dụng
      </p>
    </div>
  )
}

const SkillsList = ({ skills }: { skills: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {skills.map((skill) => (
      <Badge key={skill} variant="outline" className="rounded-full px-2 py-0.5 text-xs font-medium">
        {skill}
      </Badge>
    ))}
  </div>
)

const RecommendedTeacherCard = ({
  teacher,
  onAssign,
  isAssigning,
  assignmentMode,
  onOpenSchedule,
}: {
  teacher: TeacherAvailability
  onAssign: () => void
  isAssigning: boolean
  assignmentMode: 'single' | 'multi'
  onOpenSchedule?: () => void
}) => (
  <div className="flex flex-col rounded-2xl border border-border/40 bg-white/90 p-4 shadow-sm transition-shadow hover:shadow-lg">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-lg font-semibold text-foreground">{teacher.fullName}</p>
        <p className="text-sm text-muted-foreground">{teacher.email}</p>
      </div>
      <Badge className="bg-neutral-900 text-xs font-semibold uppercase tracking-wide text-white">
        Khuyến nghị
      </Badge>
    </div>
    <div className="mt-3 space-y-3 text-sm">
      <SkillsList skills={teacher.skills} />
      <AvailabilityProgress teacher={teacher} />
      {teacher.hasGeneralSkill && (
        <p className="text-xs text-emerald-700">Có kỹ năng GENERAL - ưu tiên lớp tổng quát</p>
      )}
    </div>
    {assignmentMode === 'single' ? (
      <Button className="mt-4 bg-neutral-900 text-white hover:bg-neutral-800" onClick={onAssign} disabled={isAssigning}>
        {isAssigning ? 'Đang phân công…' : 'Phân công toàn bộ buổi học'}
      </Button>
    ) : (
      <Button
        className="mt-4 border border-neutral-900/40 text-neutral-900 hover:bg-neutral-900/5"
        variant="ghost"
        onClick={onOpenSchedule}
      >
        Chọn ngày & gán buổi học
      </Button>
    )}
  </div>
)

const UnavailableTeacherCard = ({
  teacher,
  assignmentMode,
}: {
  teacher: TeacherAvailability
  assignmentMode: 'single' | 'multi'
}) => {
  const reason = getUnavailabilityReason(teacher)

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-3">
      <p className="text-sm font-semibold text-foreground">{teacher.fullName}</p>
      <p className="text-xs text-muted-foreground">{teacher.email}</p>
      <p className="mt-2 text-xs font-medium text-rose-700">Lý do chính: {reason.title}</p>
      {reason.description && (
        <p className="text-xs text-muted-foreground">{reason.description}</p>
      )}
      {(reason.teacherScheduleLabel || reason.classScheduleLabel) && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {reason.teacherScheduleLabel && (
            <p>
              Lịch giáo viên: <span className="font-medium text-foreground">{reason.teacherScheduleLabel}</span>
            </p>
          )}
          {reason.classScheduleLabel && (
            <p>
              Lịch lớp: <span className="font-medium text-foreground">{reason.classScheduleLabel}</span>
            </p>
          )}
        </div>
      )}
      {assignmentMode === 'multi' && (
        <p className="mt-1 text-xs text-muted-foreground">
          Nếu cần, hãy điều chỉnh lịch lớp hoặc liên hệ giáo viên để cập nhật đăng ký, sau đó gán giáo viên này cho các buổi phù hợp.
        </p>
      )}
      {assignmentMode === 'single' && (
        <p className="mt-1 text-xs text-muted-foreground">
          Giáo viên này không phù hợp để dạy toàn bộ lớp. Liên hệ để cập nhật lịch nếu muốn sử dụng lại.
        </p>
      )}
    </div>
  )
}

export function Step5AssignTeacher({
  classId,
  onBack,
  onContinue,
  onCancelKeepDraft,
  onCancelDelete,
}: Step5AssignTeacherProps) {
  const [assignTeacher, { isLoading: isSubmitting }] = useAssignTeacherMutation()
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, { skip: !classId, refetchOnMountOrArgChange: true })
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'multi'>('single')
  const shouldFetchSingleTeachers = Boolean(classId && assignmentMode === 'single')
  const {
    data,
    isLoading: isSingleLoading,
    isError: isSingleError,
    refetch: refetchSingleTeachers,
  } = useGetTeacherAvailabilityQuery(
    { classId: classId ?? 0 },
    { skip: !shouldFetchSingleTeachers }
  )
  const shouldFetchMultiTeachers = Boolean(classId && assignmentMode === 'multi')
  const {
    data: dayAvailabilityData,
    isLoading: isDayLoading,
    isError: isDayError,
    refetch: refetchDayTeachers,
  } = useGetTeachersAvailableByDayQuery(
    { classId: classId ?? 0 },
    { skip: !shouldFetchMultiTeachers }
  )
  const [pendingTeacherId, setPendingTeacherId] = useState<number | null>(null)
  const [isUnavailableExpanded, setIsUnavailableExpanded] = useState(false)
  const [scheduleModal, setScheduleModal] = useState<{ teacher: TeacherAvailability } | null>(null)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [dayAssignments, setDayAssignments] = useState<Record<number, string[]>>({})
  const [assignedDays, setAssignedDays] = useState<Record<number, boolean>>({})
  const { data: sessionsData, refetch: refetchSessions } = useGetClassSessionsQuery(classId ?? 0, {
    skip: !classId,
  })
  const isTeachersLoading = assignmentMode === 'single' ? isSingleLoading : isDayLoading
  const isTeachersError = assignmentMode === 'single' ? isSingleError : isDayError
  const refetchTeachers = assignmentMode === 'single' ? refetchSingleTeachers : refetchDayTeachers

  useEffect(() => {
    if (scheduleModal) {
      setSelectedDays([])
    }
  }, [scheduleModal])

  const teachers = useMemo(() => data?.data ?? [], [data])
  const teacherAvailabilityByDay = useMemo(() => dayAvailabilityData?.data ?? [], [dayAvailabilityData])
  const scheduleDays = classDetail?.data?.scheduleDays ?? []
  const allowedDays = (scheduleDays.length ? [...scheduleDays] : [1, 2, 3, 4, 5, 6, 0]).sort((a, b) => a - b)
  const allowedDaysSet = useMemo(() => new Set(allowedDays), [allowedDays])
  const teachersByDay = useMemo(() => {
    const map: Record<number, { info: TeacherDayAvailabilityInfo; teachers: DayTeacherEntry[] }> = {}
    teacherAvailabilityByDay.forEach((teacher) => {
      teacher.availableDays?.forEach((day) => {
        if (!day || !day.isFullyAvailable) return
        const dayValue = apiDayToClientDay(day.dayOfWeek)
        if (dayValue === undefined) return
        if (!allowedDaysSet.has(dayValue)) return
        if (!map[dayValue]) {
          map[dayValue] = { info: day, teachers: [] }
        }
        map[dayValue].teachers.push({
          teacherId: teacher.teacherId,
          fullName: teacher.fullName,
          email: teacher.email,
          skills: teacher.skills,
          dayInfo: day,
        })
      })
    })
    return map
  }, [teacherAvailabilityByDay])
  const { fullyAvailable, unavailable } = useMemo(() => {
    const fully = []
    const unavailableCombined = []
    for (const teacher of teachers) {
      if (teacher.availabilityStatus === 'FULLY_AVAILABLE') {
        fully.push(teacher)
      } else {
        unavailableCombined.push(teacher)
      }
    }
    return { fullyAvailable: fully, unavailable: unavailableCombined }
  }, [teachers])

  const dayLabelMap: Record<number, string> = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
  }

  const dayOptions: DayOption[] = allowedDays
    .map((value) => ({
      value,
      label: dayLabelMap[value] || `Ngày ${value}`,
    }))
  const teacherDayKeys = useMemo(() => Object.keys(teachersByDay).map((key) => Number(key)), [teachersByDay])
  const sessionsByDay = useMemo(() => {
    const sessions = sessionsData?.data?.sessions ?? []
    return sessions.reduce<Record<number, number[]>>((acc, session) => {
      const dayValue = resolveSessionDay(session)
      if (dayValue === undefined) return acc
      if (!acc[dayValue]) acc[dayValue] = []
      acc[dayValue].push(session.sessionId)
      return acc
    }, {})
  }, [sessionsData])

  const orderedMultiDayKeys = useMemo(() => {
    if (teacherDayKeys.length === 0) return []
    const sortAsc = (arr: number[]) => [...arr].sort((a, b) => a - b)
    if (!scheduleDays.length) return sortAsc(teacherDayKeys)
    const normalizedScheduleDays = scheduleDays.map((day) => apiDayToClientDay(day) ?? day)
    const seen = new Set<number>()
    const ordered: number[] = []
    normalizedScheduleDays.forEach((day) => {
      if (day !== undefined && teacherDayKeys.includes(day) && !seen.has(day)) {
        ordered.push(day)
        seen.add(day)
      }
    })
    teacherDayKeys.forEach((day) => {
      if (!seen.has(day)) ordered.push(day)
    })
    return ordered
  }, [teacherDayKeys, scheduleDays])
  const filteredMultiDayKeys = useMemo(
    () => orderedMultiDayKeys.filter((day) => (sessionsByDay[day]?.length ?? 0) > 0),
    [orderedMultiDayKeys, sessionsByDay]
  )

  useEffect(() => {
    const sessions = sessionsData?.data?.sessions ?? []
    const namesMap: Record<number, string[]> = {}
    const assignedMap: Record<number, boolean> = {}
    sessions.forEach((session) => {
      const dayValue = resolveSessionDay(session)
      if (dayValue === undefined) return
      if (session.hasTeacher) {
        assignedMap[dayValue] = true
      }
      const teacherNames = getSessionTeacherNames(session)
      if (teacherNames.length === 0) return
      const existing = new Set(namesMap[dayValue] ?? [])
      teacherNames.forEach((name) => existing.add(name))
      namesMap[dayValue] = Array.from(existing)
    })
    setAssignedDays(assignedMap)
    setDayAssignments((prev) => {
      const merged: Record<number, string[]> = { ...prev }
      Object.entries(namesMap).forEach(([key, names]) => {
        merged[Number(key)] = names
      })
      Object.keys(merged).forEach((key) => {
        const day = Number(key)
        if (!assignedMap[day]) {
          delete merged[day]
        }
      })
      return merged
    })
  }, [sessionsData])

  // dayAssignments + assignedDays state kept synced via effect

  const subjectLabel =
    classDetail?.data?.course?.code ||
    classDetail?.data?.course?.name ||
    classDetail?.data?.name ||
    'Không xác định'

  const handleAssign = async (
    teacherId: number,
    sessionIds: number[] | null = null,
    teacherName?: string,
    appliedDaysOverride?: number[]
  ) => {
    if (!classId) return
    setPendingTeacherId(teacherId)
    try {
      const response = await assignTeacher({ classId, data: { teacherId, sessionIds } }).unwrap()
      if (refetchSessions) {
        await refetchSessions()
      }
      const appliedDays = sessionIds
        ? (appliedDaysOverride && appliedDaysOverride.length > 0 ? appliedDaysOverride : selectedDays)
        : allowedDays
      if (teacherName) {
        setDayAssignments((prev) => {
          const next = { ...prev }
          appliedDays.forEach((day) => {
            const existing = new Set(next[day] ?? [])
            existing.add(teacherName)
            next[day] = Array.from(existing)
          })
          return next
        })
      }
      setAssignedDays((prev) => {
        const next = { ...prev }
        appliedDays.forEach((day) => {
          next[day] = true
        })
        return next
      })
      setSelectedDays([])
      setScheduleModal(null)
      toast.success(response.message || 'Đã phân công giáo viên')
      if (response.data.needsSubstitute) {
        toast.message('Một số buổi chưa có giáo viên. Tiếp tục chọn người thay thế.')
      } else {
        onContinue()
      }
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Không thể phân công giáo viên. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setPendingTeacherId(null)
    }
  }

  const getSessionIdsForDays = (days: number[]) => {
    const ids: number[] = []
    days.forEach((day) => {
      if (sessionsByDay[day]) {
        ids.push(...sessionsByDay[day])
      }
    })
    return ids
  }
  const handleAssignForDay = (teacherId: number, dayValue: number, teacherName: string) => {
    const sessionIds = getSessionIdsForDays([dayValue])
    if (sessionIds.length === 0) {
      toast.error('Không tìm thấy buổi học nào cho ngày này.')
      return
    }
    void handleAssign(teacherId, sessionIds, teacherName, [dayValue])
  }

  if (!classId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Vui lòng tạo lớp (Bước 1) trước khi chọn giáo viên.</AlertDescription>
        </Alert>
        <WizardFooter
          currentStep={5}
          isFirstStep={false}
          isLastStep={false}
          onBack={onBack}
          onNext={onContinue}
          onCancelKeepDraft={onCancelKeepDraft}
          onCancelDelete={onCancelDelete}
          isNextDisabled
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bước 5: Gán giáo viên</CardTitle>
          <Badge variant="outline" className="w-fit border-border/70 bg-muted/40 text-xs uppercase tracking-wide">
            Lớp học: {subjectLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm font-semibold mb-3">Chọn phương thức phân công</p>
            <RadioGroup
              value={assignmentMode}
              onValueChange={(value) => setAssignmentMode(value as 'single' | 'multi')}
              className="grid gap-3 md:grid-cols-2"
            >
              <label
                htmlFor="assign-single"
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-white p-3 transition-all',
                  assignmentMode === 'single' ? 'border-emerald-500 shadow-sm' : 'hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value="single" id="assign-single" />
                <span className="font-semibold">Phân công một giáo viên cho lớp học</span>
              </label>
              <label
                htmlFor="assign-multi"
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-white p-3 transition-all',
                  assignmentMode === 'multi' ? 'border-emerald-500 shadow-sm' : 'hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value="multi" id="assign-multi" />
                <span className="font-semibold">Phân công nhiều giáo viên cho lớp học</span>
              </label>
            </RadioGroup>
          </div>

          {assignmentMode === 'multi' && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Phân công nhiều giáo viên</p>
              <p className="mt-1">
                Chọn giáo viên có thể dạy toàn bộ các buổi của từng ngày trong tuần (ví dụ: 8/8 buổi Thứ Hai). Danh sách hiển thị dựa trên dữ liệu khả dụng theo ngày.
              </p>
              <p className="mt-1">
                Sau khi gán hết, hãy chuyển sang bước tiếp theo để kiểm tra lại các buổi còn thiếu.
              </p>
            </div>
          )}

          {isTeachersLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : isTeachersError ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertDescription>Không thể tải danh sách giáo viên. Vui lòng thử lại.</AlertDescription>
              </Alert>
              <Button variant="outline" onClick={() => refetchTeachers()}>
                Thử lại
              </Button>
            </div>
          ) : assignmentMode === 'single' ? (
            teachers.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Chưa có giáo viên phù hợp cho môn {subjectLabel}. Vui lòng kiểm tra lại dữ liệu chuyên môn hoặc cập nhật lịch làm việc.
                </AlertDescription>
              </Alert>
            ) : (
              <Fragment>
                <div className="grid gap-3 rounded-2xl border border-border/60 bg-white p-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Khuyến nghị</p>
                    <p className="text-3xl font-semibold text-emerald-700">{fullyAvailable.length}</p>
                    <p className="text-xs text-muted-foreground">Sẵn sàng toàn bộ buổi học</p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80">Không khả dụng</p>
                    <p className="text-3xl font-semibold text-rose-600">{unavailable.length}</p>
                    <p className="text-xs text-muted-foreground">Bao gồm giáo viên xung đột hoặc không phù hợp lịch</p>
                  </div>
                </div>

                <section className="space-y-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {STATUS_LABELS.FULLY_AVAILABLE} ({fullyAvailable.length})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mở rộng chi tiết để xem nhanh kỹ năng, tỷ lệ khả dụng và phân công ngay lập tức.
                    </p>
                  </div>
                  {fullyAvailable.length === 0 ? (
                    <Alert>
                      <AlertDescription>Chưa có giáo viên đạt mức khả dụng 100%. Hãy xem nhóm “Có xung đột”.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid max-h-[520px] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                      {fullyAvailable.map((teacher) => (
                        <RecommendedTeacherCard
                          key={teacher.teacherId}
                          teacher={teacher}
                          onAssign={() => handleAssign(teacher.teacherId, null, teacher.fullName)}
                          isAssigning={isSubmitting && pendingTeacherId === teacher.teacherId}
                          assignmentMode={assignmentMode}
                          onOpenSchedule={() => {
                            setSelectedDays([])
                            setScheduleModal({ teacher })
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        Giáo viên không khả dụng (trùng lịch với lớp khác / xin nghỉ / chưa đăng ký lịch dạy) ({unavailable.length})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dùng để tham khảo lý do và liên hệ giáo viên cập nhật dữ liệu nếu cần.
                      </p>
                    </div>
                    {unavailable.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setIsUnavailableExpanded((prev) => !prev)}>
                        {isUnavailableExpanded ? 'Thu gọn danh sách' : 'Xem lý do không khả dụng'}
                      </Button>
                    )}
                  </div>
                  {unavailable.length === 0 ? (
                    <Alert>
                      <AlertDescription>Không có giáo viên nào bị đánh dấu không khả dụng.</AlertDescription>
                    </Alert>
                  ) : (
                    isUnavailableExpanded && (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {unavailable.map((teacher) => (
                          <UnavailableTeacherCard
                            key={teacher.teacherId}
                            teacher={teacher}
                            assignmentMode={assignmentMode}
                          />
                        ))}
                      </div>
                    )
                  )}
                </section>

                <p className="text-xs text-muted-foreground">
                  Có thể gán nhiều giáo viên. Hệ thống sẽ giữ lại các buổi chưa có giáo viên sau mỗi lần phân công để bạn tiếp tục hoàn thiện lịch dạy.
                </p>
              </Fragment>
            )
          ) : filteredMultiDayKeys.length === 0 ? (
            <Alert>
              <AlertDescription>
                Chưa tìm thấy giáo viên có thể dạy toàn bộ các buổi cho từng ngày học. Vui lòng kiểm tra lại lịch lớp hoặc yêu cầu trung tâm cập nhật.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredMultiDayKeys.map((dayValue) => {
                const group = teachersByDay[dayValue]
                if (!group) return null
                const dayLabel = group.info.dayName || dayLabelMap[dayValue] || `Ngày ${dayValue}`
                const daySessions = sessionsByDay[dayValue]?.length ?? 0
                return (
                  <div key={dayValue} className="rounded-2xl border border-border/60 bg-card/40 p-4">
                    <div className="flex flex-col gap-1 border-b pb-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-foreground">{dayLabel}</p>
                        <p>
                          {group.info.timeSlotDisplay || 'Khung giờ lớp'} · {group.info.totalSessions} buổi{' '}
                          {group.info.firstDate && (
                            <span>
                              ({formatDateDisplay(group.info.firstDate)} → {formatDateDisplay(group.info.lastDate)})
                            </span>
                          )}
                        </p>
                      </div>
                      <p>{daySessions} buổi của lớp</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.teachers.map((teacher) => {
                        const isAssigning = isSubmitting && pendingTeacherId === teacher.teacherId
                        return (
                          <div
                            key={`${dayValue}-${teacher.teacherId}`}
                            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-3 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{teacher.fullName}</p>
                              <p className="text-xs text-muted-foreground">{teacher.email}</p>
                              <div className="mt-2">
                                <SkillsList skills={teacher.skills} />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Có thể dạy {teacher.dayInfo.availableSessions}/{teacher.dayInfo.totalSessions} buổi từ{' '}
                                {formatDateDisplay(teacher.dayInfo.firstDate)} → {formatDateDisplay(teacher.dayInfo.lastDate)}
                              </p>
                            </div>
                            <Button
                              className="md:w-52"
                              disabled={daySessions === 0 || isAssigning}
                              onClick={() => handleAssignForDay(teacher.teacherId, dayValue, teacher.fullName)}
                            >
                              {isAssigning ? 'Đang phân công…' : `Gán ${dayLabel}`}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <WizardFooter
        currentStep={5}
        isFirstStep={false}
        isLastStep={false}
        onBack={onBack}
        onNext={onContinue}
        onCancelKeepDraft={onCancelKeepDraft}
        onCancelDelete={onCancelDelete}
        nextButtonText="Bỏ qua bước này"
      />
      {scheduleModal && (
        <Dialog open={Boolean(scheduleModal)} onOpenChange={(open) => !open && setScheduleModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chọn ngày dạy cho {scheduleModal.teacher.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Chọn các ngày mà giáo viên này sẽ phụ trách. Bạn có thể phân công lại cho những ngày còn trống sau khi lưu.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {dayOptions.map((day) => {
                  const assignedNames = dayAssignments[day.value] || []
                  const isAssigned = assignedDays[day.value] ?? false
                  const checked = isAssigned || selectedDays.includes(day.value)
                  return (
                    <label
                      key={day.value}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                        checked ? 'border-primary bg-primary/5' : 'border-border/60 bg-background',
                        isAssigned && 'opacity-75'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={isAssigned}
                        onCheckedChange={(checkedValue) => {
                          if (isAssigned) return
                          setSelectedDays((prev) =>
                            checkedValue ? [...prev, day.value] : prev.filter((value) => value !== day.value)
                          )
                        }}
                      />
                      <div className="flex flex-col">
                        <span>{day.label}</span>
                        {isAssigned && (
                          <span className="text-[11px] text-muted-foreground">
                            Đã phân công{assignedNames.length ? `: ${assignedNames.join(', ')}` : ''}
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setScheduleModal(null)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    const sessionIds = getSessionIdsForDays(selectedDays)
                    if (sessionIds.length === 0) {
                      toast.error('Chưa chọn ngày có buổi học')
                      return
                    }
                    setScheduleModal(null)
                    handleAssign(scheduleModal.teacher.teacherId, sessionIds, scheduleModal.teacher.fullName)
                  }}
                >
                  Xác nhận phân công
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
