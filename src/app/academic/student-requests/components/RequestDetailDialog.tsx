import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { UserIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { REQUEST_STATUS_META } from '@/constants/absence'
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

interface RequestDetailDialogProps {
  requestId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDetailDialog({ requestId, open, onOpenChange }: RequestDetailDialogProps) {
  const [decisionNote, setDecisionNote] = useState('')
  const [decisionRejectReason, setDecisionRejectReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null)

  // Fetch request detail
  const {
    data: detailResponse,
    isFetching: isLoadingDetail,
  } = useGetRequestDetailQuery(requestId ?? skipToken, {
    skip: requestId === null,
  })

  const detailRequest = detailResponse?.data
  const detailAbsenceStats = detailRequest?.additionalInfo?.studentAbsenceStats
  const detailPreviousRequests = detailRequest?.additionalInfo?.previousRequests
  const detailDaysUntilSession =
    detailRequest?.additionalInfo?.daysUntilSession ?? detailRequest?.daysUntilSession
  const detailAbsenceRate =
    detailAbsenceStats?.absenceRate ?? detailRequest?.studentAbsenceRate ?? 0
  const detailAbsenceRateDisplay = Number(detailAbsenceRate.toFixed(1))
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

    // For approve, show confirmation dialog
    if (type === 'APPROVE') {
      setConfirmAction('APPROVE')
      return
    }

    // For reject, validate reason and show confirmation dialog
    if (decisionRejectReason.trim().length < 10) {
      toast.error('Lý do từ chối cần tối thiểu 10 ký tự')
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
          note: decisionNote.trim() || undefined,
        }).unwrap()
        toast.success('Đã chấp thuận yêu cầu')
      } else if (confirmAction === 'REJECT') {
        await rejectRequest({
          id: detailRequest.id,
          rejectionReason: decisionRejectReason.trim(),
        }).unwrap()
        toast.success('Đã từ chối yêu cầu')
      }

      setDecisionNote('')
      setDecisionRejectReason('')
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
    setDecisionNote('')
    setDecisionRejectReason('')
    setConfirmAction(null)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              {/* Request Summary */}
              <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/20 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="font-medium">
                      {REQUEST_TYPE_LABELS[detailRequest.requestType as 'ABSENCE' | 'MAKEUP' | 'TRANSFER']}
                    </Badge>
                    <Badge className={cn('font-semibold', detailStatusMeta?.badgeClass ?? 'bg-muted')}>
                      {detailStatusMeta?.label ?? detailRequest.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">Mã yêu cầu: #{detailRequest.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Gửi lúc{' '}
                    {format(parseISO(detailRequest.submittedAt), 'HH:mm dd/MM/yyyy', {
                      locale: vi,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Người gửi: {detailRequest.submittedBy?.fullName ?? '—'}
                  </p>
                </div>
              </div>

              {/* Student Information */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Học viên</p>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="font-semibold">{detailRequest.student.fullName}</p>
                    <p className="text-muted-foreground">Mã SV: {detailRequest.student.studentCode}</p>
                    <p className="text-muted-foreground">{detailRequest.student.email}</p>
                    <p className="text-muted-foreground">SĐT: {detailRequest.student.phone}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Class and Session Information */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Lớp học hiện tại</p>
                  <p className="font-semibold">{detailRequest.currentClass.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {detailRequest.currentClass.branch?.name ?? 'Chưa rõ chi nhánh'}
                  </p>
                  {detailClassTeacherName && (
                    <p className="text-xs text-muted-foreground">Giảng viên: {detailClassTeacherName}</p>
                  )}
                </div>

                <div className={cn(
                  'grid gap-3',
                  detailRequest.requestType === 'MAKEUP' && detailRequest.makeupSession ? 'md:grid-cols-2' : ''
                )}>
                  {/* Target Session */}
                  {detailRequest.targetSession && (
                    <div className="rounded-lg border p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {detailRequest.requestType === 'MAKEUP' ? 'Buổi đã vắng' : 'Buổi học'}
                      </p>
                      <p className="font-medium">
                        {format(parseISO(detailRequest.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-muted-foreground">
                        Buổi {detailRequest.targetSession.courseSessionNumber}:{' '}
                        {detailRequest.targetSession.courseSessionTitle}
                      </p>
                      <p className="text-muted-foreground">
                        {detailRequest.targetSession.timeSlot.startTime} - {detailRequest.targetSession.timeSlot.endTime}
                      </p>
                      {detailDaysUntilSession != null && (
                        <p className={cn(
                          "text-xs font-medium",
                          detailDaysUntilSession <= 2 && detailDaysUntilSession >= 0 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {detailDaysUntilSession >= 0
                            ? `Còn ${detailDaysUntilSession} ngày`
                            : `Đã qua ${Math.abs(detailDaysUntilSession)} ngày`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Makeup Session */}
                  {detailRequest.makeupSession && (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                        Buổi học bù
                      </p>
                      {detailRequest.makeupSession.classInfo?.classCode && (
                        <p className="font-semibold">{detailRequest.makeupSession.classInfo.classCode}</p>
                      )}
                      <p className="font-medium">
                        {format(parseISO(detailRequest.makeupSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-muted-foreground">
                        Buổi {detailRequest.makeupSession.courseSessionNumber}:{' '}
                        {detailRequest.makeupSession.courseSessionTitle}
                      </p>
                      <p className="text-muted-foreground">
                        {detailRequest.makeupSession.timeSlot.startTime} - {detailRequest.makeupSession.timeSlot.endTime}
                      </p>
                      {detailRequest.makeupSession.classInfo?.branchName && (
                        <p className="text-xs text-muted-foreground">
                          Chi nhánh: {detailRequest.makeupSession.classInfo.branchName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Transfer Target Class */}
                  {detailRequest.requestType === 'TRANSFER' && detailRequest.targetClass && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-400">
                        Chuyển đến lớp
                      </p>
                      <p className="font-semibold">{detailRequest.targetClass.code}</p>
                      <p className="text-muted-foreground">{detailRequest.targetClass.name}</p>
                      {detailRequest.targetClass.branch?.name && (
                        <p className="text-xs text-muted-foreground">
                          Chi nhánh: {detailRequest.targetClass.branch.name}
                        </p>
                      )}
                      {detailRequest.effectiveDate && (
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
                          Hiệu lực từ: {format(parseISO(detailRequest.effectiveDate), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Absence Rate */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tỉ lệ vắng mặt</p>
                  <div className="h-2 w-full rounded-full bg-muted/40">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        detailAbsenceRate >= 20 ? 'bg-rose-500' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(detailAbsenceRate, 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {detailAbsenceRateDisplay}%
                    {detailAbsenceStats
                      ? ` (${detailAbsenceStats.totalAbsences}/${detailAbsenceStats.totalSessions} buổi)`
                      : ''}
                  </p>
                  {detailAbsenceStats ? (
                    <p className="text-xs text-muted-foreground">
                      Có phép: {detailAbsenceStats.excusedAbsences} · Không phép: {detailAbsenceStats.unexcusedAbsences}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Previous Requests History */}
              {detailPreviousRequests && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Lịch sử yêu cầu</p>
                    <div className="grid grid-cols-4 gap-3 text-center text-sm">
                      <div className="rounded-lg border p-2">
                        <p className="text-xs text-muted-foreground">Tổng số</p>
                        <p className="text-lg font-semibold">{detailPreviousRequests.totalRequests}</p>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-2">
                        <p className="text-xs text-muted-foreground">Đã duyệt</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {detailPreviousRequests.approvedRequests}
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20 p-2">
                        <p className="text-xs text-muted-foreground">Từ chối</p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {detailPreviousRequests.rejectedRequests}
                        </p>
                      </div>
                      <div className="rounded-lg border p-2">
                        <p className="text-xs text-muted-foreground">Đã hủy</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {detailPreviousRequests.cancelledRequests}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-border" />

              {/* Request Reason & Notes */}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold mb-1">Lý do</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{detailRequest.requestReason}</p>
                </div>
                {detailRequest.note && (
                  <div>
                    <p className="font-semibold mb-1">Ghi chú thêm</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{detailRequest.note}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons (for PENDING requests) */}
              {detailRequest.status === 'PENDING' && (
                <>
                  <div className="h-px bg-border" />

                  <div className="space-y-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold">Lý do từ chối</span>
                      <Textarea
                        value={decisionRejectReason}
                        onChange={(event) => setDecisionRejectReason(event.target.value)}
                        placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
                        className="min-h-[80px]"
                      />
                      <span className="text-xs text-muted-foreground">
                        Bắt buộc nhập khi chọn Từ chối để đảm bảo minh bạch.
                      </span>
                    </label>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={isRejecting || isApproving}
                        onClick={() => handleDecision('REJECT')}
                      >
                        {isRejecting ? 'Đang từ chối...' : 'Từ chối'}
                      </Button>
                      <Button
                        onClick={() => handleDecision('APPROVE')}
                        disabled={isApproving || isRejecting}
                      >
                        {isApproving ? 'Đang duyệt...' : 'Chấp thuận'}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Decision Info (for non-PENDING requests) */}
              {detailRequest.status !== 'PENDING' && detailRequest.decidedAt && (
                <>
                  <div className="h-px bg-border" />
                  <div className="rounded-lg bg-muted/20 p-3 text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Quyết định</p>
                    <p className="font-semibold">{detailRequest.decidedBy?.fullName ?? 'Không rõ'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(detailRequest.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </p>
                    {detailRequest.rejectionReason && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Lý do từ chối:</span> {detailRequest.rejectionReason}
                      </p>
                    )}
                  </div>
                </>
              )}
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
