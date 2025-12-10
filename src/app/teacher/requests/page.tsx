import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  useGetMyRequestsQuery,
  useGetRequestByIdQuery,
  useConfirmReplacementRequestMutation,
  useRejectReplacementRequestMutation,
  useGetTeacherRequestConfigQuery,
  type RequestType,
  type RequestStatus,
  type TeacherRequestDTO,
} from "@/store/services/teacherRequestApi";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalBody,
} from "@/components/ui/full-screen-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UnifiedTeacherRequestFlow from "@/components/teacher-requests/UnifiedTeacherRequestFlow";
import { RequestDetailDialog } from "./components/RequestDetailDialog";
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
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import {
  Plus,
  NotebookPen,
  RefreshCcw,
  Search,
  X,
  Clock3,
  CheckCircle2,
  XCircle,
  UserCheck,
  MoreVertical,
  ChevronDownIcon,
  ArrowLeftRight,
  CalendarClock,
  UserRoundCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  REPLACEMENT: "Nhờ dạy thay",
};

const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; badgeClass: string; tone: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    tone: "text-amber-600",
  },
  WAITING_CONFIRM: {
    label: "Chờ xác nhận",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
    tone: "text-sky-600",
  },
  APPROVED: {
    label: "Đã duyệt",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    tone: "text-emerald-600",
  },
  REJECTED: {
    label: "Đã từ chối",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    tone: "text-rose-600",
  },
};

