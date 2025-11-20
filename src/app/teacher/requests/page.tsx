import { useMemo, useState } from "react";
import { format, parseISO, startOfToday } from "date-fns";
import { vi } from "date-fns/locale";
import {
  useGetMyRequestsQuery,
  useGetRequestByIdQuery,
  useGetMySessionsQuery,
  useGetModalityResourcesQuery,
  useGetRescheduleSlotsQuery,
  useGetRescheduleResourcesQuery,
  useGetSwapCandidatesQuery,
  useCreateRequestMutation,
  useConfirmSwapRequestMutation,
  useRejectSwapRequestMutation,
  type RequestType,
  type RequestStatus,
  type ResourceDTO,
  type TeacherRequestDTO,
  type RescheduleSlotDTO,
  type SwapCandidateDTO,
} from "@/store/services/teacherRequestApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import {
  Plus,
  ArrowRight,
  NotebookPen,
  RefreshCcw,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  SWAP: "Nhờ dạy thay",
};

const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; badgeClass: string; tone: string }
> = {
  PENDING: {
    label: "Đang chờ duyệt",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    tone: "text-amber-600",
  },
  WAITING_CONFIRM: {
    label: "Chờ xác nhận",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
    tone: "text-sky-600",
  },
  APPROVED: {
    label: "Đã chấp thuận",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    tone: "text-emerald-600",
  },
  REJECTED: {
    label: "Đã từ chối",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    tone: "text-rose-600",
  },
};

const STATUS_FILTERS: Array<{ label: string; value: "ALL" | RequestStatus }> = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: REQUEST_STATUS_META.PENDING.label, value: "PENDING" },
  {
    label: REQUEST_STATUS_META.WAITING_CONFIRM.label,
    value: "WAITING_CONFIRM",
  },
  { label: REQUEST_STATUS_META.APPROVED.label, value: "APPROVED" },
  { label: REQUEST_STATUS_META.REJECTED.label, value: "REJECTED" },
];

const TYPE_FILTERS: Array<{ label: string; value: "ALL" | RequestType }> = [
  { label: "Tất cả loại yêu cầu", value: "ALL" },
  { label: REQUEST_TYPE_LABELS.MODALITY_CHANGE, value: "MODALITY_CHANGE" },
  { label: REQUEST_TYPE_LABELS.RESCHEDULE, value: "RESCHEDULE" },
  { label: REQUEST_TYPE_LABELS.SWAP, value: "SWAP" },
];

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const requestTypes: Array<{
  value: RequestType;
  label: string;
  description: string;
}> = [
  {
    value: "MODALITY_CHANGE",
    label: "Thay đổi phương thức",
    description: "Chuyển đổi giữa classroom và online",
  },
  {
    value: "RESCHEDULE",
    label: "Đổi lịch",
    description: "Thay đổi thời gian của 1 buổi học",
  },
  {
    value: "SWAP",
    label: "Nhờ dạy thay",
    description: "Yêu cầu giáo viên khác dạy thay 1 buổi học",
  },
];

// Helper function to format error messages from backend to user-friendly Vietnamese
const formatBackendError = (
  errorMessage?: string,
  defaultMessage?: string
): string => {
  if (!errorMessage) {
    return defaultMessage || "Có lỗi xảy ra. Vui lòng thử lại sau.";
  }

  // Map common error codes to user-friendly messages
  if (errorMessage.includes("SESSION_NOT_IN_TIME_WINDOW")) {
    return "Ngày session đề xuất không nằm trong khoảng thời gian cho phép (trong vòng 14 ngày từ hôm nay).";
  }

  if (
    errorMessage.includes("Internal Server Error") ||
    errorMessage.includes("500")
  ) {
    return "Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục.";
  }

  if (errorMessage.includes("INVALID_DATE")) {
    return "Ngày đề xuất không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (errorMessage.includes("NO_AVAILABLE_RESOURCES")) {
    return "Không tìm thấy resource phù hợp cho thời gian này.";
  }

  if (errorMessage.includes("TEACHER_NOT_FOUND")) {
    return "Không tìm thấy thông tin giáo viên. Vui lòng thử lại sau.";
  }

  if (errorMessage.includes("RESOURCE_NOT_AVAILABLE")) {
    return "Resource không khả dụng tại thời gian đã chỉ định. Vui lòng chọn resource khác hoặc thời gian khác.";
  }

  // If it's a technical error code, try to extract a more readable part
  if (errorMessage.includes(":")) {
    const parts = errorMessage.split(":");
    if (parts.length > 1) {
      // Use the part after the colon if it's more readable
      const readablePart = parts.slice(1).join(":").trim();
      if (readablePart.length > 0 && !readablePart.includes("_")) {
        return readablePart;
      }
    }
  }

  // Return the original message if no mapping found
  return errorMessage;
};

