import { useMemo } from 'react'
import { useGetTransferEligibilityQuery, type TransferEligibility } from '@/store/services/studentRequestApi'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-7">
      <div className="rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>Chính sách chuyển lớp</span>
          <span>Tối đa {policyInfo?.maxTransfersPerCourse ?? 1} lần/khóa</span>
        </div>
        <p className="mt-2 text-foreground">{policyInfo?.policyDescription ?? 'Chỉ hỗ trợ đổi lịch trong cùng cơ sở & hình thức. Liên hệ Phòng Học vụ nếu cần đổi cơ sở hoặc modality.'}</p>
        <p className="mt-1 text-muted-foreground">
          {eligibilitySummary}
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">Chọn lớp muốn chuyển:</div>
        <div className="space-y-3">
          {normalizedEnrollments.map((enrollment) => {
            const status = getStatusTone(enrollment)
            const disabled = !enrollment.canTransfer || enrollment.hasPendingTransfer

            return (
              <button
                key={enrollment.enrollmentId}
                type="button"
                className={cn(
                  'w-full rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm ring-1 ring-muted/40 transition hover:ring-muted/80',
                  disabled && 'cursor-not-allowed opacity-60',
                  selectedEnrollment?.enrollmentId === enrollment.enrollmentId && 'ring-2 ring-primary'
                )}
                onClick={() => handleSelectEnrollment(enrollment)}
                disabled={disabled}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{enrollment.classCode}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.className}</p>
                    <p className="text-xs text-muted-foreground">{enrollment.courseName}</p>
                  </div>
                  <Badge className={cn('flex items-center gap-1 border-none text-xs', status.tone)}>
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {enrollment.branchName}
                  </span>
                  <span>{modalityLabel(enrollment.modality)}</span>
                  {enrollment.scheduleInfo && <span>{enrollment.scheduleInfo}</span>}
                </div>

                <div className="mt-3 rounded-xl bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Hạn mức: <strong>{enrollment.transferQuota.used}/{enrollment.transferQuota.limit}</strong></span>
                    <span className="text-muted-foreground">
                      {enrollment.transferQuota.remaining > 0
                        ? `Còn ${enrollment.transferQuota.remaining} lượt`
                        : 'Đã dùng hết'}
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => {
                        event.preventDefault()
                        handleSelectEnrollment(enrollment)
                      }}
                    >
                      Chọn
                    </Button>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Cần đổi cơ sở/hình thức? <span className="font-semibold text-foreground">Liên hệ Phòng Học vụ để được hỗ trợ.</span>
      </p>
    </div>
  )
}
