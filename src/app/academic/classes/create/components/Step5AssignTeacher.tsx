import { Fragment, useMemo, useState } from 'react'
import {
  useAssignTeacherMutation,
  useGetTeacherAvailabilityQuery,
  useGetTeachersAvailableByDayQuery,
  useGetClassSessionsQuery,
} from '@/store/services/classCreationApi'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { TeacherAvailability, TeacherDayAvailabilityInfo } from '@/types/classCreation'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ChevronDown, ChevronUp, Check, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Step5AssignTeacherProps {
  classId: number | null
  onContinue: () => void
}

interface DayTeacherEntry {
  teacherId: number
  fullName: string
  email: string
  skills: string[]
  skillDetails?: { skill: string; specialization: string; level: number }[]
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
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
    'THU HAI': 1, 'THU BA': 2, 'THU TU': 3, 'THU NAM': 4, 'THU SAU': 5, 'THU BAY': 6, 'CHU NHAT': 0,
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
    if (!Number.isNaN(parsed.getTime())) return parsed.getDay()
  }
  if (session.dayOfWeek) return normalizeDayValue(session.dayOfWeek)
  return undefined
}

const apiDayToClientDay = (day?: number | null) => {
  if (typeof day !== 'number' || Number.isNaN(day)) return undefined
  return ((day % 7) + 7) % 7
}

const dayLabelFull: Record<number, string> = {
  0: 'Chủ nhật', 1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy',
}

// Skill display names and colors
const skillDisplayNames: Record<string, string> = {
  GENERAL: 'General',
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  VOCABULARY: 'Vocabulary',
  GRAMMAR: 'Grammar',
  KANJI: 'Kanji',
}

const skillColors: Record<string, string> = {
  GENERAL: 'bg-purple-100 text-purple-700 border-purple-200',
  LISTENING: 'bg-blue-100 text-blue-700 border-blue-200',
  READING: 'bg-green-100 text-green-700 border-green-200',
  WRITING: 'bg-orange-100 text-orange-700 border-orange-200',
  SPEAKING: 'bg-pink-100 text-pink-700 border-pink-200',
  VOCABULARY: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  GRAMMAR: 'bg-amber-100 text-amber-700 border-amber-200',
  KANJI: 'bg-red-100 text-red-700 border-red-200',
}

// Level color based on proficiency
const getLevelColor = (level: number) => {
  if (level >= 9) return 'text-emerald-600 font-semibold'
  if (level >= 7) return 'text-blue-600'
  if (level >= 5) return 'text-amber-600'
  return 'text-gray-500'
}

// Helper to get General score from skillDetails
const getGeneralScore = (skillDetails?: { skill: string; specialization: string; level: number }[]) => {
  if (!skillDetails?.length) return null
  const general = skillDetails.find(s => s.skill === 'GENERAL')
  return general ? { specialization: general.specialization, level: general.level } : null
}

// Simplified Teacher Card Component
const TeacherCard = ({
  teacher,
  onAssign,
  isAssigning,
  isSelected,
}: {
  teacher: TeacherAvailability
  onAssign: () => void
  isAssigning: boolean
  isSelected?: boolean
}) => {
  const percent = Math.round(teacher.availabilityPercentage)
  const isFullyAvailable = teacher.availabilityStatus === 'FULLY_AVAILABLE'
  
  // Get General score (the overall exam score)
  const generalScore = useMemo(() => getGeneralScore(teacher.skillDetails), [teacher.skillDetails])

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md',
        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border bg-card hover:border-primary/50'
      )}
      onClick={onAssign}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{teacher.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {teacher.specializations?.length ? teacher.specializations.join(' • ') : teacher.email}
          </p>
        </div>
        {/* General Score Badge */}
        {generalScore && (
          <div className="shrink-0">
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold',
              generalScore.level >= 8 ? 'bg-emerald-100 text-emerald-700' :
              generalScore.level >= 6 ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            )}>
              {generalScore.specialization} {generalScore.level.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Session count */}
      <p className="mt-2 text-xs text-muted-foreground">
        {teacher.availableSessions}/{teacher.totalSessions} buổi khả dụng
      </p>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isFullyAvailable ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            )}
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      </div>

      <Button
        size="sm"
        className="mt-3 w-full"
        disabled={isAssigning}
        onClick={(e) => {
          e.stopPropagation()
          onAssign()
        }}
      >
        {isAssigning ? 'Đang gán...' : 'Chọn'}
      </Button>
    </div>
  )
}

