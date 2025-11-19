import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AcademicStudentRequest } from '@/store/services/studentRequestApi'
import { ArrowUpDown } from 'lucide-react'

// Request type badge
function RequestTypeBadge({ type }: { type: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    ABSENCE: { label: 'Xin nghỉ', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    MAKEUP: { label: 'Học bù', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    TRANSFER: { label: 'Chuyển lớp', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  }

  const variant = variants[type] || { label: type, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    REJECTED: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' },
  }

  const variant = variants[status] || { label: status, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}


export const pendingColumns: ColumnDef<AcademicStudentRequest>[] = [
  {
    accessorKey: 'requestType',
    header: 'Loại',
    cell: ({ row }) => <RequestTypeBadge type={row.original.requestType} />,
    size: 90,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Trạng thái
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    size: 120,
    enableSorting: true,
  },
  {
    id: 'student',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Sinh viên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.student.fullName,
    cell: ({ row }) => {
      const { student } = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{student.fullName}</span>
          <span className="text-xs text-muted-foreground">{student.studentCode}</span>
        </div>
      )
    },
    size: 180,
    enableSorting: true,
  },
  {
    accessorKey: 'decidedBy.fullName',
    header: 'Người duyệt',
    cell: ({ row }) => {
      const decidedBy = row.original.decidedBy
      if (!decidedBy) {
        return <span className="text-sm text-muted-foreground">-</span>
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium">{decidedBy.fullName}</span>
          <span className="text-xs text-muted-foreground">{decidedBy.email}</span>
        </div>
      )
    },
    size: 200,
    enableSorting: false,
  },
  {
    accessorKey: 'currentClass.code',
    header: 'Lớp',
    cell: ({ row }) => {
      return <span className="font-mono text-sm">{row.original.currentClass.code}</span>
    },
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'requestReason',
    header: 'Lý do',
    cell: ({ row }) => {
      const reason = row.original.requestReason
      const truncated = reason.length > 60 ? `${reason.substring(0, 60)}...` : reason
      return (
        <span className="text-sm text-muted-foreground" title={reason}>
          {truncated}
        </span>
      )
    },
    size: 120,
    enableSorting: false,
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Ngày gửi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const submittedAt = parseISO(row.original.submittedAt)
      const now = new Date()
      const diffDays = differenceInDays(now, submittedAt)
      const diffHours = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60))

      let relativeTime = ''
      if (diffHours < 1) {
        relativeTime = 'Vừa xong'
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} giờ trước`
      } else if (diffDays === 1) {
        relativeTime = 'Hôm qua'
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} ngày trước`
      } else {
        relativeTime = format(submittedAt, 'dd/MM/yyyy', { locale: vi })
      }

      return <span className="text-sm text-muted-foreground">{relativeTime}</span>
    },
    size: 120,
    enableSorting: true,
  },
]

export const historyColumns: ColumnDef<AcademicStudentRequest>[] = [
  {
    accessorKey: 'requestType',
    header: 'Loại',
    cell: ({ row }) => <RequestTypeBadge type={row.original.requestType} />,
    size: 90,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Trạng thái
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    size: 120,
    enableSorting: true,
  },
  {
    id: 'student',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Sinh viên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorFn: (row) => row.student.fullName,
    cell: ({ row }) => {
      const { student } = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{student.fullName}</span>
          <span className="text-xs text-muted-foreground">{student.studentCode}</span>
        </div>
      )
    },
    size: 160,
    enableSorting: true,
  },
  {
    accessorKey: 'decidedBy.fullName',
    header: 'Người duyệt',
    cell: ({ row }) => {
      const decidedBy = row.original.decidedBy
      if (!decidedBy) {
        return <span className="text-sm text-muted-foreground">-</span>
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium">{decidedBy.fullName}</span>
          <span className="text-xs text-muted-foreground">{decidedBy.email}</span>
        </div>
      )
    },
    size: 160,
    enableSorting: false,
  },
  {
    accessorKey: 'currentClass.code',
    header: 'Lớp',
    cell: ({ row }) => {
      return <span className="font-mono text-sm">{row.original.currentClass.code}</span>
    },
    size: 80,
    enableSorting: true,
  },
  {
    accessorKey: 'requestReason',
    header: 'Lý do',
    cell: ({ row }) => {
      const reason = row.original.requestReason
      const truncated = reason.length > 40 ? `${reason.substring(0, 40)}...` : reason
      return (
        <span className="text-sm text-muted-foreground" title={reason}>
          {truncated}
        </span>
      )
    },
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: 'rejectionReason',
    header: 'Lý do từ chối',
    cell: ({ row }) => {
      const rejectionReason = row.original.rejectionReason
      const status = row.original.status

      // Only show rejection reason for rejected requests
      if (status !== 'REJECTED' || !rejectionReason) {
        return <span className="text-sm text-muted-foreground">-</span>
      }

      const truncated = rejectionReason.length > 30 ? `${rejectionReason.substring(0, 30)}...` : rejectionReason
      return (
        <span className="text-sm text-red-600 dark:text-red-400" title={rejectionReason}>
          {truncated}
        </span>
      )
    },
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Ngày gửi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const submittedAt = parseISO(row.original.submittedAt)
      const now = new Date()
      const diffDays = differenceInDays(now, submittedAt)
      const diffHours = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60))

      let relativeTime = ''
      if (diffHours < 1) {
        relativeTime = 'Vừa xong'
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} giờ trước`
      } else if (diffDays === 1) {
        relativeTime = 'Hôm qua'
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} ngày trước`
      } else {
        relativeTime = format(submittedAt, 'dd/MM/yyyy', { locale: vi })
      }

      return <span className="text-sm text-muted-foreground">{relativeTime}</span>
    },
    size: 120,
    enableSorting: true,
  },
  {
    accessorKey: 'decidedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Ngày duyệt
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const decidedAt = row.original.decidedAt
      if (!decidedAt) {
        return <span className="text-sm text-muted-foreground">-</span>
      }

      const decidedDate = parseISO(decidedAt)
      const now = new Date()
      const diffDays = differenceInDays(now, decidedDate)

      let relativeTime = ''
      if (diffDays === 0) {
        relativeTime = 'Hôm nay'
      } else if (diffDays === 1) {
        relativeTime = 'Hôm qua'
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} ngày trước`
      } else {
        relativeTime = format(decidedDate, 'dd/MM/yyyy', { locale: vi })
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm">{relativeTime}</span>
          <span className="text-xs text-muted-foreground">
            {format(decidedDate, 'HH:mm', { locale: vi })}
          </span>
        </div>
      )
    },
    size: 140,
    enableSorting: true,
  },
]
