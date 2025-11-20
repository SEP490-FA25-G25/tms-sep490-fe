import { useMemo, useState, useCallback } from 'react'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { useValidateClassMutation, useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WizardFooter } from './WizardFooter'
import type { ValidateClassData, ValidationChecks } from '@/types/classCreation'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Step6ValidationProps {
  classId: number | null
  onBack: () => void
  onContinue: () => void
  onCancelKeepDraft: () => void
  onCancelDelete: () => Promise<void> | void
}

export function Step6Validation({ classId, onBack, onContinue, onCancelKeepDraft, onCancelDelete }: Step6ValidationProps) {
  const { data: classDetail } = useGetClassByIdQuery(classId ?? 0, {
    skip: !classId,
  })
  const [validateClass, { isLoading: isValidating }] = useValidateClassMutation()
  const [result, setResult] = useState<ValidateClassData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'missingTimeSlot' | 'missingResource' | 'missingTeacher' | 'completed'>('all')
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    isError: isSessionsError,
  } = useGetClassSessionsQuery(classId ?? 0, {
    skip: !classId,
  })
  const overview = sessionsData?.data

  const handleValidate = async () => {
    setErrorMessage(null)
    try {
      const response = await validateClass(classId).unwrap()
      if (response.data) {
        setResult(response.data)
        setApiMessage(response.message || response.data.message)
      } else {
        setResult(null)
        setApiMessage(null)
        setErrorMessage(response.message || 'Không thể kiểm tra lớp học.')
      }
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể kiểm tra. Vui lòng thử lại.'
      setErrorMessage(message)
    }
  }

  const defaultTotal =
    overview?.totalSessions ??
    classDetail?.data?.sessionSummary?.totalSessions ??
    classDetail?.data?.upcomingSessions?.length ??
    0
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

  const canContinue = Boolean(result?.canSubmit && result.valid && result.errors.length === 0)

  const summaryItems = [
    {
      label: 'Tổng buổi',
      value: summaryChecks.totalSessions,
      highlight: false,
    },
    {
      label: 'Có khung giờ',
      value: summaryChecks.sessionsWithTimeSlots,
      highlight: summaryChecks.sessionsWithoutTimeSlots > 0,
      hint: `${summaryChecks.sessionsWithoutTimeSlots} buổi thiếu`,
    },
    {
      label: 'Có tài nguyên',
      value: summaryChecks.sessionsWithResources,
      highlight: summaryChecks.sessionsWithoutResources > 0,
      hint: `${summaryChecks.sessionsWithoutResources} buổi thiếu`,
    },
    {
      label: 'Có giáo viên',
      value: summaryChecks.sessionsWithTeachers,
      highlight: summaryChecks.sessionsWithoutTeachers > 0,
      hint: `${summaryChecks.sessionsWithoutTeachers} buổi thiếu`,
    },
  ]

  const sessionDetailMap = useMemo(() => {
    const upcoming = classDetail?.data?.upcomingSessions ?? []
    return upcoming.reduce<Record<number, { startTime: string; endTime: string; room: string; teachers: { fullName: string }[] }>>((acc, session) => {
      acc[session.id] = {
        startTime: session.startTime,
        endTime: session.endTime,
        room: session.room,
        teachers: session.teachers,
      }
      return acc
    }, {})
  }, [classDetail])
  const weekOptions = overview?.groupedByWeek ?? []
  const weekSelectOptions = [{ label: 'Tất cả', value: 'all' as const }, ...weekOptions.map((week) => ({
    label: `Tuần ${week.weekNumber}`,
    value: week.weekNumber as number,
  }))]

  const statusFilterOptions = [
    { label: 'Tất cả trạng thái', value: 'all' as const },
    { label: 'Thiếu khung giờ', value: 'missingTimeSlot' as const },
    { label: 'Thiếu tài nguyên', value: 'missingResource' as const },
    { label: 'Thiếu giáo viên', value: 'missingTeacher' as const },
    { label: 'Đã hoàn chỉnh', value: 'completed' as const },
  ]

  const readDisplayText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  const collectStringsFromObject = (value: unknown, keys: string[]) => {
    if (!value || typeof value !== 'object') return []
    const record = value as Record<string, unknown>
    return keys
      .map((key) => readDisplayText(record[key]))
      .filter((val): val is string => Boolean(val))
  }

  const teacherNameKeys = ['fullName', 'name', 'displayName', 'teacherName', 'employeeName']
  const collectTeacherNames = (source: unknown): string[] => {
    if (!source) return []
    if (Array.isArray(source)) {
      return (source as unknown[])
        .map((entry) => {
          if (typeof entry === 'string') return readDisplayText(entry)
          if (typeof entry === 'object' && entry) {
            const record = entry as Record<string, unknown>
            for (const key of teacherNameKeys) {
              const candidate = readDisplayText(record[key])
              if (candidate) return candidate
            }
          }
          return undefined
        })
        .filter((val): val is string => Boolean(val))
    }
    if (typeof source === 'string') {
      return source
        .split(/[,;|]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    }
    if (typeof source === 'object') {
      const record = source as Record<string, unknown>
      for (const key of teacherNameKeys) {
        const candidate = readDisplayText(record[key])
        if (candidate) return [candidate]
      }
    }
    return []
  }

  const matchesStatus = useCallback((session: typeof overview.sessions[number]) => {
    switch (selectedStatus) {
      case 'missingTimeSlot':
        return !session.hasTimeSlot
      case 'missingResource':
        return !session.hasResource
      case 'missingTeacher':
        return !session.hasTeacher
      case 'completed':
        return session.hasTimeSlot && session.hasResource && session.hasTeacher
      default:
        return true
    }
  }, [selectedStatus])

  const timelineWeeks = useMemo(() => {
    if (!overview) return []
    const sessionMap = new Map(overview.sessions.map((session) => [session.sessionId, session]))

    const sourceWeeks = overview.groupedByWeek?.length
      ? overview.groupedByWeek
      : [
          {
            weekNumber: 1,
            weekRange: overview.dateRange
              ? `${overview.dateRange.startDate} - ${overview.dateRange.endDate}`
              : 'Không xác định',
            sessionCount: overview.sessions.length,
            sessionIds: overview.sessions.map((session) => session.sessionId),
          },
        ]

    return sourceWeeks
      .filter((week) => selectedWeek === 'all' || week.weekNumber === selectedWeek)
      .map((week) => {
        const sessions = week.sessionIds
          .map((id) => sessionMap.get(id))
          .filter((session): session is typeof overview.sessions[number] => Boolean(session))
          .filter(matchesStatus)
        return { ...week, sessions }
      })
      .filter((week) => week.sessions.length > 0)
  }, [overview, selectedWeek, selectedStatus, matchesStatus])

  const hasSessions = timelineWeeks.some((week) => week.sessions.length > 0)

  const formatDisplayDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  const getTimeSlotLabel = (session: Record<string, unknown>) => {
    const detail = sessionDetailMap[session.sessionId as number]
    let infoLabel: string | undefined
    if ('timeSlotInfo' in session && session.timeSlotInfo && typeof session.timeSlotInfo === 'object') {
      const info = session.timeSlotInfo as Record<string, unknown>
      infoLabel =
        readDisplayText(info.label) ??
        readDisplayText(info.displayName)
      if (!infoLabel) {
        const start = readDisplayText(info.startTime)
        const end = readDisplayText(info.endTime)
        if (start && end) {
          infoLabel = `${start} - ${end}`
        }
      }
    }
    const candidates = [
      infoLabel,
      'timeSlotLabel' in session ? readDisplayText(session.timeSlotLabel) : undefined,
      'timeSlotName' in session ? readDisplayText(session.timeSlotName) : undefined,
      'timeSlot' in session ? readDisplayText(session.timeSlot) : undefined,
      detail ? `${detail.startTime} - ${detail.endTime}` : undefined,
    ].filter(Boolean) as string[]
    if (candidates.length > 0) return candidates[0]
    const hasTimeSlotAssigned = 'hasTimeSlot' in session ? Boolean(session.hasTimeSlot) : false
    return hasTimeSlotAssigned ? 'Đã gán' : 'Chưa gán'
  }

  const getResourceLabel = (session: Record<string, unknown>) => {
    const detail = sessionDetailMap[session.sessionId as number]
    const candidates: string[] = []
    if ('resourceName' in session) {
      const value = readDisplayText(session.resourceName)
      if (value) candidates.push(value)
    }
    if ('resourceDisplayName' in session) {
      const value = readDisplayText(session.resourceDisplayName)
      if (value) candidates.push(value)
    }
    if ('roomName' in session) {
      const value = readDisplayText(session.roomName)
      if (value) candidates.push(value)
    }
    if ('room' in session) {
      const value = readDisplayText(session.room)
      if (value) candidates.push(value)
    }
    const objectKeys = ['displayName', 'name', 'code']
    if ('resourceInfo' in session) {
      candidates.push(...collectStringsFromObject(session.resourceInfo, objectKeys))
    }
    if ('resource' in session) {
      candidates.push(...collectStringsFromObject(session.resource, objectKeys))
    }
    if ('resourceDetails' in session) {
      candidates.push(...collectStringsFromObject(session.resourceDetails, objectKeys))
    }
    if ('assignedResource' in session) {
      candidates.push(...collectStringsFromObject(session.assignedResource, objectKeys))
    }
    if (detail?.room) {
      const roomLabel = readDisplayText(detail.room)
      if (roomLabel) candidates.push(roomLabel)
    }
    if (candidates.length > 0) return candidates[0]
    const hasResourceAssigned = 'hasResource' in session ? Boolean(session.hasResource) : false
    return hasResourceAssigned ? 'Đã gán' : 'Chưa gán'
  }

  const getTeacherLabel = (session: Record<string, unknown>) => {
    const detail = sessionDetailMap[session.sessionId as number]
    const names = new Set<string>()
    const mergeNames = (source: unknown) => {
      collectTeacherNames(source).forEach((name) => names.add(name))
    }
    if ('teachers' in session) mergeNames(session.teachers)
    if ('teacherAssignments' in session) mergeNames(session.teacherAssignments)
    if ('assignedTeachers' in session) mergeNames(session.assignedTeachers)
    if ('teacherInfo' in session) mergeNames(session.teacherInfo)
    if ('teacherList' in session) mergeNames(session.teacherList)
    if ('teacherDetails' in session) mergeNames(session.teacherDetails)
    if ('teacherNames' in session) mergeNames(session.teacherNames)
    if ('teacherName' in session) mergeNames(session.teacherName)
    if ('teacher' in session) mergeNames(session.teacher)
    if (detail?.teachers?.length) mergeNames(detail.teachers)
    if (names.size > 0) return Array.from(names).join(', ')
    const hasTeacherAssigned = 'hasTeacher' in session ? Boolean(session.hasTeacher) : false
    return hasTeacherAssigned ? 'Đã gán' : 'Chưa gán'
  }

  if (!classId) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Vui lòng hoàn thành các bước trước để tạo lớp trước khi kiểm tra.</AlertDescription>
        </Alert>
        <WizardFooter
          currentStep={6}
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
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Step 6: Kiểm tra thông tin</h2>
        <p className="text-muted-foreground">
          Chạy kiểm tra tự động để đảm bảo lớp học đã có đầy đủ thông tin (khung giờ · tài nguyên · giáo viên) trước khi gửi duyệt.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'rounded-xl border bg-muted/20 p-3',
                item.highlight && 'border-rose-300 bg-rose-50/60'
              )}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              {item.highlight && (
                <p className="text-xs text-rose-700">{item.hint}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">Chạy kiểm tra lớp học</p>
          <p className="text-sm text-muted-foreground">
            Hệ thống sẽ kiểm tra tất cả {summaryChecks.totalSessions} buổi học và báo cáo các buổi còn thiếu dữ liệu.
          </p>
        </div>
        <Button onClick={handleValidate} disabled={isValidating}>
          {isValidating ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}
        </Button>
      </div>

      {apiMessage && (
        <Alert variant={result?.valid ? 'default' : 'destructive'}>
          <AlertDescription>{apiMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {result === null ? (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          <p>Chưa có báo cáo. Vui lòng nhấn “Kiểm tra ngay”.</p>
        </div>
      ) : result.errors.length === 0 && result.warnings.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-700">Tuyệt vời! {result.message || 'Tất cả buổi học đều đã hoàn chỉnh.'}</p>
          <p className="text-sm text-emerald-700">Bạn có thể sang bước tiếp theo để gửi duyệt lớp học.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {result.errors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="font-semibold text-rose-700 mb-2">Lỗi bắt buộc phải xử lý</p>
              <ul className="list-disc pl-5 text-sm text-rose-700">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {result.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="font-semibold text-amber-700 mb-2">Cảnh báo</p>
              <ul className="list-disc pl-5 text-sm text-amber-700">
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs tracking-wide text-muted-foreground">Tuần</Label>
            <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(value === 'all' ? 'all' : parseInt(value))}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {weekSelectOptions.map((option) => (
                  <SelectItem key={option.value.toString()} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs tracking-wide text-muted-foreground">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs tracking-wide text-muted-foreground">Tổng buổi</Label>
            <div className="rounded-xl border px-4 py-3 text-lg font-semibold">
              {overview?.totalSessions ?? summaryChecks.totalSessions ?? '--'}
            </div>
          </div>
        </div>

        {isSessionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : isSessionsError ? (
          <Alert>
            <AlertDescription>Không thể tải danh sách buổi học. Vui lòng thử lại.</AlertDescription>
          </Alert>
        ) : hasSessions ? (
          <div className="space-y-6">
            {timelineWeeks.map((week) => (
              <div key={week.weekNumber} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <div className="flex flex-col gap-1 border-b pb-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tuần {week.weekNumber}</p>
                    <p className="text-base font-semibold">{week.weekRange}</p>
                  </div>
                  <Badge variant="outline">{week.sessions.length} buổi</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {week.sessions.map((session) => (
                    <div key={session.sessionId} className="rounded-xl border border-border/60 bg-background/90 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Buổi #{session.sequenceNumber}</p>
                            <p className="text-lg font-semibold">{formatDisplayDate(session.date)}</p>
                            <p className="text-sm text-muted-foreground">{session.dayOfWeek}</p>
                          </div>
                        <div className="flex-1 md:px-6 space-y-1">
                          <p className="text-sm font-medium">{session.courseSessionName}</p>
                          <p className="text-xs text-muted-foreground">
                            Khung giờ: <span className="font-semibold text-foreground">{getTimeSlotLabel(session as Record<string, unknown>)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tài nguyên / phòng: <span className="font-semibold text-foreground">{getResourceLabel(session as Record<string, unknown>)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Giáo viên: <span className="font-semibold text-foreground">{getTeacherLabel(session as Record<string, unknown>)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>Không tìm thấy buổi học nào khớp với bộ lọc hiện tại.</AlertDescription>
          </Alert>
        )}
      </div>

      <WizardFooter
        currentStep={6}
        isFirstStep={false}
        isLastStep={false}
        onBack={onBack}
        onNext={onContinue}
        onCancelKeepDraft={onCancelKeepDraft}
        onCancelDelete={onCancelDelete}
        isNextDisabled={!canContinue}
        nextButtonText="Tiếp tục bước 7"
      />
    </div>
  )
}
