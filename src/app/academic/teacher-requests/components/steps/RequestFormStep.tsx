import { useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import {
  useCreateRequestForTeacherMutation,
  useGetTeacherSessionsForStaffQuery,
  useGetModalityResourcesQuery,
  useGetRescheduleSlotsQuery,
  useGetRescheduleResourcesQuery,
  useGetReplacementCandidatesQuery,
  type RequestType,
} from "@/store/services/teacherRequestApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/utils/dateFormat";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

interface RequestFormStepProps {
  teacherId: number;
  sessionId: number;
  requestType: RequestType;
  onSuccess: () => void;
  onBack: () => void;
}

// Helper function to format error messages
const formatBackendError = (
  errorMessage?: string,
  defaultMessage?: string
): string => {
  if (!errorMessage) {
    return defaultMessage || "Có lỗi xảy ra. Vui lòng thử lại sau.";
  }

  if (errorMessage.includes("SESSION_NOT_IN_TIME_WINDOW")) {
    return "Ngày buổi học đề xuất không nằm trong khoảng thời gian cho phép.";
  }

  if (errorMessage.includes("INVALID_DATE")) {
    return "Ngày đề xuất không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (errorMessage.includes(":")) {
    const parts = errorMessage.split(":");
    if (parts.length > 1) {
      const readablePart = parts.slice(1).join(":").trim();
      if (readablePart.length > 0 && !readablePart.includes("_")) {
        return readablePart;
      }
    }
  }

  return errorMessage;
};

export function RequestFormStep({
  teacherId: teacherIdProp,
  sessionId: sessionIdProp,
  requestType,
  onSuccess,
  onBack,
}: RequestFormStepProps) {
  const teacherIdNumber = teacherIdProp;
  const sessionIdNumber = sessionIdProp;

  const reasonLimit = 500;

  // Form state
  const [reason, setReason] = useState("");
  
  // RESCHEDULE state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | undefined>();
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>();
  
  // REPLACEMENT state
  const [selectedReplacementTeacherId, setSelectedReplacementTeacherId] = useState<number | undefined>();
  
  // MODALITY_CHANGE state
  const [selectedModalityResourceId, setSelectedModalityResourceId] = useState<number | undefined>();

  const [createRequest, { isLoading }] = useCreateRequestForTeacherMutation();

  // Load session info
  const {
    data: sessionsResponse,
    isFetching: isFetchingSession,
    error: sessionError,
  } = useGetTeacherSessionsForStaffQuery(
    { teacherId: teacherIdNumber! },
    {
      skip: !teacherIdNumber,
    }
  );

  const session = useMemo(() => {
    if (!sessionIdNumber) return undefined;
    const sessions = sessionsResponse?.data ?? [];
    return sessions.find((item) => {
      const idFromApi = item.sessionId ?? item.id;
      return idFromApi === sessionIdNumber;
    });
  }, [sessionsResponse, sessionIdNumber]);

  // Load resources for MODALITY_CHANGE
  const shouldLoadModalityResources =
    requestType === "MODALITY_CHANGE" && Boolean(sessionIdNumber) && Boolean(teacherIdNumber);
  const {
    data: modalityResourcesResponse,
    isFetching: isFetchingModalityResources,
    error: modalityResourcesError,
  } = useGetModalityResourcesQuery(
    { sessionId: sessionIdNumber!, teacherId: teacherIdNumber! },
    {
      skip: !shouldLoadModalityResources,
    }
  );

  // Load slots for RESCHEDULE
  const shouldLoadSlots =
    requestType === "RESCHEDULE" &&
    Boolean(sessionIdNumber) &&
    Boolean(teacherIdNumber) &&
    Boolean(selectedDate);
  const selectedDateString = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : undefined;
  const {
    data: slotsResponse,
    isFetching: isFetchingSlots,
    error: slotsError,
  } = useGetRescheduleSlotsQuery(
    {
      sessionId: sessionIdNumber!,
      date: selectedDateString!,
      teacherId: teacherIdNumber!,
    },
    {
      skip: !shouldLoadSlots,
    }
  );

  // Load resources for RESCHEDULE
  const shouldLoadRescheduleResources =
    requestType === "RESCHEDULE" &&
    Boolean(sessionIdNumber) &&
    Boolean(teacherIdNumber) &&
    Boolean(selectedDate) &&
    Boolean(selectedTimeSlotId);
  const {
    data: rescheduleResourcesResponse,
    isFetching: isFetchingRescheduleResources,
    error: rescheduleResourcesError,
  } = useGetRescheduleResourcesQuery(
    {
      sessionId: sessionIdNumber!,
      date: selectedDateString!,
      timeSlotId: selectedTimeSlotId!,
      teacherId: teacherIdNumber!,
    },
    {
      skip: !shouldLoadRescheduleResources,
    }
  );

  // Load replacement candidates for REPLACEMENT
  const shouldLoadCandidates =
    requestType === "REPLACEMENT" &&
    Boolean(sessionIdNumber) &&
    Boolean(teacherIdNumber);
  const {
    data: candidatesResponse,
    isFetching: isFetchingCandidates,
    error: candidatesError,
  } = useGetReplacementCandidatesQuery(
    {
      sessionId: sessionIdNumber!,
      teacherId: teacherIdNumber!,
    },
    {
      skip: !shouldLoadCandidates,
    }
  );

  const modalityResources = modalityResourcesResponse?.data ?? [];
  const slots = slotsResponse?.data ?? [];
  const rescheduleResources = rescheduleResourcesResponse?.data ?? [];
  const replacementCandidates = candidatesResponse?.data ?? [];

  const handleSubmit = async () => {
    if (!reason.trim() || !sessionIdNumber || !requestType || !teacherIdNumber) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Validate based on request type
    if (requestType === "REPLACEMENT" && !selectedReplacementTeacherId) {
      toast.error("Vui lòng chọn giáo viên dạy thay");
      return;
    }

    if (requestType === "RESCHEDULE") {
      if (!selectedDate) {
        toast.error("Vui lòng chọn ngày mới");
        return;
      }
      if (!selectedTimeSlotId) {
        toast.error("Vui lòng chọn khung giờ mới");
        return;
      }
      if (!selectedResourceId) {
        toast.error("Vui lòng chọn phòng học/phương tiện");
        return;
      }
    }

    if (requestType === "MODALITY_CHANGE" && !selectedModalityResourceId) {
      toast.error("Vui lòng chọn phòng học/phương tiện");
      return;
    }

    try {
      await createRequest({
        teacherId: teacherIdNumber,
        sessionId: sessionIdNumber,
        requestType,
        reason: reason.trim(),
        replacementTeacherId:
          requestType === "REPLACEMENT" ? selectedReplacementTeacherId : undefined,
        newDate:
          requestType === "RESCHEDULE" && selectedDate
            ? format(selectedDate, "yyyy-MM-dd")
            : undefined,
        newTimeSlotId:
          requestType === "RESCHEDULE" ? selectedTimeSlotId : undefined,
        newResourceId:
          requestType === "RESCHEDULE"
            ? selectedResourceId
            : requestType === "MODALITY_CHANGE"
            ? selectedModalityResourceId
            : undefined,
      }).unwrap();

      const statusMessage =
        requestType === "REPLACEMENT"
          ? "Yêu cầu đã được tạo, đang chờ giáo viên dạy thay xác nhận"
          : "Yêu cầu đã được tạo và tự động phê duyệt";
      toast.success(statusMessage);
      onSuccess();
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error(
        formatBackendError(
          apiError?.data?.message,
          "Có lỗi xảy ra khi tạo yêu cầu"
        )
      );
    }
  };


  const renderSessionSection = () => {
    if (!sessionIdNumber || !requestType) {
      return (
        <Empty className="border-border/70">
          <EmptyHeader>
            <EmptyTitle>Chưa có thông tin buổi học</EmptyTitle>
            <EmptyDescription>
              Vui lòng quay lại bước trước để chọn buổi học.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={onBack}>
            Quay lại
          </Button>
        </Empty>
      );
    }

    if (isFetchingSession) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-5 w-full rounded-full" />
          ))}
        </div>
      );
    }

    if (sessionError || !session) {
      return (
        <Empty className="border-destructive/60 text-destructive">
          <EmptyHeader>
            <EmptyTitle>Không thể tải thông tin buổi học</EmptyTitle>
            <EmptyDescription>
              Vui lòng thử tải lại trang hoặc chọn buổi học khác.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={onBack}>
            Chọn buổi học khác
          </Button>
        </Empty>
      );
    }

    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between text-foreground">
          <p className="font-medium text-base">{session.className}</p>
          <span>{formatDate(session.date)}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wide">
          <span>
            {session.startTime} - {session.endTime}
          </span>
          <span>·</span>
          <span>{session.subjectName}</span>
        </div>
        {session.topic && (
          <p className="text-sm text-muted-foreground">
            Chủ đề: {session.topic}
          </p>
        )}
      </div>
    );
  };

  const renderReplacementSection = () => {
    if (requestType !== "REPLACEMENT") return null;

    if (isFetchingCandidates) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }

    if (candidatesError) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {formatBackendError(
            (candidatesError as { data?: { message?: string } })?.data?.message,
            "Không thể tải danh sách giáo viên dạy thay"
          )}
        </div>
      );
    }

    if (replacementCandidates.length === 0) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Không tìm thấy giáo viên phù hợp để dạy thay.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Chọn giáo viên dạy thay <span className="text-destructive">*</span>
        </Label>
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
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn giáo viên dạy thay..." />
          </SelectTrigger>
          <SelectContent>
            {replacementCandidates
              .filter((candidate) => {
                const teacherId =
                  candidate.teacherId ?? (candidate as { id?: number }).id;
                return teacherId !== null && teacherId !== undefined && teacherId !== 0;
              })
              .map((candidate) => {
                const teacherId =
                  candidate.teacherId ?? (candidate as { id?: number }).id;
              const teacherName =
                candidate.fullName ||
                candidate.displayName ||
                candidate.teacherName ||
                "Chưa có tên";
              const hasConflict = (candidate as { hasConflict?: boolean })
                .hasConflict;

              return (
                <SelectItem
                  key={teacherId || teacherName}
                  value={String(teacherId)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>{teacherName}</span>
                      {hasConflict && (
                        <span className="text-xs text-amber-600">
                          (Có xung đột)
                        </span>
                      )}
                    </div>
                    {candidate.email && (
                      <span className="text-xs text-muted-foreground">
                        {candidate.email}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
              })}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderRescheduleSection = () => {
    if (requestType !== "RESCHEDULE") return null;

    return (
      <div className="space-y-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Chọn ngày mới <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Chọn khung giờ mới <span className="text-destructive">*</span>
            </Label>
            {isFetchingSlots ? (
              <Skeleton className="h-10 w-full" />
            ) : slotsError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {formatBackendError(
                  (slotsError as { data?: { message?: string } })?.data?.message,
                  "Không thể tải danh sách khung giờ"
                )}
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Không có khung giờ phù hợp cho ngày đã chọn.
              </div>
            ) : (
              <Select
                value={
                  selectedTimeSlotId !== null && selectedTimeSlotId !== undefined
                    ? String(selectedTimeSlotId)
                    : undefined
                }
                onValueChange={(value) =>
                  setSelectedTimeSlotId(Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khung giờ..." />
                </SelectTrigger>
                <SelectContent>
                  {slots
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
                      `${slot.startTime || slot.startAt} - ${slot.endTime || slot.endAt}`;

                    return (
                      <SelectItem
                        key={slotId || label}
                        value={String(slotId)}
                      >
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Resource Selection */}
        {selectedDate && selectedTimeSlotId && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Chọn phòng học/phương tiện <span className="text-destructive">*</span>
            </Label>
            {isFetchingRescheduleResources ? (
              <Skeleton className="h-10 w-full" />
            ) : rescheduleResourcesError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {formatBackendError(
                  (rescheduleResourcesError as { data?: { message?: string } })
                    ?.data?.message,
                  "Không thể tải danh sách phòng học/phương tiện"
                )}
              </div>
            ) : rescheduleResources.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Không tìm thấy phòng học/phương tiện phù hợp.
              </div>
            ) : (
              <Select
                value={
                  selectedResourceId !== null && selectedResourceId !== undefined
                    ? String(selectedResourceId)
                    : undefined
                }
                onValueChange={(value) =>
                  setSelectedResourceId(Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng học/phương tiện..." />
                </SelectTrigger>
                <SelectContent>
                  {rescheduleResources
                    .filter((resource) => {
                      const resourceId = resource.id ?? resource.resourceId;
                      return resourceId !== null && resourceId !== undefined && resourceId !== 0;
                    })
                    .map((resource) => {
                      const resourceId = resource.id ?? resource.resourceId;
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
      </div>
    );
  };

  const renderModalityChangeSection = () => {
    if (requestType !== "MODALITY_CHANGE") return null;

    if (isFetchingModalityResources) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }

    if (modalityResourcesError) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {formatBackendError(
            (modalityResourcesError as { data?: { message?: string } })
              ?.data?.message,
            "Không thể tải danh sách phòng học/phương tiện"
          )}
        </div>
      );
    }

    if (modalityResources.length === 0) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Không tìm thấy phòng học/phương tiện phù hợp.
        </div>
      );
    }

    const filteredModalityResources = modalityResources.filter((resource) => {
      const resourceId = resource.id ?? resource.resourceId;
      return resourceId !== null && resourceId !== undefined && resourceId !== 0;
    });

    const modalitySelectValue =
      selectedModalityResourceId ??
      (filteredModalityResources[0]
        ? filteredModalityResources[0].id ??
          filteredModalityResources[0].resourceId
        : undefined);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Chọn phòng học/phương tiện <span className="text-destructive">*</span>
        </Label>
        <Select
          value={
            modalitySelectValue !== undefined && modalitySelectValue !== null
              ? String(modalitySelectValue)
              : ""
          }
          onValueChange={(value) =>
            setSelectedModalityResourceId(Number(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn phòng học/phương tiện..." />
          </SelectTrigger>
          <SelectContent>
            {filteredModalityResources.map((resource) => {
              const resourceId = resource.id ?? resource.resourceId;
              const resourceName = resource.name || "Chưa có tên";
              const resourceType =
                resource.type || resource.resourceType || "";
              const resourceCapacity = resource.capacity;
              const isCurrent = resource.currentResource;

              return (
                <SelectItem
                  key={resourceId || resourceName}
                  value={String(resourceId)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {resourceName}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Hiện tại)
                          </span>
                        )}
                      </span>
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
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto">
        {/* Session Info */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Thông tin buổi học
            </h2>
            {session && (
              <span className="text-xs text-muted-foreground">
                ID buổi: {session.sessionId ?? session.id}
              </span>
            )}
          </div>
          <div className="mt-3">{renderSessionSection()}</div>
        </section>

        {/* Request Type Specific Fields */}
        {(requestType === "REPLACEMENT" ||
          requestType === "RESCHEDULE" ||
          requestType === "MODALITY_CHANGE") && (
          <section className="rounded-2xl border border-border/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              {requestType === "REPLACEMENT"
                ? "Thông tin giáo viên dạy thay"
                : requestType === "RESCHEDULE"
                ? "Thông tin lịch mới"
                : "Thông tin phương tiện mới"}
            </h2>
            {renderReplacementSection()}
            {renderRescheduleSection()}
            {renderModalityChangeSection()}
          </section>
        )}

        {/* Reason */}
        <section className="rounded-2xl border border-border/70 p-4">
          <Label
            htmlFor="reason"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Lý do yêu cầu <span className="text-destructive">*</span>
          </Label>
          <p className="mt-2 text-sm text-muted-foreground">
            Hãy mô tả rõ lý do tạo yêu cầu này.
          </p>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Giáo viên có việc đột xuất cần đổi lịch..."
            className="mt-4 min-h-[140px]"
            maxLength={reasonLimit}
          />
          <div className="mt-2 text-right text-xs text-muted-foreground">
            {reason.length}/{reasonLimit} ký tự
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !reason.trim() ||
              !session ||
              isLoading ||
              (requestType === "REPLACEMENT" && !selectedReplacementTeacherId) ||
              (requestType === "RESCHEDULE" &&
                (!selectedDate || !selectedTimeSlotId || !selectedResourceId)) ||
              (requestType === "MODALITY_CHANGE" && !selectedModalityResourceId)
            }
          >
            {isLoading ? "Đang tạo..." : "Tạo yêu cầu"}
          </Button>
        </div>
      </div>
  );
}

