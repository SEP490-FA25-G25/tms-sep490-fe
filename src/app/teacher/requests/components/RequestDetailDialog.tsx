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
  ClockIcon,
  ArrowLeftRight,
  CalendarClock,
  UserRoundCheck,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import type {
  TeacherRequestDTO,
  RequestStatus,
  RequestType,
} from "@/store/services/teacherRequestApi";

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  REPLACEMENT: "Nhờ dạy thay",
};

const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
  MODALITY_CHANGE:
    "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
  RESCHEDULE:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  REPLACEMENT:
    "bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-800",
};

const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  WAITING_CONFIRM: {
    label: "Chờ xác nhận",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Đã từ chối",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

interface RequestDetailDialogProps {
  requestId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  request?: TeacherRequestDTO | null;
  onConfirmReplacement?: (action: "confirm") => void;
  onRejectReplacement?: (action: "reject") => void;
  decisionNote?: string;
  onDecisionNoteChange?: (note: string) => void;
  isActionLoading?: boolean;
  pendingAction?: "confirm" | "reject" | null;
  reasonMinLength?: number;
}

export function RequestDetailDialog({
  open,
  onOpenChange,
  isLoading = false,
  request,
  onConfirmReplacement,
  onRejectReplacement,
  decisionNote = "",
  onDecisionNoteChange,
  isActionLoading = false,
  pendingAction = null,
  reasonMinLength = 10,
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
            <RequestDetailContent
              request={request}
              onConfirmReplacement={onConfirmReplacement}
              onRejectReplacement={onRejectReplacement}
              decisionNote={decisionNote}
              onDecisionNoteChange={onDecisionNoteChange}
              isActionLoading={isActionLoading}
              pendingAction={pendingAction}
              reasonMinLength={reasonMinLength}
            />
          )}
        </FullScreenModalBody>
      </FullScreenModalContent>
    </FullScreenModal>
  );
}

