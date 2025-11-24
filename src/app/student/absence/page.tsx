import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, startOfToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  AlertCircleIcon,
  CalendarIcon,
  Clock4Icon,
  MapPinIcon,
  NotebookPenIcon,
  RefreshCcwIcon,
  ShieldXIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { StudentRoute } from '@/components/ProtectedRoute'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useGetAvailableSessionsQuery,
  useGetMyRequestByIdQuery,
  useGetMyRequestsQuery,
  useSubmitAbsenceRequestMutation,
  useCancelRequestMutation,
  type StudentClassSessions,
  type StudentAbsenceRequest,
  type RequestStatus,
} from '@/store/services/studentAbsenceRequestApi'
import { ABSENCE_STATUS_META } from '@/constants/absence'

type RequestFilter = RequestStatus | 'ALL'

interface SessionOption {
  classInfo: StudentClassSessions
  session: StudentClassSessions['sessions'][number]
}

const REQUEST_PAGE_SIZE = 8

export default function StudentAbsencePage() {
  const today = startOfToday()
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('ALL')
  const [page, setPage] = useState(0)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [dateSessionDensity, setDateSessionDensity] = useState<Record<string, number>>({})

  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  const {
    data: sessionsResponse,
    isFetching: isLoadingSessions,
    refetch: refetchSessions,
  } = useGetAvailableSessionsQuery(
    {
      date: formattedDate,
      requestType: 'ABSENCE',
    },
    {
      skip: !formattedDate,
    }
  )

  const {
    data: requestsResponse,
    isFetching: isLoadingRequests,
  } = useGetMyRequestsQuery({
    requestType: 'ABSENCE',
    status: requestFilter === 'ALL' ? undefined : requestFilter,
    page,
    size: REQUEST_PAGE_SIZE,
    sort: 'submittedAt,desc',
  })

  const {
    data: detailResponse,
    isFetching: isLoadingDetail,
  } = useGetMyRequestByIdQuery(detailId ?? 0, {
    skip: detailId === null,
  })

  const [submitAbsenceRequest, { isLoading: isSubmitting }] = useSubmitAbsenceRequestMutation()
  const [cancelRequest, { isLoading: isCancelling }] = useCancelRequestMutation()
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  const availableClasses = useMemo(() => sessionsResponse?.data ?? [], [sessionsResponse?.data])
  const totalSessionsForDay = useMemo(
    () => availableClasses.reduce((total, current) => total + current.sessionCount, 0),
    [availableClasses]
  )

  useEffect(() => {
    setSelectedSessionId(null)
  }, [formattedDate])

  useEffect(() => {
    if (!formattedDate) return
    setDateSessionDensity((prev) => {
      if (prev[formattedDate] === totalSessionsForDay) return prev
      return {
        ...prev,
        [formattedDate]: totalSessionsForDay,
      }
    })
  }, [formattedDate, totalSessionsForDay])

  const highlightDates = useMemo(
    () =>
      Object.entries(dateSessionDensity)
        .filter(([, count]) => count > 0)
        .map(([date]) => parseISO(date)),
    [dateSessionDensity]
  )

  const sessionOptions: SessionOption[] = useMemo(() => {
    return availableClasses.flatMap((cls) => cls.sessions.map((session) => ({ classInfo: cls, session })))
  }, [availableClasses])

  const selectedSession = useMemo(
    () => sessionOptions.find((option) => option.session.sessionId === selectedSessionId),
    [sessionOptions, selectedSessionId]
  )

  const requestData = requestsResponse?.data
  const requests = requestData?.content ?? []
  const pagination = requestData?.page
  const requestSummary = requestData?.summary
  const computedAbsenceRate =
    requestSummary?.absenceRate ??
    (requestSummary
      ? Math.round(((requestSummary.approved ?? 0) / Math.max(requestSummary.totalRequests || 1, 1)) * 100)
      : 0)
  const showAbsenceWarning = computedAbsenceRate >= 20

  const totalPages = pagination?.totalPages ?? 0

  const detailRequest = detailResponse?.data

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
      await submitAbsenceRequest({
        requestType: 'ABSENCE',
        currentClassId: selectedSession.classInfo.classId,
        targetSessionId: selectedSession.session.sessionId,
        requestReason: reason.trim(),
        note: note.trim() || undefined,
      }).unwrap()

      toast.success('Đã gửi yêu cầu xin nghỉ. Chúng tôi sẽ phản hồi sớm nhất.')
      setReason('')
      setNote('')
      setSelectedSessionId(null)
      refetchSessions()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Không thể gửi yêu cầu. Vui lòng thử lại sau.'
      toast.error(message)
    }
  }

  const handleCancel = async (request: StudentAbsenceRequest) => {
    setCancelingId(request.id)
    try {
      await cancelRequest(request.id).unwrap()
      toast.success('Yêu cầu đã được hủy')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Không thể hủy yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setCancelingId(null)
    }
  }

  const requestFilters: { label: string; value: RequestFilter }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đã chấp thuận', value: 'APPROVED' },
    { label: 'Đã từ chối', value: 'REJECTED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ]

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
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-primary">Xin nghỉ buổi học</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Quản lý đơn xin nghỉ</h1>
                    <p className="text-muted-foreground">
                      Gửi yêu cầu nghỉ học cho các buổi sắp tới và theo dõi trạng thái xử lý theo thời gian thực.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 px-4 lg:grid-cols-[420px_1fr] lg:px-6">
                  <section className="space-y-6 rounded-3xl border border-border/60 bg-background/80 p-5">
                    <header className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">Chọn buổi học</h2>
                        <p className="text-sm text-muted-foreground">
                          Lịch được đồng bộ với thời khóa biểu của bạn. Chỉ các buổi trong tương lai mới được hiển thị.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => {
                          setSelectedDate(today)
                          refetchSessions()
                        }}
                        aria-label="Tải lại dữ liệu"
                      >
                        <RefreshCcwIcon className="h-4 w-4" />
                      </Button>
                    </header>

                    <div className="rounded-2xl border border-dashed border-border/60 p-3">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        locale={vi}
                        modifiers={{
                          hasSessions: highlightDates,
                        }}
                        modifiersClassNames={{
                          hasSessions:
                            'after:absolute after:bottom-1.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary/80',
                        }}
                      />
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/80"></span>
                        <span>Ngày có buổi học khả dụng</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 p-4">
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Buổi học đã chọn</p>
                        <div className="space-y-2">
                          <p className="text-base font-semibold">
                            {format(selectedDate, "EEEE, dd 'tháng' MM", { locale: vi })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {totalSessionsForDay > 0
                              ? `${totalSessionsForDay} buổi có thể xin nghỉ`
                              : 'Không có buổi nào trong ngày này'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Chọn buổi muốn xin nghỉ</p>
                      {isLoadingSessions ? (
                        <div className="space-y-3">
                          {[...Array(2)].map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                          ))}
                        </div>
                      ) : sessionOptions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                          Không có buổi học nào để xin nghỉ trong ngày được chọn.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessionOptions.map((option) => {
                            const isSelected = selectedSessionId === option.session.sessionId
                            return (
                              <button
                                key={option.session.sessionId}
                                type="button"
                                className={cn(
                                  'w-full rounded-2xl border p-4 text-left transition-colors',
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/40'
                                )}
                                onClick={() => setSelectedSessionId(option.session.sessionId)}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">{option.classInfo.className}</p>
                                    <Badge variant="outline" className="rounded-full border-dashed">
                                      {option.classInfo.classCode}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock4Icon className="h-4 w-4" />
                                      {option.session.timeSlot.startTime} - {option.session.timeSlot.endTime}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <NotebookPenIcon className="h-4 w-4" />
                                      Buổi {option.session.courseSessionNumber}: {option.session.courseSessionTitle}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-6 rounded-3xl border border-border/60 bg-background/80 p-6">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-semibold">Lý do xin nghỉ</h2>
                      <p className="text-sm text-muted-foreground">
                        Cung cấp thông tin để Phòng Học vụ có đủ dữ liệu xét duyệt. Lý do càng cụ thể càng tốt.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Lý do chính *</span>
                        <Textarea
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Ví dụ: Khám bệnh đã đặt lịch trước, không thể thay đổi..."
                          rows={4}
                        />
                        <span className="text-xs text-muted-foreground">
                          Tối thiểu 10 ký tự. Đừng chia sẻ thông tin nhạy cảm.
                        </span>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Ghi chú thêm (không bắt buộc)</span>
                        <Input
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Kế hoạch tự học, cam kết bù bài..."
                        />
                      </label>

                      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
                        <p className="font-semibold">Nhắc nhẹ</p>
                        <p className="mt-1">
                          Vui lòng gửi yêu cầu ít nhất 24 giờ trước buổi học. Các yêu cầu gửi trễ có thể bị từ chối.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">Buổi đã chọn</p>
                        {selectedSession ? (
                          <p className="text-sm text-muted-foreground">
                            {selectedSession.classInfo.className} ·{' '}
                            {selectedSession.session.timeSlot.startTime}-
                            {selectedSession.session.timeSlot.endTime}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Chưa chọn buổi nào</p>
                        )}
                      </div>
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                      </Button>
                    </div>

                    {showAbsenceWarning && (
                      <Alert variant="destructive" className="rounded-2xl border border-rose-200 bg-rose-50">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle>Tỉ lệ nghỉ học cao ({computedAbsenceRate}%)</AlertTitle>
                        <AlertDescription>
                          Bạn đã nghỉ học khá nhiều trong thời gian gần đây. Hạn chế xin nghỉ để tránh ảnh hưởng tiến độ.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded-2xl border border-border/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">Tỉ lệ nghỉ học</p>
                          <p className="text-2xl font-bold">{computedAbsenceRate}%</p>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-semibold text-emerald-600">{requestSummary?.approved ?? 0}</span>
                            <span>Đã duyệt</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sky-600">{requestSummary?.pending ?? 0}</span>
                            <span>Chờ duyệt</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-rose-600">{requestSummary?.rejected ?? 0}</span>
                            <span>Bị từ chối</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="space-y-4 px-4 lg:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Lịch sử yêu cầu</h2>
                      <p className="text-sm text-muted-foreground">
                        Theo dõi trạng thái từng yêu cầu và hủy nếu vẫn đang chờ duyệt.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {requestFilters.map((filter) => (
                        <Button
                          key={filter.value}
                          size="sm"
                          variant={requestFilter === filter.value ? 'default' : 'ghost'}
                          className="rounded-full"
                          onClick={() => {
                            setRequestFilter(filter.value)
                            setPage(0)
                          }}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/80">
                    {isLoadingRequests ? (
                      <div className="space-y-3 p-4">
                        {[...Array(4)].map((_, index) => (
                          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                        ))}
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <ShieldXIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-semibold">Chưa có yêu cầu nào</p>
                        <p className="text-sm text-muted-foreground">
                          Gửi yêu cầu xin nghỉ và bạn sẽ thấy lịch sử xử lý tại đây.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {requests.map((request) => {
                          const meta = ABSENCE_STATUS_META[request.status]
                          return (
                            <li key={request.id} className="p-4 hover:bg-muted/20">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Badge className={cn('rounded-full text-xs font-medium', meta.badgeClass)}>
                                      {meta.label}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                      Gửi lúc {format(parseISO(request.submittedAt), 'HH:mm dd/MM', { locale: vi })}
                                    </p>
                                  </div>
                                  <p className="text-base font-semibold">{request.currentClass.name}</p>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarIcon className="h-4 w-4" />
                                      {format(parseISO(request.targetSession.date), "dd/MM/yyyy", { locale: vi })}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <Clock4Icon className="h-4 w-4" />
                                      {request.targetSession.timeSlot.startTime} -{' '}
                                      {request.targetSession.timeSlot.endTime}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setDetailId(request.id)}>
                                    Xem chi tiết
                                  </Button>
                                  {request.status === 'PENDING' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                                      onClick={() => handleCancel(request)}
                                      disabled={isCancelling && cancelingId === request.id}
                                    >
                                      {isCancelling && cancelingId === request.id ? 'Đang hủy...' : 'Hủy yêu cầu'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm">
                      <span>
                        Trang {page + 1}/{totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                          disabled={page === 0}
                        >
                          Trước
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage((prev) =>
                            Math.min(prev + 1, (pagination?.totalPages ?? 1) - 1)
                          )}
                          disabled={page + 1 >= (pagination?.totalPages ?? 1)}
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
          </DialogHeader>
          {isLoadingDetail || !detailRequest ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm text-muted-foreground">Lớp học</p>
                <p className="text-lg font-semibold">{detailRequest.currentClass.name}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(parseISO(detailRequest.targetSession.date), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock4Icon className="h-4 w-4" />
                    {detailRequest.targetSession.timeSlot.startTime} - {detailRequest.targetSession.timeSlot.endTime}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {detailRequest.currentClass.branch?.name ?? 'Đang cập nhật'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Lý do</p>
                <p className="text-sm text-muted-foreground">{detailRequest.requestReason}</p>
              </div>

              {detailRequest.note && (
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm font-semibold">Ghi chú</p>
                  <p className="text-sm text-muted-foreground">{detailRequest.note}</p>
                </div>
              )}

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Trạng thái</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge
                    className={cn(
                      'rounded-full text-xs font-medium',
                      ABSENCE_STATUS_META[detailRequest.status].badgeClass
                    )}
                  >
                    {ABSENCE_STATUS_META[detailRequest.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {detailRequest.decidedAt
                      ? `Cập nhật lúc ${format(parseISO(detailRequest.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}`
                      : 'Chưa được xử lý'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentRoute>
  )
}
