import { useState } from 'react'
import { useGetPendingRequestsQuery, useGetAcademicRequestsQuery, useGetAAStaffQuery } from '@/store/services/studentRequestApi'
import type { RequestStatus } from '@/store/services/studentRequestApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { PlusCircleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from './components/DataTable'
import { pendingColumns, historyColumns } from './components/columns'
import { RequestDetailDialog } from './components/RequestDetailDialog'
import AAAbsenceFlow from '@/components/requests/flows/AAAbsenceFlow'
import AAMakeupFlow from '@/components/requests/flows/AAMakeupFlow'
import AATransferFlow from '@/components/requests/flows/AATransferFlow'

type RequestType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER' | 'ALL'

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: 'ALL', label: 'Tất cả yêu cầu' },
  { value: 'ABSENCE', label: 'Xin nghỉ' },
  { value: 'MAKEUP', label: 'Học bù' },
  { value: 'TRANSFER', label: 'Chuyển lớp' },
]

const STATUS_OPTIONS: { value: RequestStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Đã từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const PAGE_SIZE = 20

export default function AcademicRequestsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

  // Pending tab filter states
  const [requestTypeFilter, setRequestTypeFilter] = useState<RequestType>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [classCode, setClassCode] = useState('')

  // Pending tab pagination
  const [page, setPage] = useState(0)

  // History tab filter states
  const [historyRequestType, setHistoryRequestType] = useState<RequestType>('ALL')
  const [historyStatus, setHistoryStatus] = useState<RequestStatus | 'ALL'>('ALL')
  const [historySearchKeyword, setHistorySearchKeyword] = useState('')
  const [historyClassCode, setHistoryClassCode] = useState('')
  const [historyDecidedBy, setHistoryDecidedBy] = useState<number | undefined>(undefined)

  // History tab pagination
  const [historyPage, setHistoryPage] = useState(0)

  // Dialog states
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [showOnBehalfDialog, setShowOnBehalfDialog] = useState(false)
  const [activeRequestType, setActiveRequestType] = useState<'ABSENCE' | 'MAKEUP' | 'TRANSFER' | null>(null)

  // Fetch pending requests
  const {
    data: pendingResponse,
    isFetching: isLoadingPending,
  } = useGetPendingRequestsQuery({
    requestType: requestTypeFilter === 'ALL' ? undefined : requestTypeFilter,
    studentName: searchKeyword || undefined,
    classCode: classCode || undefined,
    page,
    size: PAGE_SIZE,
    sort: 'submittedAt,asc', // Oldest first (most urgent)
  })

  // Fetch history requests
  const {
    data: historyResponse,
    isFetching: isLoadingHistory,
  } = useGetAcademicRequestsQuery({
    requestType: historyRequestType === 'ALL' ? undefined : historyRequestType,
    status: historyStatus === 'ALL' ? undefined : historyStatus,
    studentName: historySearchKeyword || undefined,
    classCode: historyClassCode || undefined,
    decidedBy: historyDecidedBy,
    page: historyPage,
    size: PAGE_SIZE,
    sort: 'submittedAt,desc', // Newest first for history
  })

  // Fetch AA staff for filter
  const {
    data: aaStaffResponse,
  } = useGetAAStaffQuery()

  const pendingData = pendingResponse?.data
  const requests = pendingData?.content ?? []
  const summary = pendingData?.summary
  const totalPages = pendingData?.totalPages ?? 0

  const historyData = historyResponse?.data
  const historyRequests = historyData?.content ?? []
  const historyTotalPages = historyData?.page?.totalPages ?? 0

  const handleViewDetail = (id: number) => {
    setSelectedRequestId(id)
  }

  const handleClearFilters = () => {
    setRequestTypeFilter('ALL')
    setSearchKeyword('')
    setClassCode('')
    setPage(0)
  }

  const handleClearHistoryFilters = () => {
    setHistoryRequestType('ALL')
    setHistoryStatus('ALL')
    setHistorySearchKeyword('')
    setHistoryClassCode('')
    setHistoryDecidedBy(undefined)
    setHistoryPage(0)
  }

  const hasActiveFilters = requestTypeFilter !== 'ALL' || searchKeyword !== '' || classCode !== ''
  const hasActiveHistoryFilters = historyRequestType !== 'ALL' || historyStatus !== 'ALL' || historySearchKeyword !== '' || historyClassCode !== '' || historyDecidedBy !== undefined

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

        {/* Tabs with filters on same line */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'history')}>
          {/* Tab Headers with Filters */}
          <div className="space-y-3">
            {/* First row: Tabs + Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList>
                <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
                <TabsTrigger value="history">Lịch sử</TabsTrigger>
              </TabsList>

              {/* Filters that apply to current tab */}
              {activeTab === 'pending' ? (
                <>
                  <Select
                    value={requestTypeFilter}
                    onValueChange={(value) => {
                      setRequestTypeFilter(value as RequestType)
                      setPage(0)
                    }}
                  >
                    <SelectTrigger className="flex-1 min-w-40">
                      <SelectValue placeholder="Tất cả yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Tìm kiếm học viên..."
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value)
                      setPage(0)
                    }}
                    className="flex-1 min-w-40"
                  />

                  <Input
                    placeholder="Mã lớp..."
                    value={classCode}
                    onChange={(e) => {
                      setClassCode(e.target.value)
                      setPage(0)
                    }}
                    className="flex-1 min-w-32"
                  />

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Select
                    value={historyRequestType}
                    onValueChange={(value) => {
                      setHistoryRequestType(value as RequestType)
                      setHistoryPage(0)
                    }}
                  >
                    <SelectTrigger className="flex-1 min-w-40">
                      <SelectValue placeholder="Tất cả yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={historyStatus}
                    onValueChange={(value) => {
                      setHistoryStatus(value as RequestStatus | 'ALL')
                      setHistoryPage(0)
                    }}
                  >
                    <SelectTrigger className="flex-1 min-w-40">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={historyDecidedBy?.toString() || 'all'}
                    onValueChange={(value) => {
                      setHistoryDecidedBy(value === 'all' ? undefined : parseInt(value))
                      setHistoryPage(0)
                    }}
                  >
                    <SelectTrigger className="flex-1 min-w-40">
                      <SelectValue placeholder="Người duyệt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả người duyệt</SelectItem>
                      {aaStaffResponse?.data?.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Tìm kiếm học viên..."
                    value={historySearchKeyword}
                    onChange={(e) => {
                      setHistorySearchKeyword(e.target.value)
                      setHistoryPage(0)
                    }}
                    className="flex-1 min-w-40"
                  />

                  <Input
                    placeholder="Mã lớp..."
                    value={historyClassCode}
                    onChange={(e) => {
                      setHistoryClassCode(e.target.value)
                      setHistoryPage(0)
                    }}
                    className="flex-1 min-w-32"
                  />

                  {hasActiveHistoryFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearHistoryFilters} className="gap-2">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4 mt-4">

            {/* Data Table */}
            <div className="space-y-4">
              {isLoadingPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <DataTable columns={pendingColumns} data={requests} onViewDetail={handleViewDetail} />
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Trang {page + 1} / {totalPages} · {pendingData?.totalElements ?? 0} yêu cầu
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage((prev) => Math.max(prev - 1, 0))
                        }}
                        disabled={page === 0 || isLoadingPending}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(pageNum)
                          }}
                          isActive={pageNum === page}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage((prev) => Math.min(prev + 1, totalPages - 1))
                        }}
                        disabled={page + 1 >= totalPages || isLoadingPending}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* History Data Table */}
            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <DataTable columns={historyColumns} data={historyRequests} onViewDetail={handleViewDetail} />
              )}

              {/* History Pagination */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Trang {historyPage + 1} / {historyTotalPages} · {historyData?.page?.totalElements ?? 0} yêu cầu
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setHistoryPage((prev) => Math.max(prev - 1, 0))
                        }}
                        disabled={historyPage === 0 || isLoadingHistory}
                      />
                    </PaginationItem>
                    {Array.from({ length: historyTotalPages }, (_, i) => i).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setHistoryPage(pageNum)
                          }}
                          isActive={pageNum === historyPage}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages - 1))
                        }}
                        disabled={historyPage + 1 >= historyTotalPages || isLoadingHistory}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
