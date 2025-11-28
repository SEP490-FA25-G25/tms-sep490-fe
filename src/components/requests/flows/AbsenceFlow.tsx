import { useState, useMemo } from 'react'
import { addMonths, format, parseISO, startOfToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Clock4Icon, MapPinIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import {
  useGetCurrentWeekQuery,
  useGetWeeklyScheduleQuery,
  type SessionSummaryDTO
} from '@/store/services/studentScheduleApi'
import {
  useGetAvailableSessionsQuery,
  useSubmitStudentRequestMutation,
  type StudentSessionOption
} from '@/store/services/studentRequestApi'
import {
  BaseFlowComponent,
  Section,
  ReasonInput,
  NoteInput,
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
type CombinedSession = SessionSummaryDTO | StudentSessionOption

function getSessionAvailability(session: CombinedSession, futureLimit: Date) {
  const dateStr = session.date
  const timeStr = 'startTime' in session ? session.startTime : session.timeSlot.startTime

  const sessionDateTime = parseSessionDateTime(dateStr, timeStr)
  const now = new Date()
  const isPast = sessionDateTime.getTime() <= now.getTime()
  const isTooFar = sessionDateTime.getTime() > futureLimit.getTime()

  // Check specific fields depending on the type
  const hasAttendance = 'attendanceStatus' in session && session.attendanceStatus && session.attendanceStatus !== 'PLANNED'
  const isInactive = 'sessionStatus' in session && session.sessionStatus !== 'PLANNED'

  let disabledReason: string | null = null
  if (isPast) disabledReason = 'Buổi đã diễn ra'
  else if (isTooFar) disabledReason = 'Chỉ có thể xin nghỉ trong 30 ngày tới'
  else if (hasAttendance) disabledReason = 'Đã điểm danh'
  else if (isInactive) disabledReason = 'Buổi không khả dụng'

  return {
    isSelectable: !isPast && !isTooFar && !hasAttendance && !isInactive,
    disabledReason
  }
}

export default function AbsenceFlow({ onSuccess }: AbsenceFlowProps) {
  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())

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
  const [note, setNote] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Data Fetching
  const futureLimitDate = useMemo(() => addMonths(new Date(), 1), [])

  // 1. Upcoming Data (Weekly Schedule)
  const { data: currentWeekResponse } = useGetCurrentWeekQuery()
  const currentWeekStart = currentWeekResponse?.data
  const { data: weeklyScheduleResponse, isFetching: isLoadingSchedule } = useGetWeeklyScheduleQuery(
    { weekStart: currentWeekStart ?? '' },
    { skip: !currentWeekStart }
  )

  // 2. Calendar Data (Available Sessions for Date)
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  const { data: availableSessionsResponse, isFetching: isLoadingCalendar } = useGetAvailableSessionsQuery(
    { date: formattedDate, requestType: 'ABSENCE' },
    { skip: activeTab !== 'calendar' || !formattedDate }
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
      .filter(s => s.isSelectable) // Only show selectable in "Upcoming"
      .sort((a, b) => {
        const dateA = parseSessionDateTime(a.date, a.startTime)
        const dateB = parseSessionDateTime(b.date, b.startTime)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 5) // Take top 5
  }, [weeklyScheduleResponse, futureLimitDate])

  // Process Calendar Sessions
  const calendarSessions = useMemo(() => {
    if (!availableSessionsResponse?.data) return []
    return availableSessionsResponse.data.flatMap(cls =>
      cls.sessions.map(session => ({
        ...session,
        classId: cls.classId,
        classCode: cls.classCode,
        className: cls.className,
        branchName: cls.branchName,
        // Adapt to common shape
        sessionId: session.sessionId,
        date: session.date,
        startTime: session.timeSlot.startTime,
        endTime: session.timeSlot.endTime,
        topic: session.courseSessionTitle,
        isSelectable: true // API returns available ones usually, but we can double check if needed
      }))
    )
  }, [availableSessionsResponse])

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
        requestReason: reason.trim(),
        note: note.trim() || undefined
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upcoming">Gợi ý (Sắp tới)</TabsTrigger>
              <TabsTrigger value="calendar">Chọn theo lịch</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3 mt-0">
              {isLoadingSchedule ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : upcomingSessions.length > 0 ? (
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
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {session.classCode}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {format(parseISO(session.date), 'EEEE, dd/MM', { locale: vi })}
                          </span>
                        </div>
                        <p className="font-semibold text-sm">{session.topic}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock4Icon className="h-3 w-3" />
                            {session.startTime} - {session.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {session.branchName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SelectionCard>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  Không có buổi học nào sắp tới trong tuần này.
                  <br />
                  Vui lòng chuyển sang tab <b>Chọn theo lịch</b>.
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="rounded-lg border p-3 bg-background">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={vi}
                    className="mx-auto"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Buổi học ngày {format(selectedDate, 'dd/MM/yyyy')}
                  </p>

                  {isLoadingCalendar ? (
                    <Skeleton className="h-20 w-full" />
                  ) : calendarSessions.length > 0 ? (
                    calendarSessions.map(session => (
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{session.classCode}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                          <p className="font-medium text-sm mt-1">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">{session.branchName}</p>
                        </div>
                      </SelectionCard>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                      Không có buổi học nào trong ngày này.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Section>
      )}

      {currentStep === 2 && selectedSession && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-4 border mb-4">
            <h4 className="font-medium text-sm mb-2">Thông tin buổi nghỉ</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Lớp học</p>
                <p className="font-medium">{selectedSession.classCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian</p>
                <p className="font-medium">
                  {format(parseISO(selectedSession.date), 'dd/MM/yyyy')}
                  <br />
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Nội dung</p>
                <p className="font-medium">{selectedSession.title}</p>
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

          <NoteInput
            value={note}
            onChange={setNote}
          />
        </Section>
      )}
    </BaseFlowComponent>
  )
}
