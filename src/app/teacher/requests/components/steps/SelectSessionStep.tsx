import { useMemo, useState } from "react";
import { useGetMySessionsQuery } from "@/store/services/teacherRequestApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RequestType } from "@/store/services/teacherRequestApi";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface SelectSessionStepProps {
  requestType: RequestType;
  onSelect: (sessionId: number) => void;
  onBack: () => void;
}

const formatDateLabel = (dateString: string) => {
  try {
    return format(parseISO(dateString), "EEE · dd/MM", { locale: vi });
  } catch {
    return dateString;
  }
};

export function SelectSessionStep({
  onSelect,
  onBack,
}: SelectSessionStepProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<
    number | undefined
  >();

  const {
    data: sessionsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetMySessionsQuery({});

  const handleContinue = () => {
    if (selectedSessionId) {
      onSelect(selectedSessionId);
    }
  };

  const sessions = useMemo(
    () => sessionsResponse?.data ?? [],
    [sessionsResponse]
  );
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
        </Empty>
      );
    }

    return (
      <div className="rounded-lg border overflow-hidden bg-card max-h-[400px] overflow-y-auto">
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
                    {session.subjectName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.topic || "Chưa cập nhật"}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {session.hasPendingRequest ? "Đang có yêu cầu" : "Không có"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderContent()}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
        <div>
          <Button variant="ghost" onClick={onBack}>
            Quay lại
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleContinue} disabled={!selectedSessionId}>
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
}


