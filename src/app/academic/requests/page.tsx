import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { 
  CalendarIcon, 
  FilterIcon, 
  HourglassIcon, 
  PlusCircleIcon, 
  SearchIcon, 
  UserIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { skipToken } from '@reduxjs/toolkit/query'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useGetPendingRequestsQuery,
  useGetAcademicRequestsQuery,
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useGetStudentMissedSessionsQuery,
  useGetStudentMakeupOptionsQuery,
  useCreateOnBehalfRequestMutation,
} from '@/store/services/studentRequestApi'
import { useGetStudentsQuery, type StudentListItemDTO } from '@/store/services/studentApi'
import { REQUEST_STATUS_META } from '@/constants/absence'

type RequestType = 'ABSENCE' | 'MAKEUP' | 'TRANSFER' | 'ALL'
type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const PENDING_PAGE_SIZE = 6
const HISTORY_PAGE_SIZE = 8
const WEEKS_OPTIONS = [
  { value: 2, label: '2 tuần' },
  { value: 4, label: '4 tuần' },
  { value: 6, label: '6 tuần' },
]

export default function AcademicRequestsPage() {
  // Filter states
  const [requestTypeFilter, setRequestTypeFilter] = useState<RequestType>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [classCode, setClassCode] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [todayOnly, setTodayOnly] = useState(false)

  // Pagination states
  const [pendingPage, setPendingPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL')

  // Dialog states
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [decisionRejectReason, setDecisionRejectReason] = useState('')

  // On-behalf creation states
  const [showOnBehalfDialog, setShowOnBehalfDialog] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentListItemDTO | null>(null)
  const [weeksBack, setWeeksBack] = useState(4)
  const [selectedMissedId, setSelectedMissedId] = useState<number | null>(null)
  const [selectedMakeupId, setSelectedMakeupId] = useState<number | null>(null)
  const [onBehalfReason, setOnBehalfReason] = useState('')
  const [onBehalfNote, setOnBehalfNote] = useState('')

  // Fetch pending requests
  const {
    data: pendingResponse,
    isFetching: isLoadingPending,
  } = useGetPendingRequestsQuery({
    requestType: requestTypeFilter === 'ALL' ? undefined : requestTypeFilter,
    studentName: searchKeyword || undefined,
    classCode: classCode || undefined,
    sessionDateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    sessionDateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    page: pendingPage,
    size: PENDING_PAGE_SIZE,
    sort: 'submittedAt,asc',
  })

  const pendingData = pendingResponse?.data
  const pendingList = useMemo(
    () => pendingResponse?.data?.content ?? [],
    [pendingResponse?.data?.content]
  )

  const displayedPending = useMemo(() => {
    return pendingList.filter((request) => {
      if (urgentOnly && (request.daysUntilSession ?? Number.MAX_SAFE_INTEGER) > 2) {
        return false
      }
      if (todayOnly) {
        if (!request.targetSession) return false
        const sessionDate = parseISO(request.targetSession.date)
        const today = new Date()
        if (
          sessionDate.getFullYear() !== today.getFullYear() ||
          sessionDate.getMonth() !== today.getMonth() ||
          sessionDate.getDate() !== today.getDate()
        ) {
          return false
        }
      }
      return true
    })
  }, [pendingList, urgentOnly, todayOnly])

  const totalPendingPages = pendingData?.totalPages ?? 0

  // Fetch history
  const {
    data: historyResponse,
    isFetching: isLoadingHistory,
  } = useGetAcademicRequestsQuery({
    requestType: requestTypeFilter === 'ALL' ? undefined : requestTypeFilter,
    status: historyFilter === 'ALL' ? undefined : historyFilter,
    studentName: searchKeyword || undefined,
    classCode: classCode || undefined,
    page: historyPage,
    size: HISTORY_PAGE_SIZE,
    sort: 'decidedAt,desc',
  })

  const historyItems = useMemo(
    () => historyResponse?.data?.content ?? [],
    [historyResponse?.data?.content]
  )
  const totalHistoryPages = historyResponse?.data?.page?.totalPages ?? 0

  // Fetch request detail
  const {
    data: detailResponse,
    isFetching: isLoadingDetail,
  } = useGetRequestDetailQuery(selectedRequestId ?? skipToken, {
    skip: selectedRequestId === null,
  })

  const detailRequest = detailResponse?.data

  // Mutations
  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation()
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation()

  const handleDecision = async (type: 'APPROVE' | 'REJECT') => {
    if (!detailRequest) return

    try {
      if (type === 'APPROVE') {
        await approveRequest({
          id: detailRequest.id,
          note: decisionNote.trim() || undefined,
        }).unwrap()
        toast.success('Đã chấp thuận yêu cầu')
      } else {
        if (decisionRejectReason.trim().length < 10) {
          toast.error('Lý do từ chối cần tối thiểu 10 ký tự')
          return
        }
        await rejectRequest({
          id: detailRequest.id,
          rejectionReason: decisionRejectReason.trim(),
        }).unwrap()
        toast.success('Đã từ chối yêu cầu')
      }

      setDecisionNote('')
      setDecisionRejectReason('')
      setSelectedRequestId(null)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        'Không thể xử lý yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  // On-behalf request logic
  const shouldSearchStudents = studentSearch.trim().length >= 2
  const studentQueryResult = useGetStudentsQuery(
    shouldSearchStudents
      ? {
          search: studentSearch.trim(),
          size: 5,
          page: 0,
        }
      : skipToken,
    {
      skip: !shouldSearchStudents,
    }
  )

  const isSearchingStudents = shouldSearchStudents && studentQueryResult.isFetching
  const studentOptions = (studentQueryResult.data as { data?: { content: StudentListItemDTO[] } })?.data?.content ?? []

  const {
    data: missedResponse,
    isFetching: isLoadingStudentMissed,
  } = useGetStudentMissedSessionsQuery(
    selectedStudent
      ? {
          studentId: selectedStudent.id,
          weeksBack,
          excludeRequested: true,
        }
      : skipToken,
    {
      skip: !selectedStudent,
    }
  )

  const missedSessions = useMemo(
    () => missedResponse?.data?.missedSessions ?? [],
    [missedResponse?.data?.missedSessions]
  )
  const selectedMissedSession = useMemo(
    () => missedSessions.find((session) => session.sessionId === selectedMissedId),
    [missedSessions, selectedMissedId]
  )

  useEffect(() => {
    setSelectedMakeupId(null)
  }, [selectedMissedId])

  const {
    data: optionsResponse,
    isFetching: isLoadingStudentOptions,
  } = useGetStudentMakeupOptionsQuery(
    selectedStudent && selectedMissedId
      ? {
          studentId: selectedStudent.id,
          targetSessionId: selectedMissedId,
        }
      : skipToken,
    {
      skip: !selectedStudent || !selectedMissedId,
    }
  )

  const makeupOptions = useMemo(
    () => optionsResponse?.data?.makeupOptions ?? [],
    [optionsResponse?.data?.makeupOptions]
  )
  const selectedMakeupOption = useMemo(
    () => makeupOptions.find((option) => option.sessionId === selectedMakeupId),
    [makeupOptions, selectedMakeupId]
  )

  const [createOnBehalf, { isLoading: isCreatingOnBehalf }] = useCreateOnBehalfRequestMutation()

  const canSubmitOnBehalf =
    selectedStudent &&
    selectedMissedSession &&
    selectedMakeupOption &&
    onBehalfReason.trim().length >= 10

  const handleCreateOnBehalf = async () => {
    if (!canSubmitOnBehalf) return

    try {
      await createOnBehalf({
        requestType: 'MAKEUP',
        currentClassId: selectedMissedSession.classInfo.classId,
        targetSessionId: selectedMissedId!,
        makeupSessionId: selectedMakeupId!,
        requestReason: onBehalfReason.trim(),
        note: onBehalfNote.trim() || undefined,
        studentId: selectedStudent.id,
      }).unwrap()

      toast.success('Đã tạo và tự động duyệt yêu cầu học bù')
      setShowOnBehalfDialog(false)
      setSelectedStudent(null)
      setStudentSearch('')
      setSelectedMissedId(null)
      setSelectedMakeupId(null)
      setOnBehalfReason('')
      setOnBehalfNote('')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Không thể tạo yêu cầu thay học viên.'
      toast.error(message)
    }
  }

  const summaryItems = [
    {
      label: 'Đang chờ duyệt',
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
      label: 'Đơn học bù',
      value: pendingData?.summary?.makeupRequests ?? 0,
      accent: 'text-slate-600',
    },
    {
      label: 'Đơn chuyển lớp',
      value: pendingData?.summary?.transferRequests ?? 0,
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
      title="Quản lý yêu cầu"
      description="Xét duyệt yêu cầu nghỉ học, học bù, chuyển lớp và tạo yêu cầu thay học viên."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowOnBehalfDialog(true)}>
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          Tạo yêu cầu thay học viên
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Summary Stats */}
        <section className="grid gap-4 md:grid-cols-5">
          {summaryItems.map((item) => (
            <div key={item.label} className="space-y-1 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn('text-2xl font-semibold', item.accent)}>{item.value}</p>
            </div>
          ))}
        </section>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Hàng đợi ({pendingData?.summary?.totalPending ?? 0})</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Select
                  value={requestTypeFilter}
                  onValueChange={(value) => {
                    setRequestTypeFilter(value as RequestType)
                    setPendingPage(0)
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả loại</SelectItem>
                    <SelectItem value="ABSENCE">Xin nghỉ</SelectItem>
                    <SelectItem value="MAKEUP">Học bù</SelectItem>
                    <SelectItem value="TRANSFER">Chuyển lớp</SelectItem>
                  </SelectContent>
                </Select>

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
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-60">
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
                      ? `${format(dateRange.from, 'dd/MM')} - ${
                          dateRange.to ? format(dateRange.to, 'dd/MM') : '...'
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

            <div className="space-y-3">
              {isLoadingPending ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-36 w-full rounded-lg" />
                  ))}
                </div>
              ) : displayedPending.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
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
                        'rounded-lg border p-4 transition-colors',
                        isUrgent ? 'border-amber-300 bg-amber-50/70' : ''
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              {request.requestType === 'ABSENCE' && 'Xin nghỉ'}
                              {request.requestType === 'MAKEUP' && 'Học bù'}
                              {request.requestType === 'TRANSFER' && 'Chuyển lớp'}
                            </Badge>
                            {isUrgent && (
                              <Badge className="rounded-full bg-amber-600/80 text-white">Khẩn cấp</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">#{request.student.studentCode}</p>
                          <h3 className="text-lg font-semibold">{request.student.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{request.student.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{request.currentClass.name}</p>
                          <p className="text-xs text-muted-foreground">{request.currentClass.branch?.name}</p>
                          {request.targetSession ? (
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(request.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                              {request.targetSession.timeSlot.startTime}-
                              {request.targetSession.timeSlot.endTime}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>

                      {request.requestType === 'MAKEUP' && request.makeupSession && (
                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                            Buổi học bù được chọn
                          </p>
                          <p className="text-sm font-semibold">
                            {format(parseISO(request.makeupSession.date), "EEEE, dd/MM/yyyy", { locale: vi })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.makeupSession.classInfo?.classCode ?? 'Đang cập nhật'} · {request.makeupSession.timeSlot.startTime} - {request.makeupSession.timeSlot.endTime}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          Còn {request.daysUntilSession ?? '-'} ngày
                        </span>
                        <span className="inline-flex items-center gap-1">
                          Tỉ lệ nghỉ: <span className="font-semibold text-rose-600">{absenceRate}%</span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          "{request.requestReason}"
                        </p>
                        <Button variant="ghost" onClick={() => setSelectedRequestId(request.id)}>
                          Xem & xử lý
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {totalPendingPages > 1 && (
              <div className="flex items-center justify-between text-sm">
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
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Lịch sử xử lý</h2>
              <p className="text-sm text-muted-foreground">
                Tra cứu quyết định cũ để đảm bảo tính nhất quán và minh bạch.
              </p>
            </div>

            <Tabs
              value={historyFilter}
              onValueChange={(value) => {
                setHistoryFilter(value as HistoryFilter)
                setHistoryPage(0)
              }}
            >
              <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0">
                {historyTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-full border px-4 py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary/10"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={historyFilter} className="mt-4">
                <div className="rounded-lg border">
                  {isLoadingHistory ? (
                    <div className="space-y-3 p-4">
                      {[...Array(5)].map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : historyItems.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại</TableHead>
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
                              <Badge variant="outline" className="rounded-full">
                                {request.requestType === 'ABSENCE' && 'Nghỉ'}
                                {request.requestType === 'MAKEUP' && 'Bù'}
                                {request.requestType === 'TRANSFER' && 'Chuyển'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold">{request.student.fullName}</span>
                                <span className="text-xs text-muted-foreground">{request.student.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{request.currentClass.name}</p>
                                {request.targetSession ? (
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(request.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                                    {request.targetSession.timeSlot.startTime}-
                                    {request.targetSession.timeSlot.endTime}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">—</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  'rounded-full text-xs font-medium',
                                  REQUEST_STATUS_META[request.status as keyof typeof REQUEST_STATUS_META]?.badgeClass || 'bg-muted'
                                )}
                              >
                                {REQUEST_STATUS_META[request.status as keyof typeof REQUEST_STATUS_META]?.label || request.status}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Detail Dialog */}
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
        <DialogContent className="max-w-2xl rounded-lg">
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
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Học viên</p>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{detailRequest.student.fullName}</p>
                    <p className="text-sm text-muted-foreground">{detailRequest.student.email}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Lớp học</p>
                    <p className="font-semibold">{detailRequest.currentClass.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {detailRequest.currentClass.branch?.name ?? '—'}
                    </p>
                  </div>
                  {detailRequest.targetSession ? (
                    <div className="text-right text-sm text-muted-foreground">
                      <p>
                        {format(parseISO(detailRequest.targetSession.date), "dd/MM/yyyy", { locale: vi })} ·{' '}
                        {detailRequest.targetSession.timeSlot.startTime}-
                        {detailRequest.targetSession.timeSlot.endTime}
                      </p>
                      <p>Còn {detailRequest.daysUntilSession ?? '-'} ngày</p>
                    </div>
                  ) : (
                    <div className="text-right text-sm text-muted-foreground">
                      <p>—</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tỉ lệ nghỉ</p>
                  <div className="h-2 w-full rounded-full bg-muted/40">
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

              {detailRequest.requestType === 'MAKEUP' && detailRequest.makeupSession && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Buổi học bù được chọn</p>
                    <p className="text-sm font-semibold">
                      {format(parseISO(detailRequest.makeupSession.date), "EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detailRequest.makeupSession.classInfo?.classCode ?? 'Đang cập nhật'} · {detailRequest.makeupSession.timeSlot.startTime} - {detailRequest.makeupSession.timeSlot.endTime}
                    </p>
                  </div>
                </>
              )}

              <div className="h-px bg-border" />

              <div>
                <p className="text-sm font-semibold mb-1">Lý do</p>
                <p className="text-sm text-muted-foreground">{detailRequest.requestReason}</p>
                {detailRequest.note && (
                  <>
                    <p className="mt-3 text-sm font-semibold">Ghi chú thêm</p>
                    <p className="mt-1 text-sm text-muted-foreground">{detailRequest.note}</p>
                  </>
                )}
              </div>

              {detailRequest.status === 'PENDING' && (
                <>
                  <div className="h-px bg-border" />

                  <div className="space-y-3">
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
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* On-Behalf Creation Dialog */}
      <Dialog open={showOnBehalfDialog} onOpenChange={setShowOnBehalfDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu học bù thay học viên</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Hệ thống sẽ tự động phê duyệt ngay sau khi chọn lớp và lý do phù hợp.
            </p>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-lg border p-4">
              <label className="text-sm font-medium">Tìm học viên</label>
              <Input
                placeholder="Nhập tên hoặc mã học viên"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
              {studentSearch.trim().length > 0 && (
                <div className="space-y-2">
                  {isSearchingStudents ? (
                    <Skeleton className="h-10 w-full rounded-lg" />
                  ) : studentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không tìm thấy học viên phù hợp.</p>
                  ) : (
                    <ul className="space-y-1">
                      {studentOptions.map((student) => (
                        <li key={student.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student)
                              setStudentSearch('')
                              setSelectedMissedId(null)
                              setSelectedMakeupId(null)
                            }}
                            className="flex w-full flex-col rounded-lg border p-3 text-left text-sm hover:border-primary/40"
                          >
                            <span className="font-medium">{student.fullName}</span>
                            <span className="text-xs text-muted-foreground">{student.studentCode} · {student.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {selectedStudent && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-semibold">{selectedStudent.fullName}</p>
                  <p className="text-muted-foreground">{selectedStudent.studentCode}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedStudent(null)
                      setSelectedMissedId(null)
                      setSelectedMakeupId(null)
                    }}
                  >
                    Chọn học viên khác
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={weeksBack.toString()} onValueChange={(value) => setWeeksBack(Number(value))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!selectedStudent}
                  onClick={() => {
                    setSelectedMissedId(null)
                    setSelectedMakeupId(null)
                  }}
                >
                  <RefreshCcwIcon className="mr-2 h-4 w-4" />
                  Tải lại
                </Button>
              </div>

              {selectedStudent && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Chọn buổi đã vắng ({missedSessions.length})</p>
                  {isLoadingStudentMissed ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : missedSessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Không tìm thấy buổi vắng nào trong {weeksBack} tuần gần nhất.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {missedSessions.map((session) => (
                        <li key={session.sessionId}>
                          <button
                            type="button"
                            onClick={() => setSelectedMissedId(session.sessionId)}
                            className={cn(
                              'w-full rounded-lg border p-3 text-left transition hover:border-primary/40',
                              selectedMissedId === session.sessionId && 'border-primary bg-primary/5'
                            )}
                          >
                            <p className="text-sm font-semibold">
                              {format(parseISO(session.date), 'dd/MM/yyyy', { locale: vi })} · Buổi {session.courseSessionNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.classInfo.classCode} · {session.timeSlotInfo.startTime} - {session.timeSlotInfo.endTime}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {selectedMissedSession && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Gợi ý buổi học bù</p>
                      {isLoadingStudentOptions ? (
                        <Skeleton className="h-24 w-full rounded-lg" />
                      ) : makeupOptions.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Không có buổi học bù khả dụng cho buổi này.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {makeupOptions.map((option) => (
                            <li key={option.sessionId}>
                              <button
                                type="button"
                                onClick={() => setSelectedMakeupId((prev) => (prev === option.sessionId ? null : option.sessionId))}
                                className={cn(
                                  'w-full rounded-lg border p-3 text-left transition hover:border-primary/40',
                                  selectedMakeupId === option.sessionId && 'border-primary bg-primary/5'
                                )}
                              >
                                <p className="text-sm font-semibold">
                                  {format(parseISO(option.date), 'dd/MM/yyyy', { locale: vi })} · {option.classInfo.classCode}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {option.timeSlotInfo.startTime} - {option.timeSlotInfo.endTime} · {option.availableSlots}/{option.maxCapacity} chỗ
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 rounded-lg border p-4">
                    <label className="text-sm font-medium" htmlFor="onbehalf-reason">
                      Lý do học bù<span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      id="onbehalf-reason"
                      rows={4}
                      placeholder="Ví dụ: Nghỉ theo quyết định chuyên môn, yêu cầu từ phụ huynh..."
                      value={onBehalfReason}
                      onChange={(event) => setOnBehalfReason(event.target.value)}
                      disabled={!selectedMakeupOption}
                    />
                    <Input
                      placeholder="Ghi chú (tuỳ chọn)"
                      value={onBehalfNote}
                      onChange={(event) => setOnBehalfNote(event.target.value)}
                      disabled={!selectedMakeupOption}
                    />
                    <Button onClick={handleCreateOnBehalf} disabled={!canSubmitOnBehalf} className="w-full">
                      {isCreatingOnBehalf ? 'Đang tạo yêu cầu...' : (
                        <>
                          <ShieldCheckIcon className="mr-2 h-4 w-4" />
                          Tạo & tự động duyệt
                        </>
                      )}
                    </Button>
                    {selectedMakeupOption && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3" />
                        Yêu cầu sẽ được phê duyệt tự động ngay lập tức
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
