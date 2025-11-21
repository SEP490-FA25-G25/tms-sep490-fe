import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetMySessionsQuery } from "@/store/services/teacherRequestApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestType } from "@/store/services/teacherRequestApi";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const formatDateLabel = (dateString: string) => {
  try {
    return format(parseISO(dateString), "EEE · dd/MM", { locale: vi });
  } catch {
    return dateString;
  }
};

export default function SelectSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestType = searchParams.get("type") as RequestType;
  const [selectedSessionId, setSelectedSessionId] = useState<
    number | undefined
  >();

  const { data, isLoading, error, refetch, isFetching } = useGetMySessionsQuery(
    {}
  );

  const handleContinue = () => {
    if (!selectedSessionId || !requestType) return;

    // For MODALITY_CHANGE, navigate to select resource
    if (requestType === "MODALITY_CHANGE") {
      navigate(
        `/teacher/requests/create/select-resource?sessionId=${selectedSessionId}&type=${requestType}`
      );
    } else {
      // For other types, navigate directly to form
      navigate(
        `/teacher/requests/create/form?sessionId=${selectedSessionId}&type=${requestType}`
      );
    }
  };

  const sessions = useMemo(() => data?.data ?? [], [data]);
  const isEmpty = !isLoading && !isFetching && sessions.length === 0;

  const renderContent = () => {
    if (isLoading || isFetching) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/60 bg-card/40 p-4"
            >
              <Skeleton className="h-4 w-1/3 rounded-full" />
              <Skeleton className="mt-3 h-4 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Empty className="border border-destructive/40 text-destructive">
          <EmptyHeader>
            <EmptyTitle>Không thể tải danh sách buổi học</EmptyTitle>
            <EmptyDescription>
              Vui lòng kiểm tra kết nối và thử lại.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => refetch()}>
            Thử tải lại
          </Button>
        </Empty>
      );
    }

    if (isEmpty) {
      return (
        <Empty className="border border-dashed border-border/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-lg font-semibold text-muted-foreground">
                14
              </span>
            </EmptyMedia>
            <EmptyTitle>Không có buổi học phù hợp</EmptyTitle>
            <EmptyDescription>
              Bạn không có buổi dạy nào trong 14 ngày tới để tạo yêu cầu.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p>
              Nếu cần hỗ trợ khẩn, vui lòng liên hệ trực tiếp bộ phận Học vụ.
            </p>
          </EmptyContent>
        </Empty>
      );
    }

    return (
      <>
        <div className="rounded-2xl border border-border/60 bg-card/40">
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                <TableHead className="w-[60px] text-center">Chọn</TableHead>
                <TableHead>Ngày & giờ</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Khoá học</TableHead>
                <TableHead>Chủ đề</TableHead>
                <TableHead className="w-[110px] text-center">
                  Trạng thái
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const sessionRowId = session.sessionId ?? session.id;
                const isSelected = selectedSessionId === sessionRowId;
                return (
                  <TableRow
                    key={sessionRowId}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedSessionId(sessionRowId);
                      }
                    }}
                    className={cn(
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      isSelected
                        ? "bg-primary/5"
                        : "hover:bg-muted/40 transition-colors"
                    )}
                    onClick={() => setSelectedSessionId(sessionRowId)}
                  >
                    <TableCell className="text-center">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-flex h-4 w-4 items-center justify-center rounded-full border transition",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border"
                        )}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </span>
                      <span className="sr-only">
                        Chọn buổi {session.className} ngày{" "}
                        {formatDateLabel(session.date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">
                        {formatDateLabel(session.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.startTime} - {session.endTime}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {session.className}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.courseName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.topic || "Chưa cập nhật"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {session.hasPendingRequest
                        ? "Đang có yêu cầu"
                        : "Không có"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/teacher/requests/create/select-type")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Button onClick={handleContinue} disabled={!selectedSessionId}>
            Tiếp tục
          </Button>
        </div>
      </>
    );
  };

  return (
    <TeacherRoute>
      <DashboardLayout
        title="Chọn buổi cần hỗ trợ"
        description="Chỉ hiển thị các buổi bạn phụ trách trong 14 ngày tới"
      >
        <div className="flex flex-col gap-6">{renderContent()}</div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
