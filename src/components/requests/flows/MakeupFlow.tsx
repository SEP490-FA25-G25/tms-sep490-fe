import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  useSubmitStudentRequestMutation,
  type SessionModality
} from '@/store/services/studentRequestApi'
import {
  StepHeader,
  Section,
  ReasonInput,
  BaseFlowComponent,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../UnifiedRequestFlow'
import type { MakeupFlowProps } from '../UnifiedRequestFlow'

const MAKEUP_LOOKBACK_WEEKS = 2

export default function MakeupFlow({ onSuccess }: MakeupFlowProps) {
  const [excludeRequested] = useState(true)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const { data: missedResponse, isFetching: isLoadingMissed } = useGetMissedSessionsQuery({
    weeksBack: MAKEUP_LOOKBACK_WEEKS,
    excludeRequested,
  })

  const missedSessions = useMemo(() => {
    const rawSessions = missedResponse?.data?.missedSessions ?? missedResponse?.data?.sessions ?? []
    return excludeRequested
      ? rawSessions.filter((session) => !session.hasExistingMakeupRequest)
      : rawSessions
  }, [missedResponse?.data, excludeRequested])

  const selectedMissedSession = useMemo(
    () => missedSessions.find((session) => session.sessionId === selectedMissedId) ?? null,
    [missedSessions, selectedMissedId]
  )

  useEffect(() => {
    if (!selectedMissedSession) {
      setSelectedMakeupId(null)
    }
  }, [selectedMissedSession])

  const { data: makeupResponse, isFetching: isLoadingOptions } = useGetMakeupOptionsQuery(
    selectedMissedId ? { targetSessionId: selectedMissedId } : skipToken
  )

  const makeupOptions = useMemo(() => makeupResponse?.data?.makeupOptions ?? [], [makeupResponse?.data?.makeupOptions])
  const selectedMakeupOption = makeupOptions.find((option) => option.sessionId === selectedMakeupId) ?? null

  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const getClassId = (classInfo?: { classId?: number; id?: number }) =>
    classInfo?.classId ?? classInfo?.id ?? null

  const formatModality = (modality?: SessionModality) => {
    switch (modality) {
      case 'ONLINE':
        return 'Trực tuyến'
      case 'HYBRID':
        return 'Kết hợp'
      default:
        return 'Tại trung tâm'
    }
  }

  const getCapacityText = (available?: number | null, max?: number | null) => {
    const hasAvailable = typeof available === 'number'
    const hasMax = typeof max === 'number'
    if (hasAvailable && hasMax) {
      return `${available}/${max} chỗ trống`
    }
    if (hasAvailable) {
      return `Còn ${available} chỗ trống`
    }
    if (hasMax) {
      return `Tối đa ${max} chỗ`
    }
    return 'Sức chứa đang cập nhật'
  }

  const getClassDisplayName = (classInfo?: { className?: string; name?: string }) =>
    classInfo?.className ?? classInfo?.name ?? 'Tên lớp đang cập nhật'

  const handleReset = useCallback(() => {
    setSelectedMissedId(null)
    setSelectedMakeupId(null)
    setReason('')
    setReasonError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedMissedSession || !selectedMakeupOption) {
      handleError(new Error('Vui lòng chọn đủ buổi đã vắng và buổi học bù'))
      return
    }

    const currentClassId = getClassId(selectedMissedSession.classInfo)
    if (!currentClassId) {
      handleError(new Error('Không thể xác định lớp của buổi đã chọn. Vui lòng thử lại.'))
      return
    }

    try {
      await submitRequest({
        requestType: 'MAKEUP',
        currentClassId,
        targetSessionId: selectedMissedSession.sessionId,
        makeupSessionId: selectedMakeupOption.sessionId,
        requestReason: reason.trim(),
      }).unwrap()

      handleReset()
      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }, [selectedMissedSession, selectedMakeupOption, reason, submitRequest, handleReset, handleSuccess, handleError])

  // Step states
  const step1Complete = !!selectedMissedSession
  const step2Complete = !!selectedMakeupOption
  const step3Complete = step2Complete && reason.trim().length >= 10

  const steps = [
    {
      id: 1,
      title: 'Chọn buổi đã vắng',
      description: `Hiển thị buổi vắng trong ${MAKEUP_LOOKBACK_WEEKS} tuần gần nhất`,
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn buổi học bù',
      description: 'Hệ thống gợi ý các buổi học bù phù hợp',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Điền lý do học bù',
      description: 'Giải thích lý do cần học bù buổi đã vắng',
      isComplete: step3Complete,
      isAvailable: step2Complete
    }
  ]

  return (
    <BaseFlowComponent
      onSubmit={handleSubmit}
      submitButtonText="Gửi yêu cầu"
      isSubmitDisabled={!step3Complete}
      isSubmitting={isLoading}
      onReset={handleReset}
    >
      {/* Step 1: Chọn buổi đã vắng */}
      <Section>
        <StepHeader step={steps[0]} stepNumber={1} />

        <div className="space-y-3">
          {!step1Complete ? (
            <>
              {isLoadingMissed ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : missedSessions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Không có buổi vắng hợp lệ trong {MAKEUP_LOOKBACK_WEEKS} tuần gần nhất
                </div>
              ) : (
                <div className="space-y-2">
                  {missedSessions.map((session) => (
                    <button
                      key={session.sessionId}
                      type="button"
                      onClick={() => setSelectedMissedId(session.sessionId)}
                      className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {format(parseISO(session.date), 'EEEE, dd/MM', { locale: vi })} · {session.classInfo.classCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                          </p>
                          {typeof session.daysAgo === 'number' && (
                            <p className="text-xs text-muted-foreground">
                              {session.daysAgo === 0
                                ? 'Vắng hôm nay'
                                : session.daysAgo === 1
                                  ? 'Cách đây 1 ngày'
                                  : `Cách đây ${session.daysAgo} ngày`}
                              {session.isExcusedAbsence && ' · Đã xin nghỉ'}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="border-t pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedMissedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} · {selectedMissedSession.classInfo.classCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Buổi {selectedMissedSession.courseSessionNumber}: {selectedMissedSession.courseSessionTitle}
                  </p>
                  {typeof selectedMissedSession.daysAgo === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMissedSession.daysAgo === 0
                        ? 'Vắng hôm nay'
                        : selectedMissedSession.daysAgo === 1
                          ? 'Cách đây 1 ngày'
                          : `Cách đây ${selectedMissedSession.daysAgo} ngày`}
                      {selectedMissedSession.isExcusedAbsence && ' · Đã xin nghỉ'}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMissedId(null)}>
                  Chọn lại
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Step 2: Chọn buổi học bù */}
      <Section className={!step1Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[1]} stepNumber={2} />

        {step1Complete && (
          <div className="space-y-3">
            {!step2Complete ? (
              isLoadingOptions ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : makeupOptions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Chưa có buổi học bù phù hợp
                </div>
              ) : (
                <div className="space-y-2">
                  {makeupOptions.map((option) => {
                    const availableSlots = option.availableSlots ?? option.classInfo?.availableSlots ?? null
                    const maxCapacity = option.maxCapacity ?? option.classInfo?.maxCapacity ?? null
                    const branchLabel = option.classInfo.branchName ?? 'Chi nhánh đang cập nhật'
                    const modalityLabel = formatModality(option.classInfo.modality)
                    return (
                      <button
                        key={option.sessionId}
                        type="button"
                        onClick={() => setSelectedMakeupId(option.sessionId)}
                        className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {format(parseISO(option.date), 'dd/MM', { locale: vi })} · {option.classInfo.classCode}
                          </p>
                          <p className="text-sm text-muted-foreground">{getClassDisplayName(option.classInfo)}</p>
                          <p className="text-xs text-muted-foreground">
                            {branchLabel} · {modalityLabel} · {option.timeSlotInfo.startTime}-{option.timeSlotInfo.endTime} · {getCapacityText(availableSlots, maxCapacity)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            ) : (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Buổi học bù đã chọn</p>
                    <p className="font-semibold">
                      {format(parseISO(selectedMakeupOption.date), 'dd/MM/yyyy', { locale: vi })} · {selectedMakeupOption.classInfo.classCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{getClassDisplayName(selectedMakeupOption.classInfo)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.classInfo.branchName ?? 'Chi nhánh đang cập nhật'} · {formatModality(selectedMakeupOption.classInfo.modality)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.timeSlotInfo.startTime} - {selectedMakeupOption.timeSlotInfo.endTime} ·{' '}
                      {getCapacityText(
                        selectedMakeupOption.availableSlots ?? selectedMakeupOption.classInfo?.availableSlots ?? null,
                        selectedMakeupOption.maxCapacity ?? selectedMakeupOption.classInfo?.maxCapacity ?? null
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMakeupId(null)}>
                    Chọn lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Step 3: Điền lý do */}
      <Section className={!step2Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[2]} stepNumber={3} />

        {step2Complete && (
          <div className="space-y-4">
            <ReasonInput
              value={reason}
              onChange={setReason}
              placeholder="Nhập lý do học bù..."
              error={reasonError}
            />
          </div>
        )}
      </Section>
    </BaseFlowComponent>
  )
}