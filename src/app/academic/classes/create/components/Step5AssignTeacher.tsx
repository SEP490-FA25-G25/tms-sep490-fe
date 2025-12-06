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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  
  // Get course subject code (IELTS, TOEIC, JLPT, etc.)
  const courseSubject = useMemo(() => {
    const course = classDetail?.data?.course
    // Priority: subject.code > course code prefix
    return course?.subject?.code?.toUpperCase() || course?.code?.split('-')[0]?.toUpperCase() || null
  }, [classDetail])

  // Helper to check if teacher's specialization matches course subject
  const checkSpecializationMatch = (teacherData?: { specializations?: string[] }) => {
    if (!courseSubject) return { matches: true, teacherSpec: null, courseSubject: null }
    
    // Get teacher's specializations 
    const teacherSpecs = teacherData?.specializations?.map(s => s?.toUpperCase()).filter(Boolean) ?? []
    
    if (teacherSpecs.length === 0) return { matches: true, teacherSpec: null, courseSubject }
    
    // Check if any of teacher's specializations match the course subject
    const hasMatch = teacherSpecs.some(spec => spec === courseSubject)
    
    return { 
      matches: hasMatch, 
      teacherSpec: teacherSpecs.join(', '),
      courseSubject 
    }
  }
  
  // Confirmation dialog state - added specializationMismatch
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    teacherId: number | null
    teacherName: string
    currentTeacherName: string
    sessionIds: number[] | null
    dayLabel?: string
    specializationMismatch?: { teacherSpec: string | null; courseSubject: string | null }
  }>({ isOpen: false, teacherId: null, teacherName: '', currentTeacherName: '', sessionIds: null })

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

  // Track assigned teachers per day
  const assignedTeachersByDay = useMemo(() => {
    const sessions = sessionsData?.data?.sessions ?? []
    const result: Record<number, { teacherId: number; fullName: string }[]> = {}
    
    sessions.forEach(s => {
      const day = resolveSessionDay(s)
      if (day === undefined) return
      
      // Get teacher info from session
      const teachers = s.teachers ?? s.teacherAssignments ?? s.teacherInfo ?? s.assignedTeachers ?? []
      if (teachers.length > 0) {
        if (!result[day]) result[day] = []
        teachers.forEach(t => {
          const teacherId = t.teacherId
          const fullName = t.fullName || t.name || ''
          if (teacherId && !result[day].some(existing => existing.teacherId === teacherId)) {
            result[day].push({ teacherId, fullName })
          }
        })
      }
    })
    
    return result
  }, [sessionsData])

  // Stats
  const totalSessions = sessionsData?.data?.totalSessions ?? 0
  const assignedSessions = sessionsData?.data?.sessions?.filter(s => s.hasTeacher)?.length ?? 0

  // Check if any sessions already have teacher assigned
  const hasExistingAssignment = assignedSessions > 0

  // Handlers
  const handleAssign = async (teacherId: number, sessionIds: number[] | null = null) => {
    if (!classId) return
    setPendingTeacherId(teacherId)
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
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

  // Request assign with confirmation check
  const requestAssign = (teacherId: number, teacherName: string, sessionIds: number[] | null = null, dayLabel?: string, skillDetails?: { specializations?: string[] }) => {
    // Check for specialization mismatch
    const specCheck = skillDetails ? checkSpecializationMatch(skillDetails) : null
    const hasSpecMismatch = specCheck && !specCheck.matches
    
    // Check if there are existing assignments
    if (sessionIds) {
      // Multi-teacher mode: check if specific day has assignment
      const dayValue = Object.entries(sessionsByDay).find(([, ids]) => 
        ids.length === sessionIds.length && ids.every(id => sessionIds.includes(id))
      )?.[0]
      
      if (dayValue) {
        const assignedTeachers = assignedTeachersByDay[Number(dayValue)] ?? []
        if (assignedTeachers.length > 0 || hasSpecMismatch) {
          setConfirmDialog({
            isOpen: true,
            teacherId,
            teacherName,
            currentTeacherName: assignedTeachers.length > 0 
              ? assignedTeachers.map(t => t.fullName).join(', ') 
              : undefined,
            sessionIds,
            dayLabel,
            specializationMismatch: hasSpecMismatch ? {
              teacherSpec: specCheck.teacherSpec,
              courseSubject: specCheck.courseSubject,
            } : undefined,
          })
          return
        }
      }
    } else {
      // Single teacher mode: check if any session has assignment
      if (hasExistingAssignment || hasSpecMismatch) {
        // Get current assigned teachers
        const allAssigned = Object.values(assignedTeachersByDay).flat()
        const uniqueNames = [...new Set(allAssigned.map(t => t.fullName))].filter(Boolean)
        
        setConfirmDialog({
          isOpen: true,
          teacherId,
          teacherName,
          currentTeacherName: hasExistingAssignment 
            ? (uniqueNames.join(', ') || 'Giáo viên hiện tại')
            : undefined,
          sessionIds: null,
          specializationMismatch: hasSpecMismatch ? {
            teacherSpec: specCheck.teacherSpec,
            courseSubject: specCheck.courseSubject,
          } : undefined,
        })
        return
      }
    }
    
    // No existing assignment and no specialization mismatch, proceed directly
    handleAssign(teacherId, sessionIds)
  }

  const handleAssignForDay = (teacherId: number, teacherName: string, dayValue: number, skillDetails?: { specializations?: string[] }) => {
    const ids = sessionsByDay[dayValue] ?? []
    if (ids.length === 0) {
      toast.error('Không có buổi học cho ngày này')
      return
    }
    requestAssign(teacherId, teacherName, ids, dayLabelFull[dayValue], skillDetails)
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
                {recommended.map(t => {
                  // Extract specializations from skillDetails or use specializations field
                  const specs = t.skillDetails?.map(s => s.specialization).filter(Boolean) ?? t.specializations ?? []
                  const uniqueSpecs = [...new Set(specs)]
                  return (
                    <TeacherCard
                      key={t.teacherId}
                      teacher={t}
                      onAssign={() => requestAssign(t.teacherId, t.fullName, null, undefined, { specializations: uniqueSpecs })}
                      isAssigning={isSubmitting && pendingTeacherId === t.teacherId}
                    />
                  )
                })}
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
            const assignedTeachers = assignedTeachersByDay[dayValue] ?? []
            const isAssigned = assignedTeachers.length > 0

            return (
              <div key={dayValue} className={cn(
                "rounded-xl border p-4",
                isAssigned && "border-green-300 bg-green-50/50"
              )}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{dayLabelFull[dayValue]}</p>
                    <p className="text-xs text-muted-foreground">{sessionCount} buổi</p>
                  </div>
                  {isAssigned && (
                    <div className="flex items-center gap-1.5 text-green-700">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">Đã gán</span>
                    </div>
                  )}
                </div>
                
                {/* Show assigned teacher */}
                {isAssigned && (
                  <div className="mb-3 p-2 rounded-lg bg-green-100/70 border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Giáo viên đã gán:</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-medium text-green-800">
                        {assignedTeachers.map(t => t.fullName).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {group.teachers.map(t => {
                    // Get General score from teacher's skillDetails
                    const generalSkill = t.skillDetails?.find(s => s.skill === 'GENERAL')
                    const generalScore = generalSkill 
                      ? { spec: generalSkill.specialization, level: generalSkill.level }
                      : null
                    
                    // Fallback: get specialization from skills array if no skillDetails
                    const fallbackSpec = !generalScore && t.skills?.length > 0 
                      ? t.skills.find(s => s !== 'GENERAL') || t.skills[0]
                      : null
                    
                    // Check if this teacher is already assigned for this day
                    const isThisTeacherAssigned = assignedTeachers.some(at => at.teacherId === t.teacherId)

                    return (
                      <button
                        key={t.teacherId}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors group",
                          isThisTeacherAssigned 
                            ? "border-green-400 bg-green-100 cursor-default" 
                            : "hover:bg-muted/50 hover:border-primary/50"
                        )}
                        onClick={() => {
                          if (isThisTeacherAssigned) return
                          // Extract specializations from skillDetails
                          const specs = t.skillDetails?.map(s => s.specialization).filter(Boolean) ?? []
                          const uniqueSpecs = [...new Set(specs)]
                          handleAssignForDay(t.teacherId, t.fullName, dayValue, { specializations: uniqueSpecs })
                        }}
                        disabled={(isSubmitting && pendingTeacherId === t.teacherId) || isThisTeacherAssigned}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "font-medium truncate",
                            isThisTeacherAssigned && "text-green-800"
                          )}>{t.fullName}</span>
                          {generalScore ? (
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold shrink-0',
                              isThisTeacherAssigned ? 'bg-green-200 text-green-800' :
                              generalScore.level >= 8 ? 'bg-emerald-100 text-emerald-700' :
                              generalScore.level >= 6 ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            )}>
                              {generalScore.spec} {generalScore.level.toFixed(1)}
                            </span>
                          ) : fallbackSpec && (
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0",
                              isThisTeacherAssigned ? "bg-green-200 text-green-800" : "bg-gray-100 text-gray-600"
                            )}>
                              {fallbackSpec}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs font-medium ml-2 whitespace-nowrap",
                          isThisTeacherAssigned 
                            ? "text-green-700 flex items-center gap-1" 
                            : "text-primary opacity-70 group-hover:opacity-100 transition-opacity"
                        )}>
                          {isThisTeacherAssigned ? (
                            <><Check className="h-3.5 w-3.5" /> Đã chọn</>
                          ) : isSubmitting && pendingTeacherId === t.teacherId ? (
                            'Đang gán...'
                          ) : (
                            'Gán →'
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.specializationMismatch && !confirmDialog.currentTeacherName
                ? 'Cảnh báo chuyên môn không phù hợp'
                : 'Xác nhận thay đổi giáo viên'
              }
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {confirmDialog.dayLabel 
                  ? confirmDialog.currentTeacherName
                    ? `Bạn có muốn thay đổi giáo viên cho ${confirmDialog.dayLabel}?`
                    : `Bạn có muốn gán giáo viên cho ${confirmDialog.dayLabel}?`
                  : confirmDialog.currentTeacherName
                    ? 'Bạn có muốn thay đổi giáo viên cho lớp học này?'
                    : 'Bạn có muốn gán giáo viên cho lớp học này?'
                }
              </p>
              
              {/* Specialization mismatch warning */}
              {confirmDialog.specializationMismatch && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                  <p className="text-sm font-medium text-amber-800">⚠️ Chuyên môn không khớp</p>
                  <p className="text-sm text-amber-700">
                    Giáo viên <span className="font-semibold">{confirmDialog.teacherName}</span> có chuyên môn{' '}
                    <span className="font-semibold">{confirmDialog.specializationMismatch.teacherSpec || 'Chung'}</span>,{' '}
                    nhưng khóa học này yêu cầu <span className="font-semibold">{confirmDialog.specializationMismatch.courseSubject}</span>.
                  </p>
                </div>
              )}
              
              {/* Teacher change info */}
              {confirmDialog.currentTeacherName && (
                <>
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Giáo viên hiện tại:</span>
                      <span className="font-medium text-foreground">{confirmDialog.currentTeacherName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Giáo viên mới:</span>
                      <span className="font-medium text-primary">{confirmDialog.teacherName}</span>
                    </div>
                  </div>
                  <p className="text-sm text-amber-600 mt-2">
                    Giáo viên hiện tại sẽ bị gỡ khỏi các buổi học này.
                  </p>
                </>
              )}
              
              {/* Only show new teacher info when there's no current teacher */}
              {!confirmDialog.currentTeacherName && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Giáo viên:</span>
                    <span className="font-medium text-primary">{confirmDialog.teacherName}</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmDialog.teacherId !== null) {
                  handleAssign(confirmDialog.teacherId, confirmDialog.sessionIds)
                }
              }}
            >
              {confirmDialog.currentTeacherName ? 'Xác nhận thay đổi' : 'Xác nhận gán'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
