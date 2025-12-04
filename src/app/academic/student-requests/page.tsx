import { useState } from 'react'
import { useGetPendingRequestsQuery, useGetAcademicRequestsQuery, useGetAAStaffQuery } from '@/store/services/studentRequestApi'
import type { RequestStatus } from '@/store/services/studentRequestApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
} from '@/components/ui/full-screen-modal'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  PlusCircleIcon,
  RotateCcwIcon,
  ClockIcon,
  CalendarX2Icon,
  CalendarCheck2Icon,
  ArrowRightLeftIcon,
  SearchIcon
} from 'lucide-react'
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
  const [keyword, setKeyword] = useState('')

  // Pending tab pagination
  const [page, setPage] = useState(0)

  // History tab filter states
  const [historyRequestType, setHistoryRequestType] = useState<RequestType>('ALL')
  const [historyStatus, setHistoryStatus] = useState<RequestStatus | 'ALL'>('ALL')
  const [historyKeyword, setHistoryKeyword] = useState('')
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
    keyword: keyword || undefined,
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
    keyword: historyKeyword || undefined,
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
    setKeyword('')
    setPage(0)
  }

  const handleClearHistoryFilters = () => {
    setHistoryRequestType('ALL')
    setHistoryStatus('ALL')
    setHistoryKeyword('')
    setHistoryDecidedBy(undefined)
    setHistoryPage(0)
  }

  const hasActiveFilters = requestTypeFilter !== 'ALL' || keyword !== ''
  const hasActiveHistoryFilters = historyRequestType !== 'ALL' || historyStatus !== 'ALL' || historyKeyword !== '' || historyDecidedBy !== undefined

  return (
    <DashboardLayout
      title="Quản lý yêu cầu học viên"
      description="Xem xét và phê duyệt các yêu cầu xin nghỉ, học bù, chuyển lớp"
      actions={
        <Button variant="outline" className="gap-2" onClick={() => setShowOnBehalfDialog(true)}>
          <PlusCircleIcon className="h-4 w-4" />
          Tạo thay học viên
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalPending}</div>
                <p className="text-xs text-muted-foreground">Tổng yêu cầu chờ xử lý</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Xin nghỉ</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                  <CalendarX2Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.absenceRequests}</div>
                <p className="text-xs text-muted-foreground">Yêu cầu xin nghỉ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Học bù</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <CalendarCheck2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.makeupRequests}</div>
                <p className="text-xs text-muted-foreground">Yêu cầu học bù</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chuyển lớp</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                  <ArrowRightLeftIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.transferRequests}</div>
                <p className="text-xs text-muted-foreground">Yêu cầu chuyển lớp</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs with filters on same line */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'history')}>
          {/* Tab Headers with Filters - all on same row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs first */}
            <TabsList className="h-9">
              <TabsTrigger value="pending" className="h-7">Chờ duyệt</TabsTrigger>
              <TabsTrigger value="history" className="h-7">Lịch sử</TabsTrigger>
            </TabsList>

            {/* Search - bên trái */}
            {activeTab === 'pending' ? (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm học viên, mã học viên, mã lớp..."
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value)
                      setPage(0)
                    }}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Filters - bên phải */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={requestTypeFilter}
                    onValueChange={(value) => {
                      setRequestTypeFilter(value as RequestType)
                      setPage(0)
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[130px]">
                      <SelectValue placeholder="Loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                    title="Xóa bộ lọc"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm học viên, mã học viên, mã lớp..."
                    value={historyKeyword}
                    onChange={(e) => {
                      setHistoryKeyword(e.target.value)
                      setHistoryPage(0)
                    }}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Filters - bên phải */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={historyRequestType}
                    onValueChange={(value) => {
                      setHistoryRequestType(value as RequestType)
                      setHistoryPage(0)
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[130px]">
                      <SelectValue placeholder="Loại yêu cầu" />
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
                    <SelectTrigger className="h-9 w-auto min-w-[130px]">
                      <SelectValue placeholder="Trạng thái" />
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
                    <SelectTrigger className="h-9 w-auto min-w-[140px]">
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

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleClearHistoryFilters}
                    disabled={!hasActiveHistoryFilters}
                    title="Xóa bộ lọc"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4 mt-4">

            {/* Data Table */}
            <div className="space-y-4">
              <DataTable columns={pendingColumns} data={requests} onViewDetail={handleViewDetail} isLoading={isLoadingPending} />

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
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
                    {/* Show page numbers only on larger screens */}
                    <span className="hidden sm:contents">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Show first 5 pages or pages around current page
                        let pageNum = i;
                        if (totalPages > 5 && page > 2) {
                          pageNum = Math.min(page - 2 + i, totalPages - 1);
                        }
                        return (
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
                        );
                      })}
                    </span>
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
              <DataTable columns={historyColumns} data={historyRequests} onViewDetail={handleViewDetail} isLoading={isLoadingHistory} />

              {/* History Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
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
                    {/* Show page numbers only on larger screens */}
                    <span className="hidden sm:contents">
                      {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                        let pageNum = i;
                        if (historyTotalPages > 5 && historyPage > 2) {
                          pageNum = Math.min(historyPage - 2 + i, historyTotalPages - 1);
                        }
                        return (
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
                        );
                      })}
                    </span>
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
      <FullScreenModal open={showOnBehalfDialog} onOpenChange={setShowOnBehalfDialog}>
        <FullScreenModalContent size="2xl">
          <FullScreenModalHeader>
            <FullScreenModalTitle>Tạo yêu cầu cho học viên</FullScreenModalTitle>
            <FullScreenModalDescription>
              Xử lý yêu cầu từ học viên qua điện thoại, tin nhắn hoặc trực tiếp. Hệ thống sẽ tự động duyệt.
            </FullScreenModalDescription>
          </FullScreenModalHeader>
          <FullScreenModalBody>

          {activeRequestType === null ? (
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  type: 'ABSENCE' as const,
                  icon: <CalendarX2Icon className="h-6 w-6" />,
                  title: 'Báo nghỉ học viên',
                  description: 'Ghi nhận lý do vắng mặt',
                  bullets: ['Buổi chưa diễn ra', 'Tự động duyệt', 'Ghi chú nội bộ'],
                },
                {
                  type: 'MAKEUP' as const,
                  icon: <CalendarCheck2Icon className="h-6 w-6" />,
                  title: 'Xếp lịch học bù',
                  description: 'Chọn buổi bù cho học viên',
                  bullets: ['Buổi vắng trong 4 tuần', 'Gợi ý thông minh', 'Tự động duyệt'],
                },
                {
                  type: 'TRANSFER' as const,
                  icon: <ArrowRightLeftIcon className="h-6 w-6" />,
                  title: 'Đổi lớp học viên',
                  description: 'Chuyển sang lớp khác',
                  bullets: ['Cùng khóa học', 'Đổi lịch/chi nhánh', 'Tự động duyệt'],
                },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveRequestType(item.type)}
                  className="group flex min-h-[180px] flex-col rounded-xl border border-border/60 p-5 text-left transition hover:border-primary hover:bg-primary/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                  <ul className="mt-auto pt-4 space-y-1.5 text-xs text-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
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
                  <p className="text-xs text-muted-foreground">Đang thực hiện</p>
                  <h3 className="text-base font-semibold">
                    {activeRequestType === 'ABSENCE' && 'Báo nghỉ học viên'}
                    {activeRequestType === 'MAKEUP' && 'Xếp lịch học bù'}
                    {activeRequestType === 'TRANSFER' && 'Đổi lớp học viên'}
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
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>
    </DashboardLayout>
  )
}