function RequestDetailContent({
  request,
  onConfirmReplacement,
  onRejectReplacement,
  decisionNote = "",
  onDecisionNoteChange,
  isActionLoading = false,
  pendingAction = null,
  reasonMinLength = 10,
}: {
  request: TeacherRequestDTO;
  onConfirmReplacement?: (action: "confirm") => void;
  onRejectReplacement?: (action: "reject") => void;
  decisionNote?: string;
  onDecisionNoteChange?: (note: string) => void;
  isActionLoading?: boolean;
  pendingAction?: "confirm" | "reject" | null;
  reasonMinLength?: number;
}) {
  const submittedLabel = request.submittedAt
    ? format(parseISO(request.submittedAt), "HH:mm dd/MM/yyyy", { locale: vi })
    : null;
  const decidedLabel = request.decidedAt
    ? format(parseISO(request.decidedAt), "HH:mm dd/MM/yyyy", { locale: vi })
    : null;

  // Calculate days until session
  const sessionDate = request.sessionDate
    ? parseISO(request.sessionDate)
    : null;
  const daysUntilSession = sessionDate
    ? Math.ceil(
        (sessionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Session Information */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Thông tin buổi học
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Lớp" value={request.className ?? "—"} />
          <InfoItem label="Môn học" value={request.subjectName ?? "—"} />
          <InfoItem
            label="Ngày"
            value={
              request.sessionDate
                ? format(parseISO(request.sessionDate), "dd/MM/yyyy", {
                    locale: vi,
                  })
                : "—"
            }
          />
          <InfoItem
            label="Thời gian"
            value={`${request.sessionStartTime ?? "—"} - ${
              request.sessionEndTime ?? "—"
            }`}
          />
          {request.sessionTopic && (
            <InfoItem
              label="Chủ đề"
              value={request.sessionTopic}
              className="sm:col-span-2"
            />
          )}
        </div>
        {daysUntilSession !== null && (
          <div className="mt-3 pt-3 border-t">
            <p
              className={cn(
                "text-xs font-medium",
                daysUntilSession >= 0
                  ? "text-muted-foreground"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {daysUntilSession >= 0
                ? `Còn ${daysUntilSession} ngày`
                : `Đã qua ${Math.abs(daysUntilSession)} ngày`}
            </p>
          </div>
        )}
      </div>

      {/* Request-specific content */}
      {request.requestType === "MODALITY_CHANGE" && (
        <ModalityChangeRequestContent request={request} />
      )}

      {request.requestType === "RESCHEDULE" && (
        <RescheduleRequestContent request={request} />
      )}

      {request.requestType === "REPLACEMENT" && (
        <ReplacementRequestContent request={request} />
      )}

      {/* Request Reason */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Lý do yêu cầu
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {request.requestReason ?? request.reason ?? "—"}
        </p>
      </div>

      {/* Note from AA (if any) */}
      {request.note && (
        <div
          className={cn(
            "rounded-xl border p-4",
            request.status === "REJECTED"
              ? "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20"
              : "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold mb-2",
              request.status === "REJECTED"
                ? "text-rose-600 dark:text-rose-400"
                : "text-blue-700 dark:text-blue-400"
            )}
          >
            Ghi chú từ giáo vụ
          </h3>
          <p
            className={cn(
              "text-sm whitespace-pre-wrap",
              request.status === "REJECTED"
                ? "text-rose-600 dark:text-rose-300"
                : "text-blue-600 dark:text-blue-300"
            )}
          >
            {request.note}
          </p>
        </div>
      )}

      {/* Timeline / Meta Info */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
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
            {request.submittedBy && (
              <p className="text-xs text-muted-foreground">
                Bởi: {request.submittedBy}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trạng thái xử lý</p>
            <p className="text-sm font-medium text-foreground">
              {decidedLabel ? `Cập nhật ${decidedLabel}` : "Chưa được xử lý"}
            </p>
            {request.decidedByName && (
              <p className="text-xs text-muted-foreground">
                Bởi: {request.decidedByName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Replacement Request Actions */}
      {request.requestType === "REPLACEMENT" &&
        request.status === "WAITING_CONFIRM" &&
        onConfirmReplacement &&
        onRejectReplacement && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-4">
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3">
              Xác nhận yêu cầu dạy thay
            </h3>
            <div className="space-y-3">
              {onDecisionNoteChange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Ghi chú
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      (bắt buộc khi từ chối, tối thiểu {reasonMinLength} ký tự)
                    </span>
                  </label>
                  <Textarea
                    value={decisionNote}
                    onChange={(e) => onDecisionNoteChange(e.target.value)}
                    placeholder="Nhập ghi chú cho quyết định của bạn..."
                    className="min-h-[100px] resize-none"
                    disabled={isActionLoading}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                  disabled={isActionLoading || pendingAction === "confirm"}
                  onClick={() => {
                    if (decisionNote.trim().length < reasonMinLength) {
                      toast.error(
                        `Vui lòng nhập lý do từ chối (tối thiểu ${reasonMinLength} ký tự).`
                      );
                      return;
                    }
                    onRejectReplacement("reject");
                  }}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  {pendingAction === "reject" ? "Đang từ chối..." : "Từ chối"}
                </Button>
                <Button
                  disabled={isActionLoading || pendingAction === "reject"}
                  onClick={() => onConfirmReplacement("confirm")}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {pendingAction === "confirm"
                    ? "Đang xác nhận..."
                    : "Đồng ý dạy thay"}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// MODALITY_CHANGE Request Content
function ModalityChangeRequestContent({
  request,
}: {
  request: TeacherRequestDTO;
}) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowLeftRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400">
          Thay đổi phương thức
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="Phương thức hiện tại"
          value={request.currentModality ?? "—"}
        />
        <InfoItem label="Phương thức mới" value={request.newModality ?? "—"} />
        <InfoItem
          label="Phòng học/Phương tiện hiện tại"
          value={request.currentResourceName ?? "—"}
        />
        <InfoItem
          label="Phòng học/Phương tiện mới"
          value={request.newResourceName ?? "—"}
        />
      </div>
    </div>
  );
}

// RESCHEDULE Request Content
function RescheduleRequestContent({ request }: { request: TeacherRequestDTO }) {
  return (
    <div className="space-y-3">
      {/* Current Session */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Buổi học hiện tại
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Ngày"
            value={
              request.sessionDate
                ? format(parseISO(request.sessionDate), "EEEE, dd/MM/yyyy", {
                    locale: vi,
                  })
                : "—"
            }
          />
          <InfoItem
            label="Thời gian"
            value={`${request.sessionStartTime ?? "—"} - ${
              request.sessionEndTime ?? "—"
            }`}
          />
          {request.currentResourceName && (
            <InfoItem
              label="Phòng học/Phương tiện"
              value={request.currentResourceName}
              className="sm:col-span-2"
            />
          )}
        </div>
      </div>

      {/* New Session */}
      {(request.newDate ||
        request.newTimeSlotStartTime ||
        request.newResourceName) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Buổi học mới
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {request.newDate && (
              <InfoItem
                label="Ngày mới"
                value={format(parseISO(request.newDate), "EEEE, dd/MM/yyyy", {
                  locale: vi,
                })}
              />
            )}
            {(request.newTimeSlotStartTime || request.newTimeSlotEndTime) && (
              <InfoItem
                label="Thời gian mới"
                value={`${request.newTimeSlotStartTime ?? "—"} - ${
                  request.newTimeSlotEndTime ?? "—"
                }`}
              />
            )}
            {request.newResourceName && (
              <InfoItem
                label="Phòng học/Phương tiện mới"
                value={request.newResourceName}
                className="sm:col-span-2"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// REPLACEMENT Request Content
function ReplacementRequestContent({
  request,
}: {
  request: TeacherRequestDTO;
}) {
  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserRoundCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
          Nhờ dạy thay
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="Giáo viên hiện tại"
          value={request.teacherName ?? "—"}
        />
        <InfoItem
          label="Giáo viên dạy thay"
          value={request.replacementTeacherName ?? "—"}
        />
        {request.replacementTeacherSpecialization && (
          <InfoItem
            label="Chuyên môn giáo viên thay"
            value={request.replacementTeacherSpecialization}
            className="sm:col-span-2"
          />
        )}
      </div>
    </div>
  );
}

// Helper component
function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
