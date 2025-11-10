
import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, startOfToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  ArrowRightIcon,
  NotebookPenIcon,
  PlusIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useGetMyRequestsQuery,
  useGetMyRequestByIdQuery,
  useCancelRequestMutation,
  useSubmitStudentRequestMutation,
  useGetAvailableSessionsQuery,
  useGetMissedSessionsQuery,
  useGetMakeupOptionsQuery,
  type StudentRequest,
  type RequestStatus,
  type RequestType,
  type StudentClassSessions,
  type StudentSessionOption,
} from '@/store/services/studentRequestApi'
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

type TypeFilter = 'ALL' | RequestType

type StatusFilter = 'ALL' | RequestStatus
export default function StudentRequestsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeType, setActiveType] = useState<RequestType | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

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

  const handleCancel = async (request: StudentRequest) => {
    if (request.status !== 'PENDING') return
    setCancelingId(request.id)
    try {
      await cancelRequest(request.id).unwrap()
      toast.success('Đã hủy yêu cầu')
      refetchRequests()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể hủy yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setCancelingId(null)
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
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu của tôi</h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi trạng thái xin nghỉ, học bù và chuyển lớp
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
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                  >
                    {/* Request Header */}
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
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(request.submittedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>

                    {/* Request Content - NO NESTED BORDERS */}
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
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
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Lý do
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{request.requestReason}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      {request.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(request)}
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
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
                <span>
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
        onSuccess={() => {
          handleModalClose()
          refetchRequests()
        }}
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

function CreateRequestDialog({ open, onOpenChange, activeType, onSelectType, onSuccess }: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>
        {activeType === null ? (
          <TypeSelection onSelect={onSelectType} />
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
            {activeType === 'TRANSFER' && (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <ShieldCheckIcon className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Tính năng đang được xây dựng</p>
                <p className="text-xs text-muted-foreground">
                  Vui lòng liên hệ Học vụ để được hỗ trợ chuyển lớp.
                </p>
              </div>
            )}
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
      description: 'Đang phát triển – dự kiến cho phép chuyển lớp nhanh.',
      bullets: ['Theo dõi tiến độ', 'Đồng bộ lịch học mới', 'Thông báo giáo vụ'],
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
  onSuccess: () => void
}

function AbsenceFlow({ onSuccess }: FlowProps) {
  const today = startOfToday()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null

  const { data: sessionsResponse, isFetching: isLoadingSessions } = useGetAvailableSessionsQuery(
    formattedDate
      ? {
          date: formattedDate,
          requestType: 'ABSENCE',
        }
      : skipToken,
    {
      skip: !formattedDate,
    }
  )

  const availableClasses = useMemo(() => sessionsResponse?.data ?? [], [sessionsResponse?.data])
  const sessionOptions: Array<{
    classInfo: StudentClassSessions
    session: StudentSessionOption
  }> = useMemo(() => {
    return availableClasses.flatMap((cls) => cls.sessions.map((session) => ({ classInfo: cls, session })))
  }, [availableClasses])

  const selectedSession = sessionOptions.find((option) => option.session.sessionId === selectedSessionId) ?? null
  const [submitRequest, { isLoading }] = useSubmitStudentRequestMutation()

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || date < today) return
    setSelectedDate(date)
    setSelectedSessionId(null)
  }

  const handleSubmit = async () => {
    if (!selectedSession) {
      toast.error('Vui lòng chọn buổi học muốn xin nghỉ')
      return
    }

    if (reason.trim().length < 10) {
      toast.error('Lý do xin nghỉ phải có tối thiểu 10 ký tự')
      return
    }

    try {
      await submitRequest({
        requestType: 'ABSENCE',
        currentClassId: selectedSession.classInfo.classId,
        targetSessionId: selectedSession.session.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      toast.success('Đã gửi yêu cầu xin nghỉ')
      setReason('')
      setNote('')
      setSelectedDate(undefined)
      setSelectedSessionId(null)
      onSuccess()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const step1Complete = !!selectedDate
  const step2Complete = !!selectedSession
  const step3Complete = step2Complete && reason.trim().length >= 10

  return (
    <div className="space-y-4">
      {/* Step 1: Chọn ngày */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            // Allow re-opening step 1 to change date
          }}
          className="flex w-full items-center gap-2 text-left"
        >
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step1Complete ? 'bg-primary text-primary-foreground' : 'border-2 border-primary text-primary'
            )}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <h3 className="text-sm font-semibold">Chọn ngày học</h3>
        </button>

        <div className="pl-8">
          {!step1Complete ? (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < today}
              locale={vi}
              className="rounded-lg border"
            />
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-sm">
                <span className="font-medium">{format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDate(undefined)
                  setSelectedSessionId(null)
                }}
              >
                Thay đổi
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Chọn buổi học */}
      <div className={cn('space-y-2', !step1Complete && 'opacity-50')}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step2Complete
                ? 'bg-primary text-primary-foreground'
                : step1Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <h3 className="text-sm font-semibold">Chọn buổi học cụ thể</h3>
        </div>

        {step1Complete && (
          <div className="pl-8">
            {!step2Complete ? (
              isLoadingSessions ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessionOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Không có buổi học nào trong ngày đã chọn
                </div>
              ) : (
                <ul className="space-y-2">
                  {sessionOptions.map((option) => (
                    <li key={option.session.sessionId}>
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(option.session.sessionId)}
                        className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <p className="text-sm font-medium">
                          {option.classInfo.classCode} · {option.session.timeSlot.startTime} -{' '}
                          {option.session.timeSlot.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Buổi {option.session.courseSessionNumber}: {option.session.courseSessionTitle}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {selectedSession.classInfo.classCode} · {selectedSession.session.timeSlot.startTime} -{' '}
                    {selectedSession.session.timeSlot.endTime}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buổi {selectedSession.session.courseSessionNumber}: {selectedSession.session.courseSessionTitle}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)}>
                  Thay đổi
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Điền lý do */}
      <div className={cn('space-y-2', !step2Complete && 'opacity-50')}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step3Complete
                ? 'bg-primary text-primary-foreground'
                : step2Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step3Complete ? '✓' : '3'}
          </div>
          <h3 className="text-sm font-semibold">Điền lý do xin nghỉ</h3>
        </div>

        {step2Complete && (
          <div className="space-y-3 pl-8">
            <div className="space-y-1.5">
              <Textarea
                placeholder="Chia sẻ lý do cụ thể để Học vụ duyệt nhanh hơn..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">Tối thiểu 10 ký tự · {reason.trim().length}/10</p>
            </div>

            <Input
              placeholder="Ghi chú bổ sung (không bắt buộc)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!step3Complete || isLoading} size="sm">
                {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(undefined)
                  setSelectedSessionId(null)
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
function MakeupFlow({ onSuccess }: FlowProps) {
  const [weeksBack, setWeeksBack] = useState(4)
  const [excludeRequested, setExcludeRequested] = useState(true)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const { data: missedResponse, isFetching: isLoadingMissed } = useGetMissedSessionsQuery({
    weeksBack,
    excludeRequested,
  })

  const missedSessions = useMemo(
    () => missedResponse?.data?.missedSessions ?? [],
    [missedResponse?.data?.missedSessions]
  )
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

  const handleSubmit = async () => {
    if (!selectedMissedSession || !selectedMakeupOption) {
      toast.error('Vui lòng chọn đủ buổi đã vắng và buổi học bù')
      return
    }

    if (reason.trim().length < 10) {
      toast.error('Lý do học bù phải có tối thiểu 10 ký tự')
      return
    }

    try {
      await submitRequest({
        requestType: 'MAKEUP',
        currentClassId: selectedMissedSession.classInfo.classId,
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Ưu tiên cao</Badge>
      case 'MEDIUM':
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Ưu tiên TB</Badge>
      case 'LOW':
        return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20">Ưu tiên thấp</Badge>
      default:
        return null
    }
  }

  const step1Complete = !!selectedMissedSession
  const step2Complete = !!selectedMakeupOption
  const step3Complete = step2Complete && reason.trim().length >= 10

  return (
    <div className="space-y-4">
      {/* Step 1: Chọn buổi đã vắng */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step1Complete ? 'bg-primary text-primary-foreground' : 'border-2 border-primary text-primary'
            )}
          >
            {step1Complete ? '✓' : '1'}
          </div>
          <h3 className="text-sm font-semibold">Chọn buổi đã vắng</h3>
        </div>

        <div className="pl-8">
          {!step1Complete ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <Select value={weeksBack.toString()} onValueChange={(value) => setWeeksBack(Number(value))}>
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6].map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        {week} tuần
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={excludeRequested ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExcludeRequested((prev) => !prev)}
                  className="h-8 text-xs"
                >
                  {excludeRequested ? 'Ẩn đã gửi' : 'Hiện tất cả'}
                </Button>
              </div>

              {isLoadingMissed ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : missedSessions.length === 0 ? (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Không có buổi vắng hợp lệ trong {weeksBack} tuần
                </div>
              ) : (
                <ul className="space-y-2">
                  {missedSessions.map((session) => (
                    <li key={session.sessionId}>
                      <button
                        type="button"
                        onClick={() => setSelectedMissedId(session.sessionId)}
                        className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {format(parseISO(session.date), 'dd/MM', { locale: vi })} · {session.classInfo.classCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Buổi {session.courseSessionNumber}: {session.courseSessionTitle}
                            </p>
                          </div>
                          {session.hasExistingMakeupRequest && (
                            <Badge variant="outline" className="text-xs">
                              Đã gửi
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">
                  {format(parseISO(selectedMissedSession.date), 'dd/MM/yyyy', { locale: vi })} ·{' '}
                  {selectedMissedSession.classInfo.classCode}
                </p>
                <p className="text-xs text-muted-foreground">
                  Buổi {selectedMissedSession.courseSessionNumber}: {selectedMissedSession.courseSessionTitle}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMissedId(null)}>
                Thay đổi
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Chọn buổi học bù */}
      <div className={cn('space-y-2', !step1Complete && 'opacity-50')}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step2Complete
                ? 'bg-primary text-primary-foreground'
                : step1Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step2Complete ? '✓' : '2'}
          </div>
          <h3 className="text-sm font-semibold">Chọn buổi học bù</h3>
        </div>

        {step1Complete && (
          <div className="pl-8">
            {!step2Complete ? (
              isLoadingOptions ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : makeupOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Chưa có buổi học bù phù hợp
                </div>
              ) : (
                <ul className="space-y-2">
                  {makeupOptions.map((option) => (
                    <li key={option.sessionId}>
                      <button
                        type="button"
                        onClick={() => setSelectedMakeupId(option.sessionId)}
                        className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {format(parseISO(option.date), 'dd/MM', { locale: vi })} · {option.classInfo.classCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {option.timeSlotInfo.startTime} - {option.timeSlotInfo.endTime} · {option.availableSlots}/
                              {option.maxCapacity} chỗ
                            </p>
                          </div>
                          {getPriorityBadge(option.matchScore.priority)}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {format(parseISO(selectedMakeupOption.date), 'dd/MM/yyyy', { locale: vi })} ·{' '}
                    {selectedMakeupOption.classInfo.classCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMakeupOption.timeSlotInfo.startTime} - {selectedMakeupOption.timeSlotInfo.endTime}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMakeupId(null)}>
                  Thay đổi
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Điền lý do */}
      <div className={cn('space-y-2', !step2Complete && 'opacity-50')}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              step3Complete
                ? 'bg-primary text-primary-foreground'
                : step2Complete
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {step3Complete ? '✓' : '3'}
          </div>
          <h3 className="text-sm font-semibold">Điền lý do học bù</h3>
        </div>

        {step2Complete && (
          <div className="space-y-3 pl-8">
            <div className="space-y-1.5">
              <Textarea
                placeholder="Chia sẻ lý do bạn muốn học bù buổi này..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">Tối thiểu 10 ký tự · {reason.trim().length}/10</p>
            </div>

            <Input
              placeholder="Ghi chú bổ sung (không bắt buộc)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!step3Complete || isLoading} size="sm">
                {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
              <Button
                variant="outline"
                size="sm"
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

      <div className="h-px bg-border" />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái xử lý</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {request.decidedAt
            ? `Cập nhật ${format(parseISO(request.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}`
            : 'Chưa được xử lý'}
        </p>
      </div>
    </div>
  )
}
