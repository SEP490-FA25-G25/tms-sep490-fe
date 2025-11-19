import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AcademicStudentRequest } from '@/store/services/studentRequestApi'
import { ArrowUpDown, Eye } from 'lucide-react'

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


export const columns: ColumnDef<AcademicStudentRequest>[] = [
  {
    accessorKey: 'requestType',
    header: 'Loại',
    cell: ({ row }) => <RequestTypeBadge type={row.original.requestType} />,
    size: 90,
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
    size: 300,
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
    id: 'actions',
    header: 'Thao tác',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onViewDetail?: (id: number) => void }
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => meta?.onViewDetail?.(row.original.id)}
          className="h-8"
        >
          <Eye className="mr-2 h-4 w-4" />
          Xem
        </Button>
      )
    },
    size: 100,
    enableSorting: false,
  },
]
