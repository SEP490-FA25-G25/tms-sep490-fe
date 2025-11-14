import { useMemo } from 'react'
import { useGetTransferOptionsQuery, type TransferEligibility, type TransferOption, type TransferOptionsResponse } from '@/store/services/studentRequestApi'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const optionPayload = optionsData?.data as TransferOptionsResponse | TransferOption[] | undefined
  const availableClasses = useMemo<TransferOption[]>(() => {
    if (!optionPayload) return []
    return Array.isArray(optionPayload) ? optionPayload : optionPayload.availableClasses ?? []
  }, [optionPayload])

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

  if (availableClasses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Hiện không có lớp nào cùng khóa và cùng cơ sở/hình thức. Liên hệ Phòng Học vụ nếu cần thêm lựa chọn.</p>
      </div>
    )
  }

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

  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'OFFLINE': return 'Tại lớp'
      case 'ONLINE': return 'Online'
      case 'HYBRID': return 'Hybrid'
      default: return modality
    }
  }

  const resolveSeverity = (classOption: TransferOption) => {
    const severity = classOption.contentGap?.severity ?? classOption.contentGapAnalysis?.gapLevel ?? 'NONE'
    const missed = classOption.contentGap?.missedSessions ?? classOption.contentGapAnalysis?.missedSessions ?? 0
    const recommendation =
      classOption.contentGap?.recommendation ??
      classOption.contentGapAnalysis?.impactDescription ??
      classOption.contentGapAnalysis?.recommendedActions?.[0]

    return { severity, missed, recommendation }
  }

  const getCapacityBadge = (availableSlots: number) => {
    if (availableSlots <= 0) {
      return <Badge variant="destructive">Đã đủ chỗ</Badge>
    }
    if (availableSlots < 3) {
      return <Badge className="bg-rose-50 text-rose-700">Còn {availableSlots} chỗ</Badge>
    }
    return null
  }

  const buildScheduleLine = (classOption: TransferOption) => {
    if (classOption.scheduleDays || classOption.scheduleTime) {
      return `${classOption.scheduleDays ?? ''} ${classOption.scheduleTime ?? ''}`.trim()
    }
    if (classOption.scheduleInfo) {
      return classOption.scheduleInfo
    }
    if (classOption.startDate && classOption.endDate) {
      return `${classOption.startDate} → ${classOption.endDate}`
    }
    return 'Chưa cập nhật lịch'
  }

  return (
    <div className="space-y-6">
      {/* Current Class Info */}
      <div className="space-y-2 border-b pb-4">
        <p className="text-xs text-muted-foreground">Từ lớp</p>
        <p className="font-semibold">{currentEnrollment.classCode}</p>
        <p className="text-sm text-muted-foreground">{currentEnrollment.className}</p>
        <p className="text-sm text-muted-foreground">
          {currentEnrollment.branchName} · {getModalityText(currentEnrollment.modality)}
        </p>
        <p className="text-xs text-muted-foreground">Chỉ hiển thị lớp cùng cơ sở và hình thức để tự duyệt trong 4-8 giờ</p>
      </div>

      {/* Available Classes Header */}
      <div className="space-y-1">
        <h3 className="font-medium">Chọn lớp đích</h3>
        <p className="text-sm text-muted-foreground">Chỉ hiển thị lớp cùng cơ sở và hình thức học</p>
      </div>

      {/* Available Classes */}
      <div className="space-y-3">
        {availableClasses.map((classOption) => {
          const { severity, missed, recommendation } = resolveSeverity(classOption)
          const scheduleLine = buildScheduleLine(classOption)
          const enrolledCount = classOption.enrolledCount ?? classOption.currentEnrollment ?? 0
          const startDate = classOption.startDate ?? classOption.scheduleInfo?.split(' to ')?.[0]
          const endDate = classOption.endDate ?? classOption.scheduleInfo?.split(' to ')?.[1]

          return (
            <button
              key={classOption.classId}
              type="button"
              className={cn(
                'w-full rounded-lg border p-4 text-left transition',
                'hover:border-primary/50 hover:bg-muted/30',
                selectedClass?.classId === classOption.classId && 'border-primary bg-primary/5'
              )}
              onClick={() => handleSelectClass(classOption)}
              disabled={!classOption.canTransfer}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{classOption.classCode}</p>
                  <p className="text-sm text-muted-foreground">{classOption.className}</p>
                </div>
                {classOption.availableSlots <= 0 && (
                  <span className="text-xs font-medium text-rose-600">Hết chỗ</span>
                )}
                {classOption.availableSlots > 0 && classOption.availableSlots < 3 && (
                  <span className="text-xs font-medium text-amber-600">Còn {classOption.availableSlots} chỗ</span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>{scheduleLine}</p>
                <p>
                  {startDate && endDate ? `${startDate} → ${endDate}` : classOption.scheduleTime ?? 'Đang học'} · {enrolledCount}/{classOption.maxCapacity} ({classOption.availableSlots} trống)
                </p>
              </div>

              {missed > 0 && (
                <div className="mt-3 border-t pt-3 text-sm">
                  <p className="font-medium text-amber-600">Thiếu {missed} buổi</p>
                  <p className="text-muted-foreground">{recommendation}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tự phục vụ chỉ hỗ trợ đổi lịch. Cần đổi cơ sở/hình thức? Quay lại bước trước để liên hệ Học vụ
      </p>
    </div>
  )
}
