import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import TransferErrorDisplay from '../TransferErrorDisplay'
import { useGetAcademicTransferEligibilityQuery } from '@/store/services/studentRequestApi'
import type { TransferEligibility } from '@/types/academicTransfer'

interface CurrentClassSelectionStepProps {
  studentId: number
  selectedClass: TransferEligibility | null
  onSelectClass: (classData: TransferEligibility) => void
}

export default function CurrentClassSelectionStep({
  studentId,
  selectedClass,
  onSelectClass,
}: CurrentClassSelectionStepProps) {
  const {
    data: eligibilityData,
    isLoading,
    error,
    refetch,
  } = useGetAcademicTransferEligibilityQuery(
    { studentId },
    { skip: !studentId }
  )

  const classes = eligibilityData?.data.currentClasses ?? []
  const policyInfo = eligibilityData?.data.policyInfo

  const eligibilityMessage = useMemo(() => {
    if (!eligibilityData?.data) return null
    if (eligibilityData.data.eligibleForTransfer) {
      return {
        intent: 'positive',
        text: `Mỗi học viên được chuyển tối đa ${policyInfo?.maxTransfersPerCourse ?? 1} lần mỗi khóa.`,
      }
    }

    return {
      intent: 'negative',
      text: eligibilityData.data.ineligibilityReason ?? 'Học viên không đủ điều kiện chuyển lớp.',
    }
  }, [eligibilityData?.data, policyInfo])

  const modalityLabel = (modality: string) => {
    switch (modality) {
      case 'ONLINE':
        return 'Online'
      case 'OFFLINE':
        return 'Tại lớp'
      case 'HYBRID':
        return 'Hybrid'
      default:
        return modality
    }
  }

  const renderQuota = (transferClass: TransferEligibility) => {
    const quota = transferClass.transferQuota ?? { used: 0, limit: 1, remaining: 1 }
    const { used, limit, remaining } = quota
    return (
      <div className="text-xs text-muted-foreground">
        <span>Đã dùng {used}/{limit} lượt • </span>
        <span>{remaining > 0 ? `Còn ${remaining} lượt` : 'Hết lượt chuyển'}</span>
      </div>
    )
  }

  const renderBlockingReason = (transferClass: TransferEligibility) => {
    const quota = transferClass.transferQuota ?? { used: 0, limit: 1, remaining: 1 }
    if (quota.remaining === 0) {
      return 'Đã đạt giới hạn 1 lần chuyển trong khóa'
    }
    if (transferClass.hasPendingTransfer) {
      return 'Đang có yêu cầu chuyển lớp chờ xử lý'
    }
    if (transferClass.enrollmentStatus !== 'ENROLLED') {
      return 'Chỉ hỗ trợ lớp đang học (ENROLLED)'
    }
    return 'Không đáp ứng điều kiện chuyển lớp'
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Chọn lớp hiện tại</h3>
        <p className="text-sm text-muted-foreground">
          Hệ thống sẽ tự kiểm tra hạn mức chuyển và yêu cầu đang chờ của học viên.
        </p>
      </div>

      {eligibilityMessage && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg px-4 py-3 text-sm',
            eligibilityMessage.intent === 'positive'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          )}
        >
          {eligibilityMessage.intent === 'positive' ? (
            <ShieldCheck className="mt-0.5 h-4 w-4" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4" />
          )}
          <span>{eligibilityMessage.text}</span>
        </div>
      )}

      {error && (
        <TransferErrorDisplay
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <span>Đang kiểm tra điều kiện chuyển lớp...</span>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3">
          {classes.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Học viên chưa có lớp nào đủ điều kiện chuyển.
            </p>
          )}

          {classes.map((transferClass) => {
            const isSelected = selectedClass?.classId === transferClass.classId
            const disabled = !transferClass.canTransfer

            return (
              <div
                key={transferClass.classId}
                className={cn(
                  'rounded-lg border p-4',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border/70',
                  disabled && 'opacity-70'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{transferClass.classCode}</p>
                    <p className="text-sm text-muted-foreground">{transferClass.courseName}</p>
                  </div>

                  <Badge variant="outline">
                    {transferClass.enrollmentStatus === 'ENROLLED' ? 'Đang học' : transferClass.enrollmentStatus}
                  </Badge>
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-muted-foreground">
                    Cơ sở: <span className="font-medium text-foreground">{transferClass.branchName}</span>
                    <span className="mx-2">•</span>
                    Hình thức: <span className="font-medium text-foreground">{modalityLabel(transferClass.modality || '')}</span>
                  </p>
                  {renderQuota(transferClass as import('@/types/academicTransfer').TransferEligibility)}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!disabled) {
                        onSelectClass(transferClass as import('@/types/academicTransfer').TransferEligibility)
                      }
                    }}
                    disabled={disabled}
                  >
                    {disabled ? 'Không đủ điều kiện' : isSelected ? 'Đã chọn' : 'Chọn lớp này'}
                  </Button>

                  {!transferClass.canTransfer && (
                    <span className="text-xs text-rose-600">{renderBlockingReason(transferClass as import('@/types/academicTransfer').TransferEligibility)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
