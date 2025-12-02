import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ClassDetailDTO, TeacherSummaryDTO } from '@/store/services/classApi'
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
  Edit,
  AlertCircle,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface AAClassDetailHeaderProps {
  classData: ClassDetailDTO
  onEnrollFromExisting: () => void
  onEnrollNewStudent: () => void
  onEnrollFromExcel: () => void
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
      return 'bg-green-100 text-green-800 border-green-200'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
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
    case 'HYBRID':
      return 'Kết hợp'
    default:
      return modality
  }
}

const getUnifiedStatus = (status: string, approval?: string | null) => {
  if (approval === 'PENDING') {
    return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-200' }
  }
  if (approval === 'REJECTED') {
    return { label: 'Đã từ chối', color: 'bg-red-100 text-red-800 border-red-200' }
  }
  return { label: getStatusLabel(status), color: getStatusColor(status) }
}

const getCapacityColor = (current: number, max: number) => {
  const percentage = (current / max) * 100
  if (percentage < 80) return 'text-green-600'
  if (percentage < 95) return 'text-amber-600'
  return 'text-red-600'
}

export function AAClassDetailHeader({
  classData,
  onEnrollFromExisting,
  onEnrollNewStudent,
  onEnrollFromExcel,
}: AAClassDetailHeaderProps) {
  const unified = getUnifiedStatus(classData.status, classData.approvalStatus)
  
  const canEdit =
    (classData.status === 'DRAFT' &&
      classData.approvalStatus !== 'PENDING' &&
      classData.approvalStatus !== 'APPROVED') ||
    classData.approvalStatus === 'REJECTED'

  const editDisabledReason =
    classData.approvalStatus === 'PENDING'
      ? 'Lớp đang chờ duyệt, không thể chỉnh sửa.'
      : 'Lớp đã được duyệt, không thể chỉnh sửa.'

  // Get primary teacher or first teacher
  const primaryTeacher = classData.teachers?.[0]
  const teacherCount = classData.teachers?.length || 0

  return (
    <div className="border-b bg-background">
      <div className="@container/main py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* Header top row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={unified.color}>
                  {unified.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getModalityLabel(classData.modality)}
                </Badge>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {classData.name}
                </h1>
                <p className="text-lg text-muted-foreground">{classData.code}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{classData.course.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{classData.branch.name}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canEdit ? (
                <Button variant="outline" asChild>
                  <Link to={`/academic/classes/${classData.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled title={editDisabledReason}>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Ghi danh Học viên
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={onEnrollFromExisting}>
                    <Users className="mr-2 h-4 w-4" />
                    Chọn từ học viên có sẵn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEnrollNewStudent}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tạo học viên mới
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEnrollFromExcel}>
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

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Teacher */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Giảng viên</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate" title={primaryTeacher?.fullName}>
                {primaryTeacher?.fullName || 'Chưa phân công'}
                {teacherCount > 1 && (
                  <span className="text-xs text-muted-foreground font-normal"> +{teacherCount - 1}</span>
                )}
              </p>
            </div>

            {/* Schedule */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Lịch học</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate" title={classData.scheduleSummary}>
                {classData.scheduleSummary || '—'}
              </p>
            </div>

            {/* Location */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Phòng học</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate" title={classData.room}>
                {classData.room || '—'}
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

            {/* Utilization */}
            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Tỷ lệ lấp đầy</span>
              </div>
              <p className={`text-sm font-semibold ${getCapacityColor(classData.enrollmentSummary.currentEnrolled, classData.enrollmentSummary.maxCapacity)}`}>
                {classData.enrollmentSummary.utilizationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
