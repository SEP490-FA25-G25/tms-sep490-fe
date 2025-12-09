import { useMemo, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  SearchIcon,
  Clock3,
  ArrowLeftRight,
  CalendarClock,
  UserRoundCheck,
  Plus,
  RotateCcwIcon,
  CalendarIcon,
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
  FullScreenModal,
  FullScreenModalBody,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalFooter,
} from "@/components/ui/full-screen-modal";
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  useGetRescheduleSlotsQuery,
  type RequestType as TeacherRequestType,
  type RequestStatus as TeacherRequestStatus,
} from "@/store/services/teacherRequestApi";
import { TeacherRequestDetailContent } from "@/app/teacher/requests/page";
import { CreateRequestDialog } from "./components/CreateRequestDialog";
import { DataTable } from "./components/DataTable";
import { historyColumns, pendingColumns } from "./components/columns";
import {
  TEACHER_REQUEST_STATUS_META,
  TEACHER_REQUEST_TYPE_LABELS,
  TEACHER_REQUEST_TYPE_BADGES,
} from "./components/meta";

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

export default function AcademicTeacherRequestsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
  // RESCHEDULE states for academic staff to override
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<
    Date | undefined
  >(undefined);
  const [selectedRescheduleTimeSlotId, setSelectedRescheduleTimeSlotId] =
    useState<number | null>(null);
  const [pendingPage, setPendingPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
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
      subjectName:
        selectedRequestFromList.subjectName ||
        selectedRequestFromDetail.subjectName,
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

  // Extract sessionId from request for RESCHEDULE
  const rescheduleSessionId = useMemo(() => {
    if (!selectedRequest || !isRescheduleRequest) return undefined;
    return (
      (selectedRequest as { sessionId?: number }).sessionId ??
      (typeof selectedRequest.session === "object" &&
      selectedRequest.session &&
      "id" in selectedRequest.session
        ? (selectedRequest.session as { id?: number }).id
        : undefined) ??
      (typeof selectedRequest.session === "object" &&
      selectedRequest.session &&
      "sessionId" in selectedRequest.session
        ? (selectedRequest.session as { sessionId?: number }).sessionId
        : undefined)
    );
  }, [selectedRequest, isRescheduleRequest]);

  // Get slots for RESCHEDULE (when academic staff selects a new date)
  const selectedRescheduleDateString = selectedRescheduleDate
    ? format(selectedRescheduleDate, "yyyy-MM-dd")
    : undefined;
  const shouldFetchRescheduleSlots =
    isRescheduleRequest &&
    !!selectedRequestId &&
    !!selectedRequest?.teacherId &&
    (!!selectedRescheduleDate || !selectedRescheduleDate); // Always fetch if request exists
  const {
    data: rescheduleSlotsResponse,
    isFetching: isLoadingRescheduleSlots,
    error: rescheduleSlotsError,
  } = useGetRescheduleSlotsQuery(
    shouldFetchRescheduleSlots &&
      selectedRequestId &&
      selectedRequest?.teacherId
      ? selectedRescheduleDate && rescheduleSessionId
        ? {
            sessionId: rescheduleSessionId,
            date: selectedRescheduleDateString!,
            teacherId: selectedRequest.teacherId,
          }
        : {
            requestId: selectedRequestId,
            teacherId: selectedRequest.teacherId,
          }
      : skipToken
  );

  // Get resources for RESCHEDULE
  // If academic staff has selected new date and timeslot, use those; otherwise use requestId
  const shouldFetchRescheduleResources =
    isRescheduleRequest &&
    !!selectedRequestId &&
    ((selectedRescheduleDate &&
      selectedRescheduleTimeSlotId &&
      rescheduleSessionId &&
      selectedRequest?.teacherId) ||
      (!selectedRescheduleDate && !selectedRescheduleTimeSlotId));
  const {
    data: rescheduleResourcesResponse,
    isFetching: isLoadingRescheduleResources,
    error: rescheduleResourcesError,
  } = useGetRescheduleResourcesQuery(
    shouldFetchRescheduleResources && selectedRequestId
      ? selectedRescheduleDate &&
        selectedRescheduleTimeSlotId &&
        rescheduleSessionId &&
        selectedRequest?.teacherId
        ? {
            sessionId: rescheduleSessionId,
            date: selectedRescheduleDateString!,
            timeSlotId: selectedRescheduleTimeSlotId,
            teacherId: selectedRequest.teacherId,
          }
        : {
          requestId: selectedRequestId,
        }
      : skipToken
  );

  const replacementCandidates = replacementCandidatesResponse?.data ?? [];
  const modalityResources = modalityResourcesResponse?.data ?? [];
  const rescheduleResources = rescheduleResourcesResponse?.data ?? [];
  const rescheduleSlots = rescheduleSlotsResponse?.data ?? [];

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
        activeTab === "history"
          ? teacherStatusFilter === "ALL" ||
            request.status === teacherStatusFilter
          : true;
      const matchSearch =
        !teacherSearchKeyword ||
        (request.teacherName &&
          request.teacherName
            .toLowerCase()
            .includes(teacherSearchKeyword.toLowerCase())) ||
        request.className
          .toLowerCase()
          .includes(teacherSearchKeyword.toLowerCase()) ||
        request.subjectName
          .toLowerCase()
          .includes(teacherSearchKeyword.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [
    teacherRequests,
    teacherTypeFilter,
    teacherStatusFilter,
    teacherSearchKeyword,
    activeTab,
  ]);

  const teacherPendingRequests = useMemo(() => {
    return filteredTeacherRequests.filter((r) => r.status === "PENDING");
  }, [filteredTeacherRequests]);

  const teacherHistoryRequests = useMemo(() => {
    return filteredTeacherRequests.filter((r) => r.status !== "PENDING");
  }, [filteredTeacherRequests]);

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

  const handleClearFilters = () => {
    setTeacherTypeFilter("ALL");
    setTeacherSearchKeyword("");
    setPendingPage(0);
  };

  const handleClearHistoryFilters = () => {
    setTeacherTypeFilter("ALL");
    setTeacherStatusFilter("ALL");
    setTeacherSearchKeyword("");
    setHistoryPage(0);
  };

  const hasActiveFilters =
    teacherTypeFilter !== "ALL" || teacherSearchKeyword !== "";
  const hasActiveHistoryFilters =
    teacherTypeFilter !== "ALL" ||
    teacherStatusFilter !== "ALL" ||
    teacherSearchKeyword !== "";

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

  // Reset reschedule fields when switching to non-RESCHEDULE request
  useEffect(() => {
    if (selectedRequest?.requestType !== "RESCHEDULE") {
      setSelectedRescheduleDate(undefined);
      setSelectedRescheduleTimeSlotId(null);
      setSelectedResourceId(null);
    }
  }, [selectedRequest]);

  // Reset timeslot and resource when date changes
  useEffect(() => {
    if (isRescheduleRequest) {
      setSelectedRescheduleTimeSlotId(null);
      setSelectedResourceId(null);
    }
  }, [selectedRescheduleDate, isRescheduleRequest]);

  // Reset resource when timeslot changes
  useEffect(() => {
    if (isRescheduleRequest) {
      setSelectedResourceId(null);
    }
  }, [selectedRescheduleTimeSlotId, isRescheduleRequest]);

  const handleOpenRequestDetail = (requestId: number) => {
    setSelectedRequestId(requestId);
    setDecisionNote("");
    setPendingAction(null);
    setSelectedReplacementTeacherId(null);
    setSelectedResourceId(null);
    setSelectedRescheduleDate(undefined);
    setSelectedRescheduleTimeSlotId(null);
  };

  const handleCloseRequestDetail = (shouldRefetch = false) => {
    setSelectedRequestId(null);
    setDecisionNote("");
    setPendingAction(null);
    setSelectedReplacementTeacherId(null);
    setSelectedResourceId(null);
    setSelectedRescheduleDate(undefined);
    setSelectedRescheduleTimeSlotId(null);
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
              selectedRequest.requestType === "MODALITY_CHANGE"
                ? selectedResourceId ?? undefined
                : selectedRequest.requestType === "RESCHEDULE"
                ? ((selectedResourceId ??
                    selectedRequest.newResource?.id ??
                    selectedRequest.newResource?.resourceId) as
                    | number
                    | undefined)
                : undefined,
            newDate:
              selectedRequest.requestType === "RESCHEDULE" &&
              selectedRescheduleDate
                ? format(selectedRescheduleDate, "yyyy-MM-dd")
                : undefined,
            newTimeSlotId:
              selectedRequest.requestType === "RESCHEDULE" &&
              selectedRescheduleTimeSlotId
                ? selectedRescheduleTimeSlotId
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
      description="Xem xét và phê duyệt các yêu cầu xin đổi lịch, dạy thay, đổi phương thức dạy của giáo viên"
      actions={
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo yêu cầu cho giáo viên
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary cards for teacher requests */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">
                Tổng yêu cầu chờ xử lý
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Thay đổi phương thức
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                <ArrowLeftRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingModalityChange}</div>
              <p className="text-xs text-muted-foreground">
                Yêu cầu đổi hình thức
              </p>
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
              <p className="text-xs text-muted-foreground">
                Yêu cầu đổi lịch dạy
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nhờ dạy thay
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <UserRoundCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReplacement}</div>
              <p className="text-xs text-muted-foreground">
                Yêu cầu giáo viên thay
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "pending" | "history")
          }
          className="space-y-4"
        >
          {/* Tabs + filters in one row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs first */}
            <TabsList className="h-9">
              <TabsTrigger value="pending" className="h-7">
                Chờ duyệt
              </TabsTrigger>
              <TabsTrigger value="history" className="h-7">
                Lịch sử
              </TabsTrigger>
            </TabsList>

            {/* Search - bên trái */}
            {activeTab === "pending" ? (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm giáo viên, lớp, khóa học..."
                    value={teacherSearchKeyword}
                    onChange={(event) => {
                      setTeacherSearchKeyword(event.target.value);
                      setPendingPage(0);
                    }}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Filters - bên phải */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={teacherTypeFilter}
                    onValueChange={(value) => {
                      setTeacherTypeFilter(value as "ALL" | TeacherRequestType);
                      setPendingPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[150px]">
                      <SelectValue placeholder="Loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả yêu cầu</SelectItem>
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

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                    title="Xóa bộ lọc"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-64">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm giáo viên, lớp, khóa học..."
                    value={teacherSearchKeyword}
                    onChange={(event) => {
                      setTeacherSearchKeyword(event.target.value);
                      setHistoryPage(0);
                    }}
                    className="pl-8 h-9"
                  />
                </div>

                {/* Filters - bên phải */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={teacherTypeFilter}
                    onValueChange={(value) => {
                      setTeacherTypeFilter(value as "ALL" | TeacherRequestType);
                      setHistoryPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[150px]">
                      <SelectValue placeholder="Loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả yêu cầu</SelectItem>
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
                    onValueChange={(value) => {
                      setTeacherStatusFilter(
                        value as "ALL" | TeacherRequestStatus
                      );
                      setHistoryPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-auto min-w-[150px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING">
                        {TEACHER_REQUEST_STATUS_META.PENDING.label}
                      </SelectItem>
                      <SelectItem value="WAITING_CONFIRM">
                        {TEACHER_REQUEST_STATUS_META.WAITING_CONFIRM.label}
                      </SelectItem>
                      <SelectItem value="APPROVED">
                        {TEACHER_REQUEST_STATUS_META.APPROVED.label}
                      </SelectItem>
                      <SelectItem value="REJECTED">
                        {TEACHER_REQUEST_STATUS_META.REJECTED.label}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleClearHistoryFilters}
                    disabled={!hasActiveHistoryFilters}
                    title="Xóa bộ lọc"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Teacher Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            {teacherRequestsError ? (
              <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                {formatBackendError(
                  (teacherRequestsError as { data?: { message?: string } })
                    ?.data?.message,
                  "Có lỗi xảy ra khi tải danh sách yêu cầu. Vui lòng thử lại."
                )}
              </div>
            ) : (
              <DataTable
                columns={pendingColumns}
                data={paginatedPendingRequests}
                onViewDetail={handleOpenRequestDetail}
                isLoading={isLoadingTeacherRequests}
                defaultSorting={[{ id: "submittedAt", desc: true }]}
              />
            )}

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
            {teacherRequestsError ? (
              <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                {formatBackendError(
                  (teacherRequestsError as { data?: { message?: string } })
                    ?.data?.message,
                  "Có lỗi xảy ra khi tải danh sách yêu cầu. Vui lòng thử lại."
                )}
              </div>
            ) : (
              <DataTable
                columns={historyColumns}
                data={paginatedHistoryRequests}
                onViewDetail={handleOpenRequestDetail}
                isLoading={isLoadingTeacherRequests}
                defaultSorting={[{ id: "decidedAt", desc: true }]}
              />
            )}

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

      <FullScreenModal
        open={selectedRequestId !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseRequestDetail();
          }
        }}
      >
        <FullScreenModalContent size="2xl">
          <FullScreenModalHeader>
            <div className="flex items-center gap-2">
              {selectedRequest && (
                <>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      TEACHER_REQUEST_TYPE_BADGES[selectedRequest.requestType].className
                    )}
                  >
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
                </>
              )}
            </div>
            <FullScreenModalTitle className="text-xl font-semibold text-foreground">
              Chi tiết yêu cầu {selectedRequest ? `#${selectedRequest.id}` : ""}
            </FullScreenModalTitle>
            <FullScreenModalDescription>
              {selectedRequest?.submittedAt
                ? `Gửi lúc ${format(
                    parseISO(selectedRequest.submittedAt),
                    "HH:mm, EEEE dd/MM/yyyy",
                    { locale: vi }
                  )}`
                : "Đang tải thông tin"}
            </FullScreenModalDescription>
          </FullScreenModalHeader>

          <FullScreenModalBody>
            {isLoadingDetail ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-60 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : selectedRequest ? (
              <div
                className={cn(
                  "grid gap-6",
                  canDecide ? "lg:grid-cols-5" : "lg:grid-cols-4"
                )}
              >
                <div
                  className={cn(
                    "space-y-5",
                    canDecide ? "lg:col-span-3" : "lg:col-span-4"
                  )}
                >
                  {(selectedRequest.teacherName || selectedRequest.submittedBy) && (
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
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

                  <TeacherRequestDetailContent
                    request={selectedRequest}
                    hideRequestType={true}
                  />

                  {isModalityChangeRequest && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Chọn phòng học / phương tiện
                      </p>
                      {isLoadingModalityResources ? (
                        <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                          Đang tải danh sách phòng học/phương tiện...
                        </div>
                      ) : modalityResourcesError ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          {formatBackendError(
                            (
                              modalityResourcesError as {
                                data?: { message?: string };
                              }
                            )?.data?.message,
                            "Có lỗi khi tải danh sách phòng học/phương tiện. Vui lòng thử lại sau."
                          )}
                        </div>
                      ) : modalityResources.length === 0 ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                          Không tìm thấy phòng học/phương tiện phù hợp.
                        </div>
                      ) : (
                        <Select
                          value={
                            selectedResourceId !== null &&
                            selectedResourceId !== undefined
                              ? String(selectedResourceId)
                              : undefined
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
                                      modalityResources.find(
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
                            {modalityResources
                              .filter((resource) => {
                                const resourceId = resource.id ?? resource.resourceId;
                                return (
                                  resourceId !== null &&
                                  resourceId !== undefined &&
                                  resourceId !== 0
                                );
                              })
                              .map((resource) => {
                                const resourceId =
                                  resource.id ?? resource.resourceId;
                                const resourceName = resource.name || "Chưa có tên";
                                const resourceType =
                                  resource.type || resource.resourceType || "";
                                const resourceCapacity = resource.capacity;

                                return (
                                  <SelectItem
                                    key={resourceId || resourceName}
                                    value={String(resourceId)}
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

                  {isRescheduleRequest && (
                    <div className="space-y-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Chọn lại thông tin lịch mới (nếu cần)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bạn có thể chọn lại ngày, khung giờ và phòng học/phương tiện
                        nếu cần thay đổi so với đề xuất của giáo viên.
                      </p>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Ngày mới{" "}
                          {selectedRescheduleDate && (
                            <span className="text-xs text-muted-foreground font-normal">
                              (đã chọn)
                            </span>
                          )}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedRescheduleDate && "text-muted-foreground"
                              )}
                              disabled={isActionLoading}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedRescheduleDate ? (
                                format(selectedRescheduleDate, "EEEE, dd/MM/yyyy", {
                                  locale: vi,
                                })
                              ) : (
                                <span>Chọn ngày mới (tùy chọn)</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedRescheduleDate}
                              onSelect={setSelectedRescheduleDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {selectedRescheduleDate && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Khung giờ mới{" "}
                            {selectedRescheduleTimeSlotId && (
                              <span className="text-xs text-muted-foreground font-normal">
                                (đã chọn)
                              </span>
                            )}
                          </Label>
                          {isLoadingRescheduleSlots ? (
                            <Skeleton className="h-10 w-full" />
                          ) : rescheduleSlotsError ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                              {formatBackendError(
                                (
                                  rescheduleSlotsError as {
                                    data?: { message?: string };
                                  }
                                )?.data?.message,
                                "Không thể tải danh sách khung giờ"
                              )}
                            </div>
                          ) : rescheduleSlots.length === 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                              Không có khung giờ phù hợp cho ngày đã chọn.
                            </div>
                          ) : (
                            <Select
                              value={
                                selectedRescheduleTimeSlotId !== null &&
                                selectedRescheduleTimeSlotId !== undefined
                                  ? String(selectedRescheduleTimeSlotId)
                                  : undefined
                              }
                              onValueChange={(value) =>
                                setSelectedRescheduleTimeSlotId(Number(value))
                              }
                              disabled={isActionLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn khung giờ mới (tùy chọn)...">
                                  {selectedRescheduleTimeSlotId
                                    ? (() => {
                                        const selectedSlot = rescheduleSlots.find(
                                          (s) =>
                                            (s.timeSlotTemplateId ??
                                              s.timeSlotId ??
                                              s.id) === selectedRescheduleTimeSlotId
                                        );
                                        return (
                                          selectedSlot?.label ||
                                          selectedSlot?.name ||
                                          selectedSlot?.displayLabel ||
                                          selectedSlot?.timeSlotLabel ||
                                          `${
                                            selectedSlot?.startTime ||
                                            selectedSlot?.startAt
                                          } - ${
                                            selectedSlot?.endTime ||
                                            selectedSlot?.endAt
                                          }` ||
                                          "Chưa có tên"
                                        );
                                      })()
                                    : null}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {rescheduleSlots
                                  .filter((slot) => {
                                    const slotId =
                                      slot.timeSlotTemplateId ??
                                      slot.timeSlotId ??
                                      slot.id;
                                    return (
                                      slotId !== null &&
                                      slotId !== undefined &&
                                      slotId !== 0
                                    );
                                  })
                                  .map((slot) => {
                                    const slotId =
                                      slot.timeSlotTemplateId ??
                                      slot.timeSlotId ??
                                      slot.id;
                                    const label =
                                      slot.label ||
                                      slot.name ||
                                      slot.displayLabel ||
                                      slot.timeSlotLabel ||
                                      `${slot.startTime || slot.startAt} - ${
                                        slot.endTime || slot.endAt
                                      }`;

                                    return (
                                      <SelectItem key={slotId} value={String(slotId)}>
                                        {label}
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}

                      {(selectedRescheduleDate && selectedRescheduleTimeSlotId) ||
                      (!selectedRescheduleDate && !selectedRescheduleTimeSlotId) ? (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Phòng học/phương tiện{" "}
                            {selectedResourceId && (
                              <span className="text-xs text-muted-foreground font-normal">
                                (đã chọn)
                              </span>
                            )}
                          </Label>
                          {isLoadingRescheduleResources ? (
                            <Skeleton className="h-10 w-full" />
                          ) : rescheduleResourcesError ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                              {formatBackendError(
                                (
                                  rescheduleResourcesError as {
                                    data?: { message?: string };
                                  }
                                )?.data?.message,
                                "Có lỗi khi tải danh sách phòng học/phương tiện. Vui lòng thử lại sau."
                              )}
                            </div>
                          ) : rescheduleResources.length === 0 ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                              Không tìm thấy phòng học/phương tiện phù hợp.
                            </div>
                          ) : (
                            <Select
                              value={
                                selectedResourceId !== null &&
                                selectedResourceId !== undefined
                                  ? String(selectedResourceId)
                                  : undefined
                              }
                              onValueChange={(value) =>
                                setSelectedResourceId(Number(value))
                              }
                              disabled={isActionLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn phòng học/phương tiện (tùy chọn)...">
                                  {selectedResourceId
                                    ? (() => {
                                        const selectedResource =
                                          rescheduleResources.find(
                                            (r) =>
                                              (r.id ?? r.resourceId) ===
                                              selectedResourceId
                                          );
                                        return (
                                          selectedResource?.name || "Chưa có tên"
                                        );
                                      })()
                                    : null}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {rescheduleResources
                                  .filter((resource) => {
                                    const resourceId =
                                      resource.id ?? resource.resourceId;
                                    return (
                                      resourceId !== null &&
                                      resourceId !== undefined &&
                                      resourceId !== 0
                                    );
                                  })
                                  .map((resource) => {
                                    const resourceId =
                                      resource.id ?? resource.resourceId;
                                    const resourceName =
                                      resource.name || "Chưa có tên";
                                    const resourceType =
                                      resource.type || resource.resourceType || "";
                                    const resourceCapacity = resource.capacity;

                                    return (
                                      <SelectItem
                                        key={resourceId || resourceName}
                                        value={String(resourceId)}
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
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                          Vui lòng chọn ngày và khung giờ trước khi chọn phòng
                          học/phương tiện.
                        </div>
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
                            selectedReplacementTeacherId !== null &&
                            selectedReplacementTeacherId !== undefined
                              ? String(selectedReplacementTeacherId)
                              : undefined
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
                            {replacementCandidates
                              .filter((candidate) => {
                                const teacherId =
                                  candidate.teacherId ??
                                  (candidate as { id?: number }).id;
                                return (
                                  teacherId !== null &&
                                  teacherId !== undefined &&
                                  teacherId !== 0
                                );
                              })
                              .map((candidate) => {
                                const teacherId =
                                  candidate.teacherId ??
                                  (candidate as { id?: number }).id;
                                const teacherName =
                                  candidate.fullName ||
                                  candidate.displayName ||
                                  candidate.teacherName ||
                                  "Chưa có tên";
                                const teacherLevel = candidate.level || "";
                                return (
                                  <SelectItem
                                    key={teacherId || teacherName}
                                    value={
                                      teacherId !== null && teacherId !== undefined
                                        ? String(teacherId)
                                        : ""
                                    }
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
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>

                {canDecide && (
                  <div className="lg:col-span-2">
                    <div className="sticky top-0 space-y-4 rounded-xl border border-border/60 bg-background p-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        Xử lý yêu cầu
                      </h3>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Ghi chú
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            (bắt buộc khi từ chối, tối thiểu 10 ký tự)
                          </span>
                        </label>
                        <Textarea
                          value={decisionNote}
                          onChange={(event) => setDecisionNote(event.target.value)}
                          placeholder="Nhập ghi chú gửi giáo viên..."
                          className="min-h-[120px] resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
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
                        <p className="text-xs text-muted-foreground">
                          Sau khi xử lý, giáo viên sẽ nhận được thông báo ngay.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không tìm thấy thông tin yêu cầu. Vui lòng thử lại sau.
              </p>
            )}
          </FullScreenModalBody>

          {!canDecide && !isLoadingDetail && (
            <FullScreenModalFooter>
              <Button variant="outline" onClick={() => handleCloseRequestDetail()}>
                Đóng
              </Button>
            </FullScreenModalFooter>
          )}
        </FullScreenModalContent>
      </FullScreenModal>

      {/* Create Request Dialog */}
      <CreateRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Refetch requests when dialog closes after successful creation
            refetchTeacherRequests();
          }
        }}
      />
    </DashboardLayout>
  );
}
