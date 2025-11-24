import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetClassesQuery, useGetClassByIdQuery, type ClassListItemDTO, type ClassListRequest } from '@/store/services/classApi'
import { useGetBranchesQuery } from '@/store/services/classCreationApi'
import { ApprovalDetailDrawer } from './components/ApprovalDetailDrawer'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type StatusFilter = ClassListRequest['status'] | 'all'
type ApprovalFilter = ClassListRequest['approvalStatus'] | 'all'

const PAGE_SIZE = 8

const approvalStatusLabel = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt'
    case 'APPROVED':
      return 'Đã duyệt'
    case 'REJECTED':
      return 'Bị trả về'
    default:
      return status || 'Không xác định'
  }
}

const approvalBadgeVariant = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'secondary'
    case 'APPROVED':
      return 'default'
    case 'REJECTED':
      return 'destructive'
    default:
      return 'outline'
  }
}

const classStatusLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Nháp'
    case 'SUBMITTED':
      return 'Đã gửi duyệt'
    case 'SCHEDULED':
      return 'Đã lên lịch'
    case 'ONGOING':
      return 'Đang diễn ra'
    case 'COMPLETED':
      return 'Hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
    default:
      return status || 'Không xác định'
  }
}

const DAY_ABBREVIATIONS: Record<string, string> = {
  MON: 'Thứ hai',
  TUE: 'Thứ ba',
  WED: 'Thứ tư',
  THU: 'Thứ năm',
  FRI: 'Thứ sáu',
  SAT: 'Thứ bảy',
  SUN: 'Chủ nhật',
}

const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
}

const formatDate = (value?: string) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'dd/MM/yyyy', { locale: vi })
  } catch {
    return value
  }
}

const formatScheduleLabel = (summary?: string) => {
  if (!summary) return 'Đang cập nhật'
  const parts = summary.split(',').map((part) => part.trim())
  if (parts.length === 0) return 'Đang cập nhật'
  const translated = parts.map((part) => {
    const key = part.slice(0, 3).toUpperCase()
    return DAY_ABBREVIATIONS[key] || part
  })
  return translated.join(', ')
}

const formatScheduleDaysFromNumbers = (days?: number[], fallback?: string) => {
  if (Array.isArray(days) && days.length > 0) {
    const normalized = Array.from(new Set(days))
      .map((day) => (typeof day === 'number' ? ((day % 7) + 7) % 7 : undefined))
      .filter((day): day is number => typeof day === 'number')
      .sort((a, b) => a - b)
    if (normalized.length > 0) {
      return normalized.map((day) => DAY_LABELS[day] ?? `Thứ ${day + 1}`).join(', ')
    }
  }
  return fallback || 'Đang cập nhật'
}

