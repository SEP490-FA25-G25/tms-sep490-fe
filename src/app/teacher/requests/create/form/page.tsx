import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useCreateRequestMutation,
  useGetModalityResourcesQuery,
  useGetMySessionsQuery,
  type RequestType,
} from "@/store/services/teacherRequestApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/utils/dateFormat";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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
    return "Ngày buổi học đề xuất không nằm trong khoảng thời gian cho phép (trong vòng 14 ngày từ hôm nay).";
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
    return "Phòng học/phương tiện bạn chọn không khả dụng tại thời gian đã chỉ định. Vui lòng chọn lựa chọn khác.";
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

export default function RequestFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const requestType = searchParams.get("type") as RequestType;
  const resourceId = searchParams.get("resourceId");
  const sessionIdNumber = sessionId ? Number(sessionId) : undefined;
  const resourceIdNumber = resourceId ? Number(resourceId) : undefined;
  const reasonLimit = 500;

  const [reason, setReason] = useState("");
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const shouldLoadSession = Boolean(sessionIdNumber && requestType);
  const {
    data: sessionsResponse,
    isFetching: isFetchingSession,
    error: sessionError,
  } = useGetMySessionsQuery(
    {},
    {
      skip: !shouldLoadSession,
    }
  );

  const session = useMemo(() => {
    if (!sessionIdNumber) {
      return undefined;
    }
    const sessions = sessionsResponse?.data ?? [];
    return sessions.find((item) => {
      const idFromApi = item.sessionId ?? item.id;
      return idFromApi === sessionIdNumber;
    });
  }, [sessionsResponse, sessionIdNumber]);

  const shouldLoadResources =
    requestType === "MODALITY_CHANGE" && Boolean(sessionIdNumber);
  const {
    data: resourcesResponse,
    isFetching: isFetchingResources,
    error: resourcesError,
  } = useGetModalityResourcesQuery(
    { sessionId: sessionIdNumber },
    {
      skip: !shouldLoadResources,
    }
  );

  const selectedResource = useMemo(() => {
    if (!resourceIdNumber) {
      return undefined;
    }
    const resources = resourcesResponse?.data ?? [];
    return resources.find((item) => {
      const idFromApi = item.id ?? item.resourceId;
      return idFromApi === resourceIdNumber;
    });
  }, [resourceIdNumber, resourcesResponse]);

  const handleSubmit = async () => {
    if (!reason.trim() || !sessionIdNumber || !requestType) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const result = await createRequest({
        sessionId: sessionIdNumber,
        requestType,
        newResourceId: resourceIdNumber,
        reason: reason.trim(),
      }).unwrap();

      toast.success("Yêu cầu đã được gửi thành công");
      navigate(`/teacher/requests/${result.data.id}`);
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error(
        formatBackendError(
          apiError?.data?.message,
          "Có lỗi xảy ra khi gửi yêu cầu"
        )
      );
    }
  };

  const renderSessionSection = () => {
    if (!requestType || !sessionIdNumber) {
      return (
        <Empty className="border-border/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Chưa có thông tin buổi học</EmptyTitle>
            <EmptyDescription>
              Vui lòng quay lại bước trước để chọn buổi học rồi thử lại.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Quay lại danh sách buổi học
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

    if (sessionError) {
      return (
        <Empty className="border-destructive/60 text-destructive">
          <EmptyHeader>
            <EmptyTitle>Không thể tải thông tin buổi học</EmptyTitle>
            <EmptyDescription>
              Vui lòng thử tải lại trang hoặc chọn buổi học khác.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Chọn buổi học khác
          </Button>
        </Empty>
      );
    }

    if (!session) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy buổi học</EmptyTitle>
            <EmptyDescription>
              Có thể buổi học đã bị xóa hoặc không thuộc danh sách của bạn.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Chọn buổi khác
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

  const renderResourceSection = () => {
    if (requestType !== "MODALITY_CHANGE" || !resourceIdNumber) {
      return null;
    }

    if (isFetchingResources) {
      return <Skeleton className="h-4 w-48 rounded-full" />;
    }

    if (resourcesError) {
      return (
        <p className="text-sm text-destructive">
          Không thể tải thông tin phòng học. Bạn vẫn có thể gửi yêu cầu.
        </p>
      );
    }

    return (
      <div className="text-sm text-muted-foreground">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Resource đã chọn
        </p>
        <p className="mt-1 text-foreground">
          {selectedResource?.name || `ID: ${resourceIdNumber}`}
        </p>
        {selectedResource?.capacity && (
          <p>Sức chứa: {selectedResource.capacity} học viên</p>
        )}
      </div>
    );
  };

  const resourceSection = renderResourceSection();

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Gửi yêu cầu giảng dạy"
        description="Xem lại thông tin buổi học và mô tả lý do cần hỗ trợ"
      >
        <div className="flex max-w-3xl flex-col gap-6">
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
            {resourceSection && (
              <div className="mt-4 rounded-xl border border-dashed border-border/50 p-3">
                {resourceSection}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 p-4">
            <Label
              htmlFor="reason"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Lý do yêu cầu <span className="text-destructive">*</span>
            </Label>
            <p className="mt-2 text-sm text-muted-foreground">
              Hãy mô tả rõ khó khăn và mong muốn hỗ trợ để bộ phận Học vụ xử lý
              nhanh hơn.
            </p>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Tôi bị trùng lịch công tác nên cần đổi sang ca sáng trong khung 18/11 - 22/11..."
              className="mt-4 min-h-[140px]"
              maxLength={reasonLimit}
            />
            <div className="mt-2 text-right text-xs text-muted-foreground">
              {reason.length}/{reasonLimit} ký tự
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || !session || isLoading}
            >
              {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
