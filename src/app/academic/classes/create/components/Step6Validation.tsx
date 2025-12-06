import { useMemo, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useGetClassByIdQuery, classApi } from '@/store/services/classApi'
import { useValidateClassMutation, useGetClassSessionsQuery, useSubmitClassMutation } from '@/store/services/classCreationApi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { ValidateClassData, ValidationChecks } from '@/types/classCreation'
import { AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'

const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
}

const formatScheduleDays = (days?: number[], fallback?: string): string => {
  if (days && days.length > 0) {
    const normalized = Array.from(new Set(days))
      .map((day) => {
        if (typeof day !== 'number' || Number.isNaN(day)) return undefined
        return ((day % 7) + 7) % 7
      })
      .filter((day): day is number => typeof day === 'number')
      .sort((a, b) => a - b)

    if (normalized.length > 0) {
      return normalized.map((day) => DAY_SHORT_LABELS[day] ?? `Thứ ${day}`).join(' / ')
    }
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback
  }

  return '--'
}

interface Step6ValidationProps {
  classId: number | null
  onFinish?: () => void
}

export function Step6Validation({ classId, onFinish }: Step6ValidationProps) {
  const dispatch = useDispatch()
  const { data: classDetail, isLoading: isClassLoading } = useGetClassByIdQuery(classId ?? 0, { skip: !classId })
  const [validateClass, { isLoading: isValidating }] = useValidateClassMutation()
  const [submitClass, { isLoading: isSubmitting }] = useSubmitClassMutation()
  const [result, setResult] = useState<ValidateClassData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'missingTimeSlot' | 'missingResource' | 'missingTeacher' | 'completed'>('all')

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
  } = useGetClassSessionsQuery(classId ?? 0, { skip: !classId })

  const classOverview = classDetail?.data
  const overview = sessionsData?.data

  const handleValidate = async () => {
    setErrorMessage(null)
    try {
      const response = await validateClass(classId!).unwrap()
      if (response.data) {
        setResult(response.data)
      } else {
        setResult(null)
        setErrorMessage(response.message || 'Không thể kiểm tra lớp học.')
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể kiểm tra.'
      setErrorMessage(message)
    }
  }

  const handleSubmit = async () => {
    if (!classId) return
    try {
      const response = await submitClass(classId).unwrap()
      toast.success(response.message || 'Lớp đã được gửi duyệt.')
      dispatch(classApi.util.invalidateTags(['Classes']))
      onFinish?.()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể gửi duyệt. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const defaultTotal = overview?.totalSessions ?? classDetail?.data?.upcomingSessions?.length ?? 0
  const summaryChecks: ValidationChecks = result?.checks || {
    totalSessions: defaultTotal,
    sessionsWithTimeSlots: 0,
    sessionsWithResources: 0,
    sessionsWithTeachers: 0,
    sessionsWithoutTimeSlots: defaultTotal,
    sessionsWithoutResources: defaultTotal,
    sessionsWithoutTeachers: defaultTotal,
    completionPercentage: 0,
    allSessionsHaveTimeSlots: false,
    allSessionsHaveResources: false,
    allSessionsHaveTeachers: false,
  }

  const canSubmit = Boolean(result?.canSubmit && result.valid && result.errors.length === 0)

  // Class info rows for display
  const infoRows = useMemo(() => {
    if (!classOverview) return []
    return [
      { label: 'Mã lớp', value: classOverview.code },
      { label: 'Khóa học', value: classOverview.course?.name },
      { label: 'Chi nhánh', value: classOverview.branch?.name },
      { label: 'Ngày bắt đầu', value: classOverview.startDate },
      { label: 'Ngày kết thúc dự kiến', value: classOverview.plannedEndDate },
      {
        label: 'Ngày học',
        value: formatScheduleDays(classOverview.scheduleDays, classOverview.scheduleSummary),
      },
      { label: 'Sức chứa tối đa', value: classOverview.maxCapacity?.toString() },
    ]
  }, [classOverview])

  // Helper functions
  const readDisplayText = useCallback((value: unknown): string | undefined => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return undefined
  }, [])

  const collectStringsFromObject = useCallback((value: unknown, keys: string[]) => {
    if (!value || typeof value !== 'object') return undefined
    for (const key of keys) {
      const result = readDisplayText((value as Record<string, unknown>)[key])
      if (result) return result
    }
    return undefined
  }, [readDisplayText])

  const collectTeacherNames = useCallback((source: unknown): string[] => {
    const names = new Set<string>()
    const add = (val: unknown) => {
      if (typeof val === 'string' && val.trim()) names.add(val.trim())
    }
    if (!source) return []
    if (typeof source === 'string') { add(source); return [...names] }
    if (Array.isArray(source)) {
      source.forEach(item => {
        if (typeof item === 'string') add(item)
        else if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          add(obj.fullName); add(obj.name); add(obj.teacherName)
        }
      })
    } else if (typeof source === 'object') {
      const obj = source as Record<string, unknown>
      add(obj.fullName); add(obj.name); add(obj.teacherName)
      if (Array.isArray(obj.teachers)) collectTeacherNames(obj.teachers).forEach(n => names.add(n))
    }
    return [...names]
  }, [])

  // Filter logic
  const weekGroups = useMemo(() => {
    if (!overview?.groupedByWeek?.length) return []
    const sessionMap = new Map(overview.sessions.map(s => [s.sessionId, s]))
    return overview.groupedByWeek.map(week => ({
      ...week,
      sessions: week.sessionIds.map(id => sessionMap.get(id)).filter(Boolean)
    }))
  }, [overview])

  const filterSession = useCallback((session: Record<string, unknown>) => {
    if (selectedStatus === 'all') return true
    const hasTimeSlot = Boolean(session.timeSlotTemplateId)
    const hasResource = Boolean(session.resourceId)
    const hasTeacher = Boolean(session.hasTeacher)
    if (selectedStatus === 'missingTimeSlot') return !hasTimeSlot
    if (selectedStatus === 'missingResource') return !hasResource
    if (selectedStatus === 'missingTeacher') return !hasTeacher
    if (selectedStatus === 'completed') return hasTimeSlot && hasResource && hasTeacher
    return true
  }, [selectedStatus])

  const timelineWeeks = useMemo(() => {
    const weeks = selectedWeek === 'all' ? weekGroups : weekGroups.filter(w => w.weekNumber === selectedWeek)
    return weeks.map(week => ({
      ...week,
      sessions: week.sessions.filter(s => filterSession(s as unknown as Record<string, unknown>))
    })).filter(w => w.sessions.length > 0)
  }, [weekGroups, selectedWeek, filterSession])

  const hasSessions = timelineWeeks.some(w => w.sessions.length > 0)

  // Format helpers
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return dateString }
  }

  const getTimeSlotLabel = (session: Record<string, unknown>) => {
    const start = collectStringsFromObject(session, ['startTime', 'timeSlotStart'])
    const end = collectStringsFromObject(session, ['endTime', 'timeSlotEnd'])
    if (start && end) return `${start} - ${end}`
    const name = collectStringsFromObject(session, ['timeSlotName', 'timeSlotTemplateName'])
    return name || (session.timeSlotTemplateId ? 'Đã gán' : 'Chưa gán')
  }

  const getResourceLabel = (session: Record<string, unknown>) => {
    const name = collectStringsFromObject(session, ['resourceName', 'roomName'])
    return name || (session.resourceId ? 'Đã gán' : 'Chưa gán')
  }

  const getTeacherLabel = (session: Record<string, unknown>) => {
    const names = collectTeacherNames(session.teachers)
    if (names.length > 0) return names.join(', ')
    return session.hasTeacher ? 'Đã gán' : 'Chưa gán'
  }

  if (!classId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vui lòng hoàn thành các bước trước.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isSessionsLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Kiểm tra thông tin</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kiểm tra lớp học trước khi gửi duyệt • {summaryChecks.totalSessions} buổi
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="text-sm text-muted-foreground">Tổng buổi</p>
          <p className="text-xl font-semibold">{summaryChecks.totalSessions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Có khung giờ</p>
          <p className="text-xl font-semibold">{summaryChecks.sessionsWithTimeSlots}</p>
          {summaryChecks.sessionsWithoutTimeSlots > 0 && (
            <p className="text-xs text-red-600">{summaryChecks.sessionsWithoutTimeSlots} thiếu</p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Có tài nguyên</p>
          <p className="text-xl font-semibold">{summaryChecks.sessionsWithResources}</p>
          {summaryChecks.sessionsWithoutResources > 0 && (
            <p className="text-xs text-red-600">{summaryChecks.sessionsWithoutResources} thiếu</p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Có giáo viên</p>
          <p className="text-xl font-semibold">{summaryChecks.sessionsWithTeachers}</p>
          {summaryChecks.sessionsWithoutTeachers > 0 && (
            <p className="text-xs text-red-600">{summaryChecks.sessionsWithoutTeachers} thiếu</p>
          )}
        </div>
      </div>

      {/* Validate Action */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <p className="font-medium">Chạy kiểm tra</p>
          <p className="text-sm text-muted-foreground">Kiểm tra {summaryChecks.totalSessions} buổi học</p>
        </div>
        <Button onClick={handleValidate} disabled={isValidating}>
          {isValidating ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
        </Button>
      </div>

      {/* Messages */}
      {result && (
        <Alert className={result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={result.valid ? 'text-green-800' : 'text-red-800'}>
            {result.valid ? (
              <span className="flex items-center gap-2"><Check className="h-4 w-4" /> {result.message || 'Lớp học đã đầy đủ thông tin'}</span>
            ) : result.message}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-40">
          <Select value={String(selectedWeek)} onValueChange={v => setSelectedWeek(v === 'all' ? 'all' : Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tuần</SelectItem>
              {weekGroups.map(w => (
                <SelectItem key={w.weekNumber} value={String(w.weekNumber)}>Tuần {w.weekNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as typeof selectedStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="missingTimeSlot">Thiếu khung giờ</SelectItem>
              <SelectItem value="missingResource">Thiếu tài nguyên</SelectItem>
              <SelectItem value="missingTeacher">Thiếu giáo viên</SelectItem>
              <SelectItem value="completed">Hoàn chỉnh</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {!result ? (
          <div className="p-6 text-center text-muted-foreground rounded-lg border">
            Nhấn "Kiểm tra ngay" để xem chi tiết
          </div>
        ) : hasSessions ? (
          timelineWeeks.map(week => (
            <div key={week.weekNumber} className="rounded-lg border">
              <div className="px-4 py-3 border-b bg-muted/30 flex justify-between items-center">
                <span className="font-medium">Tuần {week.weekNumber} ({week.weekRange})</span>
                <span className="text-sm text-muted-foreground">{week.sessions.length} buổi</span>
              </div>
              <div className="divide-y">
                {week.sessions.map(session => (
                  <div key={session?.sessionId} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-16 text-center">
                      <span className="text-sm font-medium">#{session?.sequenceNumber}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{formatDate(session?.date || '')}</p>
                      <p className="text-sm text-muted-foreground">{session?.courseSessionName}</p>
                    </div>
                    <div className="text-right text-sm space-y-1">
                      <p>Giờ: <span className="font-medium">{getTimeSlotLabel(session as unknown as Record<string, unknown>)}</span></p>
                      <p>Phòng: <span className="font-medium">{getResourceLabel(session as unknown as Record<string, unknown>)}</span></p>
                      <p>GV: <span className="font-medium">{getTeacherLabel(session as unknown as Record<string, unknown>)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Alert><AlertDescription>Không có buổi học khớp với bộ lọc.</AlertDescription></Alert>
        )}
      </div>

      {/* Class Info Summary */}
      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Thông tin lớp học</CardTitle>
          <p className="text-sm text-muted-foreground">Kiểm tra lại các thông tin chính trước khi gửi duyệt.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {isClassLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải thông tin lớp…</p>
          ) : (
            infoRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-border/50 bg-card/60 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                <p className="text-base font-semibold text-foreground">{row.value || '--'}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Submit Action */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
        <div>
          <p className="font-medium">
            {canSubmit ? 'Lớp học đủ điều kiện gửi duyệt' : 'Hoàn thành kiểm tra để gửi duyệt'}
          </p>
          <p className="text-sm text-muted-foreground">
            {canSubmit ? 'Nhấn nút để gửi lớp đi phê duyệt' : 'Vui lòng kiểm tra và đảm bảo tất cả thông tin đã đầy đủ'}
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} size="lg">
          {isSubmitting ? 'Đang gửi duyệt...' : 'Gửi duyệt lớp học'}
        </Button>
      </div>
    </div>
  )
}
