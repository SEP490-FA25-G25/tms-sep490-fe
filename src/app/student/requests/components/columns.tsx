/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { StudentRequest } from '@/store/services/studentRequestApi'
import { ArrowUpDown, XIcon, MoreVertical, FileText } from 'lucide-react'

// Request type badge
function RequestTypeBadge({ type }: { type: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    ABSENCE: { label: 'Xin nghỉ', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    MAKEUP: { label: 'Học bù', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
    TRANSFER: { label: 'Chuyển lớp', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
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
    APPROVED: { label: 'Đã duyệt', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
    REJECTED: { label: 'Đã từ chối', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  }

  const variant = variants[status] || { label: status, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

export const columns: ColumnDef<StudentRequest>[] = [
  {
    accessorKey: 'currentClass.code',
    header: 'Lớp',
    cell: ({ row }) => {
      return <span className="font-mono text-sm font-medium">{row.original.currentClass.code}</span>
    },
    size: 100,
    enableSorting: true,
  },
  {
    id: 'sessionOrClass',
    header: 'Buổi học/Lớp',
    cell: ({ row }) => {
      const { requestType, targetSession, makeupSession, targetClass, effectiveDate, currentClass } = row.original

      if (requestType === 'ABSENCE') {
        // For ABSENCE requests: Show only target session info
        return (
          <div className="text-sm">
            <div className="font-medium">
              Buổi {targetSession.courseSessionNumber}: {targetSession.courseSessionTitle || 'Buổi học'}
            </div>
            <div className="text-muted-foreground text-xs">
              {format(parseISO(targetSession.date), 'dd/MM', { locale: vi })} • {targetSession.timeSlot.startTime}-{targetSession.timeSlot.endTime}
            </div>
          </div>
        )
      }

      if (requestType === 'MAKEUP') {
        // For MAKEUP requests: Show "target → makeup" flow
        if (makeupSession) {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {currentClass.code} • {format(parseISO(targetSession.date), 'dd/MM', { locale: vi })} → {makeupSession.classInfo?.classCode || 'Lớp mới'} • {format(parseISO(makeupSession.date), 'dd/MM', { locale: vi })}
              </div>
              <div className="text-muted-foreground text-xs">
                Buổi {targetSession.courseSessionNumber} → Buổi {makeupSession.courseSessionNumber}: {makeupSession.courseSessionTitle || 'Lắng nghe'}
              </div>
            </div>
          )
        } else {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {currentClass.code} • {format(parseISO(targetSession.date), 'dd/MM', { locale: vi })} → ?
              </div>
              <div className="text-muted-foreground text-xs">
                Chưa có buổi học bù
              </div>
            </div>
          )
        }
      }

      if (requestType === 'TRANSFER' && targetClass) {
        // For TRANSFER requests: Show "class A → class B" with effective date
        return (
          <div className="text-sm">
            <div className="font-medium">
              {currentClass.code} → {targetClass.code}
            </div>
            {effectiveDate && (
              <div className="text-muted-foreground text-xs">
                Hiệu lực {format(parseISO(effectiveDate), 'dd/MM', { locale: vi })}
              </div>
            )}
          </div>
        )
      }

      return <span className="text-sm text-muted-foreground">-</span>
    },
    size: 200,
    enableSorting: false,
  },
  {
    accessorKey: 'requestReason',
    header: 'Lý do',
    cell: ({ row }) => {
      const reason = row.original.requestReason
      const truncated = reason.length > 50 ? `${reason.substring(0, 50)}...` : reason
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
          className="h-8 px-2"
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
    accessorKey: 'submittedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
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
    header: 'Hành động',
    cell: ({ row, table }) => {
      const request = row.original
      const meta = table.options.meta as {
        onViewDetail?: (id: number) => void
        onCancelRequest?: (id: number) => void
        isCancelling?: boolean
        cancelingId?: number | null
      }

      const isCancelling = meta.isCancelling && meta.cancelingId === request.id

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Mở menu hành động</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-9 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  meta.onViewDetail?.(request.id)
                }}
              >
                <FileText className="h-4 w-4" />
                Xem chi tiết
              </Button>
              {request.status === 'PENDING' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={(e) => {
                    e.stopPropagation()
                    meta.onCancelRequest?.(request.id)
                  }}
                  disabled={isCancelling}
                >
                  <XIcon className="h-4 w-4" />
                  {isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )
    },
    size: 80,
    enableSorting: false,
  },
]