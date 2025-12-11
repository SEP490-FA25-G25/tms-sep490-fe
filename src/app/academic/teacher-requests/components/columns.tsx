import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO, differenceInHours, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  TeacherRequestDTO,
  RequestStatus as TeacherRequestStatus,
} from "@/store/services/teacherRequestApi";
import {
  getDaysUntilSession,
  getRequestTopic,
  getTimeDisplayMeta,
  TEACHER_REQUEST_STATUS_META,
  TEACHER_REQUEST_TYPE_LABELS,
  TEACHER_REQUEST_TYPE_BADGES,
} from "./meta";

const renderTimeBadge = (request: TeacherRequestDTO) => {
  const daysUntilSession = getDaysUntilSession(request);
  const { label, className } = getTimeDisplayMeta(daysUntilSession);
  return (
    <Badge
      variant="outline"
      className={className}
    >
      {label}
    </Badge>
  );
};

const renderStatusBadge = (status: TeacherRequestStatus) => {
  const meta = TEACHER_REQUEST_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={meta.badgeClass}
    >
      {meta.label}
    </Badge>
  );
};

export const pendingColumns: ColumnDef<TeacherRequestDTO>[] = [
  {
    id: "teacherName",
    accessorKey: "teacherName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Giáo viên
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.teacherName ?? "—"}</span>
        {row.original.subjectName && (
          <span className="text-xs text-muted-foreground">
            {row.original.subjectName}
          </span>
        )}
      </div>
    ),
    size: 140,
  },
  {
    id: "timeLeft",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Thời gian còn lại
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => renderTimeBadge(row.original),
    size: 130,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = getDaysUntilSession(rowA.original) ?? 999;
      const b = getDaysUntilSession(rowB.original) ?? 999;
      return a - b;
    },
  },
  {
    id: "classSession",
    header: "Lớp học / Buổi",
    cell: ({ row }) => {
      const request = row.original;
      const topic = getRequestTopic(request);
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {request.className} ·{" "}
            {request.sessionDate
              ? format(parseISO(request.sessionDate), "dd/MM/yyyy", { locale: vi })
              : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {request.sessionStartTime} - {request.sessionEndTime}
            {topic && ` · ${topic}`}
          </span>
        </div>
      );
    },
    size: 200,
  },
  {
    id: "reason",
    header: "Lý do",
    cell: ({ row }) => {
      const request = row.original;
      const reason =
        (request as { reason?: string }).reason ??
        (request as { requestReason?: string }).requestReason ??
        "";
      const truncatedReason =
        reason.length > 80 ? `${reason.slice(0, 80)}...` : reason;
      return (
        <span className="text-sm text-muted-foreground" title={reason}>
          {truncatedReason || "Không có lý do"}
        </span>
      );
    },
    size: 160,
  },
  {
    id: "requestType",
    accessorKey: "requestType",
    header: "Loại",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={TEACHER_REQUEST_TYPE_BADGES[row.original.requestType].className}
      >
        {TEACHER_REQUEST_TYPE_LABELS[row.original.requestType]}
      </Badge>
    ),
    size: 110,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Trạng thái
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => renderStatusBadge(row.original.status),
    size: 120,
    enableSorting: true,
  },
  {
    id: "submittedAt",
    accessorKey: "submittedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Ngày gửi
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.submittedAt ? (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(row.original.submittedAt), "HH:mm dd/MM", {
            locale: vi,
          })}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    size: 110,
    enableSorting: true,
  },
];

export const historyColumns: ColumnDef<TeacherRequestDTO>[] = [
  {
    id: "teacherName",
    accessorKey: "teacherName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Giáo viên
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.teacherName ?? "—"}</span>
        {row.original.subjectName && (
          <span className="text-xs text-muted-foreground">
            {row.original.subjectName}
          </span>
        )}
      </div>
    ),
    size: 140,
  },
  {
    id: "classSession",
    header: "Lớp học / Buổi",
    cell: ({ row }) => {
      const request = row.original;
      const topic = getRequestTopic(request);
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {request.className} ·{" "}
            {request.sessionDate
              ? format(parseISO(request.sessionDate), "dd/MM/yyyy", { locale: vi })
              : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {request.sessionStartTime} - {request.sessionEndTime}
            {topic && ` · ${topic}`}
          </span>
        </div>
      );
    },
    size: 200,
  },
  {
    id: "decidedBy",
    header: "Người xử lý",
    cell: ({ row }) => (
      <span className="font-medium text-sm">
        {row.original.decidedByName ?? "—"}
      </span>
    ),
    size: 130,
  },
  {
    id: "requestType",
    accessorKey: "requestType",
    header: "Loại",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={TEACHER_REQUEST_TYPE_BADGES[row.original.requestType].className}
      >
        {TEACHER_REQUEST_TYPE_LABELS[row.original.requestType]}
      </Badge>
    ),
    size: 110,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Trạng thái
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => renderStatusBadge(row.original.status),
    size: 120,
    enableSorting: true,
  },
  {
    id: "submittedAt",
    accessorKey: "submittedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Ngày gửi
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.submittedAt ? (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(row.original.submittedAt), "HH:mm dd/MM", {
            locale: vi,
          })}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    size: 110,
    enableSorting: true,
  },
  {
    id: "decidedAt",
    accessorKey: "decidedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-left font-medium"
      >
        Ngày duyệt
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const decidedAt = row.original.decidedAt;
      if (!decidedAt) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const decidedDate = parseISO(decidedAt);
      const now = new Date();
      const diffDays = differenceInDays(now, decidedDate);
      const diffHours = differenceInHours(now, decidedDate);

      let relativeTime = "";
      if (diffHours < 1) {
        relativeTime = "Vừa xong";
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} giờ trước`;
      } else if (diffDays === 1) {
        relativeTime = "Hôm qua";
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} ngày trước`;
      } else {
        relativeTime = format(decidedDate, "dd/MM/yyyy", { locale: vi });
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm">{relativeTime}</span>
          <span className="text-xs text-muted-foreground">
            {format(decidedDate, "HH:mm", { locale: vi })}
          </span>
        </div>
      );
    },
    size: 120,
    enableSorting: true,
  },
];

