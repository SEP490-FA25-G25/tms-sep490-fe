import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGetClassByIdQuery, useApproveClassMutation, useRejectClassMutation } from '@/store/services/classApi'
import { useGetClassSessionsQuery } from '@/store/services/classCreationApi'
import type { GeneratedClassSession } from '@/types/classCreation'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

interface ApprovalDetailDrawerProps {
  classId: number | null
  open: boolean
  onClose: () => void
  onActionComplete?: () => void
}

const DAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
}

const formatDate = (value?: string | null, formatString = 'dd/MM/yyyy') => {
  if (!value) return '--'
  try {
    return format(new Date(value), formatString, { locale: vi })
  } catch {
    return value
  }
}

const formatScheduleDays = (days?: number[], fallback?: string) => {
  if (Array.isArray(days) && days.length > 0) {
    const normalized = Array.from(new Set(days))
      .map((day) => (typeof day === 'number' ? ((day % 7) + 7) % 7 : undefined))
      .filter((day): day is number => typeof day === 'number')
      .sort((a, b) => a - b)
    if (normalized.length > 0) {
      return normalized.map((day) => DAY_LABELS[day]).join(' • ')
    }
  }
  return fallback || 'Đang cập nhật'
}

const getApprovalBadgeVariant = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'secondary'
    case 'APPROVED':
      return 'default'
    case 'REJECTED':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getClassStatusLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Nháp'
    case 'SCHEDULED':
      return 'Đã lên lịch'
    case 'ONGOING':
      return 'Đang diễn ra'
    case 'COMPLETED':
      return 'Hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
    default:
      return status || 'Không xác định'
  }
}

const getApprovalStatusLabel = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ duyệt'
    case 'APPROVED':
      return 'Đã duyệt'
    case 'REJECTED':
      return 'Bị trả về'
    default:
      return status || 'Không xác định'
  }
}

type TeacherSummary = {
  id: string | number
  fullName: string
  email?: string
  employeeCode?: string
  sessionCount: number
}

const buildSessionMap = (sessions: GeneratedClassSession[]) => {
  const map = new Map<number, GeneratedClassSession>()
  sessions.forEach((session) => {
    map.set(session.sessionId, session)
  })
  return map
}

const extractCommonTimeSlot = (sessions: GeneratedClassSession[]) => {
  const slotSet = new Set<string>()
  sessions.forEach((session) => {
    const label =
      session.timeSlotName ||
      session.timeSlotLabel ||
      session.timeSlotInfo?.displayName ||
      (session.timeSlotInfo?.startTime && session.timeSlotInfo?.endTime
        ? `${session.timeSlotInfo.startTime} - ${session.timeSlotInfo.endTime}`
        : undefined)
    if (label && typeof label === 'string') slotSet.add(label)
  })
  if (slotSet.size === 0) return null
  if (slotSet.size === 1) return Array.from(slotSet)[0]
  return Array.from(slotSet).join(', ')
}

