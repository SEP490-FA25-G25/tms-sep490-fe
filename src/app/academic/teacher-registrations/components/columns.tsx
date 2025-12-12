/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO, isPast, differenceInDays } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ClassRegistrationSummaryDTO } from '@/store/services/teacherRegistrationApi'
import { ArrowUpDown, CheckCircle2, Users } from 'lucide-react'

// Modality badge
function ModalityBadge({ modality }: { modality: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    ONLINE: { label: 'Trực tuyến', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    OFFLINE: { label: 'Tại trung tâm', className: 'bg-green-100 text-green-700 border-green-200' },
  }

  const variant = variants[modality] || { label: modality, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// Status badge
function AssignmentStatusBadge({ hasTeacher, closeDate }: { hasTeacher: boolean; closeDate: string }) {
  if (hasTeacher) {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Đã gán GV
      </Badge>
    )
  }
  
  const isExpired = isPast(parseISO(closeDate))
  if (isExpired) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        Hết hạn đăng ký
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
      Đang mở đăng ký
    </Badge>
  )
}

// Time remaining badge
function TimeRemainingBadge({ closeDate }: { closeDate: string }) {
  const closeDateParsed = parseISO(closeDate)
  const now = new Date()
  
  if (isPast(closeDateParsed)) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
        Đã hết hạn
      </Badge>
    )
  }
  
  const daysLeft = differenceInDays(closeDateParsed, now)
  
  if (daysLeft === 0) {
    return (
      <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
        Hôm nay
      </Badge>
    )
  } else if (daysLeft <= 2) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        {daysLeft} ngày
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
        {daysLeft} ngày
      </Badge>
    )
  }
}

// Schedule days display
const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function ScheduleDaysDisplay({ days }: { days: number[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {days.map((day) => (
        <Badge
          key={day}
          variant="outline"
          className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
        >
          {DAYS_OF_WEEK[day]}
        </Badge>
      ))}
    </div>
  )
}

// Columns for pending classes (chưa có giáo viên)
export const pendingColumns: ColumnDef<ClassRegistrationSummaryDTO>[] = [
  {
    id: 'class',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Lớp học
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.className,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.className}</span>
          <span className="text-xs text-muted-foreground">{row.original.classCode}</span>
        </div>
      )
    },
    size: 200,
    enableSorting: true,
  },
  {
    id: 'timeLeft',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Hạn đăng ký
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.registrationCloseDate,
    cell: ({ row }) => <TimeRemainingBadge closeDate={row.original.registrationCloseDate} />,
    size: 120,
    enableSorting: true,
  },
  {
    id: 'subject',
    header: 'Môn học',
    accessorFn: (row) => row.subjectName,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.subjectName}</span>
    ),
    size: 150,
  },
  {
    id: 'modality',
    header: 'Hình thức',
    cell: ({ row }) => <ModalityBadge modality={row.original.modality} />,
    size: 120,
  },
  {
    id: 'schedule',
    header: 'Lịch học',
    cell: ({ row }) => <ScheduleDaysDisplay days={row.original.scheduleDays} />,
    size: 150,
  },
  {
    id: 'startDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Ngày bắt đầu
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.startDate,
    cell: ({ row }) => (
      <span className="text-sm">{format(parseISO(row.original.startDate), 'dd/MM/yyyy')}</span>
    ),
    size: 120,
    enableSorting: true,
  },
  {
    id: 'registrations',
    header: 'Đăng ký',
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        {row.original.pendingCount}
      </Badge>
    ),
    size: 80,
  },
  {
    id: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Trạng thái
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.assignedTeacherId !== null,
    cell: ({ row }) => (
      <AssignmentStatusBadge 
        hasTeacher={row.original.assignedTeacherId !== null} 
        closeDate={row.original.registrationCloseDate}
      />
    ),
    size: 140,
    enableSorting: true,
  },
]

// Columns for assigned classes (đã có giáo viên)
export const assignedColumns: ColumnDef<ClassRegistrationSummaryDTO>[] = [
  {
    id: 'class',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Lớp học
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.className,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.className}</span>
          <span className="text-xs text-muted-foreground">{row.original.classCode}</span>
        </div>
      )
    },
    size: 200,
    enableSorting: true,
  },
  {
    id: 'subject',
    header: 'Môn học',
    accessorFn: (row) => row.subjectName,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.subjectName}</span>
    ),
    size: 150,
  },
  {
    id: 'modality',
    header: 'Hình thức',
    cell: ({ row }) => <ModalityBadge modality={row.original.modality} />,
    size: 120,
  },
  {
    id: 'schedule',
    header: 'Lịch học',
    cell: ({ row }) => <ScheduleDaysDisplay days={row.original.scheduleDays} />,
    size: 150,
  },
  {
    id: 'startDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Ngày bắt đầu
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.startDate,
    cell: ({ row }) => (
      <span className="text-sm">{format(parseISO(row.original.startDate), 'dd/MM/yyyy')}</span>
    ),
    size: 120,
    enableSorting: true,
  },
  {
    id: 'teacher',
    header: 'Giáo viên',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="font-medium">{row.original.assignedTeacherName}</span>
      </div>
    ),
    size: 180,
  },
  {
    id: 'registrations',
    header: 'Số đăng ký',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.registrations.length} đăng ký
      </span>
    ),
    size: 100,
  },
]
