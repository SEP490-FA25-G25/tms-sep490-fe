import { useMemo, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  SearchIcon,
  Clock3,
  ArrowLeftRight,
  CalendarClock,
  UserRoundCheck,
} from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  useGetStaffRequestsQuery,
  useGetRequestByIdQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useGetReplacementCandidatesQuery,
  useGetModalityResourcesQuery,
  useGetRescheduleResourcesQuery,
  type RequestType as TeacherRequestType,
  type RequestStatus as TeacherRequestStatus,
  type TeacherRequestDTO,
  type ReplacementCandidateDTO,
} from "@/store/services/teacherRequestApi";
import { TeacherRequestDetailContent } from "@/app/teacher/requests/page";

const TEACHER_REQUEST_TYPE_LABELS: Record<TeacherRequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  REPLACEMENT: "Nhờ dạy thay",
};

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
    return "Ngày buổi học đề xuất không nằm trong khoảng thời gian cho phép (trong vòng 7 ngày từ hôm nay).";
  }

  if (errorMessage.includes("INVALID_DATE")) {
    return "Ngày đề xuất không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (errorMessage.includes("NO_AVAILABLE_RESOURCES")) {
    return "Không tìm thấy phòng học/phương tiện phù hợp cho khung giờ này.";
  }

  if (errorMessage.includes("TEACHER_NOT_FOUND")) {
    return "Không tìm thấy thông tin giáo viên. Vui lòng thử lại sau.";
  }

  if (errorMessage.includes("RESOURCE_NOT_AVAILABLE")) {
    return "Phòng học/phương tiện không khả dụng tại thời gian đã chỉ định. Vui lòng chọn lựa chọn khác.";
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

  // Fallback: return the original message if we can't format it
  return errorMessage;
};

const TEACHER_REQUEST_STATUS_META: Record<
  TeacherRequestStatus,
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

const getCandidateSkills = (
  candidate: ReplacementCandidateDTO
): string | undefined => {
  // Helper to format skill with level
  const formatSkillWithLevel = (skill: unknown): string | null => {
    if (typeof skill === "string") {
      return skill.trim();
    }

    if (skill && typeof skill === "object") {
      // Extract skill name - can be direct string in "skill" field or nested
      const skillName =
        (typeof (skill as { skill?: unknown }).skill === "string"
          ? (skill as { skill: string }).skill
          : null) ||
        (skill as { name?: string }).name ||
        (skill as { skillName?: string }).skillName ||
        (typeof (skill as { skill?: unknown }).skill === "object" &&
          (skill as { skill?: { name?: string } }).skill?.name);

      // Extract level - can be number (1-5) or string
      const skillLevelRaw =
        (skill as { level?: string | number }).level !== undefined
          ? (skill as { level?: string | number }).level
          : (skill as { skillLevel?: string | number }).skillLevel !== undefined
          ? (skill as { skillLevel?: string | number }).skillLevel
          : (skill as { proficiency?: string | number }).proficiency;

      // Format level: if number, convert to string; if string, use as is
      let skillLevel: string | null = null;
      if (skillLevelRaw !== undefined && skillLevelRaw !== null) {
        if (typeof skillLevelRaw === "number") {
          skillLevel = String(skillLevelRaw);
        } else if (
          typeof skillLevelRaw === "string" &&
          skillLevelRaw.trim().length > 0
        ) {
          skillLevel = skillLevelRaw.trim();
        }
      }

      if (
        skillName &&
        typeof skillName === "string" &&
        skillName.trim().length > 0
      ) {
        if (skillLevel) {
          return `${skillName.trim()} (${skillLevel})`;
        }
        return skillName.trim();
      }
    }

    return null;
  };

  // Try to extract from skills array (prioritize this as it has structured data)
  if (
    candidate.skills &&
    Array.isArray(candidate.skills) &&
    candidate.skills.length > 0
  ) {
    const formattedSkills = candidate.skills
      .map(formatSkillWithLevel)
      .filter((skill): skill is string => skill !== null);

    if (formattedSkills.length > 0) {
      return formattedSkills.join(", ");
    }
  }

  // Try to extract from teacherSkills array
  if (
    candidate.teacherSkills &&
    Array.isArray(candidate.teacherSkills) &&
    candidate.teacherSkills.length > 0
  ) {
    const formattedSkills = candidate.teacherSkills
      .map(formatSkillWithLevel)
      .filter((skill): skill is string => skill !== null);

    if (formattedSkills.length > 0) {
      return formattedSkills.join(", ");
    }
  }

  // Try skillSummary as fallback
  if (candidate.skillSummary && typeof candidate.skillSummary === "string") {
    return candidate.skillSummary.trim();
  }

  // Try skillsDescription as fallback
  if (
    candidate.skillsDescription &&
    typeof candidate.skillsDescription === "string"
  ) {
    return candidate.skillsDescription.trim();
  }

  return undefined;
};

