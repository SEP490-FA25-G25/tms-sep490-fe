import { useGetTransferOptionsQuery } from '@/store/services/studentRequestApi'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransferEligibility, TransferOption } from '@/store/services/studentRequestApi'
import TransferErrorDisplay from './TransferErrorDisplay'

interface TransferClassSelectionStepProps {
  currentEnrollment: TransferEligibility
  selectedClass: TransferOption | null
  onSelectClass: (classOption: TransferOption) => void
  onNext: () => void
  onPrevious: () => void
}

export default function TransferClassSelectionStep({
  currentEnrollment,
  selectedClass,
  onSelectClass,
  onNext,
}: TransferClassSelectionStepProps) {
  const { data: optionsData, isLoading, error, refetch } = useGetTransferOptionsQuery({
    currentClassId: currentEnrollment.classId,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        <span>Đang tải các lớp có thể chuyển đến...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <TransferErrorDisplay
          error={error}
          onRetry={() => refetch()}
          className="mb-4"
        />
      </div>
    )
  }

  if (!optionsData?.data || optionsData.data.availableClasses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không có lớp nào phù hợp để chuyển. Vui lòng liên hệ Phòng Học vụ để được hỗ trợ.</p>
      </div>
    )
  }

  const { currentClass, availableClasses } = optionsData.data

  const handleSelectClass = (classOption: TransferOption) => {
    onSelectClass(classOption)
    onNext()
  }

  const getSeverityBadge = (severity: string, count: number) => {
    switch (severity) {
      case 'NONE':
        return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Không thiếu nội dung</Badge>
      case 'MINOR':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Thiếu ít: {count} buổi</Badge>
      case 'MODERATE':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">Thiếu vừa phải: {count} buổi</Badge>
      case 'MAJOR':
        return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Thiếu nhiều: {count} buổi</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getCapacityWarning = (availableSlots: number) => {
    if (availableSlots < 3) {
      return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Còn {availableSlots} chỗ</Badge>
    }
    return null
  }

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Class Info */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <h3 className="font-medium mb-3">Từ lớp:</h3>
          <div className="text-sm space-y-1">
            <div><span className="font-medium">{currentClass.code}</span> - {currentClass.name}</div>
            <div className="text-muted-foreground">
              {currentClass.branchName} • {getModalityText(currentClass.modality)}
            </div>
          </div>
        </div>
      </div>

      {/* Available Classes Header */}
      <div className="space-y-1">
        <h3 className="font-medium">Chọn lớp đích:</h3>
        <p className="text-sm text-muted-foreground">Chỉ hiển thị lớp cùng cơ sở và hình thức học</p>
      </div>

      {/* Available Classes */}
      <div className="space-y-4">
        {availableClasses.map((classOption) => (
          <div
            key={classOption.classId}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
              selectedClass?.classId === classOption.classId && "border-primary bg-primary/5"
            )}
            onClick={() => handleSelectClass(classOption)}
          >
            <div className="space-y-4">
              {/* Class Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{classOption.classCode}</h4>
                    {classOption.classId === currentClass.id && (
                      <Badge variant="outline" className="text-xs">Lớp hiện tại</Badge>
                    )}
                    {getCapacityWarning(classOption.availableSlots)}
                  </div>
                  <div className="text-sm text-muted-foreground">{classOption.className}</div>
                </div>
              </div>

              {/* Class Schedule */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{classOption.scheduleDays}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{classOption.scheduleTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{classOption.enrolledCount}/{classOption.maxCapacity}</span>
                </div>
              </div>

              {/* Content Gap Analysis */}
              <div className="pt-3 border-t border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(classOption.contentGap.severity, classOption.contentGap.missedSessions)}
                  </div>

                  {classOption.contentGap.missedSessions > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <span>Bạn sẽ bỏ lỡ </span>
                        <span className="font-medium">{classOption.contentGap.missedSessions} buổi học</span>
                      </div>

                      {classOption.contentGap.gapSessions.length > 0 && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-xs space-y-1">
                            {classOption.contentGap.gapSessions.slice(0, 2).map((session, index) => (
                              <div key={index}>
                                Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                              </div>
                            ))}
                            {classOption.contentGap.gapSessions.length > 2 && (
                              <div className="text-muted-foreground">
                                ... và {classOption.contentGap.gapSessions.length - 2} buổi khác
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">
                        <span className="font-medium">Khuyến nghị:</span> {classOption.contentGap.recommendation}
                      </div>
                    </div>
                  )}

                  {classOption.contentGap.missedSessions === 0 && (
                    <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                      Tiến độ tương đương, không thiếu nội dung
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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