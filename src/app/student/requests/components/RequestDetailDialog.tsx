import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { REQUEST_STATUS_META } from '@/constants/absence'
import type { StudentRequest } from '@/store/services/studentRequestApi'

const REQUEST_TYPE_LABELS: Record<'ABSENCE' | 'MAKEUP' | 'TRANSFER', string> = {
  ABSENCE: 'Xin nghỉ',
  MAKEUP: 'Học bù',
  TRANSFER: 'Chuyển lớp',
}

interface RequestDetailDialogProps {
  requestId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  request?: StudentRequest | null
}

export function RequestDetailDialog({
  open,
  onOpenChange,
  isLoading = false,
  request
}: RequestDetailDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="pr-4">
            {isLoading || !request ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <RequestDetail request={request} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function RequestDetail({ request }: { request: StudentRequest }) {
  const submittedLabel = request.submittedAt
    ? format(parseISO(request.submittedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : null
  const decidedLabel = request.decidedAt
    ? format(parseISO(request.decidedAt), 'HH:mm dd/MM/yyyy', { locale: vi })
    : null

  // Calculate days since session
  const targetSessionDate = request.targetSession?.date ? parseISO(request.targetSession.date) : null
  const daysUntilSession = targetSessionDate
    ? Math.ceil((targetSessionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-4">
      {/* Header: Request Type + Status */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-medium">
          {REQUEST_TYPE_LABELS[request.requestType]}
        </Badge>
        <Badge className={cn(REQUEST_STATUS_META[request.status].badgeClass)}>
          {REQUEST_STATUS_META[request.status].label}
        </Badge>
      </div>

      {/* Current Class Section */}
      <div className="rounded-lg bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lớp học hiện tại
        </p>
        <p className="mt-1 text-lg font-bold">{request.currentClass.code}</p>
        {request.currentClass.branch?.name && (
          <p className="text-sm text-muted-foreground">{request.currentClass.branch.name}</p>
        )}
      </div>

      {/* Sessions Grid */}
      {request.requestType === 'ABSENCE' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Buổi học
          </p>
          <p className="mt-1 font-medium capitalize">
            {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
          <p className="text-sm text-muted-foreground">
            Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
          </p>
          {daysUntilSession !== null && (
            <p className={cn(
              "mt-2 text-xs font-medium",
              daysUntilSession >= 0 ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
            )}>
              {daysUntilSession >= 0
                ? `Còn ${daysUntilSession} ngày`
                : `Đã qua ${Math.abs(daysUntilSession)} ngày`}
            </p>
          )}
        </div>
      )}

      {request.requestType === 'MAKEUP' && (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Absent Session */}
          <div className="rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buổi đã vắng
            </p>
            <p className="mt-1 font-medium capitalize">
              {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
            </p>
            {daysUntilSession !== null && daysUntilSession < 0 && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Đã qua {Math.abs(daysUntilSession)} ngày
              </p>
            )}
          </div>

          {/* Makeup Session */}
          {request.makeupSession && (
            <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                Buổi học bù
              </p>
              <p className="mt-1 font-medium capitalize">
                {format(parseISO(request.makeupSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
              <p className="text-sm text-muted-foreground">
                Buổi {request.makeupSession.courseSessionNumber}: {request.makeupSession.courseSessionTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.makeupSession.timeSlot.startTime} - {request.makeupSession.timeSlot.endTime}
              </p>
              {request.makeupSession.classInfo?.classCode && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Lớp: {request.makeupSession.classInfo.classCode}
                </p>
              )}
              {request.makeupSession.classInfo?.branchName && (
                <p className="text-xs text-muted-foreground">
                  Chi nhánh: {request.makeupSession.classInfo.branchName}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {request.requestType === 'TRANSFER' && (
        <div className="space-y-3">
          {/* Session being transferred */}
          <div className="rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buổi học
            </p>
            <p className="mt-1 font-medium capitalize">
              {format(parseISO(request.targetSession.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.targetSession.courseSessionNumber}: {request.targetSession.courseSessionTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.targetSession.timeSlot.startTime} - {request.targetSession.timeSlot.endTime}
            </p>
          </div>

          {/* Target Class */}
          {request.targetClass && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-400">
                Chuyển đến lớp
              </p>
              <p className="mt-1 text-lg font-bold">{request.targetClass.code}</p>
              {request.targetClass.name && (
                <p className="text-sm text-muted-foreground">{request.targetClass.name}</p>
              )}
              {request.targetClass.branch?.name && (
                <p className="text-xs text-muted-foreground">
                  Chi nhánh: {request.targetClass.branch.name}
                </p>
              )}
              {request.effectiveDate && (
                <p className="mt-2 text-xs font-medium text-purple-700 dark:text-purple-400">
                  Hiệu lực từ: {format(parseISO(request.effectiveDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="h-px bg-border" />

      {/* Reason */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lý do</p>
        <p className="mt-1 text-sm whitespace-pre-wrap">{request.requestReason}</p>
      </div>

      {/* Note (if any) */}
      {request.note && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ghi chú</p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{request.note}</p>
        </div>
      )}

      {/* Rejection Reason (if rejected) */}
      {request.rejectionReason && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Lý do từ chối
          </p>
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{request.rejectionReason}</p>
        </div>
      )}

      <div className="h-px bg-border" />

      {/* Timeline / Meta Info */}
      <div className="rounded-lg bg-muted/20 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Thời gian gửi
          </p>
          <p className="mt-1 text-sm">
            {submittedLabel ?? 'Đang cập nhật'}
            {request.submittedBy?.fullName && ` • ${request.submittedBy.fullName}`}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Trạng thái xử lý
          </p>
          <p className="mt-1 text-sm">
            {decidedLabel ? `Cập nhật ${decidedLabel}` : 'Chưa được xử lý'}
            {request.decidedBy?.fullName && ` • ${request.decidedBy.fullName}`}
          </p>
        </div>
      </div>
    </div>
  )
}