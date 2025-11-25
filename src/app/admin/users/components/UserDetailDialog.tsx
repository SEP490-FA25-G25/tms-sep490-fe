import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { UserResponse } from '@/store/services/userApi'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pb-0 pt-6">
          <DialogTitle className="text-xl font-semibold">
            {user ? user.fullName : 'Chi tiết người dùng'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          {!user ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu người dùng.</p>
          ) : (
            <div className="space-y-5 text-sm">
              <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                <InfoItem label="Email" value={user.email} />
                <InfoItem label="Số điện thoại" value={user.phone || '—'} />
                <InfoItem label="Giới tính" value={mapGender(user.gender)} />
                <InfoItem
                  label="Ngày sinh"
                  value={user.dob ? format(parseISO(user.dob), 'dd/MM/yyyy', { locale: vi }) : '—'}
                />
                <InfoItem label="Trạng thái" value={renderStatus(user.status)} raw />
                <InfoItem label="Địa chỉ" value={user.address || '—'} />
                <InfoItem label="Facebook" value={user.facebookUrl || '—'} />
              </section>

              <section className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Vai trò</p>
                {user.roles?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.roles.map((role) => (
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
                {user.branches?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.branches.map((branch, index) => (
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
    INACTIVE: 'bg-gray-100 text-gray-700',
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

