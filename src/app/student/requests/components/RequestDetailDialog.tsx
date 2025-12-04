import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
} from "@/components/ui/full-screen-modal";
import {
  Loader2,
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_META } from "@/constants/absence";
import type { StudentRequest } from "@/store/services/studentRequestApi";

const REQUEST_TYPE_LABELS: Record<"ABSENCE" | "MAKEUP" | "TRANSFER", string> = {
  ABSENCE: "Xin nghỉ",
  MAKEUP: "Học bù",
  TRANSFER: "Chuyển lớp",
};

const REQUEST_TYPE_COLORS: Record<"ABSENCE" | "MAKEUP" | "TRANSFER", string> = {
  ABSENCE:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  MAKEUP:
    "bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800",
  TRANSFER:
    "bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-800",
};

interface RequestDetailDialogProps {
  requestId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  request?: StudentRequest | null;
}

export function RequestDetailDialog({
  open,
  onOpenChange,
  isLoading = false,
  request,
}: RequestDetailDialogProps) {
  const statusMeta = request ? REQUEST_STATUS_META[request.status] : null;

  return (
    <FullScreenModal open={open} onOpenChange={onOpenChange}>
      <FullScreenModalContent size="lg">
        <FullScreenModalHeader>
          <div className="flex items-center gap-3">
            {request && (
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold ring-1",
                  REQUEST_TYPE_COLORS[request.requestType]
                )}
              >
                {REQUEST_TYPE_LABELS[request.requestType]}
              </Badge>
            )}
            {request && statusMeta && (
              <Badge className={cn("font-semibold", statusMeta.badgeClass)}>
                {statusMeta.label}
              </Badge>
            )}
          </div>
          <FullScreenModalTitle className="text-xl font-semibold text-foreground mt-2">
            Chi tiết yêu cầu {request ? `#${request.id}` : ""}
          </FullScreenModalTitle>
          <FullScreenModalDescription>
            {request?.submittedAt
              ? `Gửi lúc ${format(
                  parseISO(request.submittedAt),
                  "HH:mm, EEEE dd/MM/yyyy",
                  { locale: vi }
                )}`
              : "Đang tải thông tin"}
          </FullScreenModalDescription>
        </FullScreenModalHeader>
        <FullScreenModalBody>
          {isLoading || !request ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RequestDetailContent request={request} />
          )}
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}

