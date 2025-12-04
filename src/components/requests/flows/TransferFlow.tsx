import { useState, useMemo, useCallback } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useGetTransferEligibilityQuery,
  useGetTransferOptionsQuery,
  useSubmitTransferRequestMutation,
  type TransferEligibility,
  type TransferOption
} from '@/store/services/studentRequestApi'
import {
  Section,
  ReasonInput,
  BaseFlowComponent
} from '../UnifiedRequestFlow'
import {
  getModalityLabel,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../utils'
import type { SessionModality } from '@/store/services/studentRequestApi'
import type { TransferFlowProps } from '../UnifiedRequestFlow'

// AAContactModal component
function AAContactModal({
  open,
  onOpenChange,
  currentEnrollment
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEnrollment: TransferEligibility
}) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liên hệ Phòng Học vụ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Lớp hiện tại</p>
            <p className="font-medium">{currentEnrollment.classCode}</p>
            <p className="text-sm text-muted-foreground">
              {currentEnrollment.branchName} · {getModalityLabel(currentEnrollment.modality as SessionModality)}
            </p>
          </div>
          <Alert>
            <AlertDescription>
              Để thay đổi cơ sở hoặc hình thức học, bạn cần liên hệ trực tiếp với Phòng Học vụ để được tư vấn và hỗ trợ.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Các cách liên hệ:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Hotline: 1900-xxxx</li>
              <li>• Email: hotro@tms.edu.vn</li>
              <li>• Đến trực tiếp văn phòng</li>
            </ul>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Đã hiểu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TransferFlow({ onSuccess }: TransferFlowProps) {
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1)

  const [selectedEnrollment, setSelectedEnrollment] = useState<TransferEligibility | null>(null)
  const [selectedClass, setSelectedClass] = useState<TransferOption | null>(null)
  const [transferType, setTransferType] = useState<'schedule' | 'branch-modality'>('schedule')
  const [requestReason, setRequestReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<{ sessionId: number; date: string } | null>(null)

  // API calls
  const { data: eligibilityData, error: eligibilityError, refetch: refetchEligibility } = useGetTransferEligibilityQuery()

  // Real transfer options API
  const {
    data: transferOptionsResponse,
    error: transferOptionsError
  } = useGetTransferOptionsQuery(
    selectedEnrollment?.classId ? { currentClassId: selectedEnrollment.classId } : skipToken,
    { skip: !selectedEnrollment?.classId }
  )

  const normalizedEnrollments = useMemo(() => {
    if (!eligibilityData?.data) return []
    const source = eligibilityData.data.currentClasses ?? eligibilityData.data.currentEnrollments ?? []
    return source.map((enrollment) => {
      const quota = enrollment.transferQuota ?? { used: 0, limit: 1, remaining: 1 }
      const remaining = quota.remaining ?? Math.max(quota.limit - quota.used, 0)
      return {
        ...enrollment,
        modality: enrollment.modality ?? enrollment.learningMode ?? 'OFFLINE',
        transferQuota: { ...quota, remaining },
      }
    })
  }, [eligibilityData])

  const transferOptions = transferOptionsResponse?.data?.availableClasses ?? []

  const [submitTransfer, { isLoading }] = useSubmitTransferRequestMutation()
  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const handleReset = useCallback(() => {
    setSelectedEnrollment(null)
    setSelectedClass(null)
    setTransferType('schedule')
    setSelectedSession(null)
    setRequestReason('')
    setReasonError(null)
    setCurrentStep(1)
  }, [])

  const handleNext = () => {
    if (currentStep === 1 && selectedEnrollment) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (transferType === 'schedule' && selectedClass && selectedSession) {
        setCurrentStep(3)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = useCallback(async () => {
    const reasonValidationError = Validation.reason(requestReason)
    if (reasonValidationError) {
      setReasonError(reasonValidationError)
      return
    }

    if (!selectedEnrollment) {
      handleError(new Error('Vui lòng chọn lớp hiện tại'))
      return
    }

    if (transferType === 'schedule' && !selectedClass) {
      handleError(new Error('Vui lòng chọn lớp mục tiêu'))
      return
    }

    if (transferType === 'schedule') {
      // Schedule transfer - submit real transfer request
      if (!selectedSession) {
        handleError(new Error('Vui lòng chọn buổi học để chuyển lớp'))
        return
      }

      try {
        await submitTransfer({
          currentClassId: selectedEnrollment.classId,
          targetClassId: selectedClass!.classId,
          effectiveDate: selectedSession.date,
          sessionId: selectedSession.sessionId,
          requestReason: requestReason.trim()
        }).unwrap()

        handleReset()
        handleSuccess()
      } catch (error) {
        handleError(error)
      }
    } else {
      // Branch/modality change - show contact modal
      setIsContactModalOpen(true)
    }
  }, [selectedEnrollment, selectedClass, selectedSession, transferType, requestReason, submitTransfer, handleReset, handleSuccess, handleError])

  // Step states
  const step1Complete = !!selectedEnrollment
  const step2Complete = step1Complete && (transferType === 'branch-modality' || (!!selectedClass && !!selectedSession))
  const step3Complete = step2Complete && requestReason.trim().length >= 10

  const steps = [
    {
      id: 1,
      title: 'Chọn lớp & loại chuyển',
      description: 'Chọn lớp muốn chuyển và loại chuyển lớp phù hợp',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: transferType === 'branch-modality' ? 'Liên hệ' : 'Chọn lớp mới',
      description: transferType === 'branch-modality'
        ? 'Thông tin liên hệ Phòng Học vụ'
        : 'Chọn lớp mới và ngày bắt đầu',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Xác nhận',
      description: 'Kiểm tra lại thông tin và lý do chuyển lớp',
      isComplete: step3Complete,
      isAvailable: step2Complete
    }
  ]

  if (eligibilityError) {
    return (
      <Section>
        <Alert>
          <AlertDescription>
            Không thể tải thông tin lớp học. Vui lòng thử lại.
            <Button variant="link" onClick={() => refetchEligibility()} className="p-0 h-auto ml-2">
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      </Section>
    )
  }

  if (!eligibilityData?.data || normalizedEnrollments.length === 0) {
    return (
      <Section>
        <Alert>
          <AlertDescription>
            Bạn không có lớp học nào phù hợp để chuyển. Vui lòng liên hệ Phòng Học vụ để được hỗ trợ.
          </AlertDescription>
        </Alert>
      </Section>
    )
  }

  return (
    <BaseFlowComponent
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      isNextDisabled={
        (currentStep === 1 && !selectedEnrollment) ||
        (currentStep === 2 && (transferType === 'branch-modality' || !selectedClass || !selectedSession))
      }
      isSubmitDisabled={!step3Complete}
      isSubmitting={isLoading}
      // Hide submit button for branch-modality flow since it ends at step 2
      submitLabel={transferType === 'branch-modality' ? undefined : 'Gửi yêu cầu'}
    >
      {/* Step 1: Chọn lớp hiện tại & loại chuyển */}
      {currentStep === 1 && (
        <Section>
          <div className="min-h-[280px]">
          {/* Transfer Policy Info - Compact */}
          <div className="text-xs text-muted-foreground border-b pb-2 mb-3">
            <span>Tối đa {eligibilityData.data.policyInfo?.maxTransfersPerCourse ?? 1} lần/khóa</span>
            {eligibilityData.data.eligibleForTransfer && (
              <span className="ml-2">· Còn {eligibilityData.data.policyInfo?.remainingTransfers ?? '1'} lượt</span>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Chọn lớp muốn chuyển:</p>
            <div className="space-y-2">
              {normalizedEnrollments.map((enrollment) => {
                const canTransfer = enrollment.canTransfer && !enrollment.hasPendingTransfer
                const disabled = !canTransfer

                return (
                  <label
                    key={enrollment.enrollmentId ?? `${enrollment.classId}-${enrollment.branchId}`}
                    className={cn(
                      'block cursor-pointer rounded-lg border px-3 py-2.5 transition',
                      disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50 hover:bg-muted/30',
                      selectedEnrollment?.enrollmentId === enrollment.enrollmentId && 'border-primary bg-primary/5'
                    )}
                  >
                    <input
                      type="radio"
                      name="enrollment"
                      className="sr-only"
                      disabled={disabled}
                      checked={selectedEnrollment?.enrollmentId === enrollment.enrollmentId}
                      onChange={() => {
                        if (!disabled) {
                          setSelectedEnrollment(enrollment)
                        }
                      }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{enrollment.classCode}</span>
                          <span className="text-xs text-muted-foreground">
                            {enrollment.branchName} · {getModalityLabel(enrollment.modality)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{enrollment.className}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn(
                          'text-xs font-medium',
                          !canTransfer ? 'text-rose-600' :
                            enrollment.hasPendingTransfer ? 'text-amber-600' :
                              'text-emerald-600'
                        )}>
                          {!canTransfer ? 'Không đủ ĐK' :
                            enrollment.hasPendingTransfer ? 'Chờ duyệt' :
                              'Có thể chuyển'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {enrollment.transferQuota.used}/{enrollment.transferQuota.limit} lượt
                        </span>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Transfer Type Selection */}
          {selectedEnrollment && (
            <div className="space-y-2 border-t pt-3 mt-3">
              <h3 className="font-medium text-sm">Loại chuyển lớp</h3>

              <RadioGroup value={transferType} onValueChange={(value: 'schedule' | 'branch-modality') => setTransferType(value)} className="space-y-1.5">
                <label className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition",
                  transferType === 'schedule' && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="schedule" id="schedule" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">Đổi lịch học</span>
                    <span className="text-xs text-muted-foreground ml-2">Cùng cơ sở + hình thức · 4-8h</span>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition",
                  transferType === 'branch-modality' && "border-primary bg-primary/5"
                )}>
                  <RadioGroupItem value="branch-modality" id="branch-modality" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">Đổi cơ sở/hình thức</span>
                    <span className="text-xs text-muted-foreground ml-2">Cần liên hệ Học vụ</span>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}
          </div>
        </Section>
      )}

      {/* Step 2: Chọn lớp mục tiêu hoặc liên hệ AA */}
      {currentStep === 2 && (
        <Section>
          {transferType === 'branch-modality' ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Để thay đổi cơ sở hoặc hình thức học, bạn cần liên hệ trực tiếp với Phòng Học vụ để được tư vấn và hỗ trợ.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Thông tin liên hệ</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Hotline: 1900-xxxx</li>
                  <li>• Email: hotro@tms.edu.vn</li>
                  <li>• Đến trực tiếp văn phòng tại cơ sở của bạn</li>
                </ul>
              </div>
              <Button onClick={() => setIsContactModalOpen(true)} variant="outline">
                Xem chi tiết liên hệ
              </Button>
              <AAContactModal
                open={isContactModalOpen}
                onOpenChange={setIsContactModalOpen}
                currentEnrollment={selectedEnrollment!}
              />
            </div>
          ) : (
            <div className="min-h-[280px]">
              {transferOptionsError ? (
                <Alert>
                  <AlertDescription>
                    Không thể tải danh sách lớp chuyển. Vui lòng thử lại.
                  </AlertDescription>
                </Alert>
              ) : transferOptions.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Chưa có lớp phù hợp để chuyển trong cùng cơ sở và hình thức học
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hãy chọn "Đổi cơ sở/hình thức" để được hỗ trợ.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transferOptions.map((option) => {
                    const isSelected = selectedClass?.classId === option.classId
                    return (
                      <label
                        key={option.classId}
                        className={cn(
                          'block cursor-pointer rounded-lg border px-3 py-2.5 transition hover:border-primary/50 hover:bg-muted/30',
                          isSelected && 'border-primary bg-primary/5'
                        )}
                      >
                        <input
                          type="radio"
                          name="targetClass"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedClass(option)
                            setSelectedSession(null)
                          }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{option.classCode}</span>
                              <span className="text-xs text-muted-foreground truncate">{option.className}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {option.branchName} · {getModalityLabel(option.modality)}
                              {option.scheduleInfo && <span className="ml-1">· {option.scheduleInfo}</span>}
                            </div>
                          </div>
                          <span className={cn(
                            'text-xs font-medium shrink-0',
                            option.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-600'
                          )}>
                            {option.availableSlots > 0 ? `${option.availableSlots} chỗ` : 'Hết'}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Session Selection */}
              {selectedClass && selectedClass.upcomingSessions && selectedClass.upcomingSessions.length > 0 && (
                <div className="space-y-2 border-t pt-3 mt-3">
                  <h3 className="font-medium text-sm">Buổi bắt đầu tại lớp mới</h3>
                  <div className="grid gap-1.5">
                    {selectedClass.upcomingSessions.map((session) => {
                      const isSelected = selectedSession?.sessionId === session.sessionId
                      const sessionDate = new Date(session.date)

                      return (
                        <label
                          key={session.sessionId}
                          className={cn(
                            'block cursor-pointer rounded-lg border px-3 py-2.5 transition hover:border-primary/50 hover:bg-muted/30',
                            isSelected && 'border-primary bg-primary/5'
                          )}
                        >
                          <input
                            type="radio"
                            name="session"
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => setSelectedSession({
                              sessionId: session.sessionId,
                              date: session.date
                            })}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {sessionDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="text-xs text-muted-foreground">{session.timeSlot || 'TBD'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                              </p>
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Step 3: Xác nhận và lý do */}
      {currentStep === 3 && transferType === 'schedule' && (
        <Section>
          <div className="min-h-[280px] space-y-3">
            {/* Summary */}
            <div className="rounded-lg bg-muted/30 p-3 border">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Từ</p>
                  <p className="font-semibold truncate">{selectedEnrollment!.classCode}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedEnrollment!.branchName} · {getModalityLabel(selectedEnrollment!.modality)}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0">→</span>
                {selectedClass && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Đến</p>
                    <p className="font-semibold truncate">{selectedClass.classCode}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedClass.branchName} · {getModalityLabel(selectedClass.modality)}
                    </p>
                  </div>
                )}

              </div>
              {selectedSession && (
                <div className="border-t pt-2 mt-2 text-sm">
                  <span className="text-xs text-muted-foreground">Bắt đầu: </span>
                  <span className="font-medium">
                    {new Date(selectedSession.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {selectedClass?.upcomingSessions?.find(s => s.sessionId === selectedSession.sessionId)?.timeSlot || ''}
                  </span>
                </div>
              )}
            </div>

            <ReasonInput
              value={requestReason}
              onChange={setRequestReason}
              placeholder="Nhập lý do muốn chuyển lớp..."
              error={reasonError}
            />
          </div>
        </Section>
      )}
    </BaseFlowComponent>
  )
}