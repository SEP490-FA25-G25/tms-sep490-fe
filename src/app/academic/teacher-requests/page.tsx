import { useMemo, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { SearchIcon } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useGetSwapCandidatesQuery,
  useGetModalityResourcesQuery,
  useGetRescheduleResourcesQuery,
  type RequestType as TeacherRequestType,
  type RequestStatus as TeacherRequestStatus,
  type TeacherRequestDTO,
  type SwapCandidateDTO,
} from "@/store/services/teacherRequestApi";
import { TeacherRequestDetailContent } from "@/app/teacher/requests/page";

const TEACHER_REQUEST_TYPE_LABELS: Record<TeacherRequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  SWAP: "Nhờ dạy thay",
};

// Helper function to format error messages from backend to user-friendly Vietnamese
const formatBackendError = (
  errorMessage?: string,
  defaultMessage?: string
): string => {
  if (!errorMessage) {
    return (
      defaultMessage ||
      "Có lỗi xảy ra. Vui lòng thử lại sau."
    );
  }

  // Map common error codes to user-friendly messages
  if (errorMessage.includes("SESSION_NOT_IN_TIME_WINDOW")) {
    return "Ngày session đề xuất không nằm trong khoảng thời gian cho phép (trong vòng 7 ngày từ hôm nay).";
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

  // Fallback: return the original message if we can't format it
  return errorMessage;
};

const TEACHER_REQUEST_STATUS_META: Record<
  TeacherRequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Đang chờ duyệt",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  WAITING_CONFIRM: {
    label: "Chờ xác nhận",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  APPROVED: {
    label: "Đã chấp thuận",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Đã từ chối",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

const getCandidateSkills = (candidate: SwapCandidateDTO): string | undefined => {
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
        (typeof (skill as { skill?: unknown }).skill === "object" && (skill as { skill?: { name?: string } }).skill?.name);
      
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
        } else if (typeof skillLevelRaw === "string" && skillLevelRaw.trim().length > 0) {
          skillLevel = skillLevelRaw.trim();
        }
      }
      
      if (skillName && typeof skillName === "string" && skillName.trim().length > 0) {
        if (skillLevel) {
          return `${skillName.trim()} (${skillLevel})`;
        }
        return skillName.trim();
      }
    }
    
    return null;
  };

  // Try to extract from skills array (prioritize this as it has structured data)
  if (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0) {
    const formattedSkills = candidate.skills
      .map(formatSkillWithLevel)
      .filter((skill): skill is string => skill !== null);
    
    if (formattedSkills.length > 0) {
      return formattedSkills.join(", ");
    }
  }

  // Try to extract from teacherSkills array
  if (candidate.teacherSkills && Array.isArray(candidate.teacherSkills) && candidate.teacherSkills.length > 0) {
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
  if (candidate.skillsDescription && typeof candidate.skillsDescription === "string") {
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

const getNestedValue = (source: unknown, path: string[]): unknown => {
  let value: unknown = source;
  for (const key of path) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return value;
};

const getFirstStringFromPaths = (
  source: unknown,
  paths: string[][]
): string | undefined => {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const getRescheduleInfo = (request: TeacherRequestDTO) => {
  const newSessionDate =
    getFirstStringFromPaths(request, [
      ["newDate"],
      ["newSessionDate"],
      ["newSession", "date"],
      ["newSession", "sessionDate"],
      ["newSlot", "date"],
      ["newSchedule", "date"],
      ["selectedSlot", "date"],
      ["selectedSlot", "sessionDate"],
      ["selectedTimeSlot", "date"],
    ]) ?? undefined;

  const newSessionStart =
    getFirstStringFromPaths(request, [
      ["newTimeSlotStartTime"],
      ["newStartTime"],
      ["newSessionStartTime"],
      ["newSlot", "startTime"],
      ["newTimeSlot", "startTime"],
      ["newTimeSlot", "startAt"],
      ["newSession", "startTime"],
      ["newSession", "timeSlot", "startTime"],
      ["newSession", "timeSlot", "startAt"],
      ["newSchedule", "startTime"],
      ["timeSlot", "startTime"],
      ["selectedSlot", "startTime"],
      ["selectedSlot", "startAt"],
      ["selectedTimeSlot", "startTime"],
      ["selectedTimeSlot", "startAt"],
    ]) ?? undefined;

  const newSessionEnd =
    getFirstStringFromPaths(request, [
      ["newTimeSlotEndTime"],
      ["newEndTime"],
      ["newSessionEndTime"],
      ["newSlot", "endTime"],
      ["newTimeSlot", "endTime"],
      ["newTimeSlot", "endAt"],
      ["newSession", "endTime"],
      ["newSession", "timeSlot", "endTime"],
      ["newSession", "timeSlot", "endAt"],
      ["newSchedule", "endTime"],
      ["timeSlot", "endTime"],
      ["selectedSlot", "endTime"],
      ["selectedSlot", "endAt"],
      ["selectedTimeSlot", "endTime"],
      ["selectedTimeSlot", "endAt"],
    ]) ?? undefined;

  return { newSessionDate, newSessionStart, newSessionEnd };
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
      className: selectedRequestFromList.className || selectedRequestFromDetail.className,
      classInfo: selectedRequestFromList.classInfo || selectedRequestFromDetail.classInfo,
      courseName: selectedRequestFromList.courseName || selectedRequestFromDetail.courseName,
    };
  }, [selectedRequestFromDetail, selectedRequestFromList]);

  const canDecide = selectedRequest?.status === "PENDING";
  const isSwapRequest =
    selectedRequest?.requestType === "SWAP" && canDecide;
  const isModalityChangeRequest =
    selectedRequest?.requestType === "MODALITY_CHANGE" && canDecide;
  const isRescheduleRequest =
    selectedRequest?.requestType === "RESCHEDULE" && canDecide;

  // Get requestId for swap candidates API
  const requestId = selectedRequest?.id;
  const sessionId = selectedRequest?.sessionId;

  // Get swap candidates if this is a SWAP request
  const shouldFetchCandidates = isSwapRequest && !!requestId;
  const {
    data: swapCandidatesResponse,
    isFetching: isLoadingCandidates,
    error: swapCandidatesError,
  } = useGetSwapCandidatesQuery(
    shouldFetchCandidates && requestId
      ? { requestId }
      : skipToken
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
  const rescheduleInfo = selectedRequest
    ? getRescheduleInfo(selectedRequest)
    : null;
  const newDate = rescheduleInfo?.newSessionDate;
  const newTimeSlotId =
    selectedRequest?.newTimeSlotId ??
    selectedRequest?.newSlot?.id ??
    selectedRequest?.newSlot?.timeSlotId ??
    selectedRequest?.newTimeSlot?.id ??
    selectedRequest?.newTimeSlot?.timeSlotId ??
    undefined;

  const shouldFetchRescheduleResources =
    isRescheduleRequest &&
    !!sessionId &&
    !!newDate &&
    newTimeSlotId !== undefined;
  const {
    data: rescheduleResourcesResponse,
    isFetching: isLoadingRescheduleResources,
    error: rescheduleResourcesError,
  } = useGetRescheduleResourcesQuery(
    shouldFetchRescheduleResources &&
      sessionId &&
      newDate &&
      newTimeSlotId !== undefined
      ? {
          sessionId: Number(sessionId),
          date: newDate,
          timeSlotId: Number(newTimeSlotId),
        }
      : skipToken
  );

  // Debug: Log swap candidates query
  useEffect(() => {
    if (isSwapRequest) {
      console.log("SWAP Request Debug:", {
        requestId,
        isSwapRequest,
        canDecide,
        swapCandidatesResponse,
        candidates: swapCandidatesResponse?.data,
        isLoadingCandidates,
        error: swapCandidatesError,
      });
    }
  }, [
    isSwapRequest,
    requestId,
    canDecide,
    swapCandidatesResponse,
    isLoadingCandidates,
    swapCandidatesError,
  ]);

  const swapCandidates = swapCandidatesResponse?.data ?? [];
  const modalityResources = modalityResourcesResponse?.data ?? [];
  const rescheduleResources = rescheduleResourcesResponse?.data ?? [];
  
  // Combine resources for display
  const availableResources =
    isModalityChangeRequest
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

  // Refetch detail when opening dialog to ensure we have the latest data
  useEffect(() => {
    if (selectedRequestId !== null) {
      refetchRequestDetail();
    }
  }, [selectedRequestId, refetchRequestDetail]);

  // Set initial replacement teacher from request if available
  useEffect(() => {
    if (selectedRequest?.requestType === "SWAP" && selectedRequest.replacementTeacherId) {
      // Only set if not already selected by user
      if (!selectedReplacementTeacherId) {
        setSelectedReplacementTeacherId(selectedRequest.replacementTeacherId);
      }
    } else if (selectedRequest?.requestType !== "SWAP") {
      // Reset when switching to non-SWAP request
      setSelectedReplacementTeacherId(null);
    }
  }, [selectedRequest, selectedReplacementTeacherId]);

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

    // Validate replacement teacher for SWAP requests
    // Only require selection if request doesn't already have a replacement teacher
    if (
      action === "approve" &&
      selectedRequest.requestType === "SWAP" &&
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
              selectedRequest.requestType === "SWAP"
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
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Hàng đợi ({teacherPendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Lịch sử ({teacherHistoryRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Teacher Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
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
                  <SelectItem value="SWAP">
                    {TEACHER_REQUEST_TYPE_LABELS.SWAP}
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

            <div className="space-y-3">
              {teacherRequestsError ? (
                <div className="rounded-lg border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                  {formatBackendError(
                    (teacherRequestsError as { data?: { message?: string } })
                      ?.data?.message,
                    "Có lỗi xảy ra khi tải danh sách yêu cầu. Vui lòng thử lại."
                  )}
                </div>
              ) : isLoadingTeacherRequests ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-36 w-full rounded-lg" />
                  ))}
                </div>
              ) : teacherPendingRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Không có yêu cầu nào đang chờ duyệt.
                </div>
              ) : (
                teacherPendingRequests.map((request) => {
                  const topic = getRequestTopic(request);
                  const { newSessionDate, newSessionStart, newSessionEnd } =
                    getRescheduleInfo(request);

                  return (
                    <div
                      key={request.id}
                      className="cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary/60 hover:bg-primary/5"
                      onClick={() => handleOpenRequestDetail(request.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="rounded-full">
                              {TEACHER_REQUEST_TYPE_LABELS[request.requestType]}
                            </Badge>
                            <Badge
                              className={cn(
                                "rounded-full text-xs font-medium",
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .badgeClass
                              )}
                            >
                              {
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .label
                              }
                            </Badge>
                            {request.submittedAt && (
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
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            {request.teacherName && (
                              <p className="text-sm font-semibold text-foreground">
                                {request.teacherName}
                              </p>
                            )}
                            <p className="text-sm font-medium">
                              {request.className}{" "}
                              <span className="font-medium">
                                ·{" "}
                                {format(
                                  parseISO(request.sessionDate),
                                  "dd/MM/yyyy",
                                  {
                                    locale: vi,
                                  }
                                )}
                              </span>
                            </p>
                            {topic && (
                              <p className="text-sm text-muted-foreground">
                                {topic}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {request.sessionStartTime} - {request.sessionEndTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      {request.requestType === "MODALITY_CHANGE" && (
                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                            Thay đổi phương thức
                          </p>
                          <p className="text-sm">
                            {request.currentModality || "—"} →{" "}
                            {request.newModality || "—"}
                          </p>
                          {request.currentResourceName && (
                            <p className="text-sm text-muted-foreground">
                              Resource: {request.currentResourceName} →{" "}
                              {request.newResourceName || "—"}
                            </p>
                          )}
                        </div>
                      )}

                      {request.requestType === "RESCHEDULE" && (
                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                            Lịch mới
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            {newSessionDate && (
                              <p>
                                Ngày mới:{" "}
                                <span className="font-medium text-foreground">
                                  {format(
                                    parseISO(newSessionDate),
                                    "dd/MM/yyyy",
                                    { locale: vi }
                                  )}
                                </span>
                              </p>
                            )}
                            {newSessionStart || newSessionEnd ? (
                              <p>
                                Giờ mới:{" "}
                                <span className="font-medium text-foreground">
                                  {newSessionStart && newSessionEnd
                                    ? `${newSessionStart} - ${newSessionEnd}`
                                    : newSessionStart || newSessionEnd}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {request.requestType === "SWAP" && (
                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                            <span>Giáo viên dạy thay:</span>
                            {request.replacementTeacherName ? (
                              <span className="text-sm font-medium normal-case text-foreground">
                                {request.replacementTeacherName}
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
                      )}

                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRequestDetail(request.id);
                          }}
                        >
                          Xem & xử lý
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Teacher History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
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
                  <SelectItem value="SWAP">
                    {TEACHER_REQUEST_TYPE_LABELS.SWAP}
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

            <div className="rounded-lg border">
              {isLoadingTeacherRequests ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : teacherHistoryRequests.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Lớp học / Buổi</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Người xử lý</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherHistoryRequests.map((request) => {
                      const topic = getRequestTopic(request);

                      return (
                        <TableRow
                          key={request.id}
                          className="cursor-pointer hover:bg-primary/5"
                          onClick={() => handleOpenRequestDetail(request.id)}
                        >
                          <TableCell>
                            <Badge variant="outline" className="rounded-full">
                              {TEACHER_REQUEST_TYPE_LABELS[request.requestType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {request.teacherName ?? "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {request.className}{" "}
                                <span className="font-medium">
                                  ·{" "}
                                  {format(
                                    parseISO(request.sessionDate),
                                    "dd/MM/yyyy",
                                    { locale: vi }
                                  )}
                                </span>
                              </p>
                              {topic && (
                                <p className="text-xs text-muted-foreground">
                                  {topic}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {request.sessionStartTime} - {request.sessionEndTime}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "rounded-full text-xs font-medium",
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .badgeClass
                              )}
                            >
                              {
                                TEACHER_REQUEST_STATUS_META[request.status]
                                  .label
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {request.decidedByName ?? "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {request.decidedAt
                              ? format(
                                  parseISO(request.decidedAt),
                                  "HH:mm dd/MM",
                                  { locale: vi }
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRequestDetail(request.id);
                              }}
                            >
                              Chi tiết
                            </Button>
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
                    {format(parseISO(selectedRequest.submittedAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
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
                    Chọn resource
                  </p>
                  {!sessionId ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      Không tìm thấy thông tin session. Vui lòng thử lại sau.
                    </div>
                  ) : isLoadingModalityResources ||
                    isLoadingRescheduleResources ? (
                    <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                      Đang tải danh sách resource...
                    </div>
                  ) : modalityResourcesError || rescheduleResourcesError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {formatBackendError(
                        (modalityResourcesError as { data?: { message?: string } })
                          ?.data?.message ||
                          (rescheduleResourcesError as { data?: { message?: string } })
                            ?.data?.message,
                        "Có lỗi khi tải danh sách resource. Vui lòng thử lại sau."
                      )}
                    </div>
                  ) : availableResources.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                      Không tìm thấy resource phù hợp.
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
                        <SelectValue placeholder="Chọn resource...">
                          {selectedResourceId
                            ? (() => {
                                const selectedResource = availableResources.find(
                                  (r) =>
                                    (r.id ?? r.resourceId) === selectedResourceId
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
                          const resourceType = resource.type || "";
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

              {isSwapRequest && (
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
                  ) : swapCandidatesError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {formatBackendError(
                        (swapCandidatesError as { data?: { message?: string } })
                          ?.data?.message,
                        "Có lỗi khi tải danh sách giáo viên. Vui lòng thử lại sau."
                      )}
                    </div>
                  ) : swapCandidates.length === 0 ? (
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
                                const selectedCandidate = swapCandidates.find(
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
                                // If not in candidates, use from request
                                if (
                                  selectedRequest.replacementTeacherName &&
                                  selectedRequest.replacementTeacherId ===
                                    selectedReplacementTeacherId
                                ) {
                                  return selectedRequest.replacementTeacherName;
                                }
                                return "Chưa có tên";
                              })()
                            : selectedRequest.replacementTeacherName
                            ? selectedRequest.replacementTeacherName
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {swapCandidates.map((candidate) => {
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