// Simplified Unavailable Teacher Item
const UnavailableTeacherItem = ({ teacher }: { teacher: TeacherAvailability }) => {
  const { conflicts } = teacher
  let reason = 'Không khả dụng'
  if (conflicts.noAvailability > 0) reason = 'Chưa đăng ký lịch'
  else if (conflicts.teachingConflict > 0) reason = 'Trùng lớp khác'
  else if (conflicts.leaveConflict > 0) reason = 'Đang xin nghỉ'
  else if (conflicts.skillMismatch > 0) reason = 'Không đủ kỹ năng'

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{teacher.fullName}</span>
      <span className="text-xs text-rose-600">{reason}</span>
    </div>
  )
}

export function Step5AssignTeacher({ classId, onContinue }: Step5AssignTeacherProps) {
  const [assignTeacher, { isLoading: isSubmitting }] = useAssignTeacherMutation()
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, { skip: !classId })
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'multi'>('single')
  const [isUnavailableExpanded, setIsUnavailableExpanded] = useState(false)
  const [pendingTeacherId, setPendingTeacherId] = useState<number | null>(null)

  // Fetch teachers - refetchOnMountOrArgChange to ensure fresh data
  const { data, isLoading: isSingleLoading, isError: isSingleError, refetch: refetchSingle } =
    useGetTeacherAvailabilityQuery(
      { classId: classId ?? 0 }, 
      { skip: !classId || assignmentMode !== 'single', refetchOnMountOrArgChange: true }
    )

  const { data: dayData, isLoading: isDayLoading, isError: isDayError, refetch: refetchDay } =
    useGetTeachersAvailableByDayQuery(
      { classId: classId ?? 0 }, 
      { skip: !classId || assignmentMode !== 'multi', refetchOnMountOrArgChange: true }
    )

  const { data: sessionsData, refetch: refetchSessions } = useGetClassSessionsQuery(classId ?? 0, { skip: !classId })

  const isLoading = assignmentMode === 'single' ? isSingleLoading : isDayLoading
  const isError = assignmentMode === 'single' ? isSingleError : isDayError
  const refetch = assignmentMode === 'single' ? refetchSingle : refetchDay

  // Process teachers
  const teachers = useMemo(() => data?.data ?? [], [data])

  const { recommended, unavailable } = useMemo(() => {
    const rec = teachers.filter(t => t.availabilityStatus === 'FULLY_AVAILABLE')
    const una = teachers.filter(t => t.availabilityStatus !== 'FULLY_AVAILABLE')
    return { recommended: rec, unavailable: una }
  }, [teachers])

  // Multi-teacher mode data
  const scheduleDays = useMemo(() => classDetail?.data?.scheduleDays ?? [], [classDetail])
  const allowedDays = useMemo(
    () => (scheduleDays.length ? [...scheduleDays] : [1, 2, 3, 4, 5, 6, 0]).sort((a, b) => a - b),
    [scheduleDays]
  )
  const allowedDaysSet = useMemo(() => new Set(allowedDays), [allowedDays])

  const teachersByDay = useMemo(() => {
    const map: Record<number, { info: TeacherDayAvailabilityInfo; teachers: DayTeacherEntry[] }> = {}
      ; (dayData?.data ?? []).forEach(teacher => {
        teacher.availableDays?.forEach(day => {
          if (!day?.isFullyAvailable) return
          const dayValue = apiDayToClientDay(day.dayOfWeek)
          if (dayValue === undefined || !allowedDaysSet.has(dayValue)) return
          if (!map[dayValue]) map[dayValue] = { info: day, teachers: [] }
          map[dayValue].teachers.push({
            teacherId: teacher.teacherId,
            fullName: teacher.fullName,
            email: teacher.email,
            skills: teacher.skills,
            skillDetails: teacher.skillDetails,
            dayInfo: day,
          })
        })
      })
    return map
  }, [dayData, allowedDaysSet])

  const sessionsByDay = useMemo(() => {
    const sessions = sessionsData?.data?.sessions ?? []
    return sessions.reduce<Record<number, number[]>>((acc, s) => {
      const day = resolveSessionDay(s)
      if (day !== undefined) {
        if (!acc[day]) acc[day] = []
        acc[day].push(s.sessionId)
      }
      return acc
    }, {})
  }, [sessionsData])

  const filteredDays = useMemo(
    () => Object.keys(teachersByDay).map(Number).filter(d => (sessionsByDay[d]?.length ?? 0) > 0),
    [teachersByDay, sessionsByDay]
  )

  // Stats
  const totalSessions = sessionsData?.data?.totalSessions ?? 0
  const assignedSessions = sessionsData?.data?.sessions?.filter(s => s.hasTeacher)?.length ?? 0

  // Handlers
  const handleAssign = async (teacherId: number, sessionIds: number[] | null = null) => {
    if (!classId) return
    setPendingTeacherId(teacherId)
    try {
      const response = await assignTeacher({ classId, data: { teacherId, sessionIds } }).unwrap()
      await refetchSessions?.()
      toast.success(response.message || 'Đã gán giáo viên')
      if (!response.data.needsSubstitute) onContinue()
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Không thể gán giáo viên')
    } finally {
      setPendingTeacherId(null)
    }
  }

  const handleAssignForDay = (teacherId: number, dayValue: number) => {
    const ids = sessionsByDay[dayValue] ?? []
    if (ids.length === 0) {
      toast.error('Không có buổi học cho ngày này')
      return
    }
    handleAssign(teacherId, ids)
  }

  if (!classId) {
    return (
      <Alert className="border-amber-300 bg-amber-50">
        <AlertDescription>Vui lòng hoàn thành Bước 1 trước.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gán giáo viên</h2>
          <p className="text-sm text-muted-foreground">
            {assignedSessions}/{totalSessions} buổi đã có giáo viên
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onContinue}>
          Bỏ qua →
        </Button>
      </div>

      {/* Course Info Banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            Khóa học: {classDetail?.data?.course?.name || classDetail?.data?.name || 'Chưa xác định'}
          </p>
          <p className="text-xs text-blue-700">
            Mã khóa: {classDetail?.data?.course?.code || 'N/A'}
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {classDetail?.data?.course?.code?.split('-')[0] || '?'}
        </Badge>
      </div>

      {/* Mode Toggle & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <RadioGroup
          value={assignmentMode}
          onValueChange={(v) => setAssignmentMode(v as 'single' | 'multi')}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="single" />
            <span className="text-sm">Một giáo viên</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="multi" />
            <span className="text-sm">Nhiều giáo viên</span>
          </label>
        </RadioGroup>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertDescription>Không thể tải danh sách giáo viên.</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : assignmentMode === 'single' ? (
        <Fragment>
          {/* Recommended Teachers */}
          {recommended.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium text-emerald-700">
                {recommended.length} giáo viên sẵn sàng
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map(t => (
                  <TeacherCard
                    key={t.teacherId}
                    teacher={t}
                    onAssign={() => handleAssign(t.teacherId)}
                    isAssigning={isSubmitting && pendingTeacherId === t.teacherId}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>Chưa có giáo viên đạt 100% khả dụng.</AlertDescription>
            </Alert>
          )}

          {/* Unavailable Teachers (Collapsed) */}
          {unavailable.length > 0 && (
            <div className="rounded-lg border bg-muted/30">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-sm"
                onClick={() => setIsUnavailableExpanded(!isUnavailableExpanded)}
              >
                <span className="text-muted-foreground">
                  {unavailable.length} giáo viên không khả dụng
                </span>
                {isUnavailableExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isUnavailableExpanded && (
                <div className="space-y-1 px-4 pb-4">
                  {unavailable.map(t => <UnavailableTeacherItem key={t.teacherId} teacher={t} />)}
                </div>
              )}
            </div>
          )}
        </Fragment>
      ) : filteredDays.length === 0 ? (
        <Alert>
          <AlertDescription>Chưa tìm thấy giáo viên có thể dạy toàn bộ các buổi của từng ngày.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDays.map(dayValue => {
            const group = teachersByDay[dayValue]
            if (!group) return null
            const sessionCount = sessionsByDay[dayValue]?.length ?? 0

            return (
              <div key={dayValue} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{dayLabelFull[dayValue]}</p>
                    <p className="text-xs text-muted-foreground">{sessionCount} buổi</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {group.teachers.slice(0, 3).map(t => {
                    // Get General score from teacher's skillDetails
                    const generalSkill = t.skillDetails?.find(s => s.skill === 'GENERAL')
                    const generalScore = generalSkill 
                      ? { spec: generalSkill.specialization, level: generalSkill.level }
                      : null
                    
                    // Fallback: get specialization from skills array if no skillDetails
                    const fallbackSpec = !generalScore && t.skills?.length > 0 
                      ? t.skills.find(s => s !== 'GENERAL') || t.skills[0]
                      : null

                    return (
                      <button
                        key={t.teacherId}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/50 hover:border-primary/50 transition-colors group"
                        onClick={() => handleAssignForDay(t.teacherId, dayValue)}
                        disabled={isSubmitting && pendingTeacherId === t.teacherId}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-medium truncate">{t.fullName}</span>
                          {generalScore ? (
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold shrink-0',
                              generalScore.level >= 8 ? 'bg-emerald-100 text-emerald-700' :
                              generalScore.level >= 6 ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            )}>
                              {generalScore.spec} {generalScore.level.toFixed(1)}
                            </span>
                          ) : fallbackSpec && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                              {fallbackSpec}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-primary font-medium ml-2 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {isSubmitting && pendingTeacherId === t.teacherId ? 'Đang gán...' : 'Gán →'}
                        </span>
                      </button>
                    )
                  })}
                  {group.teachers.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{group.teachers.length - 3} giáo viên khác
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
