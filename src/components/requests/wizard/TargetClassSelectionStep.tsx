import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetAcademicTransferOptionsQuery, useGetBranchesQuery, type SessionModality } from '@/store/services/studentRequestApi'
import type { TransferEligibility, TransferOption } from '@/types/academicTransfer'
import { AlertTriangle, Loader2, Globe, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import TransferErrorDisplay from '../TransferErrorDisplay'

interface TargetClassSelectionStepProps {
  currentClass: TransferEligibility | null
  selectedClass: TransferOption | null
  onSelectClass: (classData: TransferOption) => void
}

type TransferDimension = 'schedule' | 'branch' | 'modality'

export default function TargetClassSelectionStep({
  currentClass,
  selectedClass,
  onSelectClass,
}: TargetClassSelectionStepProps) {
  const [dimensions, setDimensions] = useState<Record<TransferDimension, boolean>>({
    schedule: true,
    branch: false,
    modality: false,
  })
  const [targetBranchId, setTargetBranchId] = useState<number | undefined>()
  const [targetModality, setTargetModality] = useState<SessionModality | undefined>()

  const allowedModalities = useMemo(() => {
    if (!currentClass) return []
    if (currentClass.modality === 'ONLINE') {
      return ['OFFLINE', 'HYBRID'] as SessionModality[]
    }
    return ['ONLINE'] as SessionModality[]
  }, [currentClass])

  const shouldFetchBranches = Boolean(currentClass?.branchId && dimensions.branch)
  const {
    data: branchData,
    isLoading: isLoadingBranches,
  } = useGetBranchesQuery(
    shouldFetchBranches ? { excludeId: currentClass?.branchId } : undefined,
    { skip: !shouldFetchBranches }
  )

  const filtersReady =
    Boolean(currentClass?.classId) &&
    (!dimensions.branch || typeof targetBranchId === 'number') &&
    (!dimensions.modality || Boolean(targetModality))

  const {
    data: optionsData,
    isLoading,
    error,
    refetch,
  } = useGetAcademicTransferOptionsQuery(
    filtersReady && currentClass
      ? {
          currentClassId: currentClass.classId,
          targetBranchId: dimensions.branch ? targetBranchId : undefined,
          targetModality: dimensions.modality ? targetModality : undefined,
          scheduleOnly: dimensions.schedule && !dimensions.branch && !dimensions.modality,
        }
      : { currentClassId: 0 },
    {
      skip: !filtersReady,
    }
  )

  const availableClasses = optionsData?.data?.availableClasses ?? []

  const toggleDimension = (dimension: TransferDimension) => {
    setDimensions((prev) => {
      const next = { ...prev, [dimension]: !prev[dimension] }
      if (dimension === 'schedule' && !next.schedule && !next.branch && !next.modality) {
        next.schedule = true
      }

      if (dimension === 'branch' && !next.branch) {
        setTargetBranchId(undefined)
      }

      if (dimension === 'modality' && !next.modality) {
        setTargetModality(undefined)
      }

      return next
    })
  }

  const getSeverityBadge = (severity: string, count: number) => {
    switch (severity) {
      case 'NONE':
        return <Badge className="bg-emerald-50 text-emerald-700">Không thiếu nội dung</Badge>
      case 'MINOR':
        return <Badge className="bg-yellow-50 text-yellow-700">Thiếu ít: {count} buổi</Badge>
      case 'MODERATE':
        return <Badge className="bg-orange-50 text-orange-700">Thiếu vừa: {count} buổi</Badge>
      case 'MAJOR':
        return <Badge className="bg-rose-50 text-rose-700">Thiếu nhiều: {count} buổi</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  const renderDimensionControls = () => (
    <div className="rounded-lg border border-dashed p-4 space-y-3">
      <p className="text-sm font-medium">Tùy chọn chuyển lớp</p>
      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={dimensions.schedule}
            onCheckedChange={() => toggleDimension('schedule')}
          />
          <div>
            <p className="font-medium">Đổi lịch học</p>
            <p className="text-xs text-muted-foreground">
              Giữ nguyên cơ sở & hình thức, chỉ chuyển khung giờ khác.
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={dimensions.branch}
            onCheckedChange={() => toggleDimension('branch')}
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Đổi cơ sở</p>
            <p className="text-xs text-muted-foreground">Bắt buộc chọn cơ sở đích.</p>
            {dimensions.branch && (
              <Select
                value={targetBranchId ? String(targetBranchId) : undefined}
                onValueChange={(value) => setTargetBranchId(Number(value))}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={isLoadingBranches ? 'Đang tải...' : 'Chọn cơ sở'} />
                </SelectTrigger>
                <SelectContent>
                  {branchData?.data?.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </label>

        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={dimensions.modality}
            onCheckedChange={() => toggleDimension('modality')}
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Đổi hình thức học</p>
            <p className="text-xs text-muted-foreground">
              {currentClass?.modality === 'ONLINE'
                ? 'Online → Tại lớp/Hybird yêu cầu chọn cơ sở dạy.'
                : 'Tại lớp/Hybird có thể chuyển sang Online.'}
            </p>
            {dimensions.modality && (
              <Select
                value={targetModality}
                onValueChange={(value: SessionModality) => setTargetModality(value)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  {allowedModalities.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'ONLINE' ? 'Online' : option === 'OFFLINE' ? 'Tại lớp' : 'Hybrid'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </label>
      </div>
    </div>
  )

  if (!currentClass) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Vui lòng chọn lớp nguồn trước.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Chọn lớp đích</h3>
        <p className="text-sm text-muted-foreground">
          Hệ thống hiển thị lớp cùng khóa học, ưu tiên ít chênh lệch nội dung.
        </p>
        <div className="rounded-lg border border-border/70 p-3 text-sm">
          <p className="font-medium">{currentClass.classCode}</p>
          <p className="text-muted-foreground">
            {currentClass.courseName} • {currentClass.branchName} • {currentClass.modality}
          </p>
        </div>
      </div>

      {renderDimensionControls()}

      {error && (
        <TransferErrorDisplay
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!filtersReady && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Chọn đầy đủ thông tin cơ sở/hình thức trước khi tải danh sách lớp.</span>
        </div>
      )}

      {filtersReady && isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <span>Đang tìm lớp phù hợp...</span>
        </div>
      )}

      {filtersReady && !isLoading && !error && (
        <div className="space-y-3">
          {availableClasses.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Không có lớp nào đáp ứng tiêu chí này.
            </div>
          ) : (
            availableClasses.map((classOption) => (
              <button
                key={classOption.classId}
                type="button"
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition',
                  selectedClass?.classId === classOption.classId
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:border-primary/60'
                )}
                onClick={() => onSelectClass(classOption)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{classOption.classCode}</p>
                    <p className="text-sm text-muted-foreground">{classOption.className}</p>
                  </div>
                  <Badge variant="outline">{classOption.classStatus}</Badge>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {classOption.branchName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {classOption.scheduleDays} • {classOption.scheduleTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {classOption.enrolledCount}/{classOption.maxCapacity} chỗ
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {classOption.contentGap && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Phân tích nội dung:</span>
                        {getSeverityBadge(
                          classOption.contentGap.severity,
                          classOption.contentGap.missedSessions
                        )}
                      </div>
                      {classOption.contentGap.missedSessions > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Học viên sẽ bỏ lỡ {classOption.contentGap.missedSessions} buổi. {classOption.contentGap.recommendation}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
