import { useState, useMemo, useCallback } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  useGetTransferEligibilityQuery,
  type TransferEligibility
} from '@/store/services/studentRequestApi'

// Define TransferOption interface locally for demo
interface TransferOption {
  classId: number
  classCode: string
  className: string
  branchName: string
  modality: string
  scheduleInfo?: string
  availableSlots: number
  maxCapacity?: number
}
import {
  StepHeader,
  Section,
  ReasonInput,
  BaseFlowComponent,
  useSuccessHandler,
  useErrorHandler,
  Validation
} from '../UnifiedRequestFlow'
import type { TransferFlowProps } from '../UnifiedRequestFlow'

// AAContactModal component (simplified version)
function AAContactModal({
  open,
  onOpenChange,
  currentEnrollment
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEnrollment: TransferEligibility
}) {
  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

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
              {currentEnrollment.branchName} · {getModalityText(currentEnrollment.modality || '')}
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
  const [selectedEnrollment, setSelectedEnrollment] = useState<TransferEligibility | null>(null)
  const [selectedClass, setSelectedClass] = useState<TransferOption | null>(null)
  const [transferType, setTransferType] = useState<'schedule' | 'branch-modality'>('schedule')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // API calls - simplified for demo
  const { data: eligibilityData, error: eligibilityError, refetch: refetchEligibility } = useGetTransferEligibilityQuery()

  // Mock transfer options for demo
  const mockTransferOptions = [
    {
      classId: 1,
      classCode: 'LOP002',
      className: 'Lớp 2',
      branchName: 'Hà Nội',
      modality: 'OFFLINE',
      scheduleInfo: 'Thứ 4, 19:00-21:00',
      availableSlots: 5,
      maxCapacity: 20
    }
  ]

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

  const transferOptions = mockTransferOptions

  const { handleSuccess } = useSuccessHandler(onSuccess)
  const { handleError } = useErrorHandler()

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  const handleReset = useCallback(() => {
    setSelectedEnrollment(null)
    setSelectedClass(null)
    setTransferType('schedule')
    setEffectiveDate('')
    setRequestReason('')
    setReasonError(null)
  }, [])

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

    // Simplified submission for now - just marking as complete
    handleReset()
    handleSuccess()
  }, [selectedEnrollment, requestReason, handleReset, handleSuccess, handleError])

  // Step states
  const step1Complete = !!selectedEnrollment
  const step2Complete = step1Complete && (transferType === 'branch-modality' || true) // Simplified for now
  const step3Complete = step2Complete && requestReason.trim().length >= 10
  const isLoading = false // Simplified for demo

  const steps = [
    {
      id: 1,
      title: 'Chọn lớp hiện tại & loại chuyển',
      description: 'Chọn lớp muốn chuyển và loại chuyển lớp phù hợp',
      isComplete: step1Complete,
      isAvailable: true
    },
    {
      id: 2,
      title: transferType === 'branch-modality' ? 'Liên hệ Phòng Học vụ' : 'Chọn lớp mục tiêu',
      description: transferType === 'branch-modality'
        ? 'Để thay đổi cơ sở/hình thức, cần liên hệ Phòng Học vụ'
        : 'Chọn lớp mới phù hợp với lịch học của bạn',
      isComplete: step2Complete,
      isAvailable: step1Complete
    },
    {
      id: 3,
      title: 'Xác nhận và điền lý do',
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
      onSubmit={handleSubmit}
      submitButtonText="Gửi yêu cầu chuyển lớp"
      isSubmitDisabled={!step3Complete}
      isSubmitting={isLoading}
      onReset={handleReset}
    >
      {/* Step 1: Chọn lớp hiện tại & loại chuyển */}
      <Section>
        <StepHeader step={steps[0]} stepNumber={1} />

        <div className="space-y-6">
          {/* Transfer Policy Info */}
          <div className="space-y-2 border-b pb-4">
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
            <h3 className="font-medium">Chọn lớp muốn chuyển</h3>
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
                      <span>{getModalityText(enrollment.modality)}</span>
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
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-medium">Chọn loại chuyển lớp</h3>

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
        </div>
      </Section>

      {/* Step 2: Chọn lớp mục tiêu hoặc liên hệ AA */}
      <Section className={!step1Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[1]} stepNumber={2} />

        {step1Complete && transferType === 'branch-modality' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Để thay đổi cơ sở hoặc hình thức học, bạn cần liên hệ trực tiếp với Phòng Học vụ để được tư vấn và hỗ trợ.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setIsContactModalOpen(true)} variant="outline">
              Liên hệ Phòng Học vụ
            </Button>
            <AAContactModal
              open={isContactModalOpen}
              onOpenChange={setIsContactModalOpen}
              currentEnrollment={selectedEnrollment!}
            />
          </div>
        )}

        {step1Complete && transferType === 'schedule' && (
          <div className="space-y-4">
            {false ? ( // Simplified for demo
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : transferOptions.length === 0 ? (
              <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                Chưa có lớp phù hợp để chuyển trong cùng cơ sở và hình thức học
              </div>
            ) : (
              <div className="space-y-2">
                {transferOptions.map((option: any) => {
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
                        onChange={() => setSelectedClass(option)}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">{option.classCode}</p>
                        <p className="text-sm text-muted-foreground">{option.className}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.branchName} · {getModalityText(option.modality || '')}
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
          </div>
        )}
      </Section>

      {/* Step 3: Xác nhận và lý do */}
      <Section className={!step2Complete ? 'opacity-50' : ''}>
        <StepHeader step={steps[2]} stepNumber={3} />

        {step2Complete && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="font-medium">Tóm tắt thông tin chuyển lớp</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Lớp hiện tại</p>
                    <p className="font-semibold">{selectedEnrollment!.classCode}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnrollment!.branchName} · {getModalityText(selectedEnrollment!.modality || '')}
                    </p>
                  </div>

                  {transferType === 'schedule' && selectedClass && (
                    <div>
                      <p className="text-xs text-muted-foreground">Lớp mục tiêu</p>
                      <p className="font-semibold">{selectedClass.classCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClass.branchName} · {getModalityText(selectedClass.modality)}
                      </p>
                    </div>
                  )}
                </div>

                {transferType === 'schedule' && (
                  <div>
                    <Label htmlFor="effectiveDate" className="text-sm font-medium">
                      Ngày hiệu lực (tùy chọn)
                    </Label>
                    <input
                      id="effectiveDate"
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
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
          </div>
        )}
      </Section>
    </BaseFlowComponent>
  )
}