export function ApprovalDetailDrawer({ classId, open, onClose, onActionComplete }: ApprovalDetailDrawerProps) {
  const { data: detailResponse, isFetching: isDetailLoading, error: detailError } = useGetClassByIdQuery(classId ?? 0, {
    skip: !classId || !open,
  })
  const {
    data: sessionsResponse,
    isFetching: isSessionsLoading,
    error: sessionsError,
  } = useGetClassSessionsQuery(classId ?? 0, {
    skip: !classId || !open,
  })
  const [approveClass, { isLoading: isApproving }] = useApproveClassMutation()
  const [rejectClass, { isLoading: isRejecting }] = useRejectClassMutation()
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const overview = detailResponse?.data
  const sessions = sessionsResponse?.data?.sessions ?? []
  const groupedWeeks = sessionsResponse?.data?.groupedByWeek ?? []
  const sessionMap = useMemo(() => buildSessionMap(sessions), [sessions])

  const submittedAtValue = useMemo(() => overview?.submittedAt, [overview])
  const decidedAtValue = useMemo(() => overview?.decidedAt, [overview])

  const summary = useMemo(() => {
    if (!sessions.length) {
      return {
        total: 0,
        timeSlots: 0,
        resources: 0,
        teachers: 0,
      }
    }
    return {
      total: sessions.length,
      timeSlots: sessions.filter((session) => session.hasTimeSlot).length,
      resources: sessions.filter((session) => session.hasResource).length,
      teachers: sessions.filter((session) => session.hasTeacher).length,
    }
  }, [sessions])

  const teacherSummaries: TeacherSummary[] = useMemo(() => {
    if (overview?.teachers?.length) {
      return overview.teachers.map((teacher) => ({
        id: teacher.id ?? teacher.teacherId ?? teacher.email ?? teacher.fullName,
        fullName: teacher.fullName,
        email: teacher.email,
        employeeCode: (teacher as { employeeCode?: string }).employeeCode,
        sessionCount: teacher.sessionCount,
      }))
    }

    const map = new Map<string | number, TeacherSummary>()
    sessions.forEach((session) => {
      if (session.teachers?.length) {
        session.teachers.forEach((teacher) => {
          const id = teacher.teacherId ?? teacher.fullName ?? teacher.name ?? session.sessionId
          const name = teacher.fullName || teacher.name || 'Giáo viên'
          const existing = map.get(id)
          map.set(id, {
            id,
            fullName: name,
            sessionCount: existing ? existing.sessionCount + 1 : 1,
          })
        })
      } else if (session.teacherNames) {
        const names = session.teacherNames.split(',').map((name) => name.trim()).filter(Boolean)
        names.forEach((name, index) => {
          const id = `${session.sessionId}-${index}-${name}`
          const existing = map.get(id)
          map.set(id, {
            id,
            fullName: name,
            sessionCount: existing ? existing.sessionCount + 1 : 1,
          })
        })
      }
    })

    return Array.from(map.values())
  }, [overview?.teachers, sessions])

  const timeSlotSummary = useMemo(() => extractCommonTimeSlot(sessions), [sessions])

  const resourceSummary = useMemo(() => {
    if (overview?.room) return overview.room
    const resourceMap = new Map<string, number>()
    sessions.forEach((session) => {
      const resource = session.resourceName || session.resourceDisplayName || session.room
      if (!resource) return
      resourceMap.set(resource, (resourceMap.get(resource) ?? 0) + 1)
    })
    if (resourceMap.size === 0) return null
    const sorted = Array.from(resourceMap.entries()).sort((a, b) => b[1] - a[1])
    return sorted.map(([name]) => name).join(', ')
  }, [overview?.room, sessions])

  const resetRejectState = () => {
    setReason('')
    setReasonError(null)
    setIsRejectDialogOpen(false)
  }

  useEffect(() => {
    if (!open) {
      resetRejectState()
    }
  }, [open])

  const handleApprove = async () => {
    if (!classId) return
    try {
      const response = await approveClass(classId).unwrap()
      toast.success(response.message || 'Đã phê duyệt lớp học')
      onActionComplete?.()
      onClose()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể phê duyệt lớp'
      toast.error(message)
    }
  }

  const validateReason = () => {
    if (!reason.trim()) {
      setReasonError('Vui lòng nhập lý do từ chối')
      return false
    }
    if (reason.trim().length < 10) {
      setReasonError('Lý do phải có ít nhất 10 ký tự')
      return false
    }
    if (reason.length > 500) {
      setReasonError('Lý do tối đa 500 ký tự')
      return false
    }
    setReasonError(null)
    return true
  }

  const handleReject = async () => {
    if (!classId) return
    if (!validateReason()) return
    try {
      const response = await rejectClass({ classId, reason }).unwrap()
      toast.success(response.message || 'Đã trả lớp về trạng thái nháp')
      onActionComplete?.()
      resetRejectState()
      onClose()
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message || 'Không thể từ chối lớp'
      toast.error(message)
    }
  }

  const disableActions = overview?.approvalStatus !== 'PENDING'

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="px-4 pt-8">
            <SheetTitle>Chi tiết lớp cần duyệt</SheetTitle>
            <SheetDescription>Xem xét thông tin trước khi phê duyệt hoặc trả về cho Academic Affairs.</SheetDescription>
          </SheetHeader>

          {!classId && (
            <div className="p-4">
              <Alert>
                <AlertDescription>Vui lòng chọn một lớp từ danh sách.</AlertDescription>
              </Alert>
            </div>
          )}

          {detailError && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>Không thể tải thông tin lớp. Vui lòng thử lại.</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDetailLoading && <p className="text-sm text-muted-foreground">Đang tải thông tin lớp…</p>}
                {overview && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{getClassStatusLabel(overview.status)}</Badge>
                      <Badge variant={getApprovalBadgeVariant(overview.approvalStatus)}>
                        {getApprovalStatusLabel(overview.approvalStatus)}
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Mã lớp</p>
                        <p className="font-semibold">{overview.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Khóa học</p>
                        <p className="font-semibold">{overview.course?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chi nhánh</p>
                        <p className="font-semibold">{overview.branch?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày bắt đầu</p>
                        <p className="font-semibold">{formatDate(overview.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày kết thúc dự kiến</p>
                        <p className="font-semibold">{formatDate(overview.plannedEndDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày học</p>
                        <p className="font-semibold">{formatScheduleDays(overview.scheduleDays, overview.scheduleSummary)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gửi duyệt lúc</p>
                        <p className="font-semibold">
                          {submittedAtValue
                            ? formatDate(submittedAtValue, 'HH:mm dd/MM/yyyy')
                            : overview.status === 'DRAFT'
                              ? 'Chưa gửi duyệt'
                              : '--'}
                        </p>
                      </div>
                      {decidedAtValue && (
                        <div>
                          <p className="text-xs text-muted-foreground">Quyết định lúc</p>
                          <p className="font-semibold">{formatDate(decidedAtValue, 'HH:mm dd/MM/yyyy')}</p>
                        </div>
                      )}
                    </div>
                    {overview.rejectionReason && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Lý do trả về lần trước: <span className="font-semibold">{overview.rejectionReason}</span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>Tình trạng hoàn tất</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Tổng buổi', value: summary.total },
                  { label: 'Đã có khung giờ', value: summary.timeSlots, pending: summary.total - summary.timeSlots },
                  { label: 'Đã có tài nguyên', value: summary.resources, pending: summary.total - summary.resources },
                  { label: 'Đã có giáo viên', value: summary.teachers, pending: summary.total - summary.teachers },
                ].map((item) => (
                  <div key={item.label} className={cn('rounded-lg border p-3', item.pending ? 'border-amber-200 bg-amber-50' : 'bg-background')}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-semibold">{item.value}</p>
                    {item.pending ? <p className="text-xs text-amber-700">{item.pending} buổi chưa xong</p> : <p className="text-xs text-emerald-600">Đã đủ</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giáo viên & tài nguyên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Khung giờ học</p>
                    <p className="font-semibold">{timeSlotSummary || 'Chưa gán khung giờ'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phòng / tài nguyên chính</p>
                    <p className="font-semibold">{resourceSummary || 'Chưa gán tài nguyên'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Danh sách giáo viên</p>
                  {teacherSummaries.length ? (
                    <div className="space-y-2">
                      {teacherSummaries.map((teacher) => (
                        <div key={teacher.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-semibold">{teacher.fullName}</p>
                            {teacher.email && <p className="text-xs text-muted-foreground">{teacher.email}</p>}
                            {teacher.employeeCode && <p className="text-xs text-muted-foreground">Mã NV: {teacher.employeeCode}</p>}
                          </div>
                          <Badge variant="secondary">{teacher.sessionCount} buổi</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có giáo viên nào được phân công.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lịch buổi học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSessionsLoading && <p className="text-sm text-muted-foreground">Đang tải danh sách buổi học…</p>}
                {sessionsError && (
                  <Alert variant="destructive">
                    <AlertDescription>Không thể tải buổi học.</AlertDescription>
                  </Alert>
                )}
                {!sessions.length && !isSessionsLoading && <p className="text-sm text-muted-foreground">Chưa có dữ liệu buổi học.</p>}
                {groupedWeeks.map((week) => (
                  <div key={week.weekNumber} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        Tuần {week.weekNumber} · {week.weekRange}
                      </p>
                      <span className="text-sm text-muted-foreground">{week.sessionCount} buổi</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {week.sessionIds.map((sessionId) => {
                        const session = sessionMap.get(sessionId)
                        if (!session) return null
                        return (
                          <div key={session.sessionId} className="rounded-md border px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold">
                                {session.dayOfWeek} · {formatDate(session.date)}
                              </span>
                              <span className="text-xs text-muted-foreground">#{session.sequenceNumber}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {session.timeSlotName ||
                                session.timeSlotLabel ||
                                (session.timeSlotInfo?.displayName as string) ||
                                (session.timeSlotInfo?.startTime && session.timeSlotInfo?.endTime
                                  ? `${session.timeSlotInfo.startTime} - ${session.timeSlotInfo.endTime}`
                                  : 'Chưa có khung giờ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Tài nguyên: {session.resourceName || session.room || 'Chưa gán'} • Giáo viên:{' '}
                              {session.teacherNames || session.teacherName || (session.teachers?.map((t) => t.fullName).join(', ') || 'Chưa gán')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button variant="outline" onClick={onClose}>
                Đóng lại
              </Button>
              <div className="ml-auto flex flex-wrap gap-3">
                <Button variant="destructive" disabled={disableActions || isApproving || isRejecting} onClick={() => setIsRejectDialogOpen(true)}>
                  {isRejecting ? 'Đang xử lý…' : 'Từ chối lớp'}
                </Button>
                <Button disabled={disableActions || isApproving || isRejecting} onClick={handleApprove}>
                  {isApproving ? 'Đang phê duyệt…' : 'Phê duyệt lớp'}
                </Button>
              </div>
            </div>
          </div >
        </SheetContent >
      </Sheet >

      <Dialog open={isRejectDialogOpen} onOpenChange={(openDialog) => (!openDialog ? resetRejectState() : setIsRejectDialogOpen(true))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Trả lớp về cho Academic Affairs</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Hãy mô tả rõ lý do để nhóm Academic Affairs có thể chỉnh sửa và gửi lại.</p>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Cần cập nhật giáo viên cho các buổi thứ Tư..." rows={5} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tối thiểu 10 ký tự</span>
              <span>{reason.length}/500</span>
            </div>
            {reasonError && <p className="text-sm text-destructive">{reasonError}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={resetRejectState}>
              Huỷ
            </Button>
            <Button variant="destructive" disabled={isRejecting} onClick={handleReject}>
              {isRejecting ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
