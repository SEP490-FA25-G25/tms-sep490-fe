import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  useSubmitStudentRequestMutation,
  useGetStudentRequestConfigQuery,
  type SessionModality
} from '@/store/services/studentRequestApi'
import {
  Section,
  ReasonInput,
  BaseFlowComponent,
  SelectionCard
} from '../UnifiedRequestFlow'
import {
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../utils'
import type { MakeupFlowProps } from '../UnifiedRequestFlow'

// Fallback value if config API fails
const DEFAULT_MAKEUP_LOOKBACK_WEEKS = 2

export default function MakeupFlow({ onSuccess }: MakeupFlowProps) {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const [excludeRequested] = useState(true)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Fetch config from backend policy
  const { data: configResponse } = useGetStudentRequestConfigQuery()
  const makeupLookbackWeeks = configResponse?.data?.makeupLookbackWeeks ?? DEFAULT_MAKEUP_LOOKBACK_WEEKS

  // 1. Fetch Missed Sessions
  const { data: missedResponse, isFetching: isLoadingMissed } = useGetMissedSessionsQuery({
    weeksBack: makeupLookbackWeeks,
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

  // Reset subsequent steps when missed session changes
  useEffect(() => {
    if (!selectedMissedSession) {
      setSelectedMakeupId(null)
    }
  }, [selectedMissedSession])

  // 2. Fetch Makeup Options
  const { data: makeupResponse, isFetching: isLoadingOptions } = useGetMakeupOptionsQuery(
    selectedMissedId ? { targetSessionId: selectedMissedId } : skipToken
  )

  const makeupOptions = useMemo(() => makeupResponse?.data?.makeupOptions ?? [], [makeupResponse?.data?.makeupOptions])
  const selectedMakeupOption = makeupOptions.find((option) => option.sessionId === selectedMakeupId) ?? null

  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  // Helpers
  const getClassId = (classInfo?: { classId?: number; id?: number }) =>
    classInfo?.classId ?? classInfo?.id ?? null

  const formatModality = (modality?: SessionModality) => {
    switch (modality) {
      case 'ONLINE': return 'Trực tuyến'
      case 'HYBRID': return 'Kết hợp'
      default: return 'Tại trung tâm'
    }
  }

  const getCapacityText = (available?: number | null, max?: number | null) => {
    const hasAvailable = typeof available === 'number'
    const hasMax = typeof max === 'number'
    if (hasAvailable && hasMax) return `${available}/${max} chỗ trống`
    if (hasAvailable) return `Còn ${available} chỗ trống`
    if (hasMax) return `Tối đa ${max} chỗ`
    return 'Sức chứa đang cập nhật'
  }

  const getClassDisplayName = (classInfo?: { className?: string; name?: string }) =>
    classInfo?.className ?? classInfo?.name ?? 'Tên lớp đang cập nhật'

  // Handlers
  const handleNext = () => {
    if (currentStep === 1 && selectedMissedSession) setCurrentStep(2)
    else if (currentStep === 2 && selectedMakeupOption) setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    const reasonValidationError = Validation.reason(reason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedMissedSession || !selectedMakeupOption) return

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

      handleSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  // Steps Config
  const steps = [
    {
      id: 1,
      title: 'Chọn buổi đã vắng',
      description: `Hiển thị buổi vắng trong ${makeupLookbackWeeks} tuần gần nhất`,
      isComplete: !!selectedMissedSession,
      isAvailable: true
    },
    {
      id: 2,
      title: 'Chọn buổi học bù',
      description: 'Hệ thống gợi ý các buổi học bù phù hợp',
      isComplete: !!selectedMakeupOption,
      isAvailable: !!selectedMissedSession
    },
    {
      id: 3,
      title: 'Điền lý do học bù',
      description: 'Giải thích lý do cần học bù buổi đã vắng',
      isComplete: reason.trim().length >= 10,
      isAvailable: !!selectedMakeupOption
    }
  ]

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={
        (currentStep === 1 && !selectedMissedSession) ||
        (currentStep === 2 && !selectedMakeupOption)
      }
      isSubmitDisabled={reason.trim().length < 10}
      isSubmitting={isLoading}
    >
      {/* Step 1: Chọn buổi đã vắng */}
      {currentStep === 1 && (
        <Section>
          {isLoadingMissed ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : missedSessions.length === 0 ? (
            <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
              Không có buổi vắng hợp lệ trong {makeupLookbackWeeks} tuần gần nhất
            </div>
          ) : (
            <div className="space-y-2">
              {missedSessions.map((session) => (
                <SelectionCard
                  key={session.sessionId}
                  item={session}
                  isSelected={selectedMissedId === session.sessionId}
                  onSelect={() => setSelectedMissedId(session.sessionId)}
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
                </SelectionCard>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Step 2: Chọn buổi học bù */}
      {currentStep === 2 && selectedMissedSession && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-4 border mb-4">
            <h4 className="font-medium text-sm mb-2">Buổi vắng đã chọn</h4>
            <div className="text-sm">
              <p className="font-medium">
                {format(parseISO(selectedMissedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} · {selectedMissedSession.classInfo.classCode}
              </p>
              <p className="text-muted-foreground">
                {selectedMissedSession.courseSessionTitle}
              </p>
            </div>
          </div>

          <h4 className="font-medium text-sm mb-3">Các lớp có thể học bù:</h4>

          {isLoadingOptions ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : makeupOptions.length === 0 ? (
            <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
              Chưa có buổi học bù phù hợp cho buổi này.
            </div>
          ) : (
            <div className="space-y-2">
              {makeupOptions.map((option) => {
                const availableSlots = option.availableSlots ?? option.classInfo?.availableSlots ?? null
                const maxCapacity = option.maxCapacity ?? option.classInfo?.maxCapacity ?? null
                const branchLabel = option.classInfo.branchName ?? 'Chi nhánh đang cập nhật'
                const modalityLabel = formatModality(option.classInfo.modality)

                return (
                  <SelectionCard
                    key={option.sessionId}
                    item={option}
                    isSelected={selectedMakeupId === option.sessionId}
                    onSelect={() => setSelectedMakeupId(option.sessionId)}
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
                  </SelectionCard>
                )
              })}
            </div>
          )}
        </Section>
      )}

      {/* Step 3: Điền lý do */}
      {currentStep === 3 && selectedMakeupOption && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-4 border mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Buổi vắng</p>
                <p className="font-medium">
                  {format(parseISO(selectedMissedSession!.date), 'dd/MM')} · {selectedMissedSession!.classInfo.classCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Học bù tại</p>
                <p className="font-medium">
                  {format(parseISO(selectedMakeupOption.date), 'dd/MM')} · {selectedMakeupOption.classInfo.classCode}
                </p>
              </div>
            </div>
          </div>

          <ReasonInput
            value={reason}
            onChange={(val) => {
              setReason(val)
              if (reasonError) setReasonError(null)
            }}
            placeholder="Nhập lý do học bù..."
            error={reasonError}
          />
        </Section>
      )}
    </BaseFlowComponent>
  )
}