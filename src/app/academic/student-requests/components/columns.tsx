/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns'
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
    id: 'timeLeft',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Thời gian còn lại
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const daysUntilSession = row.original.daysUntilSession
      const requestType = row.original.requestType
      const targetSession = row.original.targetSession

      // Helper function to calculate hours until session
      const getHoursUntilSession = () => {
        if (!targetSession?.date || !targetSession?.timeSlot?.startTime) {
          return null
        }

        try {
          // Combine date and time to create full session datetime
          const sessionDateTime = parseISO(`${targetSession.date}T${targetSession.timeSlot.startTime}:00`)
          const now = new Date()
          return differenceInHours(sessionDateTime, now)
        } catch {
          return null
        }
      }

      const hoursUntilSession = getHoursUntilSession()

      // Helper function to get time display text and color
      const getTimeDisplay = (hours: number | null | undefined, days: number | null) => {
        // Handle past events
        if (hours !== null && hours !== undefined && hours < 0) {
          return {
            text: 'Đã qua',
            className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }
        }

        // Handle very urgent (less than 3 hours)
        if (hours !== null && hours !== undefined && hours < 3) {
          return {
            text: `${hours} giờ`,
            className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }
        }

        // Handle urgent (less than 24 hours)
        if (hours !== null && hours !== undefined && hours < 24) {
          return {
            text: `${hours} giờ`,
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
          }
        }

        // Handle days
        if (days !== null && days >= 0) {
          if (days === 0) {
            return {
              text: 'Hôm nay',
              className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
            }
          } else if (days <= 2) {
            return {
              text: `${days} ngày`,
              className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
            }
          } else {
            return {
              text: `${days} ngày`,
              className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            }
          }
        }

        return {
          text: 'Không xác định',
          className: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        }
      }

      // Different logic for different request types
      if (requestType === 'ABSENCE') {
        // For absence requests, use precise hours when available
        const timeDisplay = getTimeDisplay(hoursUntilSession ?? null, daysUntilSession ?? null)
        return (
          <Badge variant="outline" className={timeDisplay.className}>
            {timeDisplay.text}
          </Badge>
        )
      } else if (requestType === 'MAKEUP') {
        // For makeup requests, show urgency based on when missed session occurred
        if (daysUntilSession === null || daysUntilSession === undefined) {
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              Không xác định
            </Badge>
          )
        }

        // For makeup, daysUntilSession is negative (days since missed session)
        const daysSinceMissed = Math.abs(daysUntilSession)

        // For recent missed sessions, show hours if we can calculate them
        if (hoursUntilSession !== null && Math.abs(hoursUntilSession) < 24) {
          const hoursAgo = Math.abs(hoursUntilSession)
          if (hoursAgo <= 3) {
            return (
              <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                {hoursAgo} giờ trước
              </Badge>
            )
          }
          return (
            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {hoursAgo} giờ trước
            </Badge>
          )
        }

        if (daysSinceMissed <= 7) {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {daysSinceMissed} ngày trước
            </Badge>
          )
        } else if (daysSinceMissed <= 14) {
          return (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              {daysSinceMissed} ngày trước
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {daysSinceMissed} ngày trước
            </Badge>
          )
        }
      } else if (requestType === 'TRANSFER') {
        // For transfer requests, show based on submission date with hours for recent submissions
        const submittedAt = parseISO(row.original.submittedAt)
        const now = new Date()
        const hoursSinceSubmission = differenceInHours(now, submittedAt)
        const daysSinceSubmission = differenceInDays(now, submittedAt)

        if (hoursSinceSubmission < 1) {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Mới
            </Badge>
          )
        } else if (hoursSinceSubmission < 24) {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {hoursSinceSubmission} giờ
            </Badge>
          )
        } else if (daysSinceSubmission >= 3) {
          return (
            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {daysSinceSubmission} ngày
            </Badge>
          )
        } else if (daysSinceSubmission >= 1) {
          return (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              {daysSinceSubmission} ngày
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Mới
            </Badge>
          )
        }
      }

      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          Không xác định
        </Badge>
      )
    },
    size: 140,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.daysUntilSession ?? 999
      const b = rowB.original.daysUntilSession ?? 999
      return a - b
    },
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
