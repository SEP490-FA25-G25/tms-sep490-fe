import { useState } from 'react'
import { useGetPendingRequestsQuery } from '@/store/services/studentRequestApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlusCircleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from './components/DataTable'
import { columns } from './components/columns'
import { RequestDetailDialog } from './components/RequestDetailDialog'
import AAAbsenceFlow from '@/components/requests/flows/AAAbsenceFlow'
import AAMakeupFlow from '@/components/requests/flows/AAMakeupFlow'
import AATransferFlow from '@/components/requests/flows/AATransferFlow'

type RequestType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER' | 'ALL'

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: 'ABSENCE', label: 'Xin nghỉ' },
  { value: 'MAKEUP', label: 'Học bù' },
  { value: 'TRANSFER', label: 'Chuyển lớp' },
]

const PAGE_SIZE = 20

export default function AcademicRequestsPage() {
  // Filter states
  const [requestTypeFilter, setRequestTypeFilter] = useState<RequestType>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [classCode, setClassCode] = useState('')

  // Pagination
  const [page, setPage] = useState(0)

  // Dialog states
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [showOnBehalfDialog, setShowOnBehalfDialog] = useState(false)
  const [activeRequestType, setActiveRequestType] = useState<'ABSENCE' | 'MAKEUP' | 'TRANSFER' | null>(null)

  // Fetch pending requests
  const {
    data: pendingResponse,
    isFetching: isLoading,
  } = useGetPendingRequestsQuery({
    requestType: requestTypeFilter === 'ALL' ? undefined : requestTypeFilter,
    studentName: searchKeyword || undefined,
    classCode: classCode || undefined,
    page,
    size: PAGE_SIZE,
    sort: 'submittedAt,asc', // Oldest first (most urgent)
  })

  const pendingData = pendingResponse?.data
  const requests = pendingData?.content ?? []
  const summary = pendingData?.summary
  const totalPages = pendingData?.totalPages ?? 0

  const handleViewDetail = (id: number) => {
    setSelectedRequestId(id)
  }

  const handleClearFilters = () => {
    setRequestTypeFilter('ALL')
    setSearchKeyword('')
    setClassCode('')
    setPage(0)
  }

  const hasActiveFilters = requestTypeFilter !== 'ALL' || searchKeyword !== '' || classCode !== ''

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý yêu cầu học viên</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Xem xét và phê duyệt các yêu cầu xin nghỉ, học bù, chuyển lớp
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setShowOnBehalfDialog(true)}>
            <PlusCircleIcon className="h-4 w-4" />
            Tạo thay học viên
          </Button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Chờ duyệt</p>
              <p className="text-2xl font-bold mt-1">{summary.totalPending}</p>
            </div>
            <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400">Khẩn cấp</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {summary.needsUrgentReview}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Xin nghỉ</p>
              <p className="text-2xl font-bold mt-1">{summary.absenceRequests}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Học bù</p>
              <p className="text-2xl font-bold mt-1">{summary.makeupRequests}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Chuyển lớp</p>
              <p className="text-2xl font-bold mt-1">{summary.transferRequests}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          {hasActiveFilters && (
            <div className="flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                <XIcon className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Loại yêu cầu</label>
              <Select
                value={requestTypeFilter}
                onValueChange={(value) => {
                  setRequestTypeFilter(value as RequestType)
                  setPage(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Tìm kiếm học viên
              </label>
              <Input
                placeholder="Tên hoặc mã học viên..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setPage(0)
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Mã lớp</label>
              <Input
                placeholder="Nhập mã lớp..."
                value={classCode}
                onChange={(e) => {
                  setClassCode(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <DataTable columns={columns} data={requests} onViewDetail={handleViewDetail} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Trang {page + 1} / {totalPages} · {pendingData?.totalElements ?? 0} yêu cầu
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= totalPages || isLoading}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Detail Dialog */}
      <RequestDetailDialog
        requestId={selectedRequestId}
        open={selectedRequestId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRequestId(null)
        }}
      />

      {/* On-Behalf Creation Dialog */}
      <Dialog open={showOnBehalfDialog} onOpenChange={setShowOnBehalfDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu thay học viên</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Hệ thống sẽ tự động phê duyệt ngay sau khi chọn thông tin phù hợp.
            </p>
          </DialogHeader>

          {activeRequestType === null ? (
            <div className="space-y-3">
              {[
                {
                  type: 'ABSENCE' as const,
                  title: 'Xin nghỉ thay học viên',
                  description: 'Tạo đơn xin nghỉ cho học viên với lý do cụ thể.',
                  bullets: ['Chỉ cho buổi chưa diễn ra', 'AA có quyền duyệt trực tiếp', 'Ghi chú cho phụ huynh'],
                },
                {
                  type: 'MAKEUP' as const,
                  title: 'Xin học bù thay học viên',
                  description: 'Gợi ý buổi học bù phù hợp theo lịch và chuyên môn.',
                  bullets: ['Hiển thị buổi đã vắng', 'Ưu tiên gợi ý thông minh', 'Tự động duyệt ngay'],
                },
                {
                  type: 'TRANSFER' as const,
                  title: 'Chuyển lớp thay học viên',
                  description: 'Phân tích nội dung và chuyển lớp với quy trình nhất quán.',
                  bullets: ['Kiểm tra điều kiện chuyển', 'Phân tích nội dung bị thiếu', 'AA duyệt ngay lập tức'],
                },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveRequestType(item.type)}
                  className="w-full rounded-lg border border-border/60 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.type === 'ABSENCE' && 'Xin nghỉ'}
                        {item.type === 'MAKEUP' && 'Học bù'}
                        {item.type === 'TRANSFER' && 'Chuyển lớp'}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-1">
                        <span className="text-primary">→</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Loại yêu cầu</p>
                  <h3 className="text-base font-semibold">
                    {activeRequestType === 'ABSENCE' && 'Xin nghỉ'}
                    {activeRequestType === 'MAKEUP' && 'Học bù'}
                    {activeRequestType === 'TRANSFER' && 'Chuyển lớp'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveRequestType(null)}
                >
                  Chọn loại khác
                </Button>
              </div>

              {activeRequestType === 'ABSENCE' && (
                <AAAbsenceFlow
                  onSuccess={() => {
                    setActiveRequestType(null)
                    setShowOnBehalfDialog(false)
                    toast.success('Đã tạo yêu cầu xin nghỉ thay học viên')
                  }}
                />
              )}

              {activeRequestType === 'MAKEUP' && (
                <AAMakeupFlow
                  onSuccess={() => {
                    setActiveRequestType(null)
                    setShowOnBehalfDialog(false)
                    toast.success('Đã tạo yêu cầu học bù thành công')
                  }}
                />
              )}

              {activeRequestType === 'TRANSFER' && (
                <AATransferFlow
                  onSuccess={() => {
                    setActiveRequestType(null)
                    setShowOnBehalfDialog(false)
                    toast.success('Đã tạo yêu cầu chuyển lớp thành công')
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
