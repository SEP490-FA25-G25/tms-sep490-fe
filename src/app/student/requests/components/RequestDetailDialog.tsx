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

      {request.requestType === 'TRANSFER' && request.targetClass && (
        <>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lớp chuyển đến</p>
            <p className="mt-1 font-semibold">{request.targetClass.code}</p>
            {request.targetClass.name && (
              <p className="text-sm text-muted-foreground">{request.targetClass.name}</p>
            )}
            {request.targetClass.branch?.name && (
              <p className="text-xs text-muted-foreground">
                Chi nhánh: {request.targetClass.branch.name}
              </p>
            )}
            {request.effectiveDate && (
              <p className="text-xs text-muted-foreground">
                Hiệu lực: {format(parseISO(request.effectiveDate), 'dd/MM/yyyy', { locale: vi })}
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
            <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
              Lý do từ chối
            </p>
            <p className="mt-1 text-sm text-rose-500">{request.rejectionReason}</p>
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