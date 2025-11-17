
import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  ArrowRightIcon,
  NotebookPenIcon,
  PlusIcon,
  RefreshCcwIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import TransferFlow from '@/components/requests/TransferFlow'
import {
  useGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useCancelRequestMutation,
  useSubmitStudentRequestMutation,
  useGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  type StudentRequest,
  type RequestStatus,
  type RequestType,
  type SessionModality,
} from '@/store/services/studentRequestApi'
import {
  type DayOfWeek,
  type SessionSummaryDTO,
  useGetCurrentWeekQuery,
  useGetSessionDetailQuery,
  useGetWeeklyScheduleQuery,
} from '@/store/services/studentScheduleApi'
import { REQUEST_STATUS_META } from '@/constants/absence'
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

const WEEK_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const WEEK_DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
}

type TypeFilter = 'ALL' | RequestType
type StatusFilter = 'ALL' | RequestStatus
const MAKEUP_LOOKBACK_WEEKS = 2
export default function StudentRequestsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTransferFlowOpen, setIsTransferFlowOpen] = useState(false)
  const [activeType, setActiveType] = useState<RequestType | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [successRequest, setSuccessRequest] = useState<StudentRequest | null>(null)
  const [cancelConfirmRequest, setCancelConfirmRequest] = useState<StudentRequest | null>(null)

  const {
    data: requestsResponse,
    isFetching: isLoadingRequests,
    refetch: refetchRequests,
  } = useGetMyRequestsQuery({
    requestType: typeFilter === 'ALL' ? undefined : typeFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
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
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu của tôi</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý yêu cầu xin nghỉ, học bù, chuyển lớp
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} size="sm">
                <PlusIcon className="h-4 w-4" />
                Tạo yêu cầu
              </Button>
            </div>

            {/* Summary Stats - NO WRAPPER CARD */}
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số yêu cầu</p>
                <p className="text-2xl font-semibold">{summary?.totalRequests ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang chờ</p>
                <p className="text-2xl font-semibold text-sky-600">{summary?.pending ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã duyệt</p>
                <p className="text-2xl font-semibold text-emerald-600">{summary?.approved ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bị từ chối</p>
                <p className="text-2xl font-semibold text-rose-600">{summary?.rejected ?? 0}</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value: TypeFilter) => {
                  setTypeFilter(value)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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

            {/* Request List - NO WRAPPER CARD */}
            {isLoadingRequests ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <NotebookPenIcon className="h-12 w-12 text-muted-foreground/50" />
                <p className="font-medium">Chưa có yêu cầu nào</p>
                <p className="text-sm text-muted-foreground">
                  Tạo yêu cầu mới để xin nghỉ, học bù hoặc chuyển lớp
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const submittedAtLabel = format(parseISO(request.submittedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
                  const decidedAtLabel = request.decidedAt
                    ? format(parseISO(request.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
                    : null
                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                    >
                      {/* Request Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {REQUEST_TYPE_LABELS[request.requestType]}
                          </Badge>
                          <Badge
                            className={cn(
                              'font-semibold',
                              REQUEST_STATUS_META[request.status].badgeClass
                            )}
                          >
                            {REQUEST_STATUS_META[request.status].label}
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground">#{request.id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Gửi {submittedAtLabel}
                          {request.submittedBy?.fullName ? ` • ${request.submittedBy.fullName}` : ''}
                        </span>
                      </div>

                      {/* Request Content */}
                      <div className="mt-3 grid gap-4 md:grid-cols-3">
                        {request.requestType === 'MAKEUP' ? (
                          <>
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Buổi đã vắng ({request.currentClass.code})
                              </p>
                              <p className="mt-1 font-medium">
                                {format(parseISO(request.targetSession.date), 'EEEE, dd/MM', { locale: vi })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Buổi học bù
                              </p>
                              {request.makeupSession ? (
                                <>
                                  <p className="mt-1 font-medium">
                                    {request.makeupSession.classInfo?.classCode
                                      ? `${request.makeupSession.classInfo.classCode} · ${format(
                                          parseISO(request.makeupSession.date),
                                          'dd/MM',
                                          { locale: vi }
                                        )}`
                                      : format(parseISO(request.makeupSession.date), 'EEEE, dd/MM', { locale: vi })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Buổi {request.makeupSession.courseSessionNumber}:{' '}
                                    {request.makeupSession.courseSessionTitle}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {request.makeupSession.timeSlot.startTime} - {request.makeupSession.timeSlot.endTime}
                                  </p>
                                </>
                              ) : (
                                <p className="mt-1 text-sm text-muted-foreground">Chưa có buổi học bù</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Lớp hiện tại
                                </p>
                                <p className="mt-1 font-medium">{request.currentClass.code}</p>
                              </div>
                              {request.targetClass && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Lớp mục tiêu
                                  </p>
                                  <p className="mt-1 text-sm font-medium">{request.targetClass.code}</p>
                                  {request.effectiveDate && (
                                    <p className="text-xs text-muted-foreground">
                                      Hiệu lực: {format(parseISO(request.effectiveDate), 'dd/MM/yyyy', { locale: vi })}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Buổi học
                              </p>
                              <p className="mt-1 font-medium">
                                {request.currentClass.code} · {format(parseISO(request.targetSession.date), 'dd/MM', {
                                  locale: vi,
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
                              </p>
                            </div>
                          </>
                        )}

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Lý do
                            </p>
                            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                              {request.requestReason}
                            </p>
                          </div>
                          {request.note && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Ghi chú
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.note}</p>
                            </div>
                          )}
                          {request.rejectionReason && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-rose-500">
                                Lý do từ chối
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm text-rose-500">{request.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          {decidedAtLabel
                            ? `Cập nhật ${decidedAtLabel}${request.decidedBy?.fullName ? ` • ${request.decidedBy.fullName}` : ''}`
                            : 'Chưa được xử lý'}
                        </span>
                        <div className="flex items-center gap-2">
                          {request.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancelConfirmRequest(request)}
                              disabled={isCancelling && cancelingId === request.id}
                            >
                              {isCancelling && cancelingId === request.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setDetailId(request.id)}>
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Trang {pagination.number + 1} / {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={pagination.number === 0}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages - 1))}
                    disabled={pagination.number + 1 >= pagination.totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
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
        onSuccess={(request) => {
          handleModalClose()
          refetchRequests()
          if (request) {
            setSuccessRequest(request)
          }
        }}
        onOpenTransferFlow={() => setIsTransferFlowOpen(true)}
      />

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
          </DialogHeader>
          {isLoadingDetail || !detailResponse?.data ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <RequestDetail request={detailResponse.data} />
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Flow Dialog */}
      <TransferFlow open={isTransferFlowOpen} onOpenChange={setIsTransferFlowOpen} />

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
  onSuccess: (request?: StudentRequest | null) => void
  onOpenTransferFlow: () => void
}

function CreateRequestDialog({
  open,
  onOpenChange,
  activeType,
  onSelectType,
  onSuccess,
  onOpenTransferFlow,
}: CreateDialogProps) {
  const handleTypeSelect = (type: RequestType) => {
    if (type === 'TRANSFER') {
      onOpenChange(false)
      onSelectType(null)
      onOpenTransferFlow()
      return
    }
    onSelectType(type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>
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

            {activeType === 'ABSENCE' && <AbsenceFlow onSuccess={onSuccess} />}
            {activeType === 'MAKEUP' && <MakeupFlow onSuccess={onSuccess} />}
          </div>
        )}
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
interface FlowProps {
  onSuccess: (request?: StudentRequest | null) => void
}

interface SessionWithAvailability extends SessionSummaryDTO {
  isSelectable: boolean
  disabledReason: string | null
}

function parseSessionDateTime(dateStr: string, timeStr?: string) {
  if (!timeStr) {
    return parseISO(dateStr)
  }
  const normalizedTime =
    timeStr.length === 5 ? `${timeStr}:00` : timeStr.length === 8 ? timeStr : `${timeStr}:00`
  return parseISO(`${dateStr}T${normalizedTime}`)
}

function getSessionAvailability(session: SessionSummaryDTO, futureLimit: Date) {
  const sessionDateTime = parseSessionDateTime(session.date, session.startTime)
  const now = new Date()
  const isPast = sessionDateTime.getTime() <= now.getTime()
  const isTooFar = sessionDateTime.getTime() > futureLimit.getTime()
  const hasAttendanceRecord = session.attendanceStatus && session.attendanceStatus !== 'PLANNED'
  const isInactiveStatus = session.sessionStatus !== 'PLANNED'

  let disabledReason: string | null = null
  if (isPast) {
    disabledReason = 'Buổi đã diễn ra'
  } else if (isTooFar) {
    disabledReason = 'Chỉ có thể xin nghỉ trong 30 ngày tới'
  } else if (hasAttendanceRecord) {
    disabledReason = 'Đã điểm danh'
  } else if (isInactiveStatus) {
    disabledReason = 'Buổi không khả dụng'
  }

  return {
    isSelectable: !isPast && !isTooFar && !hasAttendanceRecord && !isInactiveStatus,
    disabledReason,
  }
}

function AbsenceFlow({ onSuccess }: FlowProps) {
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const futureLimitDate = useMemo(() => addMonths(new Date(), 1), [])

  const { data: currentWeekResponse, isFetching: isLoadingCurrentWeek } = useGetCurrentWeekQuery()
  const {
    data: weeklyScheduleResponse,
    isFetching: isLoadingSchedule,
  } = useGetWeeklyScheduleQuery(
    {
      weekStart: weekStart ?? '',
    },
    {
      skip: !weekStart,
    }
  )
  const { data: sessionDetailResponse } = useGetSessionDetailQuery(
    selectedSessionId ?? skipToken,
    {
      skip: !selectedSessionId,
    }
  )
  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()

  useEffect(() => {
    if (!weekStart && currentWeekResponse?.data) {
      setWeekStart(currentWeekResponse.data)
    }
  }, [currentWeekResponse?.data, weekStart])

  useEffect(() => {
    setSelectedSessionId(null)
  }, [weekStart])

  const weekData = weeklyScheduleResponse?.data
  const groupedSessions = useMemo(() => {
    if (!weekData) return []
    const startDate = parseISO(weekData.weekStart)
    return WEEK_DAYS.map((day, index) => {
      const dayDate = addDays(startDate, index)
      const sessions: SessionWithAvailability[] = (weekData.schedule?.[day] ?? []).map((session) => {
        const { isSelectable, disabledReason } = getSessionAvailability(session, futureLimitDate)
        return {
          ...session,
          isSelectable,
          disabledReason,
        }
      })
      return {
        day,
        date: dayDate,
        sessions,
      }
    })
  }, [weekData, futureLimitDate])

  const allSessions = useMemo(
    () => groupedSessions.flatMap((group) => group.sessions),
    [groupedSessions]
  )
  const displayedGroups = groupedSessions.filter((group) => group.sessions.length > 0)
  const selectedSession = allSessions.find((session) => session.sessionId === selectedSessionId) ?? null
  const selectedSessionDetail = sessionDetailResponse?.data ?? null
  const selectedClassId = selectedSessionDetail?.classInfo.classId ?? null
  const weekRangeLabel = weekData
    ? `${format(parseISO(weekData.weekStart), 'dd/MM', { locale: vi })} - ${format(parseISO(weekData.weekEnd), 'dd/MM', { locale: vi })}`
    : 'Đang tải tuần...'

  const handleChangeWeek = (direction: 'prev' | 'next') => {
    if (!weekStart) return
    const nextStart = addDays(parseISO(weekStart), direction === 'next' ? 7 : -7)
    setWeekStart(format(nextStart, 'yyyy-MM-dd'))
  }

  const handleReset = () => {
    setSelectedSessionId(null)
    setReason('')
    setNote('')
  }

  const handleSubmit = async () => {
    setReasonError(null)

    if (!selectedSession) {
      toast.error('Vui lòng chọn buổi học muốn xin nghỉ')
      return
    }

    if (reason.trim().length < 10) {
      setReasonError('Lý do xin nghỉ phải có tối thiểu 10 ký tự')
      return
    }

    if (!selectedClassId) {
      toast.error('Không thể xác định lớp học của buổi này. Vui lòng thử lại.')
      return
    }

    try {
      const response = await submitRequest({
        requestType: 'ABSENCE',
        currentClassId: selectedClassId,
        targetSessionId: selectedSession.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      const createdRequest = response?.data
      handleReset()
      if (createdRequest) {
        onSuccess(createdRequest)
      } else {
        onSuccess()
      }
      toast.success('Đã gửi yêu cầu xin nghỉ')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const step1Complete = !!selectedSession
  const step2Complete = step1Complete && reason.trim().length >= 10

  return (
    <>
      <div className="space-y-8">
        {/* Step 1: Chọn buổi */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                step1Complete ? 'bg-primary text-primary-foreground' : 'border-2 border-primary text-primary'
              )}
            >
              {step1Complete ? '✓' : '1'}
            </div>
            <div>
              <h3 className="font-semibold">Chọn buổi muốn xin nghỉ</h3>
              <p className="text-sm text-muted-foreground">
                Chỉ hiển thị buổi chưa diễn ra, trong 30 ngày tới và chưa điểm danh
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Tuần đang xem</p>
                <p className="font-medium">{weekRangeLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleChangeWeek('prev')}
                  disabled={!weekStart}
                >
                  <ArrowRightIcon className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentWeekResponse?.data) {
                      setWeekStart(currentWeekResponse.data)
                    }
                  }}
                  disabled={!currentWeekResponse?.data}
                >
                  Tuần hiện tại
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleChangeWeek('next')}
                  disabled={!weekStart}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingCurrentWeek || isLoadingSchedule || !weekData ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : displayedGroups.length > 0 ? (
                displayedGroups.map((group) => (
                  <div key={group.day} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {WEEK_DAY_LABELS[group.day]} · {format(group.date, 'dd/MM', { locale: vi })}
                    </p>
                    <div className="space-y-2">
                      {group.sessions.map((session) => {
                        const isActive = selectedSessionId === session.sessionId
                        return (
                          <label
                            key={session.sessionId}
                            className={cn(
                              'flex gap-3 rounded-lg border px-4 py-3 transition',
                              session.isSelectable
                                ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/30'
                                : 'cursor-not-allowed border-dashed opacity-50',
                              isActive && 'border-primary bg-primary/5'
                            )}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              disabled={!session.isSelectable}
                              checked={isActive}
                              onChange={() => {
                                if (session.isSelectable) {
                                  setSelectedSessionId(session.sessionId)
                                }
                              }}
                            />
                            <div className="flex h-5 w-5 items-center justify-center">
                              <span
                                className={cn(
                                  'h-4 w-4 rounded-full border-2',
                                  isActive ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                )}
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">
                                {session.classCode} · {session.startTime} - {session.endTime}
                              </p>
                              <p className="text-sm text-muted-foreground">{session.topic}</p>
                              <p className="text-xs text-muted-foreground">
                                {session.branchName} · {session.modality === 'ONLINE' ? 'Trực tuyến' : 'Tại trung tâm'}
                              </p>
                              {!session.isSelectable && session.disabledReason && (
                                <p className="text-xs font-medium text-rose-600">{session.disabledReason}</p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Tuần này chưa có buổi học nào trong lịch cá nhân
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Điền lý do */}
        <div className={cn('space-y-4', !step1Complete && 'opacity-50')}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                step2Complete
                  ? 'bg-primary text-primary-foreground'
                  : step1Complete
                    ? 'border-2 border-primary text-primary'
                    : 'border-2 border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {step2Complete ? '✓' : '2'}
            </div>
            <div>
              <h3 className="font-semibold">Điền lý do xin nghỉ</h3>
              <p className="text-sm text-muted-foreground">Kiểm tra lại thông tin buổi học trước khi gửi</p>
            </div>
          </div>

          {selectedSession && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                    <p className="font-semibold">
                      {selectedSession.classCode} · {selectedSession.startTime} - {selectedSession.endTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedSession.topic}</p>
                    {selectedSessionDetail && (
                      <div className="space-y-0.5 text-sm text-muted-foreground">
                        <p>
                          Giảng viên: <span className="text-foreground">{selectedSessionDetail.classInfo.teacherName ?? 'Đang cập nhật'}</span>
                        </p>
                        <p>
                          Hình thức:{' '}
                          <span className="text-foreground">
                            {selectedSessionDetail.classInfo.modality === 'ONLINE'
                              ? 'Trực tuyến'
                              : selectedSessionDetail.classInfo.modality === 'HYBRID'
                                ? 'Kết hợp'
                                : 'Tại trung tâm'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)}>
                    Chọn lại
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Nhập lý do xin nghỉ..."
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value)
                    if (reasonError) setReasonError(null)
                  }}
                  rows={4}
                  className={cn('resize-none', reasonError && 'border-destructive')}
                />
                <div className="flex items-center justify-between">
                  {reasonError ? (
                    <p className="text-xs text-destructive">{reasonError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {reason.trim().length} / tối thiểu 10 ký tự
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!step2Complete || isLoading}>
                  {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Làm lại
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
function MakeupFlow({ onSuccess }: FlowProps) {
  const [excludeRequested] = useState(true)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const { data: missedResponse, isFetching: isLoadingMissed } = useGetMissedSessionsQuery({
    weeksBack: MAKEUP_LOOKBACK_WEEKS,
    excludeRequested,
  })

  const missedSessions = useMemo(() => {
    const rawSessions = missedResponse?.data?.missedSessions ?? missedResponse?.data?.sessions ?? []
    // Filter out sessions that already have existing makeup request
    return excludeRequested
      ? rawSessions.filter((session) => !session.hasExistingMakeupRequest)
      : rawSessions
  }, [missedResponse?.data, excludeRequested])
  const selectedMissedSession = useMemo(
    () => missedSessions.find((session) => session.sessionId === selectedMissedId) ?? null,
    [missedSessions, selectedMissedId]
  )

  useEffect(() => {
    if (!selectedMissedSession) {
      setSelectedMakeupId(null)
    }
  }, [selectedMissedSession])

  const { data: makeupResponse, isFetching: isLoadingOptions } = useGetMakeupOptionsQuery(
    selectedMissedId ? { targetSessionId: selectedMissedId } : skipToken
  )

  const makeupOptions = useMemo(() => makeupResponse?.data?.makeupOptions ?? [], [makeupResponse?.data?.makeupOptions])
  const selectedMakeupOption = makeupOptions.find((option) => option.sessionId === selectedMakeupId) ?? null

  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()

  const getClassId = (classInfo?: { classId?: number; id?: number }) =>
    classInfo?.classId ?? classInfo?.id ?? null

  const formatModality = (modality?: SessionModality) => {
    switch (modality) {
      case 'ONLINE':
        return 'Trực tuyến'
      case 'HYBRID':
        return 'Kết hợp'
      default:
        return 'Tại trung tâm'
    }
  }

  const getCapacityText = (available?: number | null, max?: number | null) => {
    const hasAvailable = typeof available === 'number'
    const hasMax = typeof max === 'number'
    if (hasAvailable && hasMax) {
      return `${available}/${max} chỗ trống`
    }
    if (hasAvailable) {
      return `Còn ${available} chỗ trống`
    }
    if (hasMax) {
      return `Tối đa ${max} chỗ`
    }
    return 'Sức chứa đang cập nhật'
  }

  const getClassDisplayName = (classInfo?: { className?: string; name?: string }) =>
    classInfo?.className ?? classInfo?.name ?? 'Tên lớp đang cập nhật'

  const handleSubmit = async () => {
    setReasonError(null)

    if (!selectedMissedSession || !selectedMakeupOption) {
      toast.error('Vui lòng chọn đủ buổi đã vắng và buổi học bù')
      return
    }

    const currentClassId = getClassId(selectedMissedSession.classInfo)
    if (!currentClassId) {
      toast.error('Không thể xác định lớp của buổi đã chọn. Vui lòng thử lại.')
      return
    }

    if (reason.trim().length < 10) {
      setReasonError('Lý do học bù phải có tối thiểu 10 ký tự')
      return
    }

    try {
      await submitRequest({
        requestType: 'MAKEUP',
        currentClassId,
        targetSessionId: selectedMissedSession.sessionId,
        makeupSessionId: selectedMakeupOption.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      toast.success('Đã gửi yêu cầu học bù')
      setSelectedMissedId(null)
      setSelectedMakeupId(null)
      setReason('')
      setNote('')
      onSuccess()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  
  const step1Complete = !!selectedMissedSession
  const step2Complete = !!selectedMakeupOption
  const step3Complete = step2Complete && reason.trim().length >= 10

  return (
    <div className="space-y-8">
      {/* Step 1: Chọn buổi đã vắng */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              step1Complete ? 'bg-primary text-primary-foreground' : 'border-2 border-primary text-primary'
            )}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <div>
            <h3 className="font-semibold">Chọn buổi đã vắng</h3>
            <p className="text-sm text-muted-foreground">
              Hiển thị buổi vắng trong {MAKEUP_LOOKBACK_WEEKS} tuần gần nhất
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!step1Complete ? (
            <>

              {isLoadingMissed ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : missedSessions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Không có buổi vắng hợp lệ trong {MAKEUP_LOOKBACK_WEEKS} tuần gần nhất
                </div>
              ) : (
                <div className="space-y-2">
                  {missedSessions.map((session) => (
                    <button
                      key={session.sessionId}
                      type="button"
                      onClick={() => setSelectedMissedId(session.sessionId)}
                      className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {format(parseISO(session.date), 'EEEE, dd/MM', { locale: vi })} · {session.classInfo.classCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                          </p>
                          {typeof session.daysAgo === 'number' && (
                            <p className="text-xs text-muted-foreground">
                              {session.daysAgo === 0
                                ? 'Vắng hôm nay'
                                : session.daysAgo === 1
                                  ? 'Cách đây 1 ngày'
                                  : `Cách đây ${session.daysAgo} ngày`}
                              {session.isExcusedAbsence && ' · Đã xin nghỉ'}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="border-t pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Buổi đã chọn</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedMissedSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })} · {selectedMissedSession.classInfo.classCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Buổi {selectedMissedSession.courseSessionNumber}: {selectedMissedSession.courseSessionTitle}
                  </p>
                  {typeof selectedMissedSession.daysAgo === 'number' && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMissedSession.daysAgo === 0
                        ? 'Vắng hôm nay'
                        : selectedMissedSession.daysAgo === 1
                          ? 'Cách đây 1 ngày'
                          : `Cách đây ${selectedMissedSession.daysAgo} ngày`}
                      {selectedMissedSession.isExcusedAbsence && ' · Đã xin nghỉ'}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMissedId(null)}>
                  Chọn lại
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Chọn buổi học bù */}
      <div className={cn('space-y-4', !step1Complete && 'opacity-50')}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              step2Complete
                ? 'bg-primary text-primary-foreground'
                : step1Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <h3 className="font-semibold">Chọn buổi học bù</h3>
        </div>

        {step1Complete && (
          <div className="space-y-3">
            {!step2Complete ? (
              isLoadingOptions ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </div>
              ) : makeupOptions.length === 0 ? (
                <div className="border-t border-dashed py-8 text-center text-sm text-muted-foreground">
                  Chưa có buổi học bù phù hợp
                </div>
              ) : (
                <div className="space-y-2">
                  {makeupOptions.map((option) => {
                    const availableSlots = option.availableSlots ?? option.classInfo?.availableSlots ?? null
                    const maxCapacity = option.maxCapacity ?? option.classInfo?.maxCapacity ?? null
                    const branchLabel = option.classInfo.branchName ?? 'Chi nhánh đang cập nhật'
                    const modalityLabel = formatModality(option.classInfo.modality)
                    return (
                      <button
                        key={option.sessionId}
                        type="button"
                        onClick={() => setSelectedMakeupId(option.sessionId)}
                        className="w-full rounded-lg border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {format(parseISO(option.date), 'dd/MM', { locale: vi })} · {option.classInfo.classCode}
                          </p>
                          <p className="text-sm text-muted-foreground">{getClassDisplayName(option.classInfo)}</p>
                          <p className="text-xs text-muted-foreground">
                            {branchLabel} · {modalityLabel} · {option.timeSlotInfo.startTime}-{option.timeSlotInfo.endTime} · {getCapacityText(availableSlots, maxCapacity)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            ) : (
              <div className="border-t pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Buổi học bù đã chọn</p>
                    <p className="font-semibold">
                      {format(parseISO(selectedMakeupOption.date), 'dd/MM/yyyy', { locale: vi })} · {selectedMakeupOption.classInfo.classCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{getClassDisplayName(selectedMakeupOption.classInfo)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.classInfo.branchName ?? 'Chi nhánh đang cập nhật'} · {formatModality(selectedMakeupOption.classInfo.modality)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMakeupOption.timeSlotInfo.startTime} - {selectedMakeupOption.timeSlotInfo.endTime} ·{' '}
                      {getCapacityText(
                        selectedMakeupOption.availableSlots ?? selectedMakeupOption.classInfo?.availableSlots ?? null,
                        selectedMakeupOption.maxCapacity ?? selectedMakeupOption.classInfo?.maxCapacity ?? null
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMakeupId(null)}>
                    Chọn lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Điền lý do */}
      <div className={cn('space-y-4', !step2Complete && 'opacity-50')}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              step3Complete
                ? 'bg-primary text-primary-foreground'
                : step2Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step3Complete ? '✓' : '3'}
          </div>
          <h3 className="font-semibold">Điền lý do học bù</h3>
        </div>

        {step2Complete && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Nhập lý do học bù..."
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  if (reasonError) setReasonError(null)
                }}
                rows={4}
                className={cn('resize-none', reasonError && 'border-destructive')}
              />
              <div className="flex items-center justify-between">
                {reasonError ? (
                  <p className="text-xs text-destructive">{reasonError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {reason.trim().length} / tối thiểu 10 ký tự
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!step3Complete || isLoading}>
                {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMissedId(null)
                  setSelectedMakeupId(null)
                  setReason('')
                  setNote('')
                }}
              >
                Làm lại
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
function RequestDetail({ request }: { request: StudentRequest }) {
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

      <div className="h-px bg-border" />

      {request.requestType !== 'MAKEUP' && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lớp hiện tại</p>
            <p className="mt-1 font-semibold">{request.currentClass.code}</p>
            {request.currentClass.branch?.name && (
              <p className="text-xs text-muted-foreground">Chi nhánh: {request.currentClass.branch.name}</p>
            )}
          </div>

          <div className="h-px bg-border" />
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
          <div className="h-px bg-border" />
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

      <div className="h-px bg-border" />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do</p>
        <p className="mt-1 text-sm text-muted-foreground">{request.requestReason}</p>
      </div>

      {request.note && (
        <>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú</p>
            <p className="mt-1 text-sm text-muted-foreground">{request.note}</p>
          </div>
        </>
      )}

      {request.rejectionReason && (
        <>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do từ chối</p>
            <p className="mt-1 text-sm text-muted-foreground">{request.rejectionReason}</p>
          </div>
        </>
      )}

      <div className="h-px bg-border" />

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
