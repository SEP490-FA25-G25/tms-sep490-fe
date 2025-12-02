import { Badge } from '@/components/ui/badge'

type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Hoạt động',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  SUSPENDED: {
    label: 'Tạm khóa',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  INACTIVE: {
    label: 'Đã nghỉ',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ACTIVE

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

// Enrollment status badge
type EnrollmentStatus = 'ENROLLED' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED'

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus
}

const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ENROLLED: {
    label: 'Đang học',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  TRANSFERRED: {
    label: 'Đã chuyển lớp',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  DROPPED: {
    label: 'Đã nghỉ',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
}

export function EnrollmentStatusBadge({ status }: EnrollmentStatusBadgeProps) {
  const config = enrollmentStatusConfig[status] || enrollmentStatusConfig.ENROLLED

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