function RequestDetailContent({ request }: { request: StudentRequest }) {
  const submittedLabel = request.submittedAt
    ? format(parseISO(request.submittedAt), "HH:mm dd/MM/yyyy", { locale: vi })
    : null;
  const decidedLabel = request.decidedAt
    ? format(parseISO(request.decidedAt), "HH:mm dd/MM/yyyy", { locale: vi })
    : null;

  // Calculate days since session
  const targetSessionDate = request.targetSession?.date
    ? parseISO(request.targetSession.date)
    : null;
  const daysUntilSession = targetSessionDate
    ? Math.ceil(
        (targetSessionDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Current Class Section - Hide for TRANSFER as it's shown in TransferRequestContent */}
      {request.requestType !== "TRANSFER" && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Lớp học hiện tại
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Mã lớp" value={request.currentClass.code} />
            <InfoItem
              label="Chi nhánh"
              value={request.currentClass.branch?.name || "Chưa cập nhật"}
            />
          </div>
        </div>
      )}

      {/* Request-specific content */}
      {request.requestType === "ABSENCE" && (
        <AbsenceRequestContent
          request={request}
          daysUntilSession={daysUntilSession}
        />
      )}

      {request.requestType === "MAKEUP" && (
        <MakeupRequestContent
          request={request}
          daysUntilSession={daysUntilSession}
        />
      )}

      {request.requestType === "TRANSFER" && (
        <TransferRequestContent request={request} />
      )}

      {/* Request Reason */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Lý do yêu cầu
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {request.requestReason}
        </p>
      </div>

      {/* Note from AA (if any) */}
      {request.note && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
            Ghi chú từ giáo vụ
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-300 whitespace-pre-wrap">
            {request.note}
          </p>
        </div>
      )}

      {/* Rejection Reason (if rejected) */}
      {request.rejectionReason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20 p-4">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-2">
            Lý do từ chối
          </h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 whitespace-pre-wrap">
            {request.rejectionReason}
          </p>
        </div>
      )}

      {/* Timeline / Meta Info */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Thông tin xử lý
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Thời gian gửi</p>
            <p className="text-sm font-medium text-foreground">
              {submittedLabel ?? "Đang cập nhật"}
            </p>
            {request.submittedBy?.fullName && (
              <p className="text-xs text-muted-foreground">
                Bởi: {request.submittedBy.fullName}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trạng thái xử lý</p>
            <p className="text-sm font-medium text-foreground">
              {decidedLabel ? `Cập nhật ${decidedLabel}` : "Chưa được xử lý"}
            </p>
            {request.decidedBy?.fullName && (
              <p className="text-xs text-muted-foreground">
                Bởi: {request.decidedBy.fullName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ABSENCE Request Content
function AbsenceRequestContent({
  request,
  daysUntilSession,
}: {
  request: StudentRequest;
  daysUntilSession: number | null;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Buổi xin nghỉ
        </h3>
      </div>
      <div className="space-y-2">
        <p className="font-medium capitalize text-foreground">
          {format(parseISO(request.targetSession.date), "EEEE, dd/MM/yyyy", {
            locale: vi,
          })}
        </p>
        <p className="text-sm text-muted-foreground">
          Buổi {request.targetSession.courseSessionNumber}:{" "}
          {request.targetSession.courseSessionTitle}
        </p>
        <p className="text-sm text-muted-foreground">
          {request.targetSession.timeSlot.startTime} -{" "}
          {request.targetSession.timeSlot.endTime}
        </p>
        {daysUntilSession !== null && (
          <p
            className={cn(
              "text-xs font-medium mt-2",
              daysUntilSession >= 0
                ? "text-muted-foreground"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {daysUntilSession >= 0
              ? `Còn ${daysUntilSession} ngày`
              : `Đã qua ${Math.abs(daysUntilSession)} ngày`}
          </p>
        )}
      </div>
    </div>
  );
}

// MAKEUP Request Content
function MakeupRequestContent({
  request,
  daysUntilSession,
}: {
  request: StudentRequest;
  daysUntilSession: number | null;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Absent Session */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Buổi đã vắng
          </h3>
        </div>
        <div className="space-y-2">
          <p className="font-medium capitalize text-foreground">
            {format(parseISO(request.targetSession.date), "EEEE, dd/MM/yyyy", {
              locale: vi,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Buổi {request.targetSession.courseSessionNumber}:{" "}
            {request.targetSession.courseSessionTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.targetSession.timeSlot.startTime} -{" "}
            {request.targetSession.timeSlot.endTime}
          </p>
          {daysUntilSession !== null && daysUntilSession < 0 && (
            <p className="text-xs font-medium text-muted-foreground mt-2">
              Đã qua {Math.abs(daysUntilSession)} ngày
            </p>
          )}
        </div>
      </div>

      {/* Makeup Session */}
      {request.makeupSession && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
              Buổi học bù
            </h3>
          </div>
          <div className="space-y-2">
            <p className="font-medium capitalize text-foreground">
              {format(
                parseISO(request.makeupSession.date),
                "EEEE, dd/MM/yyyy",
                { locale: vi }
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Buổi {request.makeupSession.courseSessionNumber}:{" "}
              {request.makeupSession.courseSessionTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.makeupSession.timeSlot.startTime} -{" "}
              {request.makeupSession.timeSlot.endTime}
            </p>
            {request.makeupSession.classInfo?.classCode && (
              <p className="text-xs text-muted-foreground mt-2">
                Lớp: {request.makeupSession.classInfo.classCode}
              </p>
            )}
            {request.makeupSession.classInfo?.branchName && (
              <p className="text-xs text-muted-foreground">
                Chi nhánh: {request.makeupSession.classInfo.branchName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// TRANSFER Request Content
function TransferRequestContent({ request }: { request: StudentRequest }) {
  return (
    <div className="space-y-3">
      {/* Transfer visualization */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {/* Current Class */}
        <div className="flex-1 rounded-xl border border-border/60 bg-muted/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Lớp hiện tại
          </p>
          <p className="text-lg font-bold text-foreground">
            {request.currentClass.code}
          </p>
          {request.currentClass.branch?.name && (
            <p className="text-sm text-muted-foreground">
              {request.currentClass.branch.name}
            </p>
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
            <p className="text-lg font-bold text-foreground">
              {request.targetClass.code}
            </p>
            {request.targetClass.name && (
              <p className="text-sm text-muted-foreground">
                {request.targetClass.name}
              </p>
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
            <h3 className="text-sm font-semibold text-foreground">
              Buổi học hiệu lực
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-medium capitalize text-foreground">
                {format(
                  parseISO(request.targetSession.date),
                  "EEEE, dd/MM/yyyy",
                  { locale: vi }
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Buổi {request.targetSession.courseSessionNumber}:{" "}
                {request.targetSession.courseSessionTitle}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {request.targetSession.timeSlot.startTime} -{" "}
                {request.targetSession.timeSlot.endTime}
              </p>
              {request.effectiveDate && (
                <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mt-1">
                  Hiệu lực từ:{" "}
                  {format(parseISO(request.effectiveDate), "dd/MM/yyyy", {
                    locale: vi,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