const getRequestTopic = (request: TeacherRequestDTO): string | undefined => {
  const directCandidates = [
    (request.session as { topic?: string })?.topic,
    (request as { topic?: string }).topic,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

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
      if (value && typeof value === "object" && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
        break;
      }
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

export default function AcademicTeacherRequestsPage() {
  // Teacher request filter states
  const [teacherTypeFilter, setTeacherTypeFilter] = useState<
    "ALL" | TeacherRequestType
  >("ALL");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<
    "ALL" | TeacherRequestStatus
  >("ALL");
  const [teacherSearchKeyword, setTeacherSearchKeyword] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );
  const [decisionNote, setDecisionNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [selectedReplacementTeacherId, setSelectedReplacementTeacherId] =
    useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(
    null
  );
  const [pendingPage, setPendingPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const PAGE_SIZE = 10;

  // Teacher requests queries
  const {
    data: teacherRequestsResponse,
    isFetching: isLoadingTeacherRequests,
    error: teacherRequestsError,
    refetch: refetchTeacherRequests,
  } = useGetStaffRequestsQuery({
    status: teacherStatusFilter === "ALL" ? undefined : teacherStatusFilter,
  });

  const {
    data: selectedRequestDetailResponse,
    isFetching: isLoadingDetail,
    refetch: refetchRequestDetail,
  } = useGetRequestByIdQuery(
    selectedRequestId !== null ? selectedRequestId : skipToken,
    {
      skip: selectedRequestId === null,
    }
  );

  const selectedRequestFromDetail = selectedRequestDetailResponse?.data;

  const teacherRequests = useMemo(
    () => teacherRequestsResponse?.data ?? [],
    [teacherRequestsResponse?.data]
  );

  // Find request from list (which has correct className) and merge with detail
  const selectedRequestFromList = useMemo(() => {
    if (selectedRequestId === null) return null;
    return teacherRequests.find((r) => r.id === selectedRequestId) || null;
  }, [selectedRequestId, teacherRequests]);

  // Merge: prioritize data from list (has correct className), fallback to detail
  const selectedRequest = useMemo(() => {
    if (!selectedRequestFromDetail) return null;
    if (!selectedRequestFromList) return selectedRequestFromDetail;

    // Merge: use className and classInfo from list, keep other data from detail
    return {
      ...selectedRequestFromDetail,
      className:
        selectedRequestFromList.className ||
        selectedRequestFromDetail.className,
      classInfo:
        selectedRequestFromList.classInfo ||
        selectedRequestFromDetail.classInfo,
      courseName:
        selectedRequestFromList.courseName ||
        selectedRequestFromDetail.courseName,
    };
  }, [selectedRequestFromDetail, selectedRequestFromList]);

  const canDecide = selectedRequest?.status === "PENDING";
  const isReplacementRequest =
    selectedRequest?.requestType === "REPLACEMENT" && canDecide;
  const isModalityChangeRequest =
    selectedRequest?.requestType === "MODALITY_CHANGE" && canDecide;
  const isRescheduleRequest =
    selectedRequest?.requestType === "RESCHEDULE" && canDecide;

  // Get requestId for replacement candidates API
  const requestId = selectedRequest?.id;

  // Get replacement candidates if this is a REPLACEMENT request
  const shouldFetchCandidates = isReplacementRequest && !!requestId;
  const {
    data: replacementCandidatesResponse,
    isFetching: isLoadingCandidates,
    error: replacementCandidatesError,
  } = useGetReplacementCandidatesQuery(
    shouldFetchCandidates && requestId ? { requestId } : skipToken
  );

  // Get resources for MODALITY_CHANGE
  const shouldFetchModalityResources =
    isModalityChangeRequest && !!selectedRequestId;
  const {
    data: modalityResourcesResponse,
    isFetching: isLoadingModalityResources,
    error: modalityResourcesError,
  } = useGetModalityResourcesQuery(
    shouldFetchModalityResources && selectedRequestId
      ? { requestId: selectedRequestId }
      : skipToken
  );

  // Get resources for RESCHEDULE
  // Extract reschedule info from request

  const shouldFetchRescheduleResources =
    isRescheduleRequest && !!selectedRequestId;
  const {
    data: rescheduleResourcesResponse,
    isFetching: isLoadingRescheduleResources,
    error: rescheduleResourcesError,
  } = useGetRescheduleResourcesQuery(
    shouldFetchRescheduleResources && selectedRequestId
      ? {
          requestId: selectedRequestId,
        }
      : skipToken
  );

  const replacementCandidates = replacementCandidatesResponse?.data ?? [];
  const modalityResources = modalityResourcesResponse?.data ?? [];
  const rescheduleResources = rescheduleResourcesResponse?.data ?? [];

  // Combine resources for display
  const availableResources = isModalityChangeRequest
    ? modalityResources
    : isRescheduleRequest
    ? rescheduleResources
    : [];

  const [approveRequest, { isLoading: isApproving }] =
    useApproveRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] =
    useRejectRequestMutation();
  const isActionLoading = isApproving || isRejecting;

  const filteredTeacherRequests = useMemo(() => {
    return teacherRequests.filter((request) => {
      const matchType =
        teacherTypeFilter === "ALL" ||
        request.requestType === teacherTypeFilter;
      const matchStatus =
        teacherStatusFilter === "ALL" || request.status === teacherStatusFilter;
      const matchSearch =
        !teacherSearchKeyword ||
        (request.teacherName &&
          request.teacherName
            .toLowerCase()
            .includes(teacherSearchKeyword.toLowerCase())) ||
        request.className
          .toLowerCase()
          .includes(teacherSearchKeyword.toLowerCase()) ||
        request.courseName
          .toLowerCase()
          .includes(teacherSearchKeyword.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [
    teacherRequests,
    teacherTypeFilter,
    teacherStatusFilter,
    teacherSearchKeyword,
  ]);

  const teacherPendingRequests = useMemo(
    () =>
      filteredTeacherRequests
        .filter((r) => r.status === "PENDING")
        .sort((a, b) => {
          // Sort by submittedAt descending (newest first)
          const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        }),
    [filteredTeacherRequests]
  );

  const teacherHistoryRequests = useMemo(
    () =>
      filteredTeacherRequests
        .filter((r) => r.status !== "PENDING")
        .sort((a, b) => {
          // Sort by decidedAt descending (newest first)
          // If decidedAt is missing, use submittedAt as fallback
          const dateA = a.decidedAt
            ? parseISO(a.decidedAt).getTime()
            : a.submittedAt
            ? parseISO(a.submittedAt).getTime()
            : 0;
          const dateB = b.decidedAt
            ? parseISO(b.decidedAt).getTime()
            : b.submittedAt
            ? parseISO(b.submittedAt).getTime()
            : 0;
          return dateB - dateA;
        }),
    [filteredTeacherRequests]
  );

  // Summary for teacher pending requests
  const totalPending = teacherPendingRequests.length;
  const pendingModalityChange = teacherPendingRequests.filter(
    (r) => r.requestType === "MODALITY_CHANGE"
  ).length;
  const pendingReschedule = teacherPendingRequests.filter(
    (r) => r.requestType === "RESCHEDULE"
  ).length;
  const pendingReplacement = teacherPendingRequests.filter(
    (r) => r.requestType === "REPLACEMENT"
  ).length;

  // Pagination helpers
  useEffect(() => {
    setPendingPage(0);
    setHistoryPage(0);
  }, [teacherTypeFilter, teacherStatusFilter, teacherSearchKeyword]);

  const pendingTotalPages = Math.max(
    1,
    Math.ceil(teacherPendingRequests.length / PAGE_SIZE)
  );
  const historyTotalPages = Math.max(
    1,
    Math.ceil(teacherHistoryRequests.length / PAGE_SIZE)
  );

  const paginatedPendingRequests = useMemo(() => {
    const safePage = Math.min(pendingPage, pendingTotalPages - 1);
    const start = safePage * PAGE_SIZE;
    return teacherPendingRequests.slice(start, start + PAGE_SIZE);
  }, [teacherPendingRequests, pendingPage, pendingTotalPages]);

  const paginatedHistoryRequests = useMemo(() => {
    const safePage = Math.min(historyPage, historyTotalPages - 1);
    const start = safePage * PAGE_SIZE;
    return teacherHistoryRequests.slice(start, start + PAGE_SIZE);
  }, [teacherHistoryRequests, historyPage, historyTotalPages]);

  // Refetch detail when opening dialog to ensure we have the latest data
  useEffect(() => {
    if (selectedRequestId !== null) {
      refetchRequestDetail();
    }
  }, [selectedRequestId, refetchRequestDetail]);

  // Reset replacement teacher when switching to non-REPLACEMENT request
  useEffect(() => {
    if (selectedRequest?.requestType !== "REPLACEMENT") {
      setSelectedReplacementTeacherId(null);
    }
  }, [selectedRequest]);

  const handleOpenRequestDetail = (requestId: number) => {
    setSelectedRequestId(requestId);
    setDecisionNote("");
    setPendingAction(null);
    setSelectedReplacementTeacherId(null);
    setSelectedResourceId(null);
  };

  const handleCloseRequestDetail = (shouldRefetch = false) => {
    setSelectedRequestId(null);
    setDecisionNote("");
    setPendingAction(null);
    setSelectedReplacementTeacherId(null);
    setSelectedResourceId(null);
    if (shouldRefetch) {
      refetchTeacherRequests();
    }
  };

  const handleDecision = async (action: "approve" | "reject") => {
    if (!selectedRequestId || !selectedRequest) return;

    const trimmedNote = decisionNote.trim();

    if (action === "reject" && trimmedNote.length < 10) {
      toast.error("Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự).");
      return;
    }

    // Validate replacement teacher for REPLACEMENT requests
    // Only require selection if request doesn't already have a replacement teacher
    if (
      action === "approve" &&
      selectedRequest.requestType === "REPLACEMENT" &&
      !selectedReplacementTeacherId &&
      !selectedRequest.replacementTeacherId
    ) {
      toast.error("Vui lòng chọn giáo viên dạy thay.");
      return;
    }

    setPendingAction(action);

    try {
      if (action === "approve") {
        await approveRequest({
          id: selectedRequestId,
          body: {
            note: trimmedNote || undefined,
            replacementTeacherId:
              selectedRequest.requestType === "REPLACEMENT"
                ? selectedReplacementTeacherId ??
                  selectedRequest.replacementTeacherId ??
                  undefined
                : undefined,
            newResourceId:
              (selectedRequest.requestType === "MODALITY_CHANGE" ||
                selectedRequest.requestType === "RESCHEDULE") &&
              selectedResourceId
                ? selectedResourceId
                : undefined,
          },
        }).unwrap();
        toast.success("Đã chấp thuận yêu cầu.");
      } else {
        await rejectRequest({
          id: selectedRequestId,
          body: {
            reason: trimmedNote,
          },
        }).unwrap();
        toast.success("Đã từ chối yêu cầu.");
      }

      handleCloseRequestDetail(true);
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      toast.error(
        formatBackendError(
          apiError?.data?.message,
          "Không thể xử lý yêu cầu. Vui lòng thử lại."
        )
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <DashboardLayout
      title="Quản lý yêu cầu giáo viên"
      description="Xét duyệt yêu cầu của giáo viên."
    >
      <div className="space-y-6">
        {/* Summary cards for teacher requests */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang chờ duyệt</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">Tổng yêu cầu chờ xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thay đổi phương thức</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                <ArrowLeftRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingModalityChange}</div>
              <p className="text-xs text-muted-foreground">Yêu cầu đổi hình thức</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đổi lịch</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReschedule}</div>
              <p className="text-xs text-muted-foreground">Yêu cầu đổi lịch dạy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nhờ dạy thay</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <UserRoundCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReplacement}</div>
              <p className="text-xs text-muted-foreground">Yêu cầu giáo viên thay</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          {/* Tabs + filters in one row (like student requests page) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <TabsList>
                <TabsTrigger value="pending">
                  Hàng đợi ({teacherPendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  Lịch sử ({teacherHistoryRequests.length})
                </TabsTrigger>
              </TabsList>

              {/* Shared filters */}
              <Select
                value={teacherTypeFilter}
                onValueChange={(value) =>
                  setTeacherTypeFilter(value as "ALL" | TeacherRequestType)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="MODALITY_CHANGE">
                    {TEACHER_REQUEST_TYPE_LABELS.MODALITY_CHANGE}
                  </SelectItem>
                  <SelectItem value="RESCHEDULE">
                    {TEACHER_REQUEST_TYPE_LABELS.RESCHEDULE}
                  </SelectItem>
                  <SelectItem value="REPLACEMENT">
                    {TEACHER_REQUEST_TYPE_LABELS.REPLACEMENT}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={teacherStatusFilter}
                onValueChange={(value) =>
                  setTeacherStatusFilter(value as "ALL" | TeacherRequestStatus)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="APPROVED">
                    {TEACHER_REQUEST_STATUS_META.APPROVED.label}
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    {TEACHER_REQUEST_STATUS_META.REJECTED.label}
                  </SelectItem>
                  <SelectItem value="WAITING_CONFIRM">
                    {TEACHER_REQUEST_STATUS_META.WAITING_CONFIRM.label}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-60">
                <Input
                  placeholder="Tìm theo giáo viên, lớp học, khóa học..."
                  value={teacherSearchKeyword}
                  onChange={(event) =>
                    setTeacherSearchKeyword(event.target.value)
                  }
                  className="pl-9"
                />
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Teacher Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="rounded-lg border overflow-hidden bg-card">
              {teacherRequestsError ? (
                <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                  {formatBackendError(
                    (teacherRequestsError as { data?: { message?: string } })
                      ?.data?.message,
                    "Có lỗi xảy ra khi tải danh sách yêu cầu. Vui lòng thử lại."
                  )}
                </div>
              ) : isLoadingTeacherRequests ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : paginatedPendingRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Không có yêu cầu nào đang chờ duyệt.
                </div>
              ) : (
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="min-w-[140px]">Loại</TableHead>
                      <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="min-w-[140px]">Giáo viên</TableHead>
                      <TableHead className="min-w-[200px]">Lớp học / Buổi</TableHead>
                      <TableHead className="min-w-[180px]">Lý do</TableHead>
                      <TableHead className="min-w-[100px]">Ngày gửi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPendingRequests.map((request) => {
                      const topic = getRequestTopic(request);
                      const reason =
                        (request as { reason?: string }).reason ??
                        (request as { requestReason?: string }).requestReason ??
                        "";
                      const truncatedReason =
                        reason.length > 80
                          ? `${reason.slice(0, 80)}...`
                          : reason;

                      return (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenRequestDetail(request.id)}
                        >
                          <TableCell>
                            <Badge variant="outline">
                              {TEACHER_REQUEST_TYPE_LABELS[request.requestType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .badgeClass
                              }
                            >
                              {
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .label
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {request.teacherName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {request.className} · {format(parseISO(request.sessionDate), "dd/MM/yyyy", { locale: vi })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.sessionStartTime} - {request.sessionEndTime}
                                {topic && ` · ${topic}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" title={reason}>
                            {truncatedReason || "Không có lý do"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {request.submittedAt
                              ? format(parseISO(request.submittedAt), "HH:mm dd/MM", { locale: vi })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pending pagination */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Trang {pendingPage + 1} / {pendingTotalPages} ·{" "}
                {teacherPendingRequests.length} yêu cầu
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPendingPage((prev) => Math.max(prev - 1, 0));
                      }}
                      disabled={pendingPage === 0 || isLoadingTeacherRequests}
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: pendingTotalPages },
                    (_, index) => index
                  ).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPendingPage(pageNum);
                        }}
                        isActive={pageNum === pendingPage}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPendingPage((prev) =>
                          Math.min(prev + 1, pendingTotalPages - 1)
                        );
                      }}
                      disabled={
                        pendingPage >= pendingTotalPages - 1 ||
                        isLoadingTeacherRequests
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>

          {/* Teacher History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-lg border overflow-hidden bg-card">
              {isLoadingTeacherRequests ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : paginatedHistoryRequests.length ? (
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="min-w-[140px]">Loại</TableHead>
                      <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="min-w-[140px]">Giáo viên</TableHead>
                      <TableHead className="min-w-[200px]">Lớp học / Buổi</TableHead>
                      <TableHead className="min-w-[140px]">Người xử lý</TableHead>
                      <TableHead className="min-w-[100px]">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistoryRequests.map((request) => {
                      const topic = getRequestTopic(request);

                      return (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleOpenRequestDetail(request.id)}
                        >
                          <TableCell>
                            <Badge variant="outline">
                              {TEACHER_REQUEST_TYPE_LABELS[request.requestType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .badgeClass
                              }
                            >
                              {
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .label
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {request.teacherName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {request.className} · {format(parseISO(request.sessionDate), "dd/MM/yyyy", { locale: vi })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.sessionStartTime} - {request.sessionEndTime}
                                {topic && ` · ${topic}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">
                              {request.decidedByName ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {request.decidedAt
                              ? format(parseISO(request.decidedAt), "HH:mm dd/MM", { locale: vi })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Không có lịch sử phù hợp với bộ lọc.
                </div>
              )}
            </div>

            {/* History pagination */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Trang {historyPage + 1} / {historyTotalPages} ·{" "}
                {teacherHistoryRequests.length} yêu cầu
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setHistoryPage((prev) => Math.max(prev - 1, 0));
                      }}
                      disabled={historyPage === 0 || isLoadingTeacherRequests}
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: historyTotalPages },
                    (_, index) => index
                  ).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setHistoryPage(pageNum);
                        }}
                        isActive={pageNum === historyPage}
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setHistoryPage((prev) =>
                          Math.min(prev + 1, historyTotalPages - 1)
                        );
                      }}
                      disabled={
                        historyPage >= historyTotalPages - 1 ||
                        isLoadingTeacherRequests
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={selectedRequestId !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseRequestDetail();
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : selectedRequest ? (
            <div className="space-y-5">
              {/* Request Type Section - from TeacherRequestDetailContent */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Loại yêu cầu
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-medium">
                    {TEACHER_REQUEST_TYPE_LABELS[selectedRequest.requestType]}
                  </Badge>
                  <Badge
                    className={cn(
                      "font-semibold",
                      TEACHER_REQUEST_STATUS_META[selectedRequest.status]
                        .badgeClass
                    )}
                  >
                    {TEACHER_REQUEST_STATUS_META[selectedRequest.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Gửi lúc{" "}
                    {format(
                      parseISO(selectedRequest.submittedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Teacher who submitted request */}
              {(selectedRequest.teacherName || selectedRequest.submittedBy) && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Giáo viên gửi yêu cầu
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedRequest.teacherName || selectedRequest.submittedBy}
                    {selectedRequest.teacherEmail && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({selectedRequest.teacherEmail})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="h-px bg-border" />

              {/* Rest of TeacherRequestDetailContent without the request type section */}
              <TeacherRequestDetailContent
                request={selectedRequest}
                hideRequestType={true}
              />

              {(isModalityChangeRequest || isRescheduleRequest) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chọn phòng học / phương tiện
                  </p>
                  {isRescheduleRequest && !selectedRequestId ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      Không tìm thấy thông tin request. Vui lòng thử lại sau.
                    </div>
                  ) : isLoadingModalityResources ||
                    isLoadingRescheduleResources ? (
                    <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                      Đang tải danh sách phòng học/phương tiện...
                    </div>
                  ) : modalityResourcesError || rescheduleResourcesError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {formatBackendError(
                        (
                          modalityResourcesError as {
                            data?: { message?: string };
                          }
                        )?.data?.message ||
                          (
                            rescheduleResourcesError as {
                              data?: { message?: string };
                            }
                          )?.data?.message,
                        "Có lỗi khi tải danh sách phòng học/phương tiện. Vui lòng thử lại sau."
                      )}
                    </div>
                  ) : availableResources.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      Không tìm thấy phòng học/phương tiện phù hợp.
                    </div>
                  ) : (
                    <Select
                      value={
                        selectedResourceId ? String(selectedResourceId) : ""
                      }
                      onValueChange={(value) =>
                        setSelectedResourceId(Number(value))
                      }
                      disabled={isActionLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng học/phương tiện...">
                          {selectedResourceId
                            ? (() => {
                                const selectedResource =
                                  availableResources.find(
                                    (r) =>
                                      (r.id ?? r.resourceId) ===
                                      selectedResourceId
                                  );
                                return selectedResource?.name || "Chưa có tên";
                              })()
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableResources.map((resource) => {
                          const resourceId = resource.id ?? resource.resourceId;
                          const resourceName = resource.name || "Chưa có tên";
                          const resourceType =
                            resource.type || resource.resourceType || "";
                          const resourceCapacity = resource.capacity;

                          return (
                            <SelectItem
                              key={resourceId || resourceName}
                              value={String(resourceId || "")}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{resourceName}</span>
                                  {resourceType && (
                                    <span className="text-xs text-muted-foreground">
                                      {resourceType}
                                    </span>
                                  )}
                                </div>
                                {resourceCapacity !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Sức chứa: {resourceCapacity}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {isReplacementRequest && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chọn giáo viên dạy thay
                  </p>
                  {!requestId ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      Không tìm thấy thông tin request. Vui lòng thử lại sau.
                    </div>
                  ) : isLoadingCandidates ? (
                    <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                      Đang tải danh sách giáo viên...
                    </div>
                  ) : replacementCandidatesError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {formatBackendError(
                        (
                          replacementCandidatesError as {
                            data?: { message?: string };
                          }
                        )?.data?.message,
                        "Có lỗi khi tải danh sách giáo viên. Vui lòng thử lại sau."
                      )}
                    </div>
                  ) : replacementCandidates.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      Không tìm thấy giáo viên phù hợp để dạy thay.
                    </div>
                  ) : (
                    <Select
                      value={
                        selectedReplacementTeacherId
                          ? String(selectedReplacementTeacherId)
                          : ""
                      }
                      onValueChange={(value) =>
                        setSelectedReplacementTeacherId(Number(value))
                      }
                      disabled={isActionLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giáo viên dạy thay...">
                          {selectedReplacementTeacherId
                            ? (() => {
                                // First try to find in candidates list
                                const selectedCandidate =
                                  replacementCandidates.find(
                                    (c) =>
                                      (c.teacherId ??
                                        (c as { id?: number }).id) ===
                                      selectedReplacementTeacherId
                                  );
                                if (selectedCandidate) {
                                  return (
                                    selectedCandidate.fullName ||
                                    selectedCandidate.displayName ||
                                    selectedCandidate.teacherName ||
                                    "Chưa có tên"
                                  );
                                }
                                return "Chưa có tên";
                              })()
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {replacementCandidates.map((candidate) => {
                          const teacherId =
                            candidate.teacherId ??
                            (candidate as { id?: number }).id;
                          const teacherName =
                            candidate.fullName ||
                            candidate.displayName ||
                            candidate.teacherName ||
                            "Chưa có tên";
                          const teacherLevel = candidate.level || "";
                          const teacherSkills = getCandidateSkills(candidate);
                          const matchScore = candidate.matchScore;

                          return (
                            <SelectItem
                              key={teacherId || teacherName}
                              value={String(teacherId || "")}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span>
                                    {teacherName}
                                    {teacherLevel && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        ({teacherLevel})
                                      </span>
                                    )}
                                  </span>
                                  {matchScore !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {matchScore.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                {teacherSkills && (
                                  <span className="text-xs text-muted-foreground">
                                    {teacherSkills}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {canDecide && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ghi chú xử lý
                  </p>
                  <Textarea
                    placeholder="Nhập ghi chú gửi giáo viên (tối thiểu 10 ký tự nếu từ chối)."
                    rows={4}
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {canDecide
                    ? "Sau khi xử lý, giáo viên sẽ nhận được thông báo ngay."
                    : "Yêu cầu này đã được xử lý."}
                </p>
                {canDecide && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      disabled={isActionLoading}
                      onClick={() => handleDecision("reject")}
                    >
                      {pendingAction === "reject"
                        ? "Đang từ chối..."
                        : "Từ chối"}
                    </Button>
                    <Button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleDecision("approve")}
                    >
                      {pendingAction === "approve"
                        ? "Đang chấp thuận..."
                        : "Chấp thuận"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không tìm thấy thông tin yêu cầu. Vui lòng thử lại sau.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
