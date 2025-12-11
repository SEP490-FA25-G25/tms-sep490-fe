import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ClassDetailDTO } from '@/store/services/classApi'
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  ChevronDown,
  FileUp,
  UserPlus,
  AlertCircle,
} from 'lucide-react'

interface AAClassDetailHeaderProps {
  classData: ClassDetailDTO
  onEnrollFromExisting?: () => void
  onEnrollNewStudent?: () => void
  onEnrollFromExcel?: () => void
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'SUBMITTED':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'ONGOING':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp'
    case 'SUBMITTED':
      return 'Đã gửi duyệt'
    case 'SCHEDULED':
      return 'Đã lên lịch'
    case 'ONGOING':
      return 'Đang diễn ra'
    case 'COMPLETED':
      return 'Đã hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
    default:
      return status
  }
}

const getModalityLabel = (modality: string) => {
  switch (modality) {
    case 'ONLINE':
      return 'Trực tuyến'
    case 'OFFLINE':
      return 'Trực tiếp'
    default:
      return modality
  }
}

const getUnifiedStatus = (status: string, approval?: string | null) => {
  if (approval === 'PENDING') {
    return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-200' }
  }
  if (approval === 'REJECTED') {
    return { label: 'Đã từ chối', color: 'bg-rose-100 text-rose-800 border-rose-200' }
  }
  return { label: getStatusLabel(status), color: getStatusColor(status) }
}

const getCapacityColor = (current: number, max: number) => {
  const percentage = (current / max) * 100
  if (percentage < 80) return 'text-emerald-600'
  if (percentage < 95) return 'text-amber-600'
  return 'text-rose-600'
}

export function AAClassDetailHeader({
  classData,
  onEnrollFromExisting,
  onEnrollNewStudent,
  onEnrollFromExcel,
}: AAClassDetailHeaderProps) {
  const unified = getUnifiedStatus(classData.status, classData.approvalStatus)

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={unified.color}>
                  {unified.label}
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classData.name}
                </h1>
                <p className="text-lg text-muted-foreground">{classData.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {classData.subject.level?.curriculum && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{classData.subject.level.curriculum.name}</span>
                  </div>
                )}
                {classData.subject.level && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {classData.subject.level.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{classData.branch.name}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Ghi danh Học viên
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={onEnrollFromExisting || undefined}>
                    <Users className="mr-2 h-4 w-4" />
                    Chọn từ học viên có sẵn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEnrollNewStudent || undefined}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tạo học viên mới
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEnrollFromExcel || undefined}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Nhập từ Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Rejection Alert */}
          {classData.approvalStatus === 'REJECTED' && classData.rejectionReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lớp học bị từ chối</AlertTitle>
              <AlertDescription>
                Lý do: {classData.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Info grid - responsive: 2 cols on mobile, 4 cols on tablet+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Modality */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Hình thức</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {getModalityLabel(classData.modality)}
              </p>
            </div>

            {/* Schedule */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Lịch học</span>
              </div>
              <p className="text-sm font-semibold text-foreground whitespace-normal">
                {classData.scheduleDetails && classData.scheduleDetails.length > 0
                  ? classData.scheduleDetails
                      .map((d) => `${d.day}\u00A0${d.startTime}-${d.endTime}`)
                      .join(', ')
                  : '—'}
              </p>
            </div>

            {/* Date Range */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Thời gian</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {formatDate(classData.startDate)} - {formatDate(classData.plannedEndDate)}
              </p>
            </div>

            {/* Enrollment */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Sĩ số</span>
              </div>
              <p className={`text-sm font-semibold ${getCapacityColor(classData.enrollmentSummary.currentEnrolled, classData.enrollmentSummary.maxCapacity)}`}>
                {classData.enrollmentSummary.currentEnrolled}/{classData.enrollmentSummary.maxCapacity}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
