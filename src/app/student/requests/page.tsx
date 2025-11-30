
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  NotebookPenIcon,
  PlusIcon,
  RefreshCcwIcon,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
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
import { REQUEST_STATUS_META } from '@/constants/absence'
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
  { label: 'Đang chờ duyệt', value: 'PENDING' },
  { label: 'Đã chấp thuận', value: 'APPROVED' },
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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
    setIsCreateOpen(false)
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
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">Yêu cầu của tôi</h1>
                  <p className="text-sm text-muted-foreground">
                    Quản lý yêu cầu xin nghỉ, học bù, chuyển lớp
                  </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                  <PlusIcon className="h-4 w-4" />
                  Tạo yêu cầu
                </Button>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 px-6 py-6">

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng số yêu cầu</CardTitle>
                  <NotebookPenIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalRequests ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Tất cả yêu cầu đã gửi</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-sky-600">{summary?.pending ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Chờ phê duyệt</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{summary?.approved ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Được chấp thuận</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bị từ chối</CardTitle>
                  <XCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">{summary?.rejected ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Không được duyệt</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* Search Input - Left side */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo lý do, mã lớp, hoặc tên buổi học..."
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

              {/* Filter Controls - Right side */}
              <div className="flex items-center gap-2">
                <Select
                  value={typeFilter}
                  onValueChange={(value: TypeFilter) => {
                    setTypeFilter(value)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-[160px] h-9">
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
                  <SelectTrigger className="w-[160px] h-9">
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

                <Button variant="outline" size="icon" onClick={() => refetchRequests()}>
                  <RefreshCcwIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Request Table */}
            <div className="space-y-4">
              {isLoadingRequests ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : requests.length === 0 ? (
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
                />
              )}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between text-sm">
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
                    {Array.from({ length: pagination.totalPages }, (_, i) => i).map((pageNum) => (
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
                    ))}
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
      <CreateRequestDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose()
          } else {
            setIsCreateOpen(true)
          }
        }}
        activeType={activeType}
        onSelectType={(type) => setActiveType(type)}
        onSuccess={() => {
          handleModalClose()
          refetchRequests()
        }}
      />

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
                  onClick={() => {
                    setSuccessRequest(null)
                    setActiveType(null)
                    setIsCreateOpen(true)
                  }}
                >
                  Tạo yêu cầu khác
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
interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeType: RequestType | null
  onSelectType: (type: RequestType | null) => void
  onSuccess: () => void
}

function CreateRequestDialog({
  open,
  onOpenChange,
  activeType,
  onSelectType,
  onSuccess,
}: CreateDialogProps) {
  const handleTypeSelect = (type: RequestType) => {
    onSelectType(type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4 pb-4" style={{ height: 'calc(90vh - 8rem)' }}>
          {activeType === null ? (
            <TypeSelection onSelect={handleTypeSelect} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Loại yêu cầu</p>
                  <h3 className="text-base font-semibold">{REQUEST_TYPE_LABELS[activeType]}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onSelectType(null)}>
                  Chọn loại khác
                </Button>
              </div>

              <UnifiedRequestFlow type={activeType} onSuccess={onSuccess} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TypeSelection({ onSelect }: { onSelect: (type: RequestType) => void }) {
  const types: Array<{ type: RequestType; title: string; description: string; bullets: string[] }> = [
    {
      type: 'ABSENCE',
      title: 'Xin nghỉ buổi học',
      description: 'Chọn ngày, buổi học và gửi lý do trong 1 phút.',
      bullets: ['Chỉ cho buổi chưa diễn ra', 'Theo dõi trạng thái xử lý', 'Có thể hủy trước khi duyệt'],
    },
    {
      type: 'MAKEUP',
      title: 'Xin học bù',
      description: 'Hệ thống gợi ý buổi học bù phù hợp theo chi nhánh và sức chứa.',
      bullets: ['Hiển thị buổi đã vắng', 'Ưu tiên gợi ý thông minh', 'Tự động cảnh báo trùng lịch'],
    },
    {
      type: 'TRANSFER',
      title: 'Chuyển lớp',
      description: 'Chuyển giữa các lớp cùng khóa học với hướng dẫn từng bước.',
      bullets: ['Kiểm tra điều kiện chuyển', 'Phân tích nội dung bị thiếu', 'Xử lý nhanh 4-8 giờ'],
    },
  ]

  return (
    <div className="space-y-3">
      {types.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onSelect(item.type)}
          className="w-full rounded-lg border border-border/60 p-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{REQUEST_TYPE_LABELS[item.type]}</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ArrowRightIcon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
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
