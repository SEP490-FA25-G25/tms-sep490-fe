import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { UserIcon, CalendarIcon, MapPinIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
  FullScreenModalFooter,
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { REQUEST_STATUS_META } from '@/utils/requestStatusMeta'
import {
  useGetRequestDetailQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} from '@/store/services/studentRequestApi'
import { skipToken } from '@reduxjs/toolkit/query'

const REQUEST_TYPE_LABELS: Record<'ABSENCE' | 'MAKEUP' | 'TRANSFER', string> = {
  ABSENCE: 'Xin nghỉ',
  MAKEUP: 'Học bù',
  TRANSFER: 'Chuyển lớp',
}

const REQUEST_TYPE_COLORS: Record<'ABSENCE' | 'MAKEUP' | 'TRANSFER', string> = {
  ABSENCE: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  MAKEUP: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
  TRANSFER: 'bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-800',
}

interface RequestDetailDialogProps {
  requestId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDetailDialog({ requestId, open, onOpenChange }: RequestDetailDialogProps) {
  const [note, setNote] = useState('')
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null)

  // Fetch request detail
  const {
    data: detailResponse,
    isFetching: isLoadingDetail,
  } = useGetRequestDetailQuery(requestId ?? skipToken, {
    skip: requestId === null,
  })

  const detailRequest = detailResponse?.data
  const detailDaysUntilSession = detailRequest?.additionalInfo?.daysUntilSession ?? detailRequest?.daysUntilSession ?? null
  const detailAttendanceStats = detailRequest?.additionalInfo?.studentAbsenceStats ?? detailRequest?.attendanceStats
  const detailStatusMeta =
    detailRequest && REQUEST_STATUS_META[detailRequest.status as keyof typeof REQUEST_STATUS_META]
  const detailClassTeacherName =
    typeof detailRequest?.currentClass?.teacher === 'string'
      ? detailRequest?.currentClass?.teacher
      : detailRequest?.currentClass?.teacher?.fullName

  // Mutations
  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation()
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation()

  const handleDecision = async (type: 'APPROVE' | 'REJECT') => {
    if (!detailRequest) return

    // For approve, note is optional - show confirmation dialog
    if (type === 'APPROVE') {
      setConfirmAction('APPROVE')
      return
    }

    // For reject, note is required with min 10 chars
    if (note.trim().length < 10) {
      toast.error('Ghi chú cần tối thiểu 10 ký tự khi từ chối')
      return
    }
    setConfirmAction('REJECT')
  }

  const handleConfirmDecision = async () => {
    if (!detailRequest || !confirmAction) return

    try {
      if (confirmAction === 'APPROVE') {
        await approveRequest({
          id: detailRequest.id,
          note: note.trim() || undefined,
        }).unwrap()
        toast.success('Đã duyệt yêu cầu')
      } else if (confirmAction === 'REJECT') {
        await rejectRequest({
          id: detailRequest.id,
          note: note.trim(),
        }).unwrap()
        toast.success('Đã từ chối yêu cầu')
      }

      setNote('')
      setConfirmAction(null)
      onOpenChange(false)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        'Không thể xử lý yêu cầu. Vui lòng thử lại.'
      toast.error(message)
    }
  }

  const handleCancelDecision = () => {
    setConfirmAction(null)
  }

  const handleClose = () => {
    setNote('')
    setConfirmAction(null)
    onOpenChange(false)
  }

  const isPending = detailRequest?.status === 'PENDING'

  return (
    <>
      <FullScreenModal open={open} onOpenChange={handleClose}>
        <FullScreenModalContent size="xl">
          <FullScreenModalHeader>
            <div className="flex items-center gap-3">
              {detailRequest && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    'px-2.5 py-0.5 text-xs font-semibold ring-1',
                    REQUEST_TYPE_COLORS[detailRequest.requestType as 'ABSENCE' | 'MAKEUP' | 'TRANSFER']
                  )}
                >
                  {REQUEST_TYPE_LABELS[detailRequest.requestType as 'ABSENCE' | 'MAKEUP' | 'TRANSFER']}
                </Badge>
              )}
              {detailRequest && detailStatusMeta && (
                <Badge className={cn('font-semibold', detailStatusMeta.badgeClass)}>
                  {detailStatusMeta.label}
                </Badge>
              )}
            </div>
            <FullScreenModalTitle className="text-xl font-semibold text-foreground mt-2">
              Chi tiết yêu cầu {detailRequest ? `#${detailRequest.id}` : ''}
            </FullScreenModalTitle>
            <FullScreenModalDescription>
              {detailRequest?.submittedAt
                ? `Gửi lúc ${format(parseISO(detailRequest.submittedAt), 'HH:mm, EEEE dd/MM/yyyy', { locale: vi })}`
                : 'Đang tải thông tin'}
            </FullScreenModalDescription>
          </FullScreenModalHeader>

          <FullScreenModalBody>
            {isLoadingDetail || !detailRequest ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className={cn("grid gap-6", isPending ? "lg:grid-cols-5" : "")}>
                {/* Left Column - Request Details */}
                <div className={cn("space-y-5", isPending ? "lg:col-span-3" : "")}>
                  {/* Student Information */}
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Thông tin học viên</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoItem label="Họ tên" value={detailRequest.student.fullName} />
                      <InfoItem label="Mã học viên" value={detailRequest.student.studentCode} />
                      <InfoItem label="Email" value={detailRequest.student.email} />
                      <InfoItem label="Số điện thoại" value={detailRequest.student.phone} />
                    </div>
                  </div>

                  {/* Class Information - Hide for TRANSFER as it's shown in TransferRequestContent */}
                  {detailRequest.requestType !== 'TRANSFER' && (
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Lớp học hiện tại</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoItem label="Mã lớp" value={detailRequest.currentClass.code} />
                        <InfoItem label="Chi nhánh" value={detailRequest.currentClass.branch?.name ?? 'Chưa rõ'} />
                        {detailClassTeacherName && (
                          <InfoItem label="Giảng viên" value={detailClassTeacherName} className="sm:col-span-2" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request-specific content */}
                  {detailRequest.requestType === 'ABSENCE' && (
                    <AbsenceRequestContent 
                      request={detailRequest} 
                      daysUntilSession={detailDaysUntilSession} 
                    />
                  )}

                  {detailRequest.requestType === 'MAKEUP' && (
                    <MakeupRequestContent 
                      request={detailRequest} 
                      daysUntilSession={detailDaysUntilSession} 
                    />
                  )}

                  {detailRequest.requestType === 'TRANSFER' && (
                    <TransferRequestContent request={detailRequest} />
                  )}

                  {/* Request Reason */}
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Lý do yêu cầu</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailRequest.requestReason}</p>
                  </div>

                  {/* Note from AA (if any) */}
                  {detailRequest.note && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Ghi chú</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-300 whitespace-pre-wrap">{detailRequest.note}</p>
                    </div>
                  )}

                  {/* Attendance Stats */}
                  <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Thống kê điểm danh</h3>
                    {detailAttendanceStats ? (
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div className="rounded-lg border border-border/60 p-2">
                          <p className="text-xs text-muted-foreground">Tổng buổi</p>
                          <p className="text-lg font-semibold">{detailAttendanceStats.totalSessions}</p>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20 p-2">
                          <p className="text-xs text-muted-foreground">Tổng vắng</p>
                          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">{detailAttendanceStats.totalAbsences}</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-2">
                          <p className="text-xs text-muted-foreground">Vắng có phép</p>
                          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{detailAttendanceStats.excusedAbsences}</p>
                        </div>
                        <div className="rounded-lg border border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20 p-2">
                          <p className="text-xs text-muted-foreground">Vắng không phép</p>
                          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{detailAttendanceStats.unexcusedAbsences}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm danh</p>
                    )}
                  </div>

                  {/* Decision Info (for non-PENDING requests) */}
                  {!isPending && detailRequest.decidedAt && (
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Thông tin quyết định</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoItem label="Người xử lý" value={detailRequest.decidedBy?.fullName ?? 'Không rõ'} />
                        <InfoItem 
                          label="Thời gian" 
                          value={format(parseISO(detailRequest.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Action Panel (only for PENDING) */}
                {isPending && (
                  <div className="lg:col-span-2">
                    <div className="sticky top-0 space-y-4 rounded-xl border border-border/60 bg-background p-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Xử lý yêu cầu
                      </h3>

                      {/* Note for both approve and reject */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Ghi chú
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            (bắt buộc khi từ chối, tối thiểu 10 ký tự)
                          </span>
                        </label>
                        <Textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Nhập ghi chú cho quyết định của bạn...&#10;• Chấp thuận: Ghi chú tùy chọn&#10;• Từ chối: Ghi chú bắt buộc (≥10 ký tự)"
                          className="min-h-[120px] resize-none"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          onClick={() => handleDecision('APPROVE')}
                          disabled={isApproving || isRejecting}
                          className="w-full"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          {isApproving ? 'Đang duyệt...' : 'Chấp thuận'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                          disabled={isRejecting || isApproving}
                          onClick={() => handleDecision('REJECT')}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          {isRejecting ? 'Đang từ chối...' : 'Từ chối'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </FullScreenModalBody>

          {!isPending && !isLoadingDetail && (
            <FullScreenModalFooter>
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
            </FullScreenModalFooter>
          )}
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && handleCancelDecision()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'APPROVE' ? 'Xác nhận chấp thuận' : 'Xác nhận từ chối'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'APPROVE'
                ? 'Bạn có chắc chắn muốn chấp thuận yêu cầu này? Hành động này không thể hoàn tác.'
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
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AbsenceRequestContent({ request, daysUntilSession }: { request: any; daysUntilSession: number | null }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Buổi xin nghỉ</h3>
      </div>
      {request.targetSession && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-medium capitalize text-foreground">
              {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
            </p>
            {daysUntilSession != null && (
              <p className={cn(
                "text-xs font-medium mt-1",
                daysUntilSession <= 2 && daysUntilSession >= 0 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {daysUntilSession >= 0
                  ? `Còn ${daysUntilSession} ngày`
                  : `Đã qua ${Math.abs(daysUntilSession)} ngày`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MakeupRequestContent({ request, daysUntilSession }: { request: any; daysUntilSession: number | null }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Absent Session */}
      {request.targetSession && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Buổi đã vắng</h3>
          </div>
          <div className="space-y-1">
            <p className="font-medium capitalize text-foreground">
              {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
            </p>
            {daysUntilSession != null && daysUntilSession < 0 && (
              <p className="text-xs font-medium text-muted-foreground mt-1">
                Đã qua {Math.abs(daysUntilSession)} ngày
              </p>
            )}
          </div>
        </div>
      )}

      {/* Makeup Session */}
      {request.makeupSession && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Buổi học bù</h3>
          </div>
          <div className="space-y-1">
            {request.makeupSession.classInfo?.classCode && (
              <p className="font-semibold text-foreground">{request.makeupSession.classInfo.classCode}</p>
            )}
            <p className="font-medium capitalize text-foreground">
              {format(parseISO(request.makeupSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
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
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TransferRequestContent({ request }: { request: any }) {
  return (
    <div className="space-y-3">
      {/* Transfer visualization */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {/* Current Class */}
        <div className="flex-1 rounded-xl border border-border/60 bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Lớp hiện tại
          </p>
          <p className="text-lg font-bold text-foreground">{request.currentClass.code}</p>
          {request.currentClass.branch?.name && (
            <p className="text-sm text-muted-foreground">{request.currentClass.branch.name}</p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center md:py-0 py-2">
          <ArrowRightIcon className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
        </div>

        {/* Target Class */}
        {request.targetClass && (
          <div className="flex-1 rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-400 mb-2">
              Chuyển đến lớp
            </p>
            <p className="text-lg font-bold text-foreground">{request.targetClass.code}</p>
            {request.targetClass.name && (
              <p className="text-sm text-muted-foreground">{request.targetClass.name}</p>
            )}
            {request.targetClass.branch?.name && (
              <p className="text-xs text-muted-foreground">
                Chi nhánh: {request.targetClass.branch.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Effective Session */}
      {request.targetSession && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Buổi học hiệu lực</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-medium capitalize text-foreground">
                {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-sm text-muted-foreground">
                Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
              </p>
              {request.effectiveDate && (
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mt-1">
                  Hiệu lực từ: {format(parseISO(request.effectiveDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component
function InfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