const REQUEST_TYPE_BADGES: Record<RequestType, { className: string }> = {
  MODALITY_CHANGE: {
    className: "bg-sky-100 text-sky-700 border-sky-200",
  },
  RESCHEDULE: {
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  REPLACEMENT: {
    className: "bg-purple-100 text-purple-700 border-purple-200",
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
  { label: REQUEST_TYPE_LABELS.REPLACEMENT, value: "REPLACEMENT" },
];

const PAGE_SIZE = 8;

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
    // Note: timeWindowDays should come from config, but error handler doesn't have access to it
    // This is a fallback message - actual validation happens in backend
    return "Ngày session đề xuất không nằm trong khoảng thời gian cho phép.";
  }

  if (errorMessage.includes("TEACHER_RESCHEDULE_MIN_DAYS_NOT_MET")) {
    return "Bạn phải gửi yêu cầu dời buổi trước ít nhất số ngày tối thiểu theo quy định.";
  }

  if (errorMessage.includes("Reschedule request must be submitted earlier")) {
    return "Bạn phải gửi yêu cầu dời buổi trước ít nhất số ngày tối thiểu theo quy định.";
  }

  if (errorMessage.includes("TEACHER_REPLACEMENT_MIN_DAYS_NOT_MET")) {
    return "Bạn phải gửi yêu cầu nhờ dạy thay trước ít nhất số ngày tối thiểu theo quy định.";
  }

  if (errorMessage.includes("Replacement request must be submitted earlier")) {
    return "Bạn phải gửi yêu cầu nhờ dạy thay trước ít nhất số ngày tối thiểu theo quy định.";
  }

  if (errorMessage.includes("TEACHER_RESCHEDULE_MONTHLY_LIMIT_REACHED")) {
    return "Bạn đã đạt giới hạn số lần xin dời buổi trong tháng này. Vui lòng thử lại vào tháng sau.";
  }

  if (errorMessage.includes("TEACHER_RESCHEDULE_COURSE_LIMIT_REACHED")) {
    return "Bạn đã đạt giới hạn số lần xin dời buổi cho khóa học này.";
  }

  if (errorMessage.includes("Reschedule limit for this course reached")) {
    return "Bạn đã đạt giới hạn số lần xin dời buổi cho khóa học này.";
  }

  if (errorMessage.includes("TEACHER_MODALITY_CHANGE_COURSE_LIMIT_REACHED")) {
    return "Bạn đã đạt giới hạn số lần đổi hình thức dạy cho khóa học này. Vui lòng liên hệ giáo vụ nếu cần thay đổi thêm.";
  }

  if (errorMessage.includes("TEACHER_REPLACEMENT_MONTHLY_LIMIT_REACHED")) {
    return "Bạn đã đạt giới hạn số lần xin thay giáo viên trong tháng này. Vui lòng thử lại vào tháng sau.";
  }

  if (errorMessage.includes("TEACHER_REQUEST_DAILY_LIMIT_REACHED")) {
    return "Bạn đã đạt giới hạn số lượng yêu cầu có thể tạo trong ngày hôm nay.";
  }

  if (errorMessage.includes("Daily request limit reached")) {
    return "Bạn đã đạt giới hạn số lượng yêu cầu có thể tạo trong ngày hôm nay.";
  }

  if (errorMessage.includes("TEACHER_REQUEST_REASON_REQUIRED")) {
    return "Vui lòng nhập lý do cho yêu cầu này.";
  }

  if (errorMessage.includes("TEACHER_REQUEST_REASON_TOO_SHORT")) {
    return "Lý do yêu cầu quá ngắn. Vui lòng nhập lý do chi tiết hơn.";
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
  const { user } = useAuth();
  const {
    data,
    isFetching: isLoadingRequests,
    error,
    refetch,
  } = useGetMyRequestsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Load teacher request config for policy values
  const { data: teacherConfig } = useGetTeacherRequestConfigQuery();
  const reasonMinLength = teacherConfig?.data?.reasonMinLength ?? 10;
  const [activeType, setActiveType] = useState<RequestType | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | RequestType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RequestStatus>(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"status" | "submittedAt" | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const displayedRequests = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    let result = filteredRequests;

    // Apply search filter
    if (normalized) {
      result = result.filter((request) => {
        const candidates = [
          request.className,
          request.subjectName,
          request.reason,
          request.sessionTopic,
          request.session?.topic,
          request.session?.name,
          request.newResourceName,
          request.replacementTeacherName,
          request.id ? `#${request.id}` : undefined,
        ];

        return candidates.some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(normalized)
        );
      });
    }

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let comparison = 0;

        if (sortField === "status") {
          const statusOrder = [
            "PENDING",
            "WAITING_CONFIRM",
            "APPROVED",
            "REJECTED",
          ];
          const aIndex = statusOrder.indexOf(a.status) ?? -1;
          const bIndex = statusOrder.indexOf(b.status) ?? -1;
          comparison = aIndex - bIndex;
        } else if (sortField === "submittedAt") {
          const aDate = parseISO(a.submittedAt).getTime();
          const bDate = parseISO(b.submittedAt).getTime();
          comparison = aDate - bDate;
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [filteredRequests, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    setPage(0);
  }, [typeFilter, statusFilter, searchQuery, sortField, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedRequests.length / PAGE_SIZE)
  );

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const paginatedRequests = useMemo(() => {
    const start = page * PAGE_SIZE;
    return displayedRequests.slice(start, start + PAGE_SIZE);
  }, [displayedRequests, page]);

  const { data: detailData, isFetching: isLoadingDetail } =
    useGetRequestByIdQuery(detailId ?? 0, {
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

  const [confirmReplacementRequest, { isLoading: isConfirming }] =
    useConfirmReplacementRequestMutation();
  const [rejectReplacementRequest, { isLoading: isRejecting }] =
    useRejectReplacementRequestMutation();

  const isActionLoading = isConfirming || isRejecting;

  const handleModalClose = () => {
    setActiveType(null);
  };

  const handleDetailClose = () => {
    setDetailId(null);
    setDecisionNote("");
    setPendingAction(null);
  };

  const handleReplacementDecision = async (action: "confirm" | "reject") => {
    if (!detailId) return;

    const trimmedNote = decisionNote.trim();

    if (action === "reject" && trimmedNote.length < reasonMinLength) {
      toast.error(
        `Vui lòng nhập lý do từ chối (tối thiểu ${reasonMinLength} ký tự).`
      );
      return;
    }

    setPendingAction(action);

    try {
      if (action === "confirm") {
        await confirmReplacementRequest({
          id: detailId,
          body: {
            note: trimmedNote || undefined,
          },
        }).unwrap();
        toast.success("Đã đồng ý dạy thay.");
      } else {
        await rejectReplacementRequest({
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

  const sidebarStyle: CSSProperties = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties;

  const SummaryCard = ({
    label,
    value,
    icon: Icon,
    description,
    iconBgColor,
    iconColor,
  }: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    iconBgColor: string;
    iconColor: string;
  }) => {
    return (
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              iconBgColor
            )}
          >
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  };

  const summaryCards = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Tổng số yêu cầu"
        value={summary.total}
        icon={NotebookPen}
        description="Tất cả yêu cầu đã gửi"
        iconBgColor="bg-slate-100 dark:bg-slate-800/50"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <SummaryCard
        label="Chờ duyệt"
        value={summary.pending}
        icon={Clock3}
        description="Chờ phê duyệt"
        iconBgColor="bg-amber-50 dark:bg-amber-950/30"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <SummaryCard
        label="Đã duyệt"
        value={summary.approved}
        icon={CheckCircle2}
        description="Được chấp thuận"
        iconBgColor="bg-emerald-50 dark:bg-emerald-950/30"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <SummaryCard
        label="Đã từ chối"
        value={summary.rejected}
        icon={XCircle}
        description="Không được duyệt"
        iconBgColor="bg-rose-50 dark:bg-rose-950/30"
        iconColor="text-rose-600 dark:text-rose-400"
      />
      <SummaryCard
        label="Chờ xác nhận"
        value={summary.waitingConfirm}
        icon={UserCheck}
        description="Chờ giáo viên dạy thay xác nhận"
        iconBgColor="bg-sky-50 dark:bg-sky-950/30"
        iconColor="text-sky-600 dark:text-sky-400"
      />
    </div>
  );

  const filterControls = (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo lớp, môn, lý do hoặc mã yêu cầu..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={typeFilter}
          onValueChange={(value: "ALL" | RequestType) => {
            setTypeFilter(value);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tất cả loại yêu cầu" />
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
            <SelectValue placeholder="Tất cả trạng thái" />
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
            setSearchQuery("");
            refetch();
          }}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderRequestList = () => {
    if (isLoadingRequests) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (displayedRequests.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <NotebookPen className="h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium">Không có yêu cầu phù hợp</p>
          <p className="text-sm text-muted-foreground">
            {requests.length === 0
              ? "Bạn chưa có yêu cầu nào. Tạo yêu cầu mới để bộ phận Học vụ hỗ trợ."
              : "Điều chỉnh bộ lọc hoặc tạo thêm yêu cầu mới."}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TableHead>Loại</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/60"
                  onClick={() => {
                    if (sortField === "status") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("status");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Trạng thái
                  {sortField === "status" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Buổi học/Lớp</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/60"
                  onClick={() => {
                    if (sortField === "submittedAt") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("submittedAt");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Ngày gửi
                  {sortField === "submittedAt" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => {
              const pickString = (
                ...values: Array<unknown>
              ): string | undefined => {
                for (const value of values) {
                  if (typeof value === "string" && value.trim().length > 0) {
                    return value;
                  }
                }
                return undefined;
              };

              const submittedAtLabel = request.submittedAt
                ? format(parseISO(request.submittedAt), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })
                : "Chưa cập nhật";

              const sessionDateLabel = request.sessionDate
                ? format(parseISO(request.sessionDate), "dd/MM/yyyy", {
                    locale: vi,
                  })
                : "Chưa có ngày";
              const sessionTimeLabel =
                request.sessionStartTime && request.sessionEndTime
                  ? `${request.sessionStartTime} - ${request.sessionEndTime}`
                  : request.sessionStartTime || request.sessionEndTime || "—";

              const classLabel =
                pickString(
                  request.className,
                  request.subjectName,
                  request.session?.className,
                  request.session?.classCode
                ) ?? "Không rõ lớp";

              const sessionLabel =
                pickString(
                  request.session?.topic,
                  request.sessionTopic,
                  request.session?.courseSessionTitle,
                  request.session?.name,
                  request.session?.subjectName
                ) ?? "Chưa có thông tin buổi";

              const reason = request.reason || "Không có lý do";
              const truncatedReason =
                reason.length > 80 ? `${reason.slice(0, 80)}...` : reason;

              return (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailId(request.id)}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium",
                        REQUEST_TYPE_BADGES[request.requestType].className
                      )}
                    >
                      {REQUEST_TYPE_LABELS[request.requestType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "w-fit font-semibold",
                            REQUEST_STATUS_META[request.status].badgeClass
                          )}
                        >
                          {REQUEST_STATUS_META[request.status].label}
                        </Badge>
                        {/* Indicator for replacement teacher */}
                        {request.requestType === "REPLACEMENT" &&
                          request.status === "WAITING_CONFIRM" &&
                          request.replacementTeacherId === user?.id && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                            >
                              Bạn được yêu cầu dạy thay
                            </Badge>
                          )}
                        {/* Indicator for request owner waiting for replacement */}
                        {request.requestType === "REPLACEMENT" &&
                          request.status === "WAITING_CONFIRM" &&
                          request.teacherId === user?.id &&
                          request.replacementTeacherId !== user?.id && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            >
                              Đang chờ giáo viên dạy thay xác nhận
                            </Badge>
                          )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">
                        {classLabel}
                      </p>
                      {request.subjectName && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {request.subjectName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium leading-tight">
                        {sessionLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sessionDateLabel} · {sessionTimeLabel}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell title={reason} className="text-muted-foreground">
                    {truncatedReason}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submittedAtLabel}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailId(request.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Xem chi tiết</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  const errorView = (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="max-w-md rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.
        </p>
      </div>
    </div>
  );

  const mainView = (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Yêu cầu của tôi
            </h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi và tạo yêu cầu đổi phương thức, đổi lịch, dạy thay.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Tạo yêu cầu
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setActiveType("MODALITY_CHANGE")}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Thay đổi phương thức
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveType("RESCHEDULE")}>
                <CalendarClock className="h-4 w-4 mr-2" />
                Đổi lịch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveType("REPLACEMENT")}>
                <UserRoundCheck className="h-4 w-4 mr-2" />
                Nhờ dạy thay
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        {summaryCards}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-sm text-sky-700">
          <span>
            Chờ xác nhận từ giáo viên dạy thay:{" "}
            <span className="font-semibold">{summary.waitingConfirm}</span>
          </span>
          <span className="text-xs text-sky-600">
            Số lượng này sẽ giảm khi giáo viên xác nhận.
          </span>
        </div>
        {filterControls}
        {renderRequestList()}
        {displayedRequests.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm md:flex-nowrap">
            <span className="text-muted-foreground whitespace-nowrap">
              Trang {Math.min(page + 1, totalPages)} / {totalPages}
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.max(prev - 1, 0));
                    }}
                    disabled={page === 0}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index).map(
                  (pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={pageNum === page}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.min(prev + 1, totalPages - 1));
                    }}
                    disabled={page >= totalPages - 1}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );

  const pageShell = (content: ReactNode) => (
    <TeacherRoute>
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {content}
        </SidebarInset>
      </SidebarProvider>

      {/* Request Flow Modal */}
      <FullScreenModal
        open={activeType !== null}
        onOpenChange={(open) => !open && handleModalClose()}
      >
        <FullScreenModalContent size="lg">
          <FullScreenModalHeader>
            <FullScreenModalTitle>
              {activeType && REQUEST_TYPE_LABELS[activeType]}
            </FullScreenModalTitle>
          </FullScreenModalHeader>
          <FullScreenModalBody>
            {activeType && (
              <UnifiedTeacherRequestFlow
                type={activeType}
                onSuccess={() => {
                  handleModalClose();
                  refetch();
                }}
              />
            )}
          </FullScreenModalBody>
        </FullScreenModalContent>
      </FullScreenModal>

      <RequestDetailDialog
        requestId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) handleDetailClose();
        }}
        isLoading={isLoadingDetail}
        request={detailData?.data ?? requestFromList ?? null}
        onConfirmReplacement={handleReplacementDecision}
        onRejectReplacement={handleReplacementDecision}
        decisionNote={decisionNote}
        onDecisionNoteChange={setDecisionNote}
        isActionLoading={isActionLoading}
        pendingAction={pendingAction}
        reasonMinLength={reasonMinLength}
      />
    </TeacherRoute>
  );

  if (error) {
    return pageShell(errorView);
  }

  return pageShell(mainView);
}

export function TeacherRequestDetailContent({
  request,
  fallbackRequest,
  onConfirmReplacement,
  onRejectReplacement,
  decisionNote,
  onDecisionNoteChange,
  isActionLoading,
  pendingAction,
  hideRequestType = false,
  reasonMinLength = 10,
}: {
  request: TeacherRequestDTO;
  fallbackRequest?: TeacherRequestDTO;
  onConfirmReplacement?: (action: "confirm") => void;
  onRejectReplacement?: (action: "reject") => void;
  decisionNote?: string;
  onDecisionNoteChange?: (note: string) => void;
  isActionLoading?: boolean;
  pendingAction?: "confirm" | "reject" | null;
  hideRequestType?: boolean;
  reasonMinLength?: number;
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

  // Compute days until the original session date (for display similar to student requests)
  let daysUntilSession: number | null = null;
  if (sessionDate) {
    try {
      const sessionDateObj = parseISO(sessionDate);
      const now = new Date();
      daysUntilSession = Math.ceil(
        (sessionDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    } catch {
      daysUntilSession = null;
    }
  }
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
  const hasReplacementInfo =
    request.requestType === "REPLACEMENT" &&
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
            {daysUntilSession !== null && (
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

      {hasReplacementInfo && (
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

      {request.note &&
        (() => {
          // Parse note để loại bỏ phần DECLINED_BY_TEACHER_ID
          // Format: DECLINED_BY_TEACHER_ID:{teacherId}:{reason}
          // Hoặc có thể có nhiều dòng với format này
          const noteLines = request.note.split("\n");
          const academicNotes: string[] = [];
          const declinedInfo: Array<{
            teacherId: string;
            teacherName: string;
            reason: string;
          }> = [];

          for (const line of noteLines) {
            if (line.startsWith("DECLINED_BY_TEACHER:")) {
              // Parse declined info
              // Format: DECLINED_BY_TEACHER:{teacherId}:{teacherName}:{reason}
              const parts = line.split(":");
              if (parts.length >= 4) {
                declinedInfo.push({
                  teacherId: parts[1],
                  teacherName: parts[2],
                  reason: parts.slice(3).join(":"),
                });
              } else if (parts.length >= 3) {
                // Fallback cho format cũ: DECLINED_BY_TEACHER_ID:{teacherId}:{reason}
                declinedInfo.push({
                  teacherId: parts[1],
                  teacherName: `Giáo viên ID ${parts[1]}`,
                  reason: parts.slice(2).join(":"),
                });
              }
            } else if (line.startsWith("DECLINED_BY_TEACHER_ID:")) {
              // Parse format cũ để backward compatibility
              const parts = line.split(":");
              if (parts.length >= 3) {
                declinedInfo.push({
                  teacherId: parts[1],
                  teacherName: `Giáo viên ID ${parts[1]}`,
                  reason: parts.slice(2).join(":"),
                });
              }
            } else if (line.trim()) {
              // Đây là note từ academic staff
              academicNotes.push(line);
            }
          }

          const academicNote = academicNotes.join("\n").trim();

          return (
            <>
              {academicNote && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ghi chú từ bộ phận Học vụ
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {academicNote}
                    </p>
                  </div>
                </>
              )}
              {declinedInfo.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Giáo viên đã từ chối
                    </p>
                    <div className="mt-1 space-y-2">
                      {declinedInfo.map((info, index) => (
                        <div
                          key={index}
                          className="text-sm text-amber-700 dark:text-amber-400"
                        >
                          <span className="font-medium">
                            {info.teacherName}:
                          </span>{" "}
                          {info.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          );
        })()}

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

      {request.requestType === "REPLACEMENT" &&
        request.status === "WAITING_CONFIRM" &&
        onConfirmReplacement &&
        onRejectReplacement && (
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
                        ? `Nhập lý do từ chối (tối thiểu ${reasonMinLength} ký tự)...`
                        : `Nhập ghi chú hoặc lý do từ chối (tối thiểu ${reasonMinLength} ký tự nếu từ chối)...`
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
                    onClick={() => onRejectReplacement("reject")}
                  >
                    {pendingAction === "reject" ? "Đang từ chối..." : "Từ chối"}
                  </Button>
                  <Button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => onConfirmReplacement("confirm")}
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