export default function CenterHeadApprovalsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('SUBMITTED')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('PENDING')
  const [page, setPage] = useState(0)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const queryArgs: ClassListRequest = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      approvalStatus: approvalFilter === 'all' ? undefined : approvalFilter,
      branchIds: branchFilter === 'all' ? undefined : [Number(branchFilter)],
      sort: 'submittedAt',
      sortDir: 'desc',
    }),
    [page, debouncedSearch, statusFilter, approvalFilter, branchFilter]
  )

  const { data: listResponse, isLoading, isFetching, refetch } = useGetClassesQuery(queryArgs)
  const { data: branchesResponse } = useGetBranchesQuery()

  const { data: pendingSummary } = useGetClassesQuery({
    page: 0,
    size: 1,
    status: 'SUBMITTED',
    approvalStatus: 'PENDING',
    sort: 'submittedAt',
    sortDir: 'desc',
  })
  const { data: approvedSummary } = useGetClassesQuery({
    page: 0,
    size: 1,
    status: 'SCHEDULED',
    approvalStatus: 'APPROVED',
    sort: 'decidedAt',
    sortDir: 'desc',
  })
  const { data: rejectedSummary } = useGetClassesQuery({
    page: 0,
    size: 1,
    status: 'DRAFT',
    approvalStatus: 'REJECTED',
    sort: 'decidedAt',
    sortDir: 'desc',
  })

  const classes = listResponse?.data?.content ?? []
  const pagination = listResponse?.data?.page

  const branchOptions = [
    { value: 'all', label: 'Tất cả chi nhánh' },
    ...(branchesResponse?.data?.map((branch) => ({ value: branch.id.toString(), label: branch.name })) ?? []),
  ]

  const metrics = [
    {
      label: 'Đang chờ duyệt',
      value: pendingSummary?.data?.page?.totalElements ?? 0,
      description: 'Lớp ở trạng thái nháp đã gửi duyệt',
    },
    {
      label: 'Đã duyệt',
      value: approvedSummary?.data?.page?.totalElements ?? 0,
      description: 'Lớp đã được chấp thuận',
    },
    {
      label: 'Bị trả về',
      value: rejectedSummary?.data?.page?.totalElements ?? 0,
      description: 'Cần Academic Affairs chỉnh sửa',
    },
  ]

  const handleChangeBranch = (value: string) => {
    setBranchFilter(value)
    setPage(0)
  }

  const handleChangeStatus = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(0)
  }

  const handleChangeApproval = (value: string) => {
    setApprovalFilter(value as ApprovalFilter)
    setPage(0)
  }

  const handleSearchSubmit = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleRefresh = () => {
    refetch()
  }

  return (
    <DashboardLayout title="Phê duyệt lớp học" description="Theo dõi và xử lý các lớp được gửi từ Academic Affairs">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Tìm theo mã lớp, khóa học..." value={search} onChange={(event) => handleSearchSubmit(event.target.value)} />
            <Select value={branchFilter} onValueChange={handleChangeBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleChangeStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={handleChangeApproval}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái duyệt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Bị trả về</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-muted/30">
            <CardContent className="py-16 text-center text-muted-foreground">
              Không tìm thấy lớp nào phù hợp với bộ lọc hiện tại.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((classItem) => (
              <ApprovalClassCard key={classItem.id} item={classItem} onOpenDetail={setSelectedClassId} />
            ))}
          </div>
        )}

        {classes.length > 0 && pagination && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
            <p>
              Trang {pagination.number + 1} / {pagination.totalPages || 1} · Tổng {pagination.totalElements} lớp
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0}>
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, (pagination.totalPages || 1) - 1))}
                disabled={page >= (pagination.totalPages || 1) - 1}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      <ApprovalDetailDrawer
        classId={selectedClassId}
        open={selectedClassId !== null}
        onClose={() => setSelectedClassId(null)}
        onActionComplete={() => {
          refetch()
        }}
      />
    </DashboardLayout>
  )
}

function ApprovalClassCard({ item, onOpenDetail }: { item: ClassListItemDTO; onOpenDetail: (id: number) => void }) {
  const { data: detailData } = useGetClassByIdQuery(item.id, {
    skip: !item.id,
  })
  const scheduleLabel = formatScheduleDaysFromNumbers(detailData?.data?.scheduleDays, formatScheduleLabel(item.scheduleSummary))

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Mã lớp</p>
            <p className="text-lg font-semibold">{item.code}</p>
            <p className="text-sm text-muted-foreground">{item.courseName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{classStatusLabel(item.status ?? undefined)}</Badge>
            <Badge variant={approvalBadgeVariant(item.approvalStatus ?? undefined)}>{approvalStatusLabel(item.approvalStatus ?? undefined)}</Badge>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Chi nhánh</p>
            <p className="font-medium">{item.branchName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Khởi tạo</p>
            <p className="font-medium">{formatDate(item.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ngày kết thúc dự kiến</p>
            <p className="font-medium">{formatDate(item.plannedEndDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lịch học</p>
            <p className="font-medium">{scheduleLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Đã đăng ký: {item.currentEnrolled}/{item.maxCapacity}</span>
          <span>•</span>
          <span>Còn trống: {item.availableSlots}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Gửi duyệt: {item.approvalStatus === 'PENDING' ? 'Đang xử lý' : 'Hoàn tất'}</div>
          <Button size="sm" variant="outline" onClick={() => onOpenDetail(item.id)}>
            Xem chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
