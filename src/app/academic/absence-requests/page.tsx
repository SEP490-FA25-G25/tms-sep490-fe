import { useMemo, useState } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import {
  AlertCircleIcon,
  CalendarIcon,
  Clock4Icon,
  FilterIcon,
  HourglassIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useGetPendingRequestsQuery,
  useGetAcademicRequestsQuery,
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  type RequestStatus,
} from '@/store/services/studentRequestApi'
import { ABSENCE_STATUS_META } from '@/constants/absence'

type HistoryFilter = RequestStatus | 'ALL'

const PENDING_PAGE_SIZE = 6
const HISTORY_PAGE_SIZE = 8

export default function AcademicAbsenceRequestsPage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [classCode, setClassCode] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [pendingPage, setPendingPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [todayOnly, setTodayOnly] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [decisionRejectReason, setDecisionRejectReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null)

  const {
    data: pendingResponse,
    isFetching: isLoadingPending,
  } = useGetPendingRequestsQuery({
    requestType: 'ABSENCE',
    keyword: searchKeyword || classCode || undefined,
    sessionDateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    sessionDateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    page: pendingPage,
    size: PENDING_PAGE_SIZE,
    sort: 'submittedAt,asc',
  })

  const {
    data: historyResponse,
    isFetching: isLoadingHistory,
  } = useGetAcademicRequestsQuery({
    status: historyFilter === 'ALL' ? undefined : historyFilter,
    keyword: searchKeyword || classCode || undefined,
    page: historyPage,
    size: HISTORY_PAGE_SIZE,
    sort: 'submittedAt,desc',
  })

  const {
    data: detailResponse,
    isFetching: isLoadingDetail,
  } = useGetRequestDetailQuery(selectedRequestId ?? 0, {
    skip: selectedRequestId === null,
  })

  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation()
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation()

  const pendingData = pendingResponse?.data
  const historyData = historyResponse?.data
  const historyItems = historyData?.content ?? []

  const displayedPending = useMemo(() => {
    const list = pendingData?.content ?? []
    return list.filter((request) => {
      if (urgentOnly && (request.daysUntilSession ?? Number.MAX_SAFE_INTEGER) > 2) {
        return false
      }
      if (todayOnly && !isSameDay(parseISO(request.targetSession.date), new Date())) {
        return false
      }
      return true
    })
  }, [pendingData?.content, urgentOnly, todayOnly])

  const totalPendingPages = pendingData?.totalPages ?? 0
  const totalHistoryPages = historyData?.page.totalPages ?? 0

  const detailRequest = detailResponse?.data

  const handleDecision = (type: 'APPROVE' | 'REJECT') => {
    if (!detailRequest) return

    // For reject, validate reason first
    if (type === 'REJECT' && decisionRejectReason.trim().length < 10) {
      toast.error('Lý do từ chối cần tối thiểu 10 ký tự')
      return
    }

    // Show confirmation dialog
    setConfirmAction(type)
  }

  const handleConfirmDecision = async () => {
    if (!detailRequest || !confirmAction) return

    try {
      if (confirmAction === 'APPROVE') {
        await approveRequest({
          id: detailRequest.id,
          note: decisionNote.trim() || undefined,
        }).unwrap()
        toast.success('Đã chấp thuận yêu cầu vắng mặt')
      } else {
        await rejectRequest({
          id: detailRequest.id,
          rejectionReason: decisionRejectReason.trim(),
        }).unwrap()
        toast.success('Đã từ chối yêu cầu vắng mặt')
      }

      setDecisionNote('')
      setDecisionRejectReason('')
      setConfirmAction(null)
      setSelectedRequestId(null)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Không thể xử lý yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const handleCancelDecision = () => {
    setConfirmAction(null)
  }

  const summaryItems = [
    {
      label: 'Chờ duyệt',
      value: pendingData?.summary?.totalPending ?? 0,
      accent: 'text-primary',
    },
    {
      label: 'Cần xử lý sớm',
      value: pendingData?.summary?.needsUrgentReview ?? 0,
      accent: 'text-amber-600',
    },
    {
      label: 'Đơn xin nghỉ',
      value: pendingData?.summary?.absenceRequests ?? 0,
      accent: 'text-slate-600',
    },
    {
      label: 'Đơn chuyển/bù',
      value: (pendingData?.summary?.makeupRequests ?? 0) + (pendingData?.summary?.transferRequests ?? 0),
      accent: 'text-slate-600',
    },
  ]

  const historyTabs: { label: string; value: HistoryFilter }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Đã duyệt', value: 'APPROVED' },
    { label: 'Đã từ chối', value: 'REJECTED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ]

  return (
    <DashboardLayout
      title="Xét duyệt đơn xin nghỉ"
      description="Quản lý hàng đợi phê duyệt, xử lý các yêu cầu khẩn và theo dõi lịch sử quyết định."
    >
      <div className="space-y-6">
        <section className="grid gap-3 rounded-3xl border border-border/60 bg-background/80 p-5 md:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="space-y-1 rounded-2xl border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn('text-2xl font-semibold', item.accent)}>{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/80 p-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Hàng đợi cần xử lý</h2>
              <p className="text-sm text-muted-foreground">
                Ưu tiên những yêu cầu gần tới giờ học hoặc có tỉ lệ nghỉ học cao.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={urgentOnly ? 'default' : 'outline'}
                size="sm"
                className={cn('rounded-full', urgentOnly ? 'bg-amber-500 text-white hover:bg-amber-600' : '')}
                onClick={() => setUrgentOnly((prev) => !prev)}
              >
                <HourglassIcon className="mr-1 h-4 w-4" />
                Khẩn cấp (&lt;= 2 ngày)
              </Button>
              <Button
                variant={todayOnly ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setTodayOnly((prev) => !prev)}
              >
                <CalendarIcon className="mr-1 h-4 w-4" />
                Buổi học hôm nay
              </Button>
            </div>
          </header>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Input
                placeholder="Tìm theo tên học viên / email"
                value={searchKeyword}
                onChange={(event) => {
                  setSearchKeyword(event.target.value)
                  setPendingPage(0)
                  setHistoryPage(0)
                }}
                className="pl-9"
              />
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Input
              placeholder="Mã lớp"
              value={classCode}
              onChange={(event) => {
                setClassCode(event.target.value)
                setPendingPage(0)
                setHistoryPage(0)
              }}
              className="w-40"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FilterIcon className="h-4 w-4" />
                  {dateRange?.from
                    ? `${format(dateRange.from, 'dd/MM')} - ${dateRange.to ? format(dateRange.to, 'dd/MM') : '...'
                    }`
                    : 'Khoảng ngày buổi học'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range)
                    setPendingPage(0)
                    setHistoryPage(0)
                  }}
                  numberOfMonths={2}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
            {(dateRange?.from || dateRange?.to) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDateRange(undefined)
                  setPendingPage(0)
                  setHistoryPage(0)
                }}
              >
                Xóa lọc
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {isLoadingPending ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-36 w-full rounded-2xl" />
                ))}
              </div>
            ) : displayedPending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                Không có yêu cầu nào cần xử lý theo bộ lọc hiện tại.
              </div>
            ) : (
              displayedPending.map((request) => {
                const isUrgent = (request.daysUntilSession ?? Number.MAX_SAFE_INTEGER) <= 2
                const absenceRate = request.studentAbsenceRate ?? 0
                return (
                  <div
                    key={request.id}
                    className={cn(
                      'rounded-3xl border p-5 transition-colors',
                      isUrgent ? 'border-amber-300 bg-amber-50/70' : 'border-border/70 bg-background/90'
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">#{request.student.studentCode}</p>
                        <h3 className="text-lg font-semibold">{request.student.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{request.student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{request.currentClass.name}</p>
                        <p className="text-xs text-muted-foreground">{request.currentClass.branch?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(request.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                          {request.targetSession.timeSlot.startTime}-
                          {request.targetSession.timeSlot.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock4Icon className="h-3.5 w-3.5" />
                        Còn {request.daysUntilSession ?? '-'} ngày
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <AlertCircleIcon className="h-3.5 w-3.5" />
                        Tỉ lệ nghỉ: <span className="font-semibold text-rose-600">{absenceRate}%</span>
                      </span>
                      {isUrgent && (
                        <Badge className="rounded-full bg-amber-600/80 text-white">Khẩn cấp</Badge>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm line-clamp-2 text-muted-foreground">
                        “{request.requestReason}”
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" onClick={() => setSelectedRequestId(request.id)}>
                          Xem & xử lý
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {totalPendingPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>
                Trang {pendingPage + 1}/{totalPendingPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingPage === 0}
                  onClick={() => setPendingPage((prev) => Math.max(prev - 1, 0))}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingPage + 1 >= totalPendingPages}
                  onClick={() => setPendingPage((prev) => Math.min(prev + 1, totalPendingPages - 1))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Lịch sử xử lý</h2>
              <p className="text-sm text-muted-foreground">
                Tra cứu quyết định cũ để đảm bảo tính nhất quán và minh bạch.
              </p>
            </div>
          </div>

          <Tabs
            value={historyFilter}
            onValueChange={(value) => {
              setHistoryFilter(value as HistoryFilter)
              setHistoryPage(0)
            }}
            className="mt-4"
          >
            <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0">
              {historyTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full border border-border/60 px-4 py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary/10"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={historyFilter} className="mt-4">
              <div className="rounded-2xl border border-border/60">
                {isLoadingHistory ? (
                  <div className="space-y-3 p-4">
                    {[...Array(5)].map((_, index) => (
                      <Skeleton key={index} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : historyItems.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Lớp học / Buổi</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Người xử lý</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{request.student.fullName}</span>
                              <span className="text-xs text-muted-foreground">{request.student.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{request.currentClass.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(request.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                                {request.targetSession.timeSlot.startTime}-
                                {request.targetSession.timeSlot.endTime}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'rounded-full text-xs font-medium',
                                ABSENCE_STATUS_META[request.status].badgeClass
                              )}
                            >
                              {ABSENCE_STATUS_META[request.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{request.decidedBy?.fullName ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">{request.decidedBy?.email ?? ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {request.decidedAt
                              ? format(parseISO(request.decidedAt), "HH:mm dd/MM", { locale: vi })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedRequestId(request.id)}>
                              Chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Không có lịch sử phù hợp với bộ lọc.
                  </div>
                )}
              </div>

              {totalHistoryPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>
                    Trang {historyPage + 1}/{totalHistoryPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPage === 0}
                      onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 0))}
                    >
                      Trước
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={historyPage + 1 >= totalHistoryPages}
                      onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages - 1))}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Dialog
        open={selectedRequestId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequestId(null)
            setDecisionNote('')
            setDecisionRejectReason('')
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
          </DialogHeader>

          {isLoadingDetail || !detailRequest ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-xs text-muted-foreground">Học viên</p>
                <div className="mt-1 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{detailRequest.student.fullName}</p>
                    <p className="text-sm text-muted-foreground">{detailRequest.student.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Lớp học</p>
                    <p className="font-semibold">{detailRequest.currentClass.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {detailRequest.currentClass.branch?.name ?? '—'}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      {format(parseISO(detailRequest.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                      {detailRequest.targetSession.timeSlot.startTime}-
                      {detailRequest.targetSession.timeSlot.endTime}
                    </p>
                    <p>Còn {detailRequest.daysUntilSession ?? '-'} ngày</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">Tỉ lệ nghỉ</p>
                  <div className="mt-1 h-2 w-full rounded-full bg-muted/40">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        (detailRequest.studentAbsenceRate ?? 0) > 20 ? 'bg-rose-500' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(detailRequest.studentAbsenceRate ?? 0, 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm font-semibold">
                    {detailRequest.studentAbsenceRate ?? 0}% tổng số buổi bị nghỉ
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Lý do xin nghỉ</p>
                <p className="mt-1 text-sm text-muted-foreground">{detailRequest.requestReason}</p>
                {detailRequest.note && (
                  <>
                    <p className="mt-4 text-sm font-semibold">Ghi chú thêm</p>
                    <p className="mt-1 text-sm text-muted-foreground">{detailRequest.note}</p>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 p-4 space-y-3">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Ghi chú phê duyệt (nếu có)</span>
                  <Textarea
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    placeholder="Ví dụ: Chấp thuận do có giấy hẹn khám bệnh..."
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Lý do từ chối</span>
                  <Textarea
                    value={decisionRejectReason}
                    onChange={(event) => setDecisionRejectReason(event.target.value)}
                    placeholder="Bắt buộc nhập khi chọn Từ chối"
                  />
                  <span className="text-xs text-muted-foreground">
                    Tối thiểu 10 ký tự để đảm bảo minh bạch khi từ chối.
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={isRejecting}
                  onClick={() => handleDecision('REJECT')}
                >
                  {isRejecting ? 'Đang từ chối...' : 'Từ chối'}
                </Button>
                <Button onClick={() => handleDecision('APPROVE')} disabled={isApproving}>
                  {isApproving ? 'Đang duyệt...' : 'Chấp thuận'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && handleCancelDecision()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'APPROVE' ? 'Xác nhận chấp thuận' : 'Xác nhận từ chối'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'APPROVE'
                ? 'Bạn có chắc chắn muốn chấp thuận yêu cầu xin nghỉ này? Hành động này không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn từ chối yêu cầu này? Lý do từ chối sẽ được gửi cho học viên.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDecision}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDecision}>
              {confirmAction === 'APPROVE' ? 'Chấp thuận' : 'Từ chối'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
