import { useState, useMemo, useEffect } from 'react'
import { addDays, addWeeks, format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { MapPinIcon, VideoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useGetCurrentWeekQuery,
  useGetWeeklyScheduleQuery,
  type SessionSummaryDTO
} from '@/store/services/studentScheduleApi'
import {
  useSubmitStudentRequestMutation
} from '@/store/services/studentRequestApi'
import {
  BaseFlowComponent,
  Section,
  ReasonInput,
  SelectionCard,
  type AbsenceFlowProps
} from '../UnifiedRequestFlow'
import {
  useSuccessHandler,
  useErrorHandler,
  Validation,
  WEEK_DAYS
} from '../utils'

// Helper to parse session time
function parseSessionDateTime(dateStr: string, timeStr?: string) {
  if (!timeStr) return parseISO(dateStr)
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  return parseISO(`${dateStr}T${normalizedTime}`)
}

// Helper to check availability
type CombinedSession = SessionSummaryDTO

function getSessionAvailability(session: CombinedSession, futureLimit: Date) {
  const dateStr = session.date
  const timeStr = 'startTime' in session ? session.startTime : session.timeSlot.startTime

  const sessionDateTime = parseSessionDateTime(dateStr, timeStr)
  const now = new Date()
  const isPast = sessionDateTime.getTime() <= now.getTime()
  const isTooFar = sessionDateTime.getTime() > futureLimit.getTime()

  // Check specific fields depending on the type
  const attendanceStatus = 'attendanceStatus' in session ? session.attendanceStatus : undefined
  const isExcused = attendanceStatus === 'EXCUSED'
  const hasAttendance =
    attendanceStatus !== undefined &&
    attendanceStatus !== null &&
    attendanceStatus !== 'PLANNED' &&
    attendanceStatus !== 'EXCUSED'
  const isInactive = 'sessionStatus' in session && session.sessionStatus !== 'PLANNED'

  let disabledReason: string | null = null
  if (isPast) disabledReason = 'Buổi đã diễn ra'
  else if (isTooFar) disabledReason = 'Chỉ có thể xin nghỉ trong 30 ngày tới'
  else if (isExcused) disabledReason = 'Đã xin nghỉ (có phép)'
  else if (hasAttendance) disabledReason = 'Đã điểm danh'
  else if (isInactive) disabledReason = 'Buổi không khả dụng'

  return {
    isSelectable: !isPast && !isTooFar && !hasAttendance && !isInactive && !isExcused,
    disabledReason
  }
}

export default function AbsenceFlow({ onSuccess }: AbsenceFlowProps) {
  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [weekStartCursor, setWeekStartCursor] = useState<string | null>(null)

  // Selection State
  const [selectedSession, setSelectedSession] = useState<{
    sessionId: number
    classId: number
    classCode: string
    date: string
    startTime: string
    endTime: string
    title: string
  } | null>(null)

  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Data Fetching
  const futureLimitDate = useMemo(() => addWeeks(new Date(), 4), [])

  // Weekly Schedule
  const { data: currentWeekResponse } = useGetCurrentWeekQuery()
  const currentWeekStart = currentWeekResponse?.data

  useEffect(() => {
    if (currentWeekStart) {
      setWeekStartCursor(currentWeekStart)
    }
  }, [currentWeekStart])

  const { data: weeklyScheduleResponse, isFetching: isLoadingSchedule } = useGetWeeklyScheduleQuery(
    { weekStart: weekStartCursor ?? '' },
    { skip: !weekStartCursor }
  )

  const [submitRequest, { isLoading: isSubmitting }] = useSubmitStudentRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  // Process Upcoming Sessions
  const upcomingSessions = useMemo(() => {
    if (!weeklyScheduleResponse?.data) return []
    const schedule = weeklyScheduleResponse.data.schedule
    const sessions: SessionSummaryDTO[] = []

    WEEK_DAYS.forEach(day => {
      if (schedule[day]) {
        sessions.push(...schedule[day])
      }
    })

    // Filter and Sort
    return sessions
      .map(session => ({
        ...session,
        ...getSessionAvailability(session, futureLimitDate)
      }))
      .filter(s => s.isSelectable) // Only show selectable sessions
      .sort((a, b) => {
        const dateA = parseSessionDateTime(a.date, a.startTime)
        const dateB = parseSessionDateTime(b.date, b.startTime)
        return dateA.getTime() - dateB.getTime()
      })
  }, [weeklyScheduleResponse, futureLimitDate])

  // Handlers
  const handleNext = () => {
    if (currentStep === 1 && selectedSession) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleNextWeek = () => {
    if (!weekStartCursor) return
    const nextWeek = format(addWeeks(parseISO(weekStartCursor), 1), 'yyyy-MM-dd')
    setWeekStartCursor(nextWeek)
  }

  const handlePrevWeek = () => {
    if (!weekStartCursor || !currentWeekStart) return
    const prevWeek = format(addWeeks(parseISO(weekStartCursor), -1), 'yyyy-MM-dd')
    if (parseISO(prevWeek) >= parseISO(currentWeekStart)) {
      setWeekStartCursor(prevWeek)
    }
  }

  const isPrevWeekDisabled = useMemo(() => {
    if (!weekStartCursor || !currentWeekStart) return true
    return parseISO(weekStartCursor) <= parseISO(currentWeekStart)
  }, [weekStartCursor, currentWeekStart])

  const handleSubmit = async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedSession) return

    try {
      await submitRequest({
        requestType: 'ABSENCE',
        currentClassId: selectedSession.classId,
        targetSessionId: selectedSession.sessionId,
        requestReason: reason.trim()
      }).unwrap()

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  // Steps Config
  const steps = [
    {
      id: 1,
      title: 'Chọn buổi nghỉ',
      description: 'Chọn buổi học bạn muốn xin nghỉ',
      isComplete: !!selectedSession,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Lý do',
      description: 'Nhập lý do xin nghỉ',
      isComplete: reason.length >= 10,
      isAvailable: !!selectedSession
    }
  ]

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={!selectedSession}
      isSubmitDisabled={reason.length < 10}
      isSubmitting={isSubmitting}
    >
      {currentStep === 1 && (
        <Section>
          <div className="flex items-center justify-between pb-2 border-b mb-3">
            <p className="text-xs text-muted-foreground">
              Tuần {weekStartCursor ? `${format(parseISO(weekStartCursor), 'dd/MM')} - ${format(addDays(parseISO(weekStartCursor), 6), 'dd/MM')}` : '...'}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handlePrevWeek} disabled={isPrevWeekDisabled}>
                ← Trước
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleNextWeek} disabled={!weekStartCursor}>
                Sau →
              </Button>
            </div>
          </div>
          <div className="min-h-[280px] space-y-2">
            {!isLoadingSchedule && upcomingSessions.length > 0 ? (
              upcomingSessions.map(session => (
                  <SelectionCard
                    key={session.sessionId}
                    item={session}
                    isSelected={selectedSession?.sessionId === session.sessionId}
                    onSelect={() => setSelectedSession({
                      sessionId: session.sessionId,
                      classId: session.classId,
                      classCode: session.classCode,
                      date: session.date,
                      startTime: session.startTime,
                      endTime: session.endTime,
                      title: session.topic
                    })}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {session.classCode}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(session.date), 'EEE, dd/MM', { locale: vi })} · {session.startTime}-{session.endTime}
                          </span>
                          <Badge variant={session.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                            {session.modality === 'ONLINE' ? (
                              <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                            ) : (
                              <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                            )}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">{session.topic}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{session.branchName}</span>
                          {session.resourceName && (
                            <>
                              <span>·</span>
                              <span>{session.resourceName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectionCard>
                ))
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Không có buổi học nào trong tuần này.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vui lòng chọn tuần khác hoặc không có buổi nào có thể xin nghỉ.
                  </p>
                </div>
              )}
          </div>
        </Section>
      )}

      {currentStep === 2 && selectedSession && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-3 border mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{selectedSession.classCode}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(selectedSession.date), 'EEE, dd/MM', { locale: vi })} · {selectedSession.startTime}-{selectedSession.endTime}
                  </span>
                </div>
                <p className="font-medium text-sm mt-1">{selectedSession.title}</p>
              </div>
            </div>
          </div>

          <ReasonInput
            value={reason}
            onChange={(val) => {
              setReason(val)
              if (reasonError) setReasonError(null)
            }}
            placeholder="Nhập lý do xin nghỉ (ví dụ: Ốm, bận việc gia đình...)"
            error={reasonError}
          />
        </Section>
      )}
    </BaseFlowComponent>
  )
}
