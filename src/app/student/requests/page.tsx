
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ArrowRightLeftIcon,
  CalendarCheck2Icon,
  CalendarX2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  NotebookPenIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
} from '@/components/ui/full-screen-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import UnifiedRequestFlow from '@/components/requests/UnifiedRequestFlow'
import {
  useGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useCancelRequestMutation,
  type StudentRequest,
  type RequestStatus,
  type RequestType,
} from '@/store/services/studentRequestApi'
import { REQUEST_STATUS_META } from '@/utils/requestStatusMeta'
import { DataTable } from './components/DataTable'
import { columns } from './components/columns'
import { RequestDetailDialog } from './components/RequestDetailDialog'
const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ABSENCE: 'Xin nghỉ',
  MAKEUP: 'Học bù',
  TRANSFER: 'Chuyển lớp',
}

const STATUS_FILTERS: Array<{ label: string; value: 'ALL' | RequestStatus }> = [
  { label: 'Tất cả trạng thái', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Đã từ chối', value: 'REJECTED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const TYPE_FILTERS: Array<{ label: string; value: 'ALL' | RequestType }> = [
  { label: 'Tất cả loại yêu cầu', value: 'ALL' },
  { label: 'Xin nghỉ', value: 'ABSENCE' },
  { label: 'Học bù', value: 'MAKEUP' },
  { label: 'Chuyển lớp', value: 'TRANSFER' },
]

const REQUEST_PAGE_SIZE = 8

type TypeFilter = 'ALL' | RequestType
type StatusFilter = 'ALL' | RequestStatus
export default function StudentRequestsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [activeType, setActiveType] = useState<RequestType | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [successRequest, setSuccessRequest] = useState<StudentRequest | null>(null)
  const [cancelConfirmRequest, setCancelConfirmRequest] = useState<StudentRequest | null>(null)

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPage(0) // Reset to first page when search changes
    }, 500) // 500ms debounce delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  const hasActiveFilters = typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery !== ''

  const resetFilters = () => {
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setSearchQuery('')
    setPage(0)
  }

  const {
    data: requestsResponse,
    isFetching: isLoadingRequests,
    refetch: refetchRequests,
  } = useGetMyRequestsQuery({
    requestType: typeFilter === 'ALL' ? undefined : typeFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: debouncedSearchQuery || undefined,
    page,
    size: REQUEST_PAGE_SIZE,
    sort: 'submittedAt,desc',
  })

  const requests = requestsResponse?.data?.content ?? []
  const summary = requestsResponse?.data?.summary
  const pagination = requestsResponse?.data?.page

  const { data: detailResponse, isFetching: isLoadingDetail } = useGetMyRequestByIdQuery(detailId ?? 0, {
    skip: detailId === null,
  })

  const [cancelRequest, { isLoading: isCancelling }] = useCancelRequestMutation()

  const handleCancelConfirm = async () => {
    if (!cancelConfirmRequest || cancelConfirmRequest.status !== 'PENDING') return
    setCancelingId(cancelConfirmRequest.id)
    try {
      await cancelRequest(cancelConfirmRequest.id).unwrap()
      toast.success('Đã hủy yêu cầu')
      refetchRequests()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể hủy yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setCancelingId(null)
      setCancelConfirmRequest(null)
    }
  }

  const handleModalClose = () => {
    setActiveType(null)
  }

  return (
    <StudentRoute>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="overflow-hidden">
          <SiteHeader />
          <main className="flex flex-1 flex-col overflow-hidden min-w-0">
            <header className="flex flex-col gap-4 border-b border-border px-4 sm:px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yêu cầu của tôi</h1>
                  <p className="text-sm text-muted-foreground">
                    Quản lý yêu cầu xin nghỉ, học bù, chuyển lớp
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <PlusIcon className="h-4 w-4" />
                      Tạo yêu cầu
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setActiveType('ABSENCE')}>
                      <CalendarX2Icon className="h-4 w-4 mr-2" />
                      Xin nghỉ buổi học
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveType('MAKEUP')}>
                      <CalendarCheck2Icon className="h-4 w-4 mr-2" />
                      Xin học bù
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveType('TRANSFER')}>
                      <ArrowRightLeftIcon className="h-4 w-4 mr-2" />
                      Chuyển lớp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 px-4 sm:px-6 py-6 overflow-auto min-w-0">

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng số yêu cầu</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50">
                    <NotebookPenIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalRequests ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Tất cả yêu cầu đã gửi</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.pending ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Chờ phê duyệt</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.approved ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Được chấp thuận</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                    <XCircleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.rejected ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Không được duyệt</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Input */}
              <div className="w-full lg:max-w-sm">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo lý do, mã lớp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={typeFilter}
                  onValueChange={(value: TypeFilter) => {
                    setTypeFilter(value)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value: StatusFilter) => {
                    setStatusFilter(value)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
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
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  title="Xóa bộ lọc"
                >
                  <RotateCcwIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Request Table */}
            <div className="space-y-4">
              {requests.length === 0 && !isLoadingRequests ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <NotebookPenIcon className="h-10 w-10" />
                    </EmptyMedia>
                    <EmptyTitle>Chưa có yêu cầu nào</EmptyTitle>
                    <EmptyDescription>
                      Tạo yêu cầu mới để xin nghỉ, học bù hoặc chuyển lớp.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <DataTable
                  columns={columns}
                  data={requests}
                  onViewDetail={(id) => setDetailId(id)}
                  onCancelRequest={(id) => {
                    const request = requests.find(r => r.id === id)
                    if (request) setCancelConfirmRequest(request)
                  }}
                  isCancelling={isCancelling}
                  cancelingId={cancelingId}
                  isLoading={isLoadingRequests}
                />
              )}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Trang {pagination.number + 1} / {pagination.totalPages}
                </span>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage((prev) => Math.max(prev - 1, 0))
                        }}
                        disabled={pagination.number === 0}
                      />
                    </PaginationItem>
                    {/* Show page numbers only on sm+ screens, limit to 5 pages */}
                    <span className="hidden sm:contents">
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        let pageNum = i;
                        if (pagination.totalPages > 5 && pagination.number > 2) {
                          pageNum = Math.min(pagination.number - 2 + i, pagination.totalPages - 1);
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(pageNum)
                              }}
                              isActive={pageNum === pagination.number}
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
                          setPage((prev) => Math.min(prev + 1, pagination.totalPages - 1))
                        }}
                        disabled={pagination.number + 1 >= pagination.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      {/* Request Flow Modal */}
      <FullScreenModal open={activeType !== null} onOpenChange={(open) => !open && handleModalClose()}>
        <FullScreenModalContent size="lg">
          <FullScreenModalHeader>
            <FullScreenModalTitle>
              {activeType && REQUEST_TYPE_LABELS[activeType]}
            </FullScreenModalTitle>
          </FullScreenModalHeader>
          <FullScreenModalBody>
            {activeType && (
              <UnifiedRequestFlow
                type={activeType}
                onSuccess={() => {
                  handleModalClose()
                  refetchRequests()
                }}
              />
            )}
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>

      <RequestDetailDialog
        requestId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        isLoading={isLoadingDetail}
        request={detailResponse?.data}
      />

  
      <Dialog
        open={!!successRequest}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessRequest(null)
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Đã gửi yêu cầu xin nghỉ</DialogTitle>
          </DialogHeader>
          {successRequest && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Mã yêu cầu <span className="font-semibold text-foreground">#{successRequest.id}</span> • Trạng thái:{' '}
                <span className="font-semibold text-foreground">Đang chờ duyệt</span>
              </p>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm font-semibold">
                  {successRequest.currentClass.code} → Buổi {successRequest.targetSession.courseSessionNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(successRequest.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} •{' '}
                  {successRequest.targetSession.timeSlot.startTime} - {successRequest.targetSession.timeSlot.endTime}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setSuccessRequest(null)}>Xem danh sách yêu cầu</Button>
                <Button
                  variant="ghost"
                  onClick={() => setSuccessRequest(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!cancelConfirmRequest}
        onOpenChange={(open) => {
          if (!open) setCancelConfirmRequest(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy yêu cầu #{cancelConfirmRequest?.id}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentRoute>
  )
}
export function RequestDetail({ request }: { request: StudentRequest }) {
  const submittedLabel = request.submittedAt
    ? format(parseISO(request.submittedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : null
  const decidedLabel = request.decidedAt
    ? format(parseISO(request.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : null

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loại yêu cầu</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{REQUEST_TYPE_LABELS[request.requestType]}</Badge>
          <Badge className={cn(REQUEST_STATUS_META[request.status].badgeClass)}>
            {REQUEST_STATUS_META[request.status].label}
          </Badge>
        </div>
      </div>

      <Separator />

      {request.requestType !== 'MAKEUP' && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lớp hiện tại</p>
            <p className="mt-1 font-semibold">{request.currentClass.code}</p>
            {request.currentClass.branch?.name && (
              <p className="text-xs text-muted-foreground">Chi nhánh: {request.currentClass.branch.name}</p>
            )}
          </div>

          <Separator />
        </>
      )}

      {request.requestType === 'MAKEUP' ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buổi đã vắng ({request.currentClass.code})</p>
          <p className="mt-1 font-medium">
            {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-sm text-muted-foreground">
            Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buổi học</p>
          <p className="mt-1 font-medium">
            {request.currentClass.code} · {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-sm text-muted-foreground">
            Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
          </p>
        </div>
      )}

      {request.makeupSession && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buổi học bù</p>
            <p className="mt-1 font-medium">
              {request.makeupSession.classInfo?.classCode
                ? `${request.makeupSession.classInfo.classCode} · ${format(
                    parseISO(request.makeupSession.date),
                    'EEEE, dd/MM/yyyy',
                    { locale: vi }
                  )}`
                : format(parseISO(request.makeupSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.makeupSession.courseSessionNumber}: {request.makeupSession.courseSessionTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.makeupSession.timeSlot.startTime} - {request.makeupSession.timeSlot.endTime}
            </p>
            {request.makeupSession.classInfo?.branchName && (
              <p className="text-xs text-muted-foreground">
                Chi nhánh: {request.makeupSession.classInfo.branchName}
              </p>
            )}
          </div>
        </>
      )}

      <Separator />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do</p>
        <p className="mt-1 text-sm text-muted-foreground">{request.requestReason}</p>
      </div>

      {request.note && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú</p>
            <p className="mt-1 text-sm text-muted-foreground">{request.note}</p>
          </div>
        </>
      )}

      {request.rejectionReason && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do từ chối</p>
            <p className="mt-1 text-sm text-muted-foreground">{request.rejectionReason}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-2 text-sm text-muted-foreground">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thời gian gửi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {submittedLabel ? submittedLabel : 'Đang cập nhật'}{' '}
            {request.submittedBy?.fullName ? `• ${request.submittedBy.fullName}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái xử lý</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {decidedLabel ? `Cập nhật ${decidedLabel}` : 'Chưa được xử lý'}
            {request.decidedBy?.fullName ? ` • ${request.decidedBy.fullName}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
