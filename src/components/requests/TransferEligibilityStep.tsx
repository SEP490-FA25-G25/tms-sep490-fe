import { useMemo } from 'react'
import { useGetTransferEligibilityQuery, type TransferEligibility } from '@/store/services/studentRequestApi'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Clock, CheckCircle2, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import TransferErrorDisplay from './TransferErrorDisplay'

interface TransferEligibilityStepProps {
  selectedEnrollment: TransferEligibility | null
  onSelectEnrollment: (enrollment: TransferEligibility) => void
  onNext: () => void
}

export default function TransferEligibilityStep({
  selectedEnrollment,
  onSelectEnrollment,
  onNext,
}: TransferEligibilityStepProps) {
  const { data: eligibilityData, isLoading, error, refetch } = useGetTransferEligibilityQuery()
  const policyInfo = eligibilityData?.data?.policyInfo
  const normalizedEnrollments = useMemo(() => {
    if (!eligibilityData?.data) return []
    const source = eligibilityData.data.currentClasses ?? eligibilityData.data.currentEnrollments ?? []
    return source.map((enrollment) => {
      const quota = enrollment.transferQuota ?? {
        used: 0,
        limit: 1,
        remaining: 1,
      }
      const remaining = quota.remaining ?? Math.max(quota.limit - quota.used, 0)
      return {
        ...enrollment,
        modality: enrollment.modality ?? enrollment.learningMode ?? 'OFFLINE',
        transferQuota: { ...quota, remaining },
      }
    })
  }, [eligibilityData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Đang kiểm tra điều kiện chuyển lớp...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <TransferErrorDisplay
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!eligibilityData?.data || normalizedEnrollments.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Bạn không có lớp học nào phù hợp để chuyển. Vui lòng liên hệ Phòng Học vụ để được hỗ trợ.
        </AlertDescription>
      </Alert>
    )
  }

  const handleSelectEnrollment = (enrollment: TransferEligibility) => {
    if (!enrollment.canTransfer || enrollment.hasPendingTransfer) return
    onSelectEnrollment(enrollment)
    onNext()
  }

  const eligibilitySummary = eligibilityData.data.eligibleForTransfer
    ? `Còn tối đa ${policyInfo?.remainingTransfers ?? '1'} lượt chuyển trong khóa này.`
    : eligibilityData.data.ineligibilityReason ?? 'Bạn chưa đạt điều kiện chuyển lớp.'

  const modalityLabel = (modality: string | undefined) => {
    switch (modality) {
      case 'OFFLINE':
        return 'Tại lớp'
      case 'ONLINE':
        return 'Online'
      case 'HYBRID':
        return 'Hybrid'
      default:
        return modality ?? 'Không xác định'
    }
  }

  const getStatusTone = (enrollment: TransferEligibility) => {
    if (!enrollment.canTransfer) {
      return {
        label: 'Không đủ điều kiện',
        tone: 'text-rose-600 bg-rose-50',
        icon: <X className="h-4 w-4" />,
      }
    }
    if (enrollment.hasPendingTransfer) {
      return {
        label: 'Đang chờ duyệt',
        tone: 'text-amber-600 bg-amber-50',
        icon: <Clock className="h-4 w-4" />,
      }
    }
    return {
      label: 'Có thể chuyển',
      tone: 'text-emerald-600 bg-emerald-50',
      icon: <CheckCircle2 className="h-4 w-4" />,
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Chính sách chuyển lớp</span>
          <span>Tối đa {policyInfo?.maxTransfersPerCourse ?? 1} lần/khóa</span>
        </div>
        <p className="text-sm leading-relaxed">{policyInfo?.policyDescription ?? 'Chỉ hỗ trợ đổi lịch trong cùng cơ sở & hình thức. Liên hệ Phòng Học vụ nếu cần đổi cơ sở hoặc modality.'}</p>
        <p className="text-sm text-muted-foreground">{eligibilitySummary}</p>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Chọn lớp muốn chuyển</h3>
        <div className="space-y-3">
          {normalizedEnrollments.map((enrollment) => {
            const status = getStatusTone(enrollment)
            const disabled = !enrollment.canTransfer || enrollment.hasPendingTransfer

            return (
              <button
                key={enrollment.enrollmentId ?? `${enrollment.classId}-${enrollment.branchId}`}
                type="button"
                disabled={disabled}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition',
                  disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50 hover:bg-muted/30',
                  selectedEnrollment?.enrollmentId === enrollment.enrollmentId && 'border-primary bg-primary/5'
                )}
                onClick={() => {
                  if (!disabled) {
                    handleSelectEnrollment(enrollment)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">{enrollment.classCode}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.className}</p>
                    <p className="text-xs text-muted-foreground">{enrollment.courseName}</p>
                  </div>
                  <span className={cn('text-xs font-medium', status.tone.replace('bg-', 'text-').replace('-50', '-600'))}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{enrollment.branchName}</span>
                  <span>·</span>
                  <span>{modalityLabel(enrollment.modality)}</span>
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
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Cần đổi cơ sở/hình thức? <span className="font-medium text-foreground">Liên hệ Phòng Học vụ</span>
      </p>
    </div>
  )
}