export default function MyRequestsPage() {
  const {
    data,
    isFetching: isLoadingRequests,
    error,
    refetch,
  } = useGetMyRequestsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeType, setActiveType] = useState<RequestType | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | RequestType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>(
    "ALL"
  );
  const [detailId, setDetailId] = useState<number | null>(null);

  const requests = useMemo(() => data?.data ?? [], [data]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => item.status === "PENDING").length;
    const waitingConfirm = requests.filter(
      (item) => item.status === "WAITING_CONFIRM"
    ).length;
    const approved = requests.filter(
      (item) => item.status === "APPROVED"
    ).length;
    const rejected = requests.filter(
      (item) => item.status === "REJECTED"
    ).length;
    return {
      total: requests.length,
      pending,
      waitingConfirm,
      approved,
      rejected,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchType =
        typeFilter === "ALL" || request.requestType === typeFilter;
      const matchStatus =
        statusFilter === "ALL" || request.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [requests, typeFilter, statusFilter]);

  const {
    data: detailData,
    isFetching: isLoadingDetail,
    error: detailError,
  } = useGetRequestByIdQuery(detailId ?? 0, {
    skip: detailId === null,
  });

  // Fallback: Lấy dữ liệu từ danh sách requests nếu detail không có
  const requestFromList = detailId
    ? requests.find((r) => r.id === detailId)
    : null;

  const [decisionNote, setDecisionNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "confirm" | "reject" | null
  >(null);

  const [confirmSwapRequest, { isLoading: isConfirming }] =
    useConfirmSwapRequestMutation();
  const [rejectSwapRequest, { isLoading: isRejecting }] =
    useRejectSwapRequestMutation();

  const isActionLoading = isConfirming || isRejecting;

  const handleModalClose = () => {
    setIsCreateOpen(false);
    setActiveType(null);
  };

  const handleDetailClose = () => {
    setDetailId(null);
    setDecisionNote("");
    setPendingAction(null);
  };

  const handleSwapDecision = async (action: "confirm" | "reject") => {
    if (!detailId) return;

    const trimmedNote = decisionNote.trim();

    if (action === "reject" && trimmedNote.length < 10) {
      toast.error("Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự).");
      return;
    }

    setPendingAction(action);

    try {
      if (action === "confirm") {
        await confirmSwapRequest({
          id: detailId,
          body: {
            note: trimmedNote || undefined,
          },
        }).unwrap();
        toast.success("Đã đồng ý dạy thay.");
      } else {
        await rejectSwapRequest({
          id: detailId,
          body: {
            reason: trimmedNote,
          },
        }).unwrap();
        toast.success("Đã từ chối yêu cầu dạy thay.");
      }

      handleDetailClose();
      refetch();
    } catch (error) {
      const apiError = error as {
        data?: { message?: string };
        status?: number;
        error?: string;
      };
      const errorMessage =
        apiError?.data?.message || apiError?.error || undefined;
      toast.error(
        formatBackendError(
          errorMessage,
          `Lỗi ${
            apiError?.status || "không xác định"
          }: Không thể xử lý yêu cầu. Vui lòng thử lại.`
        )
      );
    } finally {
      setPendingAction(null);
    }
  };

  if (error) {
    return (
      <TeacherRoute>
        <DashboardLayout
          title="Yêu cầu của tôi"
          description="Theo dõi trạng thái các yêu cầu giảng dạy của bạn"
        >
          <div className="rounded-lg border bg-card p-6 text-center text-destructive">
            <p>Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.</p>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Yêu cầu của tôi"
        description="Theo dõi và xử lý các yêu cầu đổi phương thức, đổi lịch, dạy thay"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">
                  Yêu cầu giảng dạy
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Quản lý các yêu cầu đã gửi và tạo yêu cầu mới khi cần hỗ trợ từ
                Academic team.
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tạo yêu cầu
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">Tổng số yêu cầu</p>
              <p className="text-2xl font-semibold">{summary.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đang chờ duyệt</p>
              <p className="text-2xl font-semibold text-amber-600">
                {summary.pending}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              <p className="text-2xl font-semibold text-sky-600">
                {summary.waitingConfirm}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã chấp thuận</p>
              <p className="text-2xl font-semibold text-emerald-600">
                {summary.approved}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã từ chối</p>
              <p className="text-2xl font-semibold text-rose-600">
                {summary.rejected}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(value: "ALL" | RequestType) => {
                setTypeFilter(value);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn loại yêu cầu" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value: "ALL" | RequestStatus) => {
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                refetch();
              }}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {isLoadingRequests ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <NotebookPen className="h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">Không có yêu cầu phù hợp</p>
              <p className="text-sm text-muted-foreground">
                {requests.length === 0
                  ? "Bạn chưa có yêu cầu nào. Tạo yêu cầu mới để Academic team hỗ trợ."
                  : "Điều chỉnh bộ lọc hoặc tạo thêm yêu cầu mới."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                // Extract topic using multiple fallback paths
                const getTopic = (): string | undefined => {
                  const asRecord = (
                    value: unknown
                  ): Record<string, unknown> | undefined =>
                    value && typeof value === "object"
                      ? (value as Record<string, unknown>)
                      : undefined;

                  // Try direct access from top level first
                  const topLevelSessionTopic = asRecord(request)?.sessionTopic;
                  if (
                    typeof topLevelSessionTopic === "string" &&
                    topLevelSessionTopic.trim().length > 0
                  ) {
                    return topLevelSessionTopic.trim();
                  }

                  const sessionTopic = asRecord(request.session)?.topic;
                  if (
                    typeof sessionTopic === "string" &&
                    sessionTopic.trim().length > 0
                  ) {
                    return sessionTopic.trim();
                  }
                  const requestTopic = asRecord(request)?.topic;
                  if (
                    typeof requestTopic === "string" &&
                    requestTopic.trim().length > 0
                  ) {
                    return requestTopic.trim();
                  }

                  // Try nested paths
                  const paths = [
                    ["session", "topic"],
                    ["sessionInfo", "topic"],
                    ["session", "sessionTopic"],
                    ["sessionTopic"],
                    ["topic"],
                    ["session", "name"],
                    ["sessionInfo", "name"],
                  ];

                  for (const path of paths) {
                    let value: unknown = request;
                    for (const key of path) {
                      const record = asRecord(value);
                      if (!record || !(key in record)) {
                        value = undefined;
                        break;
                      }
                      value = record[key];
                    }
                    if (typeof value === "string" && value.trim().length > 0) {
                      return value.trim();
                    }
                  }

                  return undefined;
                };

                const topic = getTopic();

                // Extract info for RESCHEDULE
                const newSessionDate =
                  request.newDate ||
                  request.newSessionDate ||
                  request.newSession?.date ||
                  (request.newSlot as { date?: string })?.date ||
                  (request.newTimeSlot as { date?: string })?.date ||
                  undefined;
                const newSessionStart =
                  request.newTimeSlotStartTime ||
                  request.newStartTime ||
                  request.newSessionStartTime ||
                  request.newSlot?.startTime ||
                  request.newTimeSlot?.startTime ||
                  request.newTimeSlot?.startAt ||
                  request.newSession?.startTime ||
                  request.newSession?.timeSlot?.startTime ||
                  request.newSession?.timeSlot?.startAt ||
                  undefined;
                const newSessionEnd =
                  request.newTimeSlotEndTime ||
                  request.newEndTime ||
                  request.newSessionEndTime ||
                  request.newSlot?.endTime ||
                  request.newTimeSlot?.endTime ||
                  request.newTimeSlot?.endAt ||
                  request.newSession?.endTime ||
                  request.newSession?.timeSlot?.endTime ||
                  request.newSession?.timeSlot?.endAt ||
                  undefined;
                const newTimeSlotLabel =
                  request.newTimeSlotName ||
                  request.newTimeSlotLabel ||
                  request.newSlot?.label ||
                  request.newSlot?.name ||
                  request.newSlot?.displayLabel ||
                  request.newTimeSlot?.label ||
                  request.newTimeSlot?.name ||
                  request.newTimeSlot?.displayLabel ||
                  request.newSession?.timeSlotLabel ||
                  request.newSession?.timeSlot?.label ||
                  request.newSession?.timeSlot?.name ||
                  undefined;
                const newSessionTimeRange =
                  newSessionStart && newSessionEnd
                    ? `${newSessionStart} - ${newSessionEnd}`
                    : newSessionStart ?? newSessionEnd ?? undefined;
                const formattedNewSessionDate = newSessionDate
                  ? format(parseISO(newSessionDate), "dd/MM/yyyy", {
                      locale: vi,
                    })
                  : undefined;
                const hasNewSessionDate = Boolean(formattedNewSessionDate);
                const hasNewSessionTime = Boolean(newSessionTimeRange);
                const newSessionDateDisplay = formattedNewSessionDate ?? "";
                const newSessionTimeDisplay = newSessionTimeRange ?? "";

                // Extract info for SWAP
                const replacementTeacherName =
                  request.replacementTeacherName ||
                  request.replacementTeacher?.fullName ||
                  request.replacementTeacher?.displayName ||
                  request.replacementTeacher?.name ||
                  undefined;

                // Check if we have additional info to display
                const showModalitySummary =
                  request.requestType === "MODALITY_CHANGE" &&
                  Boolean(
                    request.currentModality ||
                      request.newModality ||
                      request.newResourceName
                  );
                const showRescheduleSummary =
                  request.requestType === "RESCHEDULE" &&
                  Boolean(newSessionDate || newSessionStart || newSessionEnd);
                const showSwapSummary = request.requestType === "SWAP";

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setDetailId(request.id)}
                    className="w-full rounded-xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {REQUEST_TYPE_LABELS[request.requestType]}
                      </Badge>
                      <Badge
                        className={cn(
                          "font-semibold",
                          REQUEST_STATUS_META[request.status].badgeClass
                        )}
                      >
                        {REQUEST_STATUS_META[request.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Gửi lúc{" "}
                        {format(
                          parseISO(request.submittedAt),
                          "dd/MM/yyyy HH:mm",
                          {
                            locale: vi,
                          }
                        )}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium">
                        {request.className}{" "}
                        <span className="font-medium">
                          ·{" "}
                          {format(parseISO(request.sessionDate), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </span>
                      </p>
                      {topic && (
                        <p className="text-sm text-muted-foreground">{topic}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {request.sessionStartTime} - {request.sessionEndTime}
                      </p>
                    </div>

                    {showModalitySummary ? (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                          Thay đổi phương thức
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          {request.currentModality && (
                            <p className="text-muted-foreground">
                              Phương thức hiện tại:{" "}
                              <span className="font-medium text-foreground">
                                {request.currentModality}
                              </span>
                            </p>
                          )}
                          {request.newModality && (
                            <p className="text-muted-foreground">
                              Đề xuất mới:{" "}
                              <span className="font-medium text-foreground">
                                {request.newModality}
                              </span>
                            </p>
                          )}
                          {request.newResourceName && (
                            <p className="text-muted-foreground">
                              Resource đề xuất:{" "}
                              <span className="font-medium text-foreground">
                                {request.newResourceName}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {showRescheduleSummary ? (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                          Lịch mới
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          {hasNewSessionDate ? (
                            <p>
                              Ngày mới:{" "}
                              <span className="font-medium text-foreground">
                                {newSessionDateDisplay}
                              </span>
                            </p>
                          ) : null}
                          {hasNewSessionTime && newSessionTimeDisplay && (
                            <p>
                              Giờ mới:{" "}
                              <span className="font-medium text-foreground">
                                {String(newSessionTimeDisplay)}
                              </span>
                              {newTimeSlotLabel && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({String(newTimeSlotLabel)})
                                </span>
                              )}
                            </p>
                          )}
                          {!hasNewSessionDate && !hasNewSessionTime ? (
                            <p className="text-muted-foreground">
                              Chưa có thông tin lịch mới
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {showSwapSummary ? (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                          <span>Giáo viên dạy thay:</span>
                          {replacementTeacherName ? (
                            <span className="text-sm font-medium normal-case text-foreground">
                              {String(replacementTeacherName)}
                              {request.replacementTeacherEmail && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  ({request.replacementTeacherEmail})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sm font-normal normal-case text-muted-foreground">
                              Đang tìm giáo viên dạy thay
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                      <span className="line-clamp-1">{request.reason}</span>
                      <span className="flex items-center gap-1 text-primary">
                        Xem chi tiết
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>

      <CreateRequestDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose();
          } else {
            setIsCreateOpen(true);
          }
        }}
        activeType={activeType}
        onSelectType={(type) => setActiveType(type)}
        onSuccess={() => {
          handleModalClose();
          refetch();
        }}
      />

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleDetailClose();
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailError || !detailData?.data ? (
            requestFromList ? (
              <TeacherRequestDetailContent
                request={requestFromList}
                fallbackRequest={undefined}
                onConfirmSwap={handleSwapDecision}
                onRejectSwap={handleSwapDecision}
                decisionNote={decisionNote}
                onDecisionNoteChange={setDecisionNote}
                isActionLoading={isActionLoading}
                pendingAction={pendingAction}
              />
            ) : (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
                <p>Không thể tải chi tiết yêu cầu. Vui lòng thử lại sau.</p>
              </div>
            )
          ) : (
            <TeacherRequestDetailContent
              request={detailData.data}
              fallbackRequest={requestFromList ?? undefined}
              onConfirmSwap={handleSwapDecision}
              onRejectSwap={handleSwapDecision}
              decisionNote={decisionNote}
              onDecisionNoteChange={setDecisionNote}
              isActionLoading={isActionLoading}
              pendingAction={pendingAction}
            />
          )}
        </DialogContent>
      </Dialog>
    </TeacherRoute>
  );
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeType: RequestType | null;
  onSelectType: (type: RequestType | null) => void;
  onSuccess: () => void;
}

function CreateRequestDialog({
  open,
  onOpenChange,
  activeType,
  onSelectType,
  onSuccess,
}: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu mới</DialogTitle>
        </DialogHeader>
        {activeType === null ? (
          <TypeSelection onSelect={onSelectType} />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="text-xs text-muted-foreground">Loại yêu cầu</p>
                <h3 className="text-base font-semibold">
                  {REQUEST_TYPE_LABELS[activeType]}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectType(null)}
              >
                Chọn loại khác
              </Button>
            </div>

            {activeType === "MODALITY_CHANGE" && (
              <ModalityChangeFlow onSuccess={onSuccess} />
            )}
            {activeType === "RESCHEDULE" && (
              <RescheduleFlow onSuccess={onSuccess} />
            )}
            {activeType === "SWAP" && <SwapFlow onSuccess={onSuccess} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TypeSelection({
  onSelect,
}: {
  onSelect: (type: RequestType) => void;
}) {
  return (
    <div className="space-y-3">
      {requestTypes.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelect(item.value)}
          className="w-full rounded-lg border border-border/60 p-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">
                {item.label}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}

interface FlowProps {
  onSuccess: () => void;
}

function ModalityChangeFlow({ onSuccess }: FlowProps) {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [selectedResourceId, setSelectedResourceId] = useState<
    number | undefined
  >(undefined);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"session" | "resource" | "form">("session");

  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;

  const sessionsQueryArg = formattedDate ? { date: formattedDate } : {};
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isFetching: isFetchingSessions,
  } = useGetMySessionsQuery(sessionsQueryArg, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  // Get modality resources using sessionId when creating new request
  const resourceQueryArg = selectedSessionId
    ? { sessionId: selectedSessionId }
    : skipToken;
  const { data: resourcesData, isLoading: isLoadingResources } =
    useGetModalityResourcesQuery(resourceQueryArg);

  const resolveResourceId = (resource?: ResourceDTO) =>
    resource?.id ?? resource?.resourceId ?? null;
  const resourceList = Array.isArray(resourcesData?.data)
    ? (resourcesData?.data as ResourceDTO[])
    : [];
  const availableResources = resourceList.filter(
    (resource) => resolveResourceId(resource) !== null
  );
  const selectedResource = availableResources.find(
    (resource) => resolveResourceId(resource) === selectedResourceId
  );
  const [createRequest, { isLoading: isSubmitting }] =
    useCreateRequestMutation();

  const selectedSession = sessionsData?.data?.find(
    (s) => (s.sessionId || s.id) === selectedSessionId
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || date < today) return;
    setSelectedDate(date);
    setShowDatePicker(false);
    setSelectedSessionId(null);
    setStep("session");
  };

  const handleClearDate = () => {
    setSelectedDate(undefined);
    setSelectedSessionId(null);
    setStep("session");
  };

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setSelectedResourceId(undefined);
    setStep("resource");
  };

  const handleResourceSelect = (resourceId: number | undefined) => {
    setSelectedResourceId(resourceId);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !selectedSessionId) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const requestBody: {
        sessionId: number;
        requestType: "MODALITY_CHANGE";
        newResourceId?: number;
        reason: string;
      } = {
        sessionId: selectedSessionId,
        requestType: "MODALITY_CHANGE",
        reason: reason.trim(),
      };
      // Only include newResourceId if it has a value
      if (selectedResourceId !== undefined && selectedResourceId !== null) {
        requestBody.newResourceId = selectedResourceId;
      }
      await createRequest(requestBody).unwrap();

      toast.success("Yêu cầu đã được gửi thành công");
      setSelectedDate(undefined);
      setSelectedSessionId(null);
      setSelectedResourceId(undefined);
      setReason("");
      setStep("session");
      onSuccess();
    } catch (error: unknown) {
      const apiError = error as {
        data?: { message?: string; error?: string; [key: string]: unknown };
        status?: number;
        error?: string;
        [key: string]: unknown;
      };
      const errorMessage =
        apiError?.data?.message ||
        apiError?.data?.error ||
        (typeof apiError?.data === "string" ? apiError.data : undefined) ||
        apiError?.error ||
        undefined;
      toast.error(
        formatBackendError(errorMessage, "Có lỗi xảy ra khi gửi yêu cầu")
      );
    }
  };

  const step1Complete = !!selectedSessionId;
  const step2Complete = step === "form"; // Đã qua step resource
  const step3Complete = step === "form" && reason.trim().length >= 10;

  return (
    <div className="space-y-4">
      {/* Step 1: Chọn session */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                step1Complete
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {step1Complete ? "✓" : "1"}
            </div>
            <h3 className="text-sm font-semibold">
              Chọn buổi học muốn thay đổi
            </h3>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            {selectedDate && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDate}
                  className="h-5 w-5 p-0"
                >
                  ×
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              {selectedDate ? "Đổi ngày" : "Chọn ngày"}
            </Button>
          </div>
        </div>

        {showDatePicker && (
          <div className="pl-8">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < today}
              locale={vi}
              className="rounded-lg border"
            />
          </div>
        )}

        {step === "session" && (
          <div className="pl-8">
            {isLoadingSessions || isFetchingSessions ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : sessionsData?.data && sessionsData.data.length > 0 ? (
              <ul className="space-y-2">
                {sessionsData.data.map((session, index) => {
                  const sessionId = session?.sessionId || session?.id;
                  if (!sessionId) {
                    return null;
                  }
                  return (
                    <li key={sessionId || index}>
                      <button
                        type="button"
                        onClick={() => handleSessionSelect(sessionId)}
                        className={cn(
                          "w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5",
                          selectedSessionId === sessionId &&
                            "border-primary bg-primary/5"
                        )}
                      >
                        <p className="text-sm font-medium">
                          {formatDateShort(session.date)} {session.startTime} -{" "}
                          {session.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.className} · {session.courseName}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                Không có session nào trong ngày đã chọn
              </div>
            )}
          </div>
        )}

        {step1Complete && step !== "session" && selectedSession && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">
                {formatDateShort(selectedSession.date)}{" "}
                {selectedSession.startTime} - {selectedSession.endTime}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedSession.className} · {selectedSession.courseName}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedSessionId(null);
                setStep("session");
              }}
            >
              Thay đổi
            </Button>
          </div>
        )}
      </div>

      {/* Step 2: Chọn resource (optional) */}
      {step1Complete && (
        <div className={cn("space-y-2", step === "session" && "opacity-50")}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                step2Complete
                  ? "bg-primary text-primary-foreground"
                  : step1Complete
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {step2Complete ? "✓" : "2"}
            </div>
            <h3 className="text-sm font-semibold">Chọn resource (Tùy chọn)</h3>
          </div>

          {step === "resource" && (
            <div className="pl-8">
              {isLoadingResources ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : availableResources.length > 0 ? (
                <>
                  <Select
                    value={selectedResourceId?.toString() || ""}
                    onValueChange={(value) =>
                      handleResourceSelect(value ? parseInt(value) : undefined)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn resource (tùy chọn)">
                        {selectedResource?.name || ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map((resource) => {
                        const resourceId = resolveResourceId(resource);
                        if (resourceId === null) return null;
                        return (
                          <SelectItem
                            key={resourceId}
                            value={resourceId.toString()}
                          >
                            <div className="flex flex-col items-start py-1">
                              <span className="font-medium text-sm">
                                {resource.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {resource.type || "N/A"} · Capacity:{" "}
                                {resource.capacity ?? "N/A"}
                              </span>
                              {resource.currentResource && (
                                <span className="text-xs text-primary">
                                  Resource hiện tại
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResourceSelect(undefined)}
                    className="mt-2"
                  >
                    Bỏ qua - Để staff quyết định
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 py-4 text-center text-sm text-amber-700">
                    Không có resource nào khả dụng tại thời điểm này. Staff sẽ
                    chọn resource phù hợp cho bạn.
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResourceSelect(undefined)}
                    className="w-full"
                  >
                    Tiếp tục - Để staff quyết định resource
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "form" && (
            <div className="pl-8">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm">
                  {selectedResource?.name || "Để staff quyết định"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedResourceId(undefined);
                    setStep("resource");
                  }}
                >
                  Thay đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Điền lý do */}
      {step === "form" && (
        <div className={cn("space-y-2", step !== "form" && "opacity-50")}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                step3Complete
                  ? "bg-primary text-primary-foreground"
                  : step2Complete
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {step3Complete ? "✓" : "3"}
            </div>
            <h3 className="text-sm font-semibold">Điền lý do</h3>
          </div>

          {step === "form" && (
            <div className="space-y-3 pl-8">
              <div className="space-y-1.5">
                <Textarea
                  placeholder="Nhập lý do yêu cầu thay đổi phương thức..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Tối thiểu 10 ký tự · {reason.trim().length}/10
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!step3Complete || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReason("");
                    setSelectedDate(undefined);
                    setSelectedSessionId(null);
                    setSelectedResourceId(undefined);
                    setStep("session");
                  }}
                >
                  Làm lại
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RescheduleFlow({ onSuccess }: FlowProps) {
  const today = startOfToday();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [sessionFilterDate, setSessionFilterDate] = useState<
    Date | undefined
  >();
  const [showSessionFilterPicker, setShowSessionFilterPicker] = useState(false);
  const [selectedNewDate, setSelectedNewDate] = useState<Date | undefined>();
  const [showNewDatePicker, setShowNewDatePicker] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<
    number | undefined
  >();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<
    "session" | "date" | "slot" | "resource" | "form"
  >("session");

  const newDateFormatted = selectedNewDate
    ? format(selectedNewDate, "yyyy-MM-dd")
    : undefined;
  const sessionFilterFormatted = sessionFilterDate
    ? format(sessionFilterDate, "yyyy-MM-dd")
    : undefined;

  const sessionsQueryArg = sessionFilterFormatted
    ? { date: sessionFilterFormatted }
    : {};
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isFetching: isFetchingSessions,
  } = useGetMySessionsQuery(sessionsQueryArg, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const selectedSession = sessionsData?.data?.find(
    (session) => (session.sessionId || session.id) === selectedSessionId
  );

  const slotQueryArg =
    selectedSessionId && newDateFormatted
      ? { sessionId: selectedSessionId, date: newDateFormatted }
      : skipToken;
  const { data: slotsData, isFetching: isLoadingSlots } =
    useGetRescheduleSlotsQuery(slotQueryArg);

  const availableSlots = slotsData?.data ?? [];

  const pickStringValue = (...values: Array<string | null | undefined>) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return undefined;
  };

  const pickFromRecord = (
    record: Record<string, unknown> | undefined,
    keys: string[]
  ) => {
    if (!record) return undefined;
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return undefined;
  };

  const getSlotTimeRange = (slot: RescheduleSlotDTO) => {
    const slotRecord = slot as unknown as Record<string, unknown>;
    const timeSlotRecord =
      typeof slot.timeSlot === "object" && slot.timeSlot !== null
        ? (slot.timeSlot as Record<string, unknown>)
        : undefined;

    const start = pickStringValue(
      slot.startTime,
      slot.startAt,
      pickFromRecord(timeSlotRecord, ["startTime", "startAt", "start"]),
      pickFromRecord(slotRecord, [
        "start",
        "start_time",
        "startHour",
        "beginTime",
        "begin_time",
      ])
    );

    const end = pickStringValue(
      slot.endTime,
      slot.endAt,
      pickFromRecord(timeSlotRecord, ["endTime", "endAt", "end"]),
      pickFromRecord(slotRecord, [
        "end",
        "end_time",
        "endHour",
        "finishTime",
        "finish_time",
      ])
    );

    return { start, end };
  };

  const getSlotLabel = (slot: RescheduleSlotDTO) => {
    const slotRecord = slot as unknown as Record<string, unknown>;
    const timeSlotRecord =
      typeof slot.timeSlot === "object" && slot.timeSlot !== null
        ? (slot.timeSlot as Record<string, unknown>)
        : undefined;

    return pickStringValue(
      slot.displayLabel,
      slot.label,
      slot.timeSlotLabel,
      slot.timeSlotName,
      slot.timeRange,
      slot.name,
      slot.title,
      slot.description,
      pickFromRecord(timeSlotRecord, [
        "label",
        "displayLabel",
        "timeRange",
        "name",
        "title",
        "displayName",
      ]),
      pickFromRecord(slotRecord, [
        "label",
        "displayLabel",
        "timeRange",
        "name",
        "title",
        "displayName",
      ])
    );
  };

  const resolveSlotLabel = (slot: RescheduleSlotDTO) => {
    const { start, end } = getSlotTimeRange(slot);
    const label = getSlotLabel(slot);

    if (start || end) {
      if (start && end) {
        return `${start} - ${end}`;
      }
      return start ?? end ?? label ?? "Khung giờ chưa xác định";
    }

    return label ?? "Khung giờ chưa xác định";
  };

  const selectedSlot =
    availableSlots.find(
      (slot) => (slot.timeSlotId ?? slot.id) === selectedSlotId
    ) ?? null;
  const selectedSlotLabel = selectedSlot ? resolveSlotLabel(selectedSlot) : "";

  const resourceQueryArg =
    selectedSessionId && newDateFormatted && selectedSlot
      ? {
          sessionId: selectedSessionId,
          date: newDateFormatted,
          timeSlotId: selectedSlot.timeSlotId ?? selectedSlot.id ?? 0,
        }
      : skipToken;
  const {
    data: rescheduleResourcesData,
    isFetching: isLoadingRescheduleResources,
  } = useGetRescheduleResourcesQuery(resourceQueryArg);

  const rescheduleResources = (rescheduleResourcesData?.data ?? []).filter(
    (resource) => (resource.id ?? resource.resourceId) != null
  );
  const selectedRescheduleResource = selectedResourceId
    ? rescheduleResources.find(
        (resource) =>
          (resource.id ?? resource.resourceId) === selectedResourceId
      ) ?? null
    : null;

  const [createRequest, { isLoading: isSubmitting }] =
    useCreateRequestMutation();

  const resetToSessionStep = () => {
    setSelectedSessionId(null);
    setSelectedNewDate(undefined);
    setSelectedSlotId(null);
    setSelectedResourceId(undefined);
    setReason("");
    setStep("session");
  };

  const handleSessionFilter = (date: Date | undefined) => {
    if (!date) {
      setSessionFilterDate(undefined);
      setShowSessionFilterPicker(false);
      return;
    }
    if (date < today) return;
    setSessionFilterDate(date);
    setSelectedSessionId(null);
    setSelectedNewDate(undefined);
    setSelectedSlotId(null);
    setSelectedResourceId(undefined);
    setShowSessionFilterPicker(false);
  };

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setSelectedNewDate(undefined);
    setSelectedSlotId(null);
    setSelectedResourceId(undefined);
    setStep("date");
  };

  const handleNewDateSelect = (date: Date | undefined) => {
    if (!date || date < today) return;
    setSelectedNewDate(date);
    setShowNewDatePicker(false);
    setSelectedSlotId(null);
    setSelectedResourceId(undefined);
    setStep("slot");
  };

  const handleSlotSelect = (slotId: number) => {
    setSelectedSlotId(slotId);
    setSelectedResourceId(undefined);
    setStep("resource");
  };

  const handleResourceSelect = (resourceId: number | undefined) => {
    setSelectedResourceId(resourceId);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedSessionId || !selectedNewDate || !selectedSlot) {
      toast.error("Vui lòng hoàn thành các bước trước khi gửi");
      return;
    }

    if (!selectedResourceId) {
      toast.error("Vui lòng chọn resource mới");
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("Lý do phải có tối thiểu 10 ký tự");
      return;
    }

    try {
      const requestBody: {
        sessionId: number;
        requestType: "RESCHEDULE";
        newDate: string;
        newTimeSlotId?: number;
        newResourceId?: number;
        reason: string;
      } = {
        sessionId: selectedSessionId,
        requestType: "RESCHEDULE",
        newDate: format(selectedNewDate, "yyyy-MM-dd"),
        reason: reason.trim(),
      };
      // Only include optional fields if they have values
      const timeSlotId = selectedSlot.timeSlotId ?? selectedSlot.id;
      if (timeSlotId !== undefined && timeSlotId !== null) {
        requestBody.newTimeSlotId = timeSlotId;
      }
      if (selectedResourceId !== undefined && selectedResourceId !== null) {
        requestBody.newResourceId = selectedResourceId;
      }
      await createRequest(requestBody).unwrap();

      toast.success("Yêu cầu đã được gửi thành công");
      resetToSessionStep();
      onSuccess();
    } catch (error: unknown) {
      const apiError = error as {
        data?: { message?: string; error?: string; [key: string]: unknown };
        status?: number;
        error?: string;
        [key: string]: unknown;
      };
      const errorMessage =
        apiError?.data?.message ||
        apiError?.data?.error ||
        (typeof apiError?.data === "string" ? apiError.data : undefined) ||
        apiError?.error ||
        undefined;
      toast.error(
        formatBackendError(errorMessage, "Có lỗi xảy ra khi gửi yêu cầu")
      );
    }
  };

  const sessionStepComplete = !!selectedSessionId;
  const dateStepComplete = sessionStepComplete && !!selectedNewDate;
  const slotStepComplete = dateStepComplete && !!selectedSlotId;
  const resourceStepComplete = slotStepComplete && !!selectedResourceId;
  const formStepReady = step === "form" && resourceStepComplete;
  const reasonValid = reason.trim().length >= 10;

  return (
    <div className="space-y-4">
      {/* Step 1: Chọn session */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                sessionStepComplete
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {sessionStepComplete ? "✓" : "1"}
            </div>
            <h3 className="text-sm font-semibold">Chọn session cần đổi lịch</h3>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {sessionFilterDate && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                {format(sessionFilterDate, "dd/MM/yyyy", { locale: vi })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSessionFilter(undefined)}
                  className="h-5 w-5 p-0"
                >
                  ×
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSessionFilterPicker((prev) => !prev)}
            >
              {sessionFilterDate ? "Đổi ngày" : "Chọn ngày"}
            </Button>
          </div>
        </div>

        <div className="pl-8 space-y-3">
          {showSessionFilterPicker && (
            <Calendar
              mode="single"
              selected={sessionFilterDate}
              onSelect={handleSessionFilter}
              disabled={(date) => !!date && date < today}
              locale={vi}
              className="rounded-lg border"
            />
          )}

          {step === "session" && (
            <div>
              {isLoadingSessions || isFetchingSessions ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessionsData?.data && sessionsData.data.length > 0 ? (
                <ul className="space-y-2">
                  {sessionsData.data.map((session) => {
                    const sessionId = session.sessionId || session.id;
                    if (!sessionId) return null;
                    return (
                      <li key={sessionId}>
                        <button
                          type="button"
                          onClick={() => handleSessionSelect(sessionId)}
                          className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                        >
                          <p className="text-sm font-medium">
                            {formatDateShort(session.date)} {session.startTime}{" "}
                            - {session.endTime}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.className} · {session.courseName}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Không có session nào trong 14 ngày tới
                </div>
              )}
            </div>
          )}
        </div>

        {sessionStepComplete && step !== "session" && selectedSession && (
          <div className="pl-8">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">
                  {formatDateShort(selectedSession.date)}{" "}
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSession.className} · {selectedSession.courseName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetToSessionStep();
                }}
              >
                Thay đổi
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Chọn ngày mới */}
      {sessionStepComplete && (
        <div className={cn("space-y-2", step === "session" && "opacity-50")}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                dateStepComplete
                  ? "bg-primary text-primary-foreground"
                  : sessionStepComplete
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {dateStepComplete ? "✓" : "2"}
            </div>
            <h3 className="text-sm font-semibold">
              Chọn ngày mới (trong 14 ngày tới)
            </h3>
          </div>

          {step === "date" && (
            <div className="pl-8 space-y-3">
              <div className="flex items-center gap-2">
                {selectedNewDate && (
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1">
                    <p className="text-xs">
                      {format(selectedNewDate, "EEEE, dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNewDate(undefined)}
                      className="h-5 w-5 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewDatePicker((prev) => !prev)}
                >
                  {selectedNewDate ? "Đổi ngày" : "Chọn ngày"}
                </Button>
              </div>

              {(showNewDatePicker || !selectedNewDate) && (
                <Calendar
                  mode="single"
                  selected={selectedNewDate}
                  onSelect={handleNewDateSelect}
                  disabled={(date) => date < today}
                  locale={vi}
                  className="rounded-lg border"
                />
              )}

              {selectedNewDate && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setStep("slot")}
                >
                  Tiếp tục
                </Button>
              )}
            </div>
          )}

          {dateStepComplete && step !== "date" && selectedNewDate && (
            <div className="pl-8">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm">
                  {format(selectedNewDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("date")}
                >
                  Thay đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Chọn khung giờ phù hợp */}
      {dateStepComplete && (
        <div
          className={cn(
            "space-y-2",
            (step === "session" || step === "date") && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                slotStepComplete
                  ? "bg-primary text-primary-foreground"
                  : dateStepComplete
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {slotStepComplete ? "✓" : "3"}
            </div>
            <h3 className="text-sm font-semibold">
              Chọn khung giờ không trùng lịch
            </h3>
          </div>

          {step === "slot" && (
            <div className="pl-8">
              {isLoadingSlots ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : availableSlots.length > 0 ? (
                <ul className="space-y-2">
                  {availableSlots.map((slot, idx) => {
                    const slotId = slot.timeSlotId ?? slot.id;
                    if (!slotId) return null;
                    const isAvailable =
                      slot.available !== false && !slot.conflictReason;
                    const { start, end } = getSlotTimeRange(slot);
                    const label = getSlotLabel(slot);
                    return (
                      <li key={slotId ?? idx}>
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSlotSelect(slotId)}
                          className={cn(
                            "w-full rounded-lg border border-border/60 px-3 py-2 text-left transition",
                            isAvailable
                              ? "hover:border-primary/60 hover:bg-primary/5"
                              : "cursor-not-allowed opacity-60",
                            selectedSlotId === slotId &&
                              "border-primary bg-primary/5"
                          )}
                        >
                          {label && (
                            <p className="text-sm font-medium">{label}</p>
                          )}
                          {(start || end) && (
                            <p
                              className={cn(
                                "text-xs",
                                label
                                  ? "text-muted-foreground"
                                  : "text-sm font-medium"
                              )}
                            >
                              {start && end
                                ? `${start} - ${end}`
                                : start ?? end}
                            </p>
                          )}
                          {!label && !start && !end && (
                            <p className="text-sm font-medium">
                              Khung giờ chưa xác định
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Không có khung giờ phù hợp trong ngày đã chọn
                </div>
              )}
            </div>
          )}

          {slotStepComplete && step !== "slot" && selectedSlot && (
            <div className="pl-8">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm">{selectedSlotLabel}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("slot")}
                >
                  Thay đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Chọn resource mới */}
      {slotStepComplete && (
        <div
          className={cn(
            "space-y-2",
            step !== "resource" && step !== "form" && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                resourceStepComplete
                  ? "bg-primary text-primary-foreground"
                  : slotStepComplete
                  ? "border-2 border-primary text-primary"
                  : "border-2 border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {resourceStepComplete ? "✓" : "4"}
            </div>
            <h3 className="text-sm font-semibold">Chọn resource mới</h3>
          </div>

          {step === "resource" && (
            <div className="pl-8">
              {isLoadingRescheduleResources ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : rescheduleResources.length > 0 ? (
                <>
                  <Select
                    value={selectedResourceId?.toString() || ""}
                    onValueChange={(value) =>
                      handleResourceSelect(
                        value ? parseInt(value, 10) : undefined
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn resource mới">
                        {selectedRescheduleResource?.name || ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rescheduleResources.map((resource) => {
                        const resourceId = resource.id ?? resource.resourceId;
                        if (!resourceId) return null;
                        return (
                          <SelectItem
                            key={resourceId}
                            value={resourceId.toString()}
                          >
                            <div className="flex flex-col items-start py-1">
                              <span className="font-medium text-sm">
                                {resource.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {resource.type} · Sức chứa {resource.capacity}
                              </span>
                              {resource.status && (
                                <span className="text-xs text-primary">
                                  {resource.status}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 py-4 text-center text-sm text-amber-700">
                  Không có resource nào khả dụng cho thời gian này. Vui lòng
                  chọn ngày hoặc khung giờ khác.
                </div>
              )}
            </div>
          )}

          {step === "form" && (
            <div className="pl-8">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm">
                  {selectedRescheduleResource?.name || "Chưa chọn resource"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("resource");
                  }}
                >
                  Thay đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Điền lý do */}
      {formStepReady && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                reasonValid
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {reasonValid ? "✓" : "5"}
            </div>
            <h3 className="text-sm font-semibold">Điền lý do đổi lịch</h3>
          </div>

          <div className="space-y-3 pl-8">
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">Tóm tắt</p>
              <p>
                <span className="font-medium text-foreground">
                  Session gốc:
                </span>{" "}
                {selectedSession?.className} · {selectedSession?.courseName}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Thời gian mới:
                </span>{" "}
                {format(selectedNewDate!, "dd/MM/yyyy", { locale: vi })} ·{" "}
                {selectedSlotLabel}
              </p>
              <p>
                <span className="font-medium text-foreground">Resource:</span>{" "}
                {selectedRescheduleResource?.name ?? "Chưa chọn"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Textarea
                placeholder="Mô tả lý do đổi lịch (tối thiểu 10 ký tự)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tối thiểu 10 ký tự · {reason.trim().length}/10
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!reasonValid || isSubmitting}
                size="sm"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetToSessionStep()}
              >
                Làm lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwapFlow({ onSuccess }: FlowProps) {
  const today = startOfToday();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null
  );
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"session" | "candidate" | "form">("session");

  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;

  const sessionsQueryArg = formattedDate ? { date: formattedDate } : {};
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isFetching: isFetchingSessions,
  } = useGetMySessionsQuery(sessionsQueryArg, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const selectedSession = sessionsData?.data?.find(
    (session) => (session.sessionId || session.id) === selectedSessionId
  );

  // Get swap candidates using sessionId when creating new request
  const candidateQueryArg = selectedSessionId
    ? { sessionId: selectedSessionId }
    : skipToken;
  const { data: candidatesData, isFetching: isLoadingCandidates } =
    useGetSwapCandidatesQuery(candidateQueryArg);

  const swapCandidates = candidatesData?.data ?? [];

  const computeCandidateMeta = (candidate: SwapCandidateDTO) => {
    const name =
      candidate.teacherName ||
      candidate.fullName ||
      candidate.displayName ||
      (candidate.email ? candidate.email.split("@")[0] : undefined) ||
      (candidate.teacherId
        ? `Giáo viên #${candidate.teacherId}`
        : "Giáo viên chưa xác định");

    const availability =
      candidate.availabilityStatus || candidate.availability || "";

    const resolvedSkills = [
      ...(candidate.skills ?? []),
      ...(candidate.teacherSkills ?? []),
    ];

    const skillTokens = resolvedSkills
      .map((raw) => {
        if (typeof raw === "string") {
          return raw.trim();
        }

        if (!raw) {
          return null;
        }

        const skillObject =
          typeof raw.skill === "object" && raw.skill !== null
            ? raw.skill
            : undefined;

        const skillName =
          raw.name ||
          raw.skillName ||
          (typeof raw.skill === "string" ? raw.skill : undefined) ||
          skillObject?.name ||
          (typeof raw.skill === "object" && "code" in raw.skill
            ? String(raw.skill.code)
            : undefined);

        const level =
          raw.level ||
          raw.skillLevel ||
          raw.proficiency ||
          (typeof raw.description === "string" ? raw.description : undefined);

        if (skillName && level) {
          return `${skillName} (${level})`;
        }

        return skillName || level || null;
      })
      .filter(
        (value, index, array): value is string =>
          value != null &&
          typeof value === "string" &&
          value.trim().length > 0 &&
          array.indexOf(value) === index
      );

    const combinedSkillList = skillTokens.join(", ");
    const fallbackSkill =
      candidate.skillSummary || candidate.skillsDescription || "";
    const skillSummary = (combinedSkillList || fallbackSkill).trim();

    const specializationRaw =
      candidate.specialization ||
      (candidate.tags && candidate.tags.length > 0
        ? candidate.tags.join(", ")
        : "");
    const specializationLine = specializationRaw.trim();

    return {
      name,
      email: candidate.email || "",
      matchScore: candidate.matchScore,
      availability,
      skillSummary,
      specializationLine,
    };
  };

  const selectedCandidate =
    selectedCandidateId !== null
      ? swapCandidates.find(
          (candidate) => (candidate.teacherId ?? null) === selectedCandidateId
        )
      : undefined;

  const normalizedCandidateQuery = candidateSearch.trim().toLowerCase();
  const filteredCandidates =
    normalizedCandidateQuery.length > 0
      ? swapCandidates.filter((candidate) => {
          const meta = computeCandidateMeta(candidate);
          const searchableText = [
            meta.name,
            meta.email,
            candidate.phone ?? "",
            meta.skillSummary,
            meta.specializationLine,
            candidate.note ?? "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchableText.includes(normalizedCandidateQuery);
        })
      : swapCandidates;

  const [createRequest, { isLoading: isSubmitting }] =
    useCreateRequestMutation();

  const resetToSessionStep = () => {
    setSelectedSessionId(null);
    setSelectedDate(undefined);
    setSelectedCandidateId(null);
    setCandidateSearch("");
    setIsCandidateDropdownOpen(false);
    setReason("");
    setStep("session");
  };

  const handleSessionSelect = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setSelectedCandidateId(null);
    setCandidateSearch("");
    setIsCandidateDropdownOpen(false);
    setStep("candidate");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || date < today) return;
    setSelectedDate(date);
    setShowDatePicker(false);
    setSelectedSessionId(null);
    setSelectedCandidateId(null);
    setCandidateSearch("");
    setIsCandidateDropdownOpen(false);
    setStep("session");
  };

  const handleCandidateSelect = (candidateId: number | null) => {
    setSelectedCandidateId(candidateId);
    setCandidateSearch("");
    setIsCandidateDropdownOpen(false);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedSessionId) {
      toast.error("Vui lòng chọn session cần nhờ dạy thay");
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("Lý do phải có tối thiểu 10 ký tự");
      return;
    }

    try {
      const requestBody: {
        sessionId: number;
        requestType: RequestType;
        replacementTeacherId?: number;
        reason: string;
      } = {
        sessionId: selectedSessionId,
        requestType: "SWAP" as RequestType,
        reason: reason.trim(),
      };
      // Only include replacementTeacherId if it has a value
      if (selectedCandidateId !== undefined && selectedCandidateId !== null) {
        requestBody.replacementTeacherId = selectedCandidateId;
      }
      await createRequest(requestBody).unwrap();

      toast.success("Yêu cầu đã được gửi thành công");
      resetToSessionStep();
      onSuccess();
    } catch (error: unknown) {
      const apiError = error as {
        data?: { message?: string; error?: string; [key: string]: unknown };
        status?: number;
        error?: string;
        [key: string]: unknown;
      };
      const errorMessage =
        apiError?.data?.message ||
        apiError?.data?.error ||
        (typeof apiError?.data === "string" ? apiError.data : undefined) ||
        apiError?.error ||
        undefined;
      toast.error(
        formatBackendError(errorMessage, "Có lỗi xảy ra khi gửi yêu cầu")
      );
    }
  };

  const sessionStepComplete = !!selectedSessionId;
  const candidateStepComplete = step === "form" || selectedCandidateId !== null;
  const reasonValid = reason.trim().length >= 10;

  return (
    <div className="space-y-4">
      {/* Step 1: Chọn session */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                sessionStepComplete
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {sessionStepComplete ? "✓" : "1"}
            </div>
            <h3 className="text-sm font-semibold">
              Chọn session cần nhờ dạy thay
            </h3>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            {selectedDate && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs">
                {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setSelectedSessionId(null);
                    setSelectedCandidateId(null);
                    setStep("session");
                  }}
                  className="h-5 w-5 p-0"
                >
                  ×
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              {selectedDate ? "Đổi ngày" : "Chọn ngày"}
            </Button>
          </div>
        </div>

        <div className="pl-8 space-y-3">
          {showDatePicker && (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < today}
              locale={vi}
              className="rounded-lg border"
            />
          )}

          {step === "session" && (
            <div>
              {isLoadingSessions || isFetchingSessions ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessionsData?.data && sessionsData.data.length > 0 ? (
                <ul className="space-y-2">
                  {sessionsData.data.map((session) => {
                    const sessionId = session.sessionId || session.id;
                    if (!sessionId) return null;
                    return (
                      <li key={sessionId}>
                        <button
                          type="button"
                          onClick={() => handleSessionSelect(sessionId)}
                          className="w-full rounded-lg border border-border/60 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                        >
                          <p className="text-sm font-medium">
                            {formatDateShort(session.date)} {session.startTime}{" "}
                            - {session.endTime}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.className} · {session.courseName}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  {selectedDate
                    ? "Không có session nào trong ngày đã chọn"
                    : "Không có session nào trong 14 ngày tới"}
                </div>
              )}
            </div>
          )}

          {sessionStepComplete && step !== "session" && selectedSession && (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">
                  {formatDateShort(selectedSession.date)}{" "}
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSession.className} · {selectedSession.courseName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetToSessionStep()}
              >
                Thay đổi
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Chọn giáo viên đề xuất (tùy chọn) */}
      {sessionStepComplete && (
        <div className={cn("space-y-2", step === "session" && "opacity-50")}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                candidateStepComplete
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {candidateStepComplete ? "✓" : "2"}
            </div>
            <h3 className="text-sm font-semibold">
              Gợi ý giáo viên dạy thay (tùy chọn)
            </h3>
          </div>

          {step === "candidate" && (
            <div className="pl-8">
              {isLoadingCandidates ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : swapCandidates.length > 0 ? (
                <div className="space-y-2">
                  <Popover
                    open={isCandidateDropdownOpen}
                    onOpenChange={setIsCandidateDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {selectedCandidate
                            ? computeCandidateMeta(selectedCandidate).name
                            : "Chọn giáo viên dạy thay..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                      onWheelCapture={(event) => event.stopPropagation()}
                    >
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Tìm kiếm giáo viên..."
                          value={candidateSearch}
                          onChange={(e) => setCandidateSearch(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredCandidates.length > 0 ? (
                          <ul className="p-1">
                            {filteredCandidates.map((candidate) => {
                              const meta = computeCandidateMeta(candidate);
                              const isSelected =
                                (candidate.teacherId ?? null) ===
                                selectedCandidateId;

                              return (
                                <li key={candidate.teacherId ?? meta.name}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCandidateSelect(
                                        candidate.teacherId ?? null
                                      );
                                    }}
                                    className={cn(
                                      "w-full rounded-md px-3 py-2 text-left transition-colors",
                                      isSelected
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                          {meta.name}
                                        </p>
                                        {meta.email && (
                                          <span className="text-xs text-muted-foreground truncate">
                                            {meta.email}
                                          </span>
                                        )}
                                      </div>
                                      {candidate.matchScore != null && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                                          {candidate.matchScore}%
                                        </span>
                                      )}
                                    </div>
                                    {meta.skillSummary && (
                                      <p className="text-xs text-muted-foreground mt-1 truncate">
                                        Kỹ năng: {meta.skillSummary}
                                      </p>
                                    )}
                                    {meta.specializationLine && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        Chuyên môn: {meta.specializationLine}
                                      </p>
                                    )}
                                    {meta.availability && (
                                      <p className="text-xs text-sky-600 mt-1">
                                        Trạng thái: {meta.availability}
                                      </p>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Không tìm thấy giáo viên phù hợp
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCandidateSelect(null)}
                  >
                    Bỏ qua bước này
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
                  Chưa có gợi ý phù hợp
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCandidateSelect(null)}
                    className="mt-2"
                  >
                    Bỏ qua bước này
                  </Button>
                </div>
              )}
            </div>
          )}

          {candidateStepComplete && step === "form" && (
            <div className="pl-8">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-sm">
                  {selectedCandidate
                    ? computeCandidateMeta(selectedCandidate).name
                    : "Để staff đề xuất"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("candidate");
                    setIsCandidateDropdownOpen(true);
                  }}
                >
                  Thay đổi
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Điền lý do */}
      {candidateStepComplete && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                reasonValid
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary text-primary"
              )}
            >
              {reasonValid ? "✓" : "3"}
            </div>
            <h3 className="text-sm font-semibold">Điền lý do nhờ dạy thay</h3>
          </div>

          <div className="space-y-3 pl-8">
            {selectedSession && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">Tóm tắt</p>
                <p>
                  <span className="font-medium text-foreground">Session:</span>{" "}
                  {selectedSession.className} · {selectedSession.courseName}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Thời gian:
                  </span>{" "}
                  {formatDate(selectedSession.date)} ·{" "}
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Giáo viên đề xuất:
                  </span>{" "}
                  {selectedCandidate
                    ? computeCandidateMeta(selectedCandidate).name
                    : "Để staff quyết định"}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Textarea
                placeholder="Mô tả lý do nhờ giáo viên khác dạy thay..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tối thiểu 10 ký tự · {reason.trim().length}/10
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!reasonValid || isSubmitting}
                size="sm"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetToSessionStep()}
              >
                Làm lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeacherRequestDetailContent({
  request,
  fallbackRequest,
  onConfirmSwap,
  onRejectSwap,
  decisionNote,
  onDecisionNoteChange,
  isActionLoading,
  pendingAction,
  hideRequestType = false,
}: {
  request: TeacherRequestDTO;
  fallbackRequest?: TeacherRequestDTO;
  onConfirmSwap?: (action: "confirm") => void;
  onRejectSwap?: (action: "reject") => void;
  decisionNote?: string;
  onDecisionNoteChange?: (note: string) => void;
  isActionLoading?: boolean;
  pendingAction?: "confirm" | "reject" | null;
  hideRequestType?: boolean;
}) {
  const getNestedValue = (source: unknown, path: string[]): unknown => {
    let current: unknown = source;
    for (const segment of path) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  };

  const getNestedString = (
    source: unknown,
    path: string[]
  ): string | undefined => {
    const value = getNestedValue(source, path);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return undefined;
  };

  const getNestedNumber = (
    source: unknown,
    path: string[]
  ): number | undefined => {
    const value = getNestedValue(source, path);
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const getNestedArray = <T = unknown,>(
    source: unknown,
    path: string[]
  ): T[] | undefined => {
    const value = getNestedValue(source, path);
    return Array.isArray(value) ? (value as T[]) : undefined;
  };
  const className =
    request.classInfo?.name ||
    request.className ||
    getNestedString(request, ["classInfo", "className"]) ||
    request.session?.className ||
    getNestedString(request, ["session", "className"]) ||
    getNestedString(request, ["sessionInfo", "className"]) ||
    request.classInfo?.classCode ||
    fallbackRequest?.className ||
    undefined;
  const branchName =
    request.classInfo?.branchName ||
    getNestedString(request, ["classInfo", "branchName"]) ||
    getNestedString(request, ["branchName"]) ||
    undefined;
  const sessionDate =
    request.sessionDate ||
    request.session?.date ||
    getNestedString(request, ["session", "sessionDate"]) ||
    getNestedString(request, ["sessionInfo", "date"]) ||
    fallbackRequest?.sessionDate ||
    undefined;
  const sessionStart =
    request.sessionStartTime ||
    request.session?.startTime ||
    getNestedString(request, ["session", "startTime"]) ||
    getNestedString(request, ["sessionInfo", "startTime"]) ||
    fallbackRequest?.sessionStartTime ||
    undefined;
  const sessionEnd =
    request.sessionEndTime ||
    request.session?.endTime ||
    getNestedString(request, ["session", "endTime"]) ||
    getNestedString(request, ["sessionInfo", "endTime"]) ||
    fallbackRequest?.sessionEndTime ||
    undefined;
  const sessionTopic =
    request.sessionTopic ||
    getNestedString(request, ["session", "topic"]) ||
    getNestedString(request, ["topic"]) ||
    getNestedString(request, ["sessionInfo", "topic"]) ||
    getNestedString(request, ["sessionTopic"]) ||
    getNestedString(request, ["session", "sessionTopic"]) ||
    getNestedString(request, ["session", "name"]) ||
    getNestedString(request, ["sessionInfo", "name"]) ||
    (fallbackRequest?.session as { topic?: string })?.topic ||
    (fallbackRequest as { topic?: string })?.topic ||
    undefined;
  const requestReason =
    request.requestReason ||
    request.reason ||
    getNestedString(request, ["requestReason"]) ||
    getNestedString(request, ["note"]) ||
    fallbackRequest?.reason ||
    "";

  const newSessionDate =
    request.newDate ||
    request.newSessionDate ||
    getNestedString(request, ["newSession", "date"]) ||
    getNestedString(request, ["newSlot", "date"]) ||
    getNestedString(request, ["newSchedule", "date"]) ||
    fallbackRequest?.newDate ||
    undefined;
  const newSessionStart =
    (request.newTimeSlotStartTime ?? request.newStartTime) ||
    request.newSessionStartTime ||
    request.newSlot?.startTime ||
    request.newTimeSlot?.startTime ||
    request.newTimeSlot?.startAt ||
    request.newSession?.startTime ||
    request.newSession?.timeSlot?.startTime ||
    getNestedString(request, ["newTimeSlotStartTime"]) ||
    getNestedString(request, ["newSession", "startTime"]) ||
    getNestedString(request, ["newSlot", "startTime"]) ||
    getNestedString(request, ["newTimeSlot", "startTime"]) ||
    getNestedString(request, ["newTimeSlot", "startAt"]) ||
    getNestedString(request, ["newSchedule", "startTime"]) ||
    getNestedString(request, ["timeSlot", "startTime"]) ||
    getNestedString(request, ["selectedSlot", "startTime"]) ||
    getNestedString(request, ["selectedSlot", "startAt"]) ||
    getNestedString(request, ["selectedTimeSlot", "startTime"]) ||
    getNestedString(request, ["selectedTimeSlot", "startAt"]) ||
    fallbackRequest?.newStartTime ||
    fallbackRequest?.newSlot?.startTime ||
    fallbackRequest?.newTimeSlot?.startTime ||
    fallbackRequest?.newTimeSlot?.startAt ||
    undefined;
  const newSessionEnd =
    (request.newTimeSlotEndTime ?? request.newEndTime) ||
    request.newSessionEndTime ||
    request.newSlot?.endTime ||
    request.newTimeSlot?.endTime ||
    request.newTimeSlot?.endAt ||
    request.newSession?.endTime ||
    request.newSession?.timeSlot?.endTime ||
    getNestedString(request, ["newTimeSlotEndTime"]) ||
    getNestedString(request, ["newSession", "endTime"]) ||
    getNestedString(request, ["newSlot", "endTime"]) ||
    getNestedString(request, ["newTimeSlot", "endTime"]) ||
    getNestedString(request, ["newTimeSlot", "endAt"]) ||
    getNestedString(request, ["newSchedule", "endTime"]) ||
    getNestedString(request, ["timeSlot", "endTime"]) ||
    getNestedString(request, ["selectedSlot", "endTime"]) ||
    getNestedString(request, ["selectedSlot", "endAt"]) ||
    getNestedString(request, ["selectedTimeSlot", "endTime"]) ||
    getNestedString(request, ["selectedTimeSlot", "endAt"]) ||
    fallbackRequest?.newEndTime ||
    fallbackRequest?.newSlot?.endTime ||
    fallbackRequest?.newTimeSlot?.endTime ||
    fallbackRequest?.newTimeSlot?.endAt ||
    undefined;

  const newTimeSlotLabel =
    (request.newTimeSlotName ?? request.newTimeSlotLabel) ||
    request.newSlot?.label ||
    request.newSlot?.name ||
    request.newSlot?.displayLabel ||
    request.newTimeSlot?.label ||
    request.newTimeSlot?.name ||
    request.newTimeSlot?.displayLabel ||
    request.newSession?.timeSlotLabel ||
    request.newSession?.timeSlot?.label ||
    request.newSession?.timeSlot?.name ||
    getNestedString(request, ["newTimeSlotName"]) ||
    getNestedString(request, ["newSession", "timeSlotLabel"]) ||
    getNestedString(request, ["newSession", "timeSlot", "label"]) ||
    getNestedString(request, ["newSession", "timeSlot", "name"]) ||
    getNestedString(request, ["newSlot", "label"]) ||
    getNestedString(request, ["newSlot", "name"]) ||
    getNestedString(request, ["newSlot", "displayLabel"]) ||
    getNestedString(request, ["newTimeSlot", "label"]) ||
    getNestedString(request, ["newTimeSlot", "name"]) ||
    getNestedString(request, ["newTimeSlot", "displayLabel"]) ||
    getNestedString(request, ["newSchedule", "label"]) ||
    getNestedString(request, ["timeSlot", "label"]) ||
    getNestedString(request, ["timeSlot", "name"]) ||
    fallbackRequest?.newTimeSlotLabel ||
    fallbackRequest?.newSlot?.label ||
    fallbackRequest?.newSlot?.name ||
    fallbackRequest?.newTimeSlot?.label ||
    fallbackRequest?.newTimeSlot?.name ||
    undefined;
  const newResourceName =
    request.newResourceName ||
    getNestedString(request, ["newResource", "name"]) ||
    fallbackRequest?.newResourceName ||
    undefined;

  const replacementTeacherName =
    request.replacementTeacherName ||
    getNestedString(request, ["replacementTeacher", "fullName"]) ||
    getNestedString(request, ["replacementTeacher", "displayName"]) ||
    getNestedString(request, ["replacementTeacher", "name"]) ||
    fallbackRequest?.replacementTeacherName ||
    undefined;
  const replacementTeacherEmail =
    request.replacementTeacherEmail ||
    getNestedString(request, ["replacementTeacher", "email"]) ||
    fallbackRequest?.replacementTeacherEmail ||
    undefined;
  const replacementTeacherPhone =
    request.replacementTeacherPhone ||
    getNestedString(request, ["replacementTeacher", "phone"]) ||
    fallbackRequest?.replacementTeacherPhone ||
    undefined;
  const replacementTeacherSpecialization =
    request.replacementTeacherSpecialization ||
    getNestedString(request, ["replacementTeacher", "specialization"]) ||
    fallbackRequest?.replacementTeacherSpecialization ||
    undefined;
  const replacementTeacherNote =
    request.replacementTeacherNote ||
    getNestedString(request, ["replacementTeacher", "note"]) ||
    fallbackRequest?.replacementTeacherNote ||
    undefined;
  const replacementTeacherMatchScore =
    getNestedNumber(request, ["replacementTeacher", "matchScore"]) ??
    getNestedNumber(fallbackRequest, ["replacementTeacher", "matchScore"]);
  const replacementTeacherSkills =
    getNestedArray<unknown>(request, ["replacementTeacher", "skills"]) ??
    getNestedArray<unknown>(fallbackRequest, ["replacementTeacher", "skills"]);
  const formattedReplacementSkills = replacementTeacherSkills
    ?.map((skill) => {
      if (!skill) return undefined;
      if (typeof skill === "string") return skill;
      if (typeof skill === "object") {
        const name =
          getNestedString(skill, ["name"]) ||
          getNestedString(skill, ["skillName"]) ||
          getNestedString(skill, ["skill", "name"]) ||
          getNestedString(skill, ["skill", "code"]);
        const level =
          getNestedString(skill, ["level"]) ||
          getNestedString(skill, ["skillLevel"]) ||
          getNestedString(skill, ["proficiency"]);
        return [name, level].filter(Boolean).join(" · ") || undefined;
      }
      return undefined;
    })
    .filter(Boolean) as string[] | undefined;

  const hasModalityChangeInfo =
    request.requestType === "MODALITY_CHANGE" && newResourceName;
  const hasRescheduleInfo =
    request.requestType === "RESCHEDULE" &&
    (newSessionDate ||
      newSessionStart ||
      newSessionEnd ||
      newTimeSlotLabel ||
      newResourceName);
  const hasSwapInfo =
    request.requestType === "SWAP" &&
    (replacementTeacherName ||
      replacementTeacherEmail ||
      replacementTeacherPhone ||
      replacementTeacherSpecialization ||
      replacementTeacherMatchScore !== undefined ||
      (formattedReplacementSkills && formattedReplacementSkills.length > 0) ||
      replacementTeacherNote);

  return (
    <div className="space-y-4">
      {!hideRequestType && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Loại yêu cầu
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {REQUEST_TYPE_LABELS[request.requestType]}
              </Badge>
              <Badge
                className={cn(
                  "font-semibold",
                  REQUEST_STATUS_META[request.status].badgeClass
                )}
              >
                {REQUEST_STATUS_META[request.status].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Gửi lúc {formatDateTime(request.submittedAt)}
              </span>
            </div>
          </div>

          <div className="h-px bg-border" />
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Thông tin buổi học
          </p>
          <div className="mt-1 space-y-1">
            <p className="font-medium text-foreground">
              {className || "Chưa cập nhật"}
              {sessionDate && (
                <>
                  {" "}
                  <span className="font-medium">
                    ·{" "}
                    {format(parseISO(sessionDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                </>
              )}
            </p>
            {sessionTopic && (
              <p className="text-sm text-muted-foreground">{sessionTopic}</p>
            )}
            {(sessionStart || sessionEnd) && (
              <p className="text-sm text-muted-foreground">
                {sessionStart && sessionEnd
                  ? `${sessionStart} - ${sessionEnd}`
                  : sessionStart || sessionEnd || ""}
              </p>
            )}
            {branchName && (
              <p className="text-xs text-muted-foreground">
                Cơ sở: {branchName}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          {request.currentModality && (
            <p>
              Phương thức hiện tại:{" "}
              <span className="font-medium text-foreground">
                {request.currentModality}
              </span>
            </p>
          )}
          {request.newModality && (
            <p>
              Đề xuất mới:{" "}
              <span className="font-medium text-foreground">
                {request.newModality}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      {hasModalityChangeInfo && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Thông tin đề xuất
            </p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {newResourceName && (
                <p>
                  Resource được gợi ý:{" "}
                  <span className="font-medium text-foreground">
                    {newResourceName}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />
        </>
      )}

      {hasRescheduleInfo && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Thông tin đề xuất
            </p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {newSessionDate && (
                <p>
                  Ngày mới:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(newSessionDate)}
                  </span>
                </p>
              )}
              {(newSessionStart || newSessionEnd) && (
                <p>
                  Khung giờ:{" "}
                  <span className="font-medium text-foreground">
                    {newSessionStart && newSessionEnd
                      ? `${newSessionStart} - ${newSessionEnd}`
                      : newSessionStart ?? newSessionEnd}
                  </span>
                </p>
              )}
              {newResourceName && (
                <p>
                  Resource đề xuất:{" "}
                  <span className="font-medium text-foreground">
                    {newResourceName}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />
        </>
      )}

      {hasSwapInfo && (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Giáo viên dạy thay
            </p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {replacementTeacherName && (
                <p>
                  Họ và tên:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherName}
                  </span>
                </p>
              )}
              {replacementTeacherEmail && (
                <p>
                  Email:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherEmail}
                  </span>
                </p>
              )}
              {replacementTeacherPhone && (
                <p>
                  Số điện thoại:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherPhone}
                  </span>
                </p>
              )}
              {replacementTeacherSpecialization && (
                <p>
                  Chuyên môn:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherSpecialization}
                  </span>
                </p>
              )}
              {replacementTeacherMatchScore !== undefined && (
                <p>
                  Điểm phù hợp:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherMatchScore.toFixed(0)}%
                  </span>
                </p>
              )}
              {formattedReplacementSkills &&
                formattedReplacementSkills.length > 0 && (
                  <div>
                    <p>Kỹ năng:</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {formattedReplacementSkills.map((skill, index) => (
                        <li key={`${skill}-${index}`}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {replacementTeacherNote && (
                <p>
                  Ghi chú:{" "}
                  <span className="font-medium text-foreground">
                    {replacementTeacherNote}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />
        </>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lý do
        </p>
        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
          {requestReason || "Chưa cung cấp"}
        </p>
      </div>

      {request.note && (
        <>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ghi chú từ Academic
            </p>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {request.note}
            </p>
          </div>
        </>
      )}

      <div className="h-px bg-border" />

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lịch sử xử lý
        </p>
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="border-border/60 border-b pb-2">
            {formatDateTime(request.submittedAt)} · Gửi yêu cầu
          </div>
          {request.decidedAt ? (
            <div className="pt-2">
              {formatDateTime(request.decidedAt)} ·{" "}
              {REQUEST_STATUS_META[request.status].label}
              {request.decidedBy && ` bởi ${request.decidedBy}`}
            </div>
          ) : (
            <div className="pt-2 text-xs text-muted-foreground">
              Yêu cầu chưa được xử lý
            </div>
          )}
        </div>
      </div>

      {request.requestType === "SWAP" &&
        request.status === "WAITING_CONFIRM" &&
        onConfirmSwap &&
        onRejectSwap && (
          <>
            <div className="h-px bg-border" />

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Xác nhận dạy thay
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bạn có muốn đồng ý dạy thay session này không?
                </p>
              </div>

              {(pendingAction === "reject" || !pendingAction) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {pendingAction === "reject"
                      ? "Lý do từ chối"
                      : "Ghi chú (nếu từ chối)"}
                  </p>
                  <Textarea
                    placeholder={
                      pendingAction === "reject"
                        ? "Nhập lý do từ chối (tối thiểu 10 ký tự)..."
                        : "Nhập ghi chú hoặc lý do từ chối (tối thiểu 10 ký tự nếu từ chối)..."
                    }
                    rows={4}
                    value={decisionNote || ""}
                    onChange={(e) => onDecisionNoteChange?.(e.target.value)}
                    disabled={isActionLoading}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Sau khi xác nhận, yêu cầu sẽ được cập nhật ngay.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    disabled={isActionLoading}
                    onClick={() => onRejectSwap("reject")}
                  >
                    {pendingAction === "reject" ? "Đang từ chối..." : "Từ chối"}
                  </Button>
                  <Button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onConfirmSwap("confirm")}
                  >
                    {pendingAction === "confirm" ? "Đang đồng ý..." : "Đồng ý"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
