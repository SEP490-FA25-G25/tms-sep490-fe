import { useState, useMemo, useCallback } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  NoteInput,
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
  const [note, setNote] = useState('')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<{ sessionId: number; date: string } | null>(null)

  // API calls
  const { data: eligibilityData, error: eligibilityError, refetch: refetchEligibility } = useGetTransferEligibilityQuery()

  // Real transfer options API
  const {
    data: transferOptionsResponse,
    isFetching: isLoadingTransferOptions,
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
    setNote('')
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
          requestReason: requestReason.trim(),
          note: note.trim() || undefined
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
  }, [selectedEnrollment, selectedClass, selectedSession, transferType, requestReason, note, submitTransfer, handleReset, handleSuccess, handleError])

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
          {/* Transfer Policy Info */}
          <div className="space-y-2 border-b pb-4 mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Chính sách chuyển lớp</span>
              <span>Tối đa {eligibilityData.data.policyInfo?.maxTransfersPerCourse ?? 1} lần/khóa</span>
            </div>
            <p className="text-sm leading-relaxed">
              {eligibilityData.data.policyInfo?.policyDescription ?? 'Chỉ hỗ trợ đổi lịch trong cùng cơ sở & hình thức. Liên hệ Phòng Học vụ nếu cần đổi cơ sở hoặc modality.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {eligibilityData.data.eligibleForTransfer
                ? `Còn tối đa ${eligibilityData.data.policyInfo?.remainingTransfers ?? '1'} lượt chuyển trong khóa này.`
                : eligibilityData.data.ineligibilityReason ?? 'Bạn chưa đạt điều kiện chuyển lớp.'}
            </p>
          </div>

          {/* Class Selection */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Chọn lớp muốn chuyển</h3>
            <div className="space-y-3">
              {normalizedEnrollments.map((enrollment) => {
                const canTransfer = enrollment.canTransfer && !enrollment.hasPendingTransfer
                const disabled = !canTransfer

                return (
                  <label
                    key={enrollment.enrollmentId ?? `${enrollment.classId}-${enrollment.branchId}`}
                    className={cn(
                      'block cursor-pointer rounded-lg border p-4 transition',
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold">{enrollment.classCode}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.className}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.courseName}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        !canTransfer ? 'text-rose-600' :
                          enrollment.hasPendingTransfer ? 'text-amber-600' :
                            'text-emerald-600'
                      )}>
                        {!canTransfer ? 'Không đủ điều kiện' :
                          enrollment.hasPendingTransfer ? 'Đang chờ duyệt' :
                            'Có thể chuyển'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{enrollment.branchName}</span>
                      <span>·</span>
                      <span>{getModalityLabel(enrollment.modality)}</span>
                      {enrollment.scheduleInfo && (
                        <>
                          <span>·</span>
                          <span>{enrollment.scheduleInfo}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 border-t pt-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Hạn mức chuyển</span>
                        <span className="font-medium">
                          {enrollment.transferQuota.used}/{enrollment.transferQuota.limit}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({enrollment.transferQuota.remaining > 0 ? `còn ${enrollment.transferQuota.remaining}` : 'hết'})
                          </span>
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
            <div className="space-y-3 border-t pt-4 mt-4">
              <h3 className="font-medium text-sm">Chọn loại chuyển lớp</h3>

              <RadioGroup value={transferType} onValueChange={(value: 'schedule' | 'branch-modality') => setTransferType(value)}>
                {/* Schedule Only Option */}
                <div className={cn(
                  "rounded-lg border p-4 cursor-pointer transition",
                  transferType === 'schedule' && "border-primary bg-primary/5"
                )}>
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="schedule" id="schedule" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="schedule" className="font-medium cursor-pointer">
                        Chỉ thay đổi lịch học
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cùng cơ sở + cùng hình thức · Xử lý nhanh 4-8 giờ · Hoàn thành trực tuyến
                      </p>
                    </div>
                  </div>
                </div>

                {/* Branch/Modality Change Option */}
                <div className={cn(
                  "rounded-lg border p-4 cursor-pointer transition",
                  transferType === 'branch-modality' && "border-primary bg-primary/5"
                )}>
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="branch-modality" id="branch-modality" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="branch-modality" className="font-medium cursor-pointer">
                        Thay đổi cơ sở hoặc hình thức học
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Cần hỗ trợ từ Phòng Học vụ · Liên hệ để được tư vấn
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
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
            <div className="space-y-4">
              {isLoadingTransferOptions ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : transferOptionsError ? (
                <Alert>
                  <AlertDescription>
                    Không thể tải danh sách lớp chuyển. Vui lòng thử lại.
                  </AlertDescription>
                </Alert>
              ) : transferOptions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Chưa có lớp phù hợp để chuyển trong cùng cơ sở và hình thức học
                </div>
              ) : (
                <div className="space-y-2">
                  {transferOptions.map((option) => {
                    const isSelected = selectedClass?.classId === option.classId
                    return (
                      <label
                        key={option.classId}
                        className={cn(
                          'block cursor-pointer rounded-lg border px-4 py-3 transition hover:border-primary/50 hover:bg-muted/30',
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
                            setSelectedSession(null) // Reset session when class changes
                          }}
                        />
                        <div className="space-y-1">
                          <p className="font-medium">{option.classCode}</p>
                          <p className="text-sm text-muted-foreground">{option.className}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.branchName} · {getModalityLabel(option.modality)}
                          </p>
                          {option.scheduleInfo && (
                            <p className="text-xs text-muted-foreground">{option.scheduleInfo}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              option.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-600'
                            )}>
                              {option.availableSlots > 0 ? `Còn ${option.availableSlots} chỗ` : 'Hết chỗ'}
                            </span>
                            {option.availableSlots > 0 && option.maxCapacity && (
                              <span className="text-muted-foreground">/ {option.maxCapacity} chỗ</span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Session Selection */}
              {selectedClass && selectedClass.upcomingSessions && selectedClass.upcomingSessions.length > 0 && (
                <div className="space-y-3 border-t pt-4 mt-4">
                  <h3 className="font-medium text-sm">Chọn buổi học bắt đầu</h3>
                  <p className="text-sm text-muted-foreground">
                    Chọn buổi học đầu tiên bạn sẽ tham gia ở lớp mới
                  </p>
                  <div className="grid gap-2">
                    {selectedClass.upcomingSessions.map((session) => {
                      const isSelected = selectedSession?.sessionId === session.sessionId
                      const sessionDate = new Date(session.date)

                      return (
                        <label
                          key={session.sessionId}
                          className={cn(
                            'block cursor-pointer rounded-lg border px-4 py-3 transition hover:border-primary/50 hover:bg-muted/30',
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
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {sessionDate.toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.timeSlot || 'Thời gian chưa xác định'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="text-primary">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              </div>
                            )}
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
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg bg-muted/30 p-4 border mb-4">
              <h4 className="font-medium text-sm mb-3">Tóm tắt thông tin chuyển lớp</h4>

              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Lớp hiện tại</p>
                  <p className="font-semibold">{selectedEnrollment!.classCode}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedEnrollment!.branchName} · {getModalityLabel(selectedEnrollment!.modality)}
                  </p>
                </div>

                {selectedClass && (
                  <div>
                    <p className="text-xs text-muted-foreground">Lớp mục tiêu</p>
                    <p className="font-semibold">{selectedClass.classCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedClass.branchName} · {getModalityLabel(selectedClass.modality)}
                    </p>
                  </div>
                )}

                {selectedSession && (
                  <div className="col-span-2 border-t pt-2 mt-2">
                    <p className="text-xs text-muted-foreground">Buổi học bắt đầu</p>
                    <p className="font-medium">
                      {new Date(selectedSession.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedClass?.upcomingSessions?.find(s => s.sessionId === selectedSession.sessionId)?.timeSlot ||
                        'Thời gian chưa xác định'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <ReasonInput
              value={requestReason}
              onChange={setRequestReason}
              placeholder="Nhập lý do muốn chuyển lớp..."
              error={reasonError}
            />

            <NoteInput
              value={note}
              onChange={setNote}
              placeholder="Ghi chú thêm về yêu cầu chuyển lớp..."
            />
          </div>
        </Section>
      )}
    </BaseFlowComponent>
  )
}