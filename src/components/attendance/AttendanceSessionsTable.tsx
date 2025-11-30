import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED"
  | "PLANNED"
  | "UNKNOWN"
  | string;

export interface AttendanceSessionRow {
  id: number | string;
  order?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  room?: string | null;
  teacher?: string | null;
  attendanceStatus?: AttendanceStatus | null;
  note?: string | null;
  // Makeup session fields
  isMakeup?: boolean;
  makeupSessionId?: number;
  originalSessionId?: number;
}

interface AttendanceSessionsTableProps {
  rows: AttendanceSessionRow[];
  emptyMessage?: string;
}

const STATUS_META: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PRESENT: {
    label: "Có mặt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ABSENT: {
    label: "Vắng không phép",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  LATE: {
    label: "Đi trễ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  EXCUSED: {
    label: "Có phép",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  PLANNED: {
    label: "Chưa diễn ra",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  PRESENT_MAKEUP: {
    label: "Đã học bù",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

function formatDateLabel(dateString: string) {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE '-' dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
}

function formatTimeRange(startTime?: string, endTime?: string) {
  const start = startTime ? startTime.slice(0, 5) : "";
  const end = endTime ? endTime.slice(0, 5) : "";
  if (!start && !end) return "—";
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
}

export function AttendanceSessionsTable({
  rows,
  emptyMessage = "Chưa có dữ liệu buổi học.",
}: AttendanceSessionsTableProps) {
  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        {rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[72px] text-center">Buổi</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ học</TableHead>
                <TableHead>Phòng học</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Trạng thái điểm danh</TableHead>
                <TableHead>Ghi chú từ giảng viên</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                // Determine status key based on makeup session
                let statusKey = row.attendanceStatus ?? "UNKNOWN";
                if (row.isMakeup && row.attendanceStatus === "PRESENT") {
                  statusKey = "PRESENT_MAKEUP";
                }
                const statusMeta = STATUS_META[statusKey] ?? null;

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {row.order ?? idx + 1}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {formatDateLabel(row.date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeRange(row.startTime, row.endTime)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.room || "Chưa cập nhật"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.teacher || "Chưa cập nhật"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {statusMeta ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-2 py-0.5 text-[11px] font-medium",
                              statusMeta.className
                            )}
                          >
                            {statusMeta.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa có dữ liệu</span>
                        )}
                        {row.isMakeup && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                Học bù
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {row.originalSessionId
                                  ? `Buổi học bù cho buổi #${row.originalSessionId}`
                                  : "Buổi học bù"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.note?.trim() || "Không có ghi chú"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default AttendanceSessionsTable;
