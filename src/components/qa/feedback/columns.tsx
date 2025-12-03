/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'

export interface FeedbackItem {
  feedbackId: number
  studentName: string
  phaseName: string
  phaseId?: number
  isFeedback: boolean
  submittedAt?: string
  responsePreview?: string
}

function StatusBadge({ isFeedback }: { isFeedback: boolean }) {
  if (isFeedback) {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-emerald-100 text-emerald-700 border-emerald-200"
      >
        <CheckCircle className="h-3 w-3" />
        <span>Đã nộp</span>
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 bg-amber-100 text-amber-700 border-amber-200"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>Chưa nộp</span>
    </Badge>
  )
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const feedbackColumns: ColumnDef<FeedbackItem>[] = [
  {
    accessorKey: 'studentName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Học viên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.studentName}</span>
    },
    size: 180,
    enableSorting: true,
  },
  {
    accessorKey: 'phaseName',
    header: 'Giai đoạn',
    cell: ({ row }) => {
      return <span className="text-sm text-muted-foreground">{row.original.phaseName}</span>
    },
    size: 140,
    enableSorting: true,
  },
  {
    accessorKey: 'isFeedback',
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
    cell: ({ row }) => <StatusBadge isFeedback={row.original.isFeedback} />,
    size: 120,
    enableSorting: true,
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
          Ngày nộp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const submittedAt = row.original.submittedAt
      if (!submittedAt) {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(submittedAt)}</span>
        </div>
      )
    },
    size: 160,
    enableSorting: true,
  },
  {
    accessorKey: 'responsePreview',
    header: 'Nội dung',
    cell: ({ row }) => {
      const preview = row.original.responsePreview
      if (!preview) {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      const truncated = preview.length > 50 ? `${preview.substring(0, 50)}...` : preview
      return (
        <span className="text-sm text-muted-foreground" title={preview}>
          {truncated}
        </span>
      )
    },
    size: 200,
    enableSorting: false,
  },
]

