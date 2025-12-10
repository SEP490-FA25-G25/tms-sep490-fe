import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import { MapPinIcon, VideoIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  useGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  useSubmitStudentRequestMutation,
  useGetStudentRequestConfigQuery
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
  Validation,
  getCapacityText
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
  const makeupWeeksLimit = configResponse?.data?.makeupWeeksLimit ?? 4
  const reasonMinLength = configResponse?.data?.reasonMinLength ?? 10

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

  const getClassId = (classInfo?: { classId?: number; id?: number }) =>
    classInfo?.classId ?? classInfo?.id ?? null

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
      isComplete: reason.trim().length >= reasonMinLength,
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
      isSubmitDisabled={reason.trim().length < reasonMinLength}
      isSubmitting={isLoading}
    >
      {/* Step 1: Chọn buổi đã vắng */}
      {currentStep === 1 && (
        <Section>
          {/* Policy Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 mb-3">
            <div className="flex gap-2">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Chính sách học bù</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
                  <li>• Hiển thị buổi vắng trong <strong>{makeupLookbackWeeks} tuần</strong> gần nhất</li>
                  <li>• Phải nộp yêu cầu trong vòng <strong>{makeupWeeksLimit} tuần</strong> sau khi vắng</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="min-h-[280px]">
            {!isLoadingMissed && missedSessions.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Không có buổi vắng hợp lệ trong {makeupLookbackWeeks} tuần gần nhất
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bạn chỉ có thể xin học bù cho buổi đã vắng trong vòng {makeupWeeksLimit} tuần.
                </p>
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(session.classInfo?.classCode || session.classInfo?.code) && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {session.classInfo.classCode || session.classInfo.code}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(session.date), 'EEE, dd/MM', { locale: vi })}
                            {typeof session.daysAgo === 'number' && ` · ${session.daysAgo === 0 ? 'Hôm nay' : `${session.daysAgo} ngày trước`}`}
                          </span>
                          <Badge variant={session.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                            {session.classInfo.modality === 'ONLINE' ? (
                              <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                            ) : (
                              <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                            )}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">
                          Buổi {session.subjectSessionNumber}: {session.subjectSessionTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.timeSlotInfo?.startTime} - {session.timeSlotInfo?.endTime} · {session.classInfo?.branchName}
                        </p>
                        {session.classInfo?.resourceName && (
                          <p className="text-xs text-muted-foreground">
                            {session.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {session.classInfo.resourceName}
                          </p>
                        )}
                      </div>
                      {session.isExcusedAbsence && (
                        <Badge variant="secondary" className="text-xs shrink-0">Có phép</Badge>
                      )}
                    </div>
                  </SelectionCard>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 2: Chọn buổi học bù */}
      {currentStep === 2 && selectedMissedSession && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-3 border mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {selectedMissedSession.classInfo.classCode || selectedMissedSession.classInfo.code}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(selectedMissedSession.date), 'EEE, dd/MM', { locale: vi })}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-medium truncate">
                Buổi {selectedMissedSession.subjectSessionNumber}: {selectedMissedSession.subjectSessionTitle}
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground mb-2 border-b pb-2">Chọn lớp học bù:</p>

          <div className="min-h-[220px]">
            {!isLoadingOptions && makeupOptions.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Chưa có buổi học bù phù hợp cho buổi này.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vui lòng thử lại sau hoặc liên hệ Giáo vụ.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {makeupOptions.map((option) => {
                  const availableSlots = option.availableSlots ?? option.classInfo?.availableSlots ?? null
                  const maxCapacity = option.maxCapacity ?? option.classInfo?.maxCapacity ?? null
                  const branchAddress = option.classInfo.branchAddress ?? option.classInfo.branchName ?? 'Địa chỉ đang cập nhật'

                  return (
                    <SelectionCard
                      key={option.sessionId}
                      item={option}
                      isSelected={selectedMakeupId === option.sessionId}
                      onSelect={() => setSelectedMakeupId(option.sessionId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {option.classInfo.classCode || option.classInfo.code}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(option.date), 'EEE, dd/MM', { locale: vi })}
                            </span>
                            <Badge variant={option.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                              {option.classInfo.modality === 'ONLINE' ? (
                                <><VideoIcon className="h-3 w-3 mr-1" />Online</>
                              ) : (
                                <><MapPinIcon className="h-3 w-3 mr-1" />Offline</>
                              )}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm truncate">
                            Buổi {option.subjectSessionNumber}: {option.subjectSessionTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {option.timeSlotInfo.startTime}-{option.timeSlotInfo.endTime} · {branchAddress}
                          </p>
                          {option.classInfo?.resourceName && (
                            <p className="text-xs text-muted-foreground">
                              {option.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {option.classInfo.resourceName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {getCapacityText(
                              maxCapacity != null && availableSlots != null ? maxCapacity - availableSlots : null,
                              maxCapacity
                            )}
                          </p>
                        </div>
                      </div>
                    </SelectionCard>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Step 3: Điền lý do */}
      {currentStep === 3 && selectedMakeupOption && (
        <Section>
          <div className="rounded-lg bg-muted/30 p-3 border mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buổi vắng */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Buổi vắng:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {selectedMissedSession!.classInfo.classCode || selectedMissedSession!.classInfo.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(selectedMissedSession!.date), 'EEE, dd/MM', { locale: vi })}
                    </span>
                    <Badge variant={selectedMissedSession!.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                      {selectedMissedSession!.classInfo.modality === 'ONLINE' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    Buổi {selectedMissedSession!.subjectSessionNumber}: {selectedMissedSession!.subjectSessionTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMissedSession!.timeSlotInfo?.startTime} - {selectedMissedSession!.timeSlotInfo?.endTime}
                  </p>
                  {selectedMissedSession!.classInfo?.resourceName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMissedSession!.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {selectedMissedSession!.classInfo.resourceName}
                    </p>
                  )}
                </div>
              </div>

              {/* Buổi học bù */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Học bù tại:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {selectedMakeupOption.classInfo.classCode || selectedMakeupOption.classInfo.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(selectedMakeupOption.date), 'EEE, dd/MM', { locale: vi })}
                    </span>
                    <Badge variant={selectedMakeupOption.classInfo.modality === 'ONLINE' ? 'default' : 'secondary'} className="text-xs">
                      {selectedMakeupOption.classInfo.modality === 'ONLINE' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    Buổi {selectedMakeupOption.subjectSessionNumber}: {selectedMakeupOption.subjectSessionTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMakeupOption.timeSlotInfo.startTime}-{selectedMakeupOption.timeSlotInfo.endTime}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMakeupOption.classInfo.branchAddress ?? selectedMakeupOption.classInfo.branchName ?? 'Địa chỉ đang cập nhật'}
                  </p>
                  {selectedMakeupOption.classInfo?.resourceName && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.classInfo.modality === 'ONLINE' ? '🔗' : '📍'} {selectedMakeupOption.classInfo.resourceName}
                    </p>
                  )}
                </div>
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