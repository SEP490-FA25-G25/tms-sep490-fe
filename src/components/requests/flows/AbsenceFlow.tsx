import { useState, useMemo, useCallback, useEffect } from 'react'
import { addDays, addMonths, format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ArrowRightIcon } from 'lucide-react'
import {
  useGetCurrentWeekQuery,
  useGetWeeklyScheduleQuery,
  type SessionSummaryDTO
} from '@/store/services/studentScheduleApi'
import { useSubmitStudentRequestMutation } from '@/store/services/studentRequestApi'
import {
  StepHeader,
  Section,
  ReasonInput,
  BaseFlowComponent
} from '../UnifiedRequestFlow'
import {
  useSuccessHandler,
  useErrorHandler,
  Validation,
  WEEK_DAYS,
  WEEK_DAY_LABELS
} from '../utils'
import type { AbsenceFlowProps } from '../UnifiedRequestFlow'

interface SessionWithAvailability extends SessionSummaryDTO {
  isSelectable: boolean
  disabledReason: string | null
}

function parseSessionDateTime(dateStr: string, timeStr?: string) {
  if (!timeStr) {
    return parseISO(dateStr)
  }
  const normalizedTime =
    timeStr.length === 5 ? `${timeStr}:00` : timeStr.length === 8 ? timeStr : `${timeStr}:00`
  return parseISO(`${dateStr}T${normalizedTime}`)
}

function getSessionAvailability(session: SessionSummaryDTO, futureLimit: Date) {
  const sessionDateTime = parseSessionDateTime(session.date, session.startTime)
  const now = new Date()
  const isPast = sessionDateTime.getTime() <= now.getTime()
  const isTooFar = sessionDateTime.getTime() > futureLimit.getTime()
  const hasAttendanceRecord = session.attendanceStatus && session.attendanceStatus !== 'PLANNED'
  const isInactiveStatus = session.sessionStatus !== 'PLANNED'

  let disabledReason: string | null = null
  if (isPast) {
    disabledReason = 'Buổi đã diễn ra'
  } else if (isTooFar) {
    disabledReason = 'Chỉ có thể xin nghỉ trong 30 ngày tới'
  } else if (hasAttendanceRecord) {
    disabledReason = 'Đã điểm danh'
  } else if (isInactiveStatus) {
    disabledReason = 'Buổi không khả dụng'
  }

  return {
    isSelectable: !isPast && !isTooFar && !hasAttendanceRecord && !isInactiveStatus,
    disabledReason,
  }
}

export default function AbsenceFlow({ onSuccess }: AbsenceFlowProps) {
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const futureLimitDate = useMemo(() => addMonths(new Date(), 1), [])

  const { data: currentWeekResponse, isFetching: isLoadingCurrentWeek } = useGetCurrentWeekQuery()
  const {
    data: weeklyScheduleResponse,
    isFetching: isLoadingSchedule,
  } = useGetWeeklyScheduleQuery(
    {
      weekStart: weekStart ?? '',
    },
    {
      skip: !weekStart,
    }
  )
  
  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  useEffect(() => {
    if (!weekStart && currentWeekResponse?.data) {
      setWeekStart(currentWeekResponse.data)
    }
  }, [currentWeekResponse?.data, weekStart])

  useEffect(() => {
    setSelectedSessionId(null)
  }, [weekStart])

  const weekData = weeklyScheduleResponse?.data
  const groupedSessions = useMemo(() => {
    if (!weekData) return []
    const startDate = parseISO(weekData.weekStart)
    return WEEK_DAYS.map((day, index) => {
      const dayDate = addDays(startDate, index)
      const sessions: SessionWithAvailability[] = (weekData.schedule?.[day] ?? []).map((session) => {
        const { isSelectable, disabledReason } = getSessionAvailability(session, futureLimitDate)
        return {
          ...session,
          isSelectable,
          disabledReason,
        }
      })
      return {
        day,
        date: dayDate,
        sessions,
      }
    })
  }, [weekData, futureLimitDate])

  const allSessions = useMemo(
    () => groupedSessions.flatMap((group) => group.sessions),
    [groupedSessions]
  )
  const displayedGroups = groupedSessions.filter((group) => group.sessions.length > 0)
  const selectedSession = allSessions.find((session) => session.sessionId === selectedSessionId) ?? null
  const selectedClassId = selectedSession?.classId ?? null

  const weekRangeLabel = weekData
    ? `${format(parseISO(weekData.weekStart), 'dd/MM', { locale: vi })} - ${format(parseISO(weekData.weekEnd), 'dd/MM', { locale: vi })}`
    : 'Đang tải tuần...'

  const handleChangeWeek = useCallback((direction: 'prev' | 'next') => {
    if (!weekStart) return
    const nextStart = addDays(parseISO(weekStart), direction === 'next' ? 7 : -7)
    setWeekStart(format(nextStart, 'yyyy-MM-dd'))
  }, [weekStart])

  const handleReset = useCallback(() => {
    setSelectedSessionId(null)
    setReason('')
    setReasonError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedSession) {
      handleError(new Error('Vui lòng chọn buổi học muốn xin nghỉ'))
      return
    }

    if (!selectedClassId) {
      handleError(new Error('Không thể xác định lớp học của buổi này. Vui lòng thử lại.'))
      return
    }

    try {
      await submitRequest({
        requestType: 'ABSENCE',
        currentClassId: selectedClassId,
        targetSessionId: selectedSession.sessionId,
        requestReason: reason.trim(),
      }).unwrap()

      handleReset()
      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }, [selectedSession, selectedClassId, reason, submitRequest, handleReset, handleSuccess, handleError])

  // Step states
  const step1Complete = !!selectedSession
  const step2Complete = step1Complete && reason.trim().length >= 10

  const steps = [
    {
      id: 1,
      title: 'Chọn buổi muốn xin nghỉ',
      description: 'Chỉ hiển thị buổi chưa diễn ra, trong 30 ngày tới và chưa điểm danh',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Điền lý do xin nghỉ',
      description: 'Kiểm tra lại thông tin buổi học trước khi gửi',
      isComplete: step2Complete,
      isAvailable: step1Complete
    }
  ]

  return (
    <BaseFlowComponent
      onSubmit={handleSubmit}
      submitButtonText="Gửi yêu cầu"
      isSubmitDisabled={!step2Complete}
      isSubmitting={isLoading}
      onReset={handleReset}
    >
      {/* Step 1: Chọn buổi */}
      <Section>
        <StepHeader step={steps[0]} stepNumber={1} />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <p className="text-xs text-muted-foreground">Tuần đang xem</p>
              <p className="font-medium">{weekRangeLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleChangeWeek('prev')}
                disabled={!weekStart}
              >
                <ArrowRightIcon className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentWeekResponse?.data) {
                    setWeekStart(currentWeekResponse.data)
                  }
                }}
                disabled={!currentWeekResponse?.data}
              >
                Tuần hiện tại
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleChangeWeek('next')}
                disabled={!weekStart}
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingCurrentWeek || isLoadingSchedule || !weekData ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : displayedGroups.length > 0 ? (
              displayedGroups.map((group) => (
                <div key={group.day} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {WEEK_DAY_LABELS[group.day]} · {format(group.date, 'dd/MM', { locale: vi })}
                  </p>
                  <div className="space-y-2">
                    {group.sessions.map((session) => {
                      const isActive = selectedSessionId === session.sessionId
                      return (
                        <label
                          key={session.sessionId}
                          className={cn(
                            'flex gap-3 rounded-lg border px-4 py-3 transition',
                            session.isSelectable
                              ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/30'
                              : 'cursor-not-allowed border-dashed opacity-50',
                            isActive && 'border-primary bg-primary/5'
                          )}
                          role="radio"
                          aria-checked={isActive}
                          aria-disabled={!session.isSelectable}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            disabled={!session.isSelectable}
                            checked={isActive}
                            onChange={() => {
                              if (session.isSelectable) {
                                setSelectedSessionId(session.sessionId)
                              }
                            }}
                          />
                          <div className="flex h-5 w-5 items-center justify-center">
                            <span
                              className={cn(
                                'h-4 w-4 rounded-full border-2',
                                isActive ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                              )}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">
                              {session.classCode} · {session.startTime} - {session.endTime}
                            </p>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.branchName} · {session.modality === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm'}
                            </p>
                            {!session.isSelectable && session.disabledReason && (
                              <p className="text-xs font-medium text-rose-600">{session.disabledReason}</p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Tuần này chưa có buổi học nào trong lịch cá nhân
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Step 2: Điền lý do */}
      <Section className={!step1Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[1]} stepNumber={2} />

        {selectedSession && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                  <p className="font-semibold">
                    {selectedSession.classCode} · {selectedSession.startTime} - {selectedSession.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedSession.topic}</p>
                                  </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)}>
                  Chọn lại
                </Button>
              </div>
            </div>

            <ReasonInput
              value={reason}
              onChange={setReason}
              placeholder="Nhập lý do xin nghỉ..."
              error={reasonError}
            />
          </div>
        )}
      </Section>
    </BaseFlowComponent>
  )
}