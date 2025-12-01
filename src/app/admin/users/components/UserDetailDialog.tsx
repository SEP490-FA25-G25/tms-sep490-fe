import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useGetUserByIdQuery, type UserResponse } from '@/store/services/userApi'
import { useEffect } from 'react'

interface UserDetailDialogProps {
  user: UserResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  // Fetch fresh user data when dialog opens
  const {
    data: userResponse,
    isLoading,
    refetch,
  } = useGetUserByIdQuery(user?.id ?? 0, {
    skip: !user?.id || !open, // Skip if no user ID or dialog is closed
  })

  // Refetch when dialog opens or user changes
  useEffect(() => {
    if (open && user?.id) {
      refetch()
    }
  }, [open, user?.id, refetch])

  // Use fetched data if available, otherwise fallback to prop
  const displayUser = userResponse?.data ?? user

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pb-0 pt-6">
          <DialogTitle className="text-xl font-semibold">
            {displayUser ? displayUser.fullName : 'Chi tiết người dùng'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !displayUser ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu người dùng.</p>
          ) : (
            <div className="space-y-5 text-sm">
              {/* Avatar Section */}
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayUser.avatarUrl || ""} alt={displayUser.fullName} />
                  <AvatarFallback className="text-2xl">
                    {displayUser.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                <InfoItem label="Email" value={displayUser.email} />
                <InfoItem label="Số điện thoại" value={displayUser.phone || '—'} />
                <InfoItem label="Giới tính" value={mapGender(displayUser.gender)} />
                <InfoItem
                  label="Ngày sinh"
                  value={displayUser.dob ? format(parseISO(displayUser.dob), 'dd/MM/yyyy', { locale: vi }) : '—'}
                />
                <InfoItem label="Trạng thái" value={renderStatus(displayUser.status)} raw />
                <InfoItem label="Địa chỉ" value={displayUser.address || '—'} />
                <InfoItem label="Facebook" value={displayUser.facebookUrl || '—'} />
              </section>

              <section className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Vai trò</p>
                {displayUser.roles?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {displayUser.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {ROLE_LABELS[role] || role}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">Chưa được gán vai trò</p>
                )}
              </section>

              <section className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Chi nhánh</p>
                {displayUser.branches?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {displayUser.branches.map((branch, index) => (
                      <Badge key={`${branch}-${index}`} variant="outline">
                        {branch}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">Chưa được phân chi nhánh</p>
                )}
              </section>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ label, value, raw }: { label: string; value: React.ReactNode; raw?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      {raw ? (
        value
      ) : (
        <p className="text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  )
}

function renderStatus(status?: string) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>
  const variants: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    INACTIVE: 'bg-slate-100 text-slate-700',
    SUSPENDED: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${variants[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status === 'ACTIVE' ? 'Hoạt động' : status === 'INACTIVE' ? 'Không hoạt động' : 'Tạm khóa'}
    </span>
  )
}

function mapGender(gender?: string) {
  switch (gender) {
    case 'MALE':
      return 'Nam'
    case 'FEMALE':
      return 'Nữ'
    case 'OTHER':
      return 'Khác'
    default:
      return '—'
  }
}

