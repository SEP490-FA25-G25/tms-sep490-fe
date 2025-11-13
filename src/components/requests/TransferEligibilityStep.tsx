import { useGetTransferEligibilityQuery } from '@/store/services/studentRequestApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from '@/lib/utils'
import type { TransferEligibility } from '@/store/services/studentRequestApi'
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

  if (!eligibilityData?.data || eligibilityData.data.currentClasses.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Bạn không có lớp học nào phù hợp để chuyển. Vui lòng liên hệ Phòng Học vụ để được hỗ trợ.
        </AlertDescription>
      </Alert>
    )
  }

  const { currentClasses, policyInfo } = eligibilityData.data

  const handleSelectEnrollment = (enrollment: TransferEligibility) => {
    onSelectEnrollment(enrollment)
    onNext()
  }

  const getStatusIcon = (enrollment: TransferEligibility) => {
    if (!enrollment.canTransfer) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    if (enrollment.hasPendingTransfer) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusBadge = (enrollment: TransferEligibility) => {
    if (!enrollment.canTransfer) {
      return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Không thể chuyển</Badge>
    }
    if (enrollment.hasPendingTransfer) {
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Đang chờ duyệt</Badge>
    }
    return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Có thể chuyển</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Policy Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
        <div className="text-sm space-y-1">
          <div className="font-medium">Chính sách chuyển lớp:</div>
          <div>• Giới hạn: <strong>{policyInfo.maxTransfersPerCourse}</strong> lần/khóa học</div>
          <div>• Xử lý tự động: {policyInfo.autoApprovalConditions}</div>
          <div>• Thời gian: 4-8 giờ làm việc</div>
        </div>
      </div>

      {/* Current Classes */}
      <div className="space-y-4">
        <h3 className="font-medium">Chọn lớp bạn muốn chuyển từ:</h3>

        <div className="space-y-4">
          {currentClasses.map((enrollment) => (
            <div
              key={enrollment.enrollmentId}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-all",
                selectedEnrollment?.enrollmentId === enrollment.enrollmentId && "border-primary bg-primary/5",
                !enrollment.canTransfer && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => enrollment.canTransfer && !enrollment.hasPendingTransfer && handleSelectEnrollment(enrollment)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{enrollment.classCode}</span>
                      {getStatusBadge(enrollment)}
                    </div>
                    <div className="text-sm text-muted-foreground">{enrollment.className}</div>
                    <div className="text-sm text-muted-foreground">{enrollment.courseName}</div>
                  </div>
                  {getStatusIcon(enrollment)}
                </div>

                {/* Class Details */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{enrollment.branchName}</span>
                  </div>
                  <div>
                    {
                      enrollment.modality === 'OFFLINE' ? 'Tại lớp' :
                      enrollment.modality === 'ONLINE' ? 'Online' : 'Hybrid'
                    }
                  </div>
                </div>

                {/* Transfer Quota Display */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Hạn mức chuyển: </span>
                      <span className="font-medium">{enrollment.transferQuota.used}/{enrollment.transferQuota.limit}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: enrollment.transferQuota.limit }).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            index < enrollment.transferQuota.used ? "bg-red-500" : "bg-green-500"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {enrollment.transferQuota.remaining === 0
                      ? 'Đã dùng hết hạn mức chuyển lớp'
                      : `Còn ${enrollment.transferQuota.remaining} lần chuyển`
                    }
                  </div>
                </div>

                {/* Action */}
                {enrollment.canTransfer && !enrollment.hasPendingTransfer && (
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      variant={selectedEnrollment?.enrollmentId === enrollment.enrollmentId ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectEnrollment(enrollment)
                      }}
                    >
                      {selectedEnrollment?.enrollmentId === enrollment.enrollmentId ? "Đã chọn" : "Chọn lớp này"}
                    </Button>
                  </div>
                )}

                {enrollment.hasPendingTransfer && (
                  <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                    <Clock className="w-4 h-4" />
                    <span>Đang có yêu cầu chuyển lớp chờ duyệt</span>
                  </div>
                )}

                {!enrollment.canTransfer && enrollment.transferQuota.remaining === 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                    <XCircle className="w-4 h-4" />
                    <span>Đã hết hạn mức chuyển lớp</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Info */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Cần chuyển cơ sở hoặc hình thức học?
          <br />
          <span className="font-medium">Liên hệ Phòng Học vụ để được hỗ trợ</span>
        </p>
      </div>
    </div>
  )
}