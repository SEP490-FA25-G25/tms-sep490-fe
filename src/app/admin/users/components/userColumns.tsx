/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UserResponse } from '@/store/services/userApi'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Role badge mapping
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  CENTER_HEAD: 'Trưởng trung tâm',
  SUBJECT_LEADER: 'Trưởng bộ môn',
  ACADEMIC_AFFAIR: 'Giáo vụ',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học viên',
  QA: 'Kiểm định chất lượng',
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Hoạt động', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    INACTIVE: { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' },
    SUSPENDED: { label: 'Tạm khóa', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  }

  const variant = variants[status] || { label: status, className: '' }

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

export interface UserColumnsProps {
  onView?: (user: UserResponse) => void
  onEdit?: (user: UserResponse) => void
  onStatusChange?: (user: UserResponse, newStatus: string) => void
}

export function createUserColumns({
  onView,
  onEdit,
  onStatusChange,
}: UserColumnsProps): ColumnDef<UserResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-mono text-sm">{row.original.id}</div>,
      size: 80,
      enableSorting: true,
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Họ tên
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user.fullName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        )
      },
      size: 220,
      enableSorting: true,
    },
    {
      accessorKey: 'phone',
      header: 'Số điện thoại',
      cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span>,
      size: 130,
    },
    {
      accessorKey: 'roles',
      header: 'Vai trò',
      cell: ({ row }) => {
        const roles = row.original.roles || []
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {ROLE_LABELS[role] || role}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        )
      },
      size: 200,
    },
    {
      accessorKey: 'branches',
      header: 'Chi nhánh',
      cell: ({ row }) => {
        const branches = row.original.branches || []
        return (
          <div className="flex flex-wrap gap-1">
            {branches.length > 0 ? (
              branches.map((branch, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {branch}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        )
      },
      size: 180,
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
      accessorKey: 'dob',
      header: 'Ngày sinh',
      cell: ({ row }) => {
        const dob = row.original.dob
        if (!dob) return <span className="text-muted-foreground">—</span>
        try {
          return format(parseISO(dob), 'dd/MM/yyyy', { locale: vi })
        } catch {
          return <span className="text-muted-foreground">—</span>
        }
      },
      size: 110,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(user)}>Xem chi tiết</DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(user)}>Chỉnh sửa</DropdownMenuItem>
              )}
              {onStatusChange && (
                <>
                  {user.status === 'ACTIVE' && (
                    <DropdownMenuItem onClick={() => onStatusChange(user, 'INACTIVE')}>
                      Vô hiệu hóa
                    </DropdownMenuItem>
                  )}
                  {user.status === 'INACTIVE' && (
                    <DropdownMenuItem onClick={() => onStatusChange(user, 'ACTIVE')}>
                      Kích hoạt
                    </DropdownMenuItem>
                  )}
                  {user.status !== 'SUSPENDED' && (
                    <DropdownMenuItem onClick={() => onStatusChange(user, 'SUSPENDED')}>
                      Tạm khóa
                    </DropdownMenuItem>
                  )}
                  {user.status === 'SUSPENDED' && (
                    <DropdownMenuItem onClick={() => onStatusChange(user, 'ACTIVE')}>
                      Mở khóa
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 80,
    },
  ]
}

