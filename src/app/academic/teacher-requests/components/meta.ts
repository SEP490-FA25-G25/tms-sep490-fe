import { parseISO, differenceInCalendarDays } from "date-fns";
import type {
  RequestStatus,
  RequestType,
  TeacherRequestDTO,
} from "@/store/services/teacherRequestApi";

export const TEACHER_REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  MODALITY_CHANGE: "Thay đổi phương thức",
  RESCHEDULE: "Đổi lịch",
  REPLACEMENT: "Nhờ dạy thay",
};

// Keep colors consistent with teacher-facing page
export const TEACHER_REQUEST_TYPE_BADGES: Record<RequestType, { className: string }> = {
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

export const TEACHER_REQUEST_STATUS_META: Record<
  RequestStatus,
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

export const getRequestTopic = (request: TeacherRequestDTO): string | undefined => {
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

export const getDaysUntilSession = (
  request: TeacherRequestDTO
): number | null => {
  const sessionDate =
    request.sessionDate ||
    (typeof request.session === "object"
      ? (request.session as { date?: string })?.date
      : undefined) ||
    (request as { sessionInfo?: { date?: string } }).sessionInfo?.date;
  if (!sessionDate) return null;

  try {
    const targetDate = parseISO(sessionDate);
    return differenceInCalendarDays(targetDate, new Date());
  } catch {
    return null;
  }
};

export const getTimeDisplayMeta = (
  daysUntilSession: number | null
): { label: string; className: string } => {
  if (daysUntilSession === null) {
    return {
      label: "Không rõ",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }
  if (daysUntilSession < 0) {
    return {
      label: `Đã qua ${Math.abs(daysUntilSession)} ngày`,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }
  if (daysUntilSession === 0) {
    return {
      label: "Diễn ra hôm nay",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  if (daysUntilSession <= 2) {
    return {
      label: `Còn ${daysUntilSession} ngày`,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  return {
    label: `Còn ${daysUntilSession} ngày`,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
};

