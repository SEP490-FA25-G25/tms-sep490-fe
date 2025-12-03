import { useParams, useNavigate } from "react-router-dom";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Clock, BookOpen } from "lucide-react";
import {
  useGetSessionStudentsQuery,
  useGetTodaySessionsQuery,
  useGetSessionReportQuery,
  useSubmitAttendanceMutation,
  useSubmitReportMutation,
} from "@/store/services/attendanceApi";
import { format, parseISO, addHours, isAfter } from "date-fns";
import { vi } from "date-fns/locale";
import { useState, useEffect, useRef, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to check if attendance can be edited
// Returns true if session has already occurred and it's within 2 calendar days from session date
// Works regardless of session status
// Note: This should match backend logic in AttendanceServiceImpl.canEditAttendance()
const canEditAttendance = (sessionDate: string, endTime?: string): boolean => {
  if (!endTime) {
    // If no end time, check if session date has passed
    try {
      const sessionDateOnly = parseISO(sessionDate);
      const now = new Date();
      const sessionEndOfDay = new Date(sessionDateOnly);
      sessionEndOfDay.setHours(23, 59, 59, 999);

      // Session must have taken place (date already passed)
      if (isAfter(sessionEndOfDay, now)) {
        return false;
      }

      // Allow editing until end of the second day after the session date
      const deadline = new Date(sessionEndOfDay);
      deadline.setDate(deadline.getDate() + 2);
      return !isAfter(now, deadline);
    } catch {
      return false;
    }
  }

  try {
    // Parse session date and end time
    // Backend uses LocalDateTime (server timezone), so we need to parse as local time
    // Format: "YYYY-MM-DD" + "HH:mm:ss" or "HH:mm"
    const endTimeFormatted = endTime.length === 5 ? `${endTime}:00` : endTime; // Ensure HH:mm:ss format
    const sessionEndDateTimeStr = `${sessionDate}T${endTimeFormatted}`;

    // Parse as local datetime (not UTC) to match backend LocalDateTime behavior
    const [datePart, timePart] = sessionEndDateTimeStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second = 0] = timePart.split(":").map(Number);

    const sessionEndDateTime = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    );
    const now = new Date();

    // Check if session has ended (not a future session)
    if (isAfter(sessionEndDateTime, now)) {
      return false;
    }

    // Allow editing until end of the second day after the session date
    const deadline = new Date(sessionEndDateTime);
    deadline.setDate(deadline.getDate() + 2);
    deadline.setHours(23, 59, 59, 999);
    return !isAfter(now, deadline);
  } catch {
    // If parsing fails, don't allow editing
    return false;
  }
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
  if (
    errorMessage.includes("SESSION_ALREADY_DONE") ||
    errorMessage.includes("1295") ||
    errorMessage.includes("đã hoàn thành") ||
    errorMessage.includes("đã kết thúc")
  ) {
    return "Bạn chỉ có thể chỉnh sửa điểm danh trong vòng 2 ngày kể từ khi buổi học kết thúc.";
  }

  if (errorMessage.includes("ATTENDANCE_RECORDS_EMPTY")) {
    return "Vui lòng chọn trạng thái điểm danh cho ít nhất một học sinh";
  }

  if (errorMessage.includes("HOMEWORK_STATUS_INVALID")) {
    return "Trạng thái bài tập về nhà không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (
    errorMessage.includes("Internal Server Error") ||
    errorMessage.includes("500")
  ) {
    return "Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên nếu vấn đề vẫn tiếp tục.";
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

type SessionInfo = {
  sessionId: number;
  classId: number;
  classCode?: string;
  courseCode?: string;
  courseName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  timeSlotName?: string;
  topic?: string;
  teacherName?: string;
  teacherNote?: string | null;
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  resourceName?: string;
  modality?: string;
};

export default function AttendanceDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const parsedSessionId = Number(sessionId);
  const sessionIdNum = Number.isFinite(parsedSessionId) ? parsedSessionId : 0;
  const isSessionIdValid = sessionIdNum > 0;
  const { user } = useAuth();

  const {
    data: studentsResponse,
    isFetching: isLoadingStudents,
    error: studentsError,
    refetch: refetchStudents,
  } = useGetSessionStudentsQuery(sessionIdNum, {
    skip: !isSessionIdValid,
    refetchOnMountOrArgChange: true,
  });

  const [submitAttendance, { isLoading: isSubmitting }] =
    useSubmitAttendanceMutation();
  const [submitReport, { isLoading: isSubmittingReport }] =
    useSubmitReportMutation();

  const { data: sessionsResponse, isFetching: isLoadingSession } =
    useGetTodaySessionsQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  // Use session info from studentsResponse if available, otherwise from sessionsResponse
  const sessionDetail = studentsResponse?.data;
  const fallbackSession = sessionsResponse?.data?.find(
    (s) => s.sessionId === sessionIdNum
  );
  const fallbackTimeSlotName =
    fallbackSession && "timeSlotName" in fallbackSession
      ? (fallbackSession as { timeSlotName?: string }).timeSlotName
      : undefined;

  const session: SessionInfo | null = useMemo(() => {
    const normalizeStart = (source?: unknown) => {
      if (!source) return undefined;
      const data = source as Record<string, unknown>;
      return (
        (data.sessionStartTime as string | undefined) ??
        (data.startTime as string | undefined) ??
        (data.session as { startTime?: string })?.startTime ??
        (data.timeSlot as { startTime?: string })?.startTime ??
        (data.timeSlotTemplate as { startTime?: string })?.startTime
      );
    };

    const normalizeEnd = (source?: unknown) => {
      if (!source) return undefined;
      const data = source as Record<string, unknown>;
      return (
        (data.sessionEndTime as string | undefined) ??
        (data.endTime as string | undefined) ??
        (data.session as { endTime?: string })?.endTime ??
        (data.timeSlot as { endTime?: string })?.endTime ??
        (data.timeSlotTemplate as { endTime?: string })?.endTime
      );
    };

    const mergedStart =
      normalizeStart(sessionDetail) ?? normalizeStart(fallbackSession);
    const mergedEnd =
      normalizeEnd(sessionDetail) ?? normalizeEnd(fallbackSession);

    if (sessionDetail) {
      return {
        sessionId: sessionDetail.sessionId,
        classId: sessionDetail.classId,
        classCode: sessionDetail.classCode,
        courseCode: sessionDetail.courseCode,
        courseName: sessionDetail.courseName,
        date: sessionDetail.date,
        startTime: mergedStart,
        endTime: mergedEnd,
        timeSlotName: sessionDetail.timeSlotName,
        topic: sessionDetail.sessionTopic,
        teacherName: sessionDetail.teacherName,
        teacherNote: sessionDetail.teacherNote,
        totalStudents: sessionDetail.summary.totalStudents,
        presentCount: sessionDetail.summary.presentCount,
        absentCount: sessionDetail.summary.absentCount,
      };
    }
    if (fallbackSession) {
      return {
        sessionId: fallbackSession.sessionId,
        classId: fallbackSession.classId,
        classCode: fallbackSession.classCode,
        courseCode: fallbackSession.courseCode,
        courseName: fallbackSession.courseName,
        date: fallbackSession.date,
        startTime: mergedStart,
        endTime: mergedEnd,
        timeSlotName: fallbackTimeSlotName,
        topic: fallbackSession.topic,
        totalStudents: fallbackSession.totalStudents,
        presentCount: fallbackSession.presentCount,
        absentCount: fallbackSession.absentCount,
        resourceName: fallbackSession.resourceName,
        modality: fallbackSession.modality,
      };
    }
    return null;
  }, [sessionDetail, fallbackSession, fallbackTimeSlotName]);

  // Extract students from response - data.students is the array
  const students = useMemo(
    () => studentsResponse?.data?.students ?? [],
    [studentsResponse?.data?.students]
  );
  const [attendanceStatus, setAttendanceStatus] = useState<
    Record<number, "PRESENT" | "ABSENT">
  >({});
  const [homeworkStatus, setHomeworkStatus] = useState<
    Record<number, "COMPLETED" | "INCOMPLETE">
  >({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const isInitialized = useRef(false);

  const sessionHasHomeworkFlag = (
    studentsResponse?.data as { hasHomework?: boolean } | undefined
  )?.hasHomework;

  const hasHomework = useMemo(() => {
    if (typeof sessionHasHomeworkFlag === "boolean") {
      return sessionHasHomeworkFlag;
    }
    return students.some(
      (student) =>
        typeof student.homeworkStatus === "string" &&
        student.homeworkStatus.trim().length > 0
    );
  }, [sessionHasHomeworkFlag, students]);

  // Check if attendance can be edited (session has ended and within 48 hours from end)
  const isEditable = useMemo(() => {
    if (!session) return false;
    return canEditAttendance(session.date, session.endTime);
  }, [session]);

  // Report dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { data: reportResponse, isLoading: isLoadingReport } =
    useGetSessionReportQuery(sessionIdNum, {
      skip: !isSessionIdValid || !isReportDialogOpen,
      refetchOnMountOrArgChange: true,
    });

  const reportData = reportResponse?.data;
  const [teacherNote, setTeacherNote] = useState(reportData?.teacherNote || "");

  // Update teacherNote when reportData changes
  useEffect(() => {
    if (reportData?.teacherNote !== undefined) {
      setTeacherNote(reportData.teacherNote || "");
    }
  }, [reportData?.teacherNote]);

  // Initialize attendance status when students data is loaded
  // Only initialize if state is empty (first load), don't reset on refetch
  useEffect(() => {
    if (students.length > 0 && !isInitialized.current) {
      const initialAttendance: Record<number, "PRESENT" | "ABSENT"> = {};
      const initialHomework: Record<number, "COMPLETED" | "INCOMPLETE"> = {};
      const initialNotes: Record<number, string> = {};

      students.forEach((student) => {
        // Initialize attendance
        if (student.attendanceStatus) {
          initialAttendance[student.studentId] =
            student.attendanceStatus === "LATE" ||
            student.attendanceStatus === "PRESENT"
              ? "PRESENT"
              : "ABSENT";
        } else {
          initialAttendance[student.studentId] = "ABSENT";
        }

        // Initialize homework status (only if session có bài tập)
        if (hasHomework) {
          if (student.homeworkStatus) {
            if (
              student.homeworkStatus === "COMPLETED" ||
              student.homeworkStatus === "DONE"
            ) {
              initialHomework[student.studentId] = "COMPLETED";
            } else {
              initialHomework[student.studentId] = "INCOMPLETE";
            }
          } else {
            initialHomework[student.studentId] = "INCOMPLETE";
          }
        }

        // Initialize notes
        if (student.note) {
          initialNotes[student.studentId] = student.note;
        }
      });

      setAttendanceStatus(initialAttendance);
      setHomeworkStatus(initialHomework);
      setNotes(initialNotes);
      isInitialized.current = true;
    }
  }, [students, hasHomework]);

  const presentCount = Object.values(attendanceStatus).filter(
    (status) => status === "PRESENT"
  ).length;

  const handleStatusChange = (
    studentId: number,
    status: "PRESENT" | "ABSENT"
  ) => {
    setAttendanceStatus((prev) => {
      const newStatus = { ...prev };
      newStatus[studentId] = status;
      return newStatus;
    });
  };

  const handleHomeworkStatusChange = (
    studentId: number,
    status: "COMPLETED" | "INCOMPLETE"
  ) => {
    setHomeworkStatus((prev) => {
      const newStatus = { ...prev };
      newStatus[studentId] = status;
      return newStatus;
    });
  };

  const handleNoteChange = (studentId: number, note: string) => {
    setNotes((prev) => {
      const newNotes = { ...prev };
      newNotes[studentId] = note;
      return newNotes;
    });
  };

  const handleMarkAllPresent = () => {
    const newStatus: Record<number, "PRESENT" | "ABSENT"> = {};
    students.forEach((student) => {
      newStatus[student.studentId] = "PRESENT";
    });
    setAttendanceStatus(newStatus);
  };

  const handleMarkAllAbsent = () => {
    const newStatus: Record<number, "PRESENT" | "ABSENT"> = {};
    students.forEach((student) => {
      newStatus[student.studentId] = "ABSENT";
    });
    setAttendanceStatus(newStatus);
  };

  const handleSubmit = async () => {
    if (!sessionIdNum || students.length === 0) {
      toast.error("Không có dữ liệu để lưu");
      return;
    }

    try {
      const attendanceRecords = students
        .map((student) => {
          const currentStatus = attendanceStatus[student.studentId];

          // Only create record if attendance status is set
          if (!currentStatus) {
            return null;
          }

          const record: {
            studentId: number;
            attendanceStatus: "PRESENT" | "ABSENT";
            homeworkStatus?: "COMPLETED" | "INCOMPLETE";
            note?: string;
          } = {
            studentId: student.studentId,
            attendanceStatus: currentStatus,
          };

          // Only include homeworkStatus if homework exists and status is set
          if (hasHomework && homeworkStatus[student.studentId]) {
            record.homeworkStatus = homeworkStatus[student.studentId];
          }

          // Only include note if it's not empty
          if (notes[student.studentId]?.trim()) {
            record.note = notes[student.studentId].trim();
          }

          return record;
        })
        .filter(
          (record): record is NonNullable<typeof record> => record !== null
        );

      if (attendanceRecords.length === 0) {
        toast.error(
          "Vui lòng chọn trạng thái điểm danh cho ít nhất một học sinh"
        );
        return;
      }

      await submitAttendance({
        sessionId: sessionIdNum,
        attendanceRecords,
      }).unwrap();

      // Refetch data to get updated attendance status
      const refetchResult = await refetchStudents();

      // Update local state with the latest data from server after successful save
      if (refetchResult.data?.data?.students) {
        const updatedStudents = refetchResult.data.data.students;
        const updatedAttendance: Record<number, "PRESENT" | "ABSENT"> = {};
        const updatedHomework: Record<number, "COMPLETED" | "INCOMPLETE"> = {};
        const updatedNotes: Record<number, string> = {};

        const refetchHasHomeworkFlag =
          (
            refetchResult.data.data as {
              hasHomework?: boolean;
            }
          )?.hasHomework ?? hasHomework;

        updatedStudents.forEach((student) => {
          // Update attendance status
          if (student.attendanceStatus) {
            updatedAttendance[student.studentId] =
              student.attendanceStatus === "LATE" ||
              student.attendanceStatus === "PRESENT"
                ? "PRESENT"
                : "ABSENT";
          }

          // Update homework status
          if (refetchHasHomeworkFlag) {
            if (student.homeworkStatus) {
              if (
                student.homeworkStatus === "COMPLETED" ||
                student.homeworkStatus === "DONE"
              ) {
                updatedHomework[student.studentId] = "COMPLETED";
              } else {
                updatedHomework[student.studentId] = "INCOMPLETE";
              }
            } else {
              updatedHomework[student.studentId] = "INCOMPLETE";
            }
          }

          // Update notes
          if (student.note) {
            updatedNotes[student.studentId] = student.note;
          }
        });

        setAttendanceStatus(updatedAttendance);
        setHomeworkStatus(updatedHomework);
        setNotes(updatedNotes);
      }

      toast.success("Đã lưu điểm danh thành công");
    } catch (error: unknown) {
      const apiError = error as {
        data?: { message?: string; error?: string };
        status?: number;
      };
      const errorMessage =
        apiError?.data?.message ||
        apiError?.data?.error ||
        "Có lỗi xảy ra khi lưu điểm danh";
      toast.error(
        formatBackendError(errorMessage, "Có lỗi xảy ra khi lưu điểm danh")
      );
    }
  };

  if (!isSessionIdValid) {
    return (
      <TeacherRoute>
        <DashboardLayout title="Điểm danh">
          <div className="rounded-lg border bg-card p-6 text-center text-destructive">
            <p>Session ID không hợp lệ.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate("/teacher/attendance")}
            >
              Quay lại
            </Button>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  if (studentsError) {
    return (
      <TeacherRoute>
        <DashboardLayout title="Điểm danh">
          <div className="rounded-lg border bg-card p-6 text-center text-destructive">
            <p>Không thể tải danh sách học sinh. Vui lòng thử lại.</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate("/teacher/attendance")}
            >
              Quay lại
            </Button>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <DashboardLayout title="Điểm danh" description="Điểm danh cho buổi học">
        <div className="space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => navigate("/teacher/attendance")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>

          {/* Session info */}
          {isLoadingSession ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : session ? (
            <div className="rounded-lg border p-5">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {session.courseName}
                  </h3>
                </div>

                {session.topic && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{session.topic}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  {session.timeSlotName && <span>{session.timeSlotName}</span>}
                  {session.timeSlotName && <span className="mx-1">·</span>}
                  <span>
                    {format(parseISO(session.date), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                </div>

                {(session.resourceName || session.modality) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {session.resourceName && (
                      <span>Phòng/phương tiện: {session.resourceName}</span>
                    )}
                    {session.modality && (
                      <span className="capitalize">
                        {session.modality.toLowerCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Attendance Table */}
          {isLoadingStudents ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Không có học sinh nào trong buổi học này.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Warning message if editing is not allowed */}
              {!isEditable && session && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    {(() => {
                      try {
                        if (!session.endTime) {
                          return "Buổi học chưa kết thúc hoặc không có thông tin thời gian kết thúc.";
                        }
                        const sessionDateTime = parseISO(
                          `${session.date}T${session.endTime}`
                        );
                        const now = new Date();
                        if (isAfter(sessionDateTime, now)) {
                          return "Buổi học chưa kết thúc. Bạn chỉ có thể chỉnh sửa điểm danh sau khi buổi học kết thúc và trong vòng 48 giờ.";
                        }
                        const deadline = addHours(sessionDateTime, 48);
                        if (isAfter(now, deadline)) {
                          return "Đã quá 48 giờ kể từ khi buổi học kết thúc. Không thể chỉnh sửa điểm danh.";
                        }
                        return "Không thể chỉnh sửa điểm danh.";
                      } catch {
                        return "Không thể chỉnh sửa điểm danh.";
                      }
                    })()}
                  </p>
                </div>
              )}
              {/* Quick action buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  disabled={!isEditable}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  Tất cả có mặt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAbsent}
                  disabled={!isEditable}
                  className="text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  Tất cả vắng mặt
                </Button>
              </div>

              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground border-r">
                          Học viên
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground border-r">
                          Điểm danh
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground border-r">
                          Bài tập về nhà
                        </th>
                        <th className="text-center p-4 font-semibold text-foreground">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr
                          key={student.studentId}
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Cột 1: Tên học viên */}
                          <td className="p-4 border-r">
                            <div>
                              <p className="font-medium text-foreground">
                                {student.fullName}
                              </p>
                              {student.studentCode && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {student.studentCode}
                                </p>
                              )}
                              {student.email && (
                                <p className="text-sm text-muted-foreground">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Cột 2: Điểm danh */}
                          <td className="p-4 border-r">
                            <div className="flex items-center justify-center gap-3">
                              <div
                                role="button"
                                tabIndex={isEditable ? 0 : -1}
                                onClick={
                                  isEditable
                                    ? () =>
                                        handleStatusChange(
                                          student.studentId,
                                          "PRESENT"
                                        )
                                    : undefined
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                  !isEditable
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                } ${
                                  attendanceStatus[student.studentId] ===
                                  "PRESENT"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                }`}
                              >
                                <Checkbox
                                  checked={
                                    attendanceStatus[student.studentId] ===
                                    "PRESENT"
                                  }
                                  onCheckedChange={() => {}}
                                  className="pointer-events-none"
                                  disabled={!isEditable}
                                />
                                <span>Có mặt</span>
                              </div>
                              <div
                                role="button"
                                tabIndex={isEditable ? 0 : -1}
                                onClick={
                                  isEditable
                                    ? () =>
                                        handleStatusChange(
                                          student.studentId,
                                          "ABSENT"
                                        )
                                    : undefined
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                  !isEditable
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                } ${
                                  attendanceStatus[student.studentId] ===
                                  "ABSENT"
                                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                }`}
                              >
                                <Checkbox
                                  checked={
                                    attendanceStatus[student.studentId] ===
                                    "ABSENT"
                                  }
                                  onCheckedChange={() => {}}
                                  className="pointer-events-none"
                                  disabled={!isEditable}
                                />
                                <span>Vắng</span>
                              </div>
                            </div>
                          </td>

                          {/* Cột 3: Bài tập về nhà */}
                          <td className="p-4 border-r">
                            <div className="flex justify-center">
                              {hasHomework ? (
                                <div className="flex items-center justify-center gap-3">
                                  <div
                                    role="button"
                                    tabIndex={isEditable ? 0 : -1}
                                    onClick={
                                      isEditable
                                        ? () =>
                                            handleHomeworkStatusChange(
                                              student.studentId,
                                              "COMPLETED"
                                            )
                                        : undefined
                                    }
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                      !isEditable
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                    } ${
                                      homeworkStatus[student.studentId] ===
                                      "COMPLETED"
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                        : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={
                                        homeworkStatus[student.studentId] ===
                                        "COMPLETED"
                                      }
                                      onCheckedChange={() => {}}
                                      className="pointer-events-none"
                                      disabled={!isEditable}
                                    />
                                    <span>Đã làm</span>
                                  </div>
                                  <div
                                    role="button"
                                    tabIndex={isEditable ? 0 : -1}
                                    onClick={
                                      isEditable
                                        ? () =>
                                            handleHomeworkStatusChange(
                                              student.studentId,
                                              "INCOMPLETE"
                                            )
                                        : undefined
                                    }
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                      !isEditable
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                    } ${
                                      homeworkStatus[student.studentId] ===
                                      "INCOMPLETE"
                                        ? "bg-rose-100 text-rose-700 border border-rose-300"
                                        : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={
                                        homeworkStatus[student.studentId] ===
                                        "INCOMPLETE"
                                      }
                                      onCheckedChange={() => {}}
                                      className="pointer-events-none"
                                      disabled={!isEditable}
                                    />
                                    <span>Chưa làm</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Không có bài tập về nhà
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Cột 4: Ghi chú */}
                          <td className="p-4">
                            <div className="flex justify-center">
                              <Textarea
                                placeholder="Nhập ghi chú (nếu cần)..."
                                value={notes[student.studentId] || ""}
                                onChange={(e) =>
                                  handleNoteChange(
                                    student.studentId,
                                    e.target.value
                                  )
                                }
                                disabled={!isEditable}
                                className="min-h-16 w-full max-w-[300px]"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Summary and Submit */}
          {students.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tổng kết</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Users className="mr-1 inline h-4 w-4" />
                      Có mặt: {presentCount}/{students.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsReportDialogOpen(true)}
                    disabled={!isEditable}
                  >
                    Nộp báo cáo
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isEditable}
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu điểm danh"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nộp báo cáo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isLoadingReport ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {/* Read-only fields */}
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Giáo viên
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.teacherName || user?.fullName || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Tên khóa học
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.courseName || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Ngày học
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.date
                            ? format(parseISO(reportData.date), "dd/MM/yyyy", {
                                locale: vi,
                              })
                            : "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Chủ đề buổi học
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.sessionTopic || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Thời gian bắt đầu
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.sessionStartTime
                            ? reportData.sessionStartTime.substring(0, 5)
                            : reportData?.timeSlotName || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Thời gian kết thúc
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.sessionEndTime
                            ? reportData.sessionEndTime.substring(0, 5)
                            : "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Số học viên
                        </Label>
                        <p className="text-sm font-medium">
                          {reportData?.summary?.presentCount !== undefined &&
                          reportData?.summary?.totalStudents !== undefined
                            ? `${reportData.summary.presentCount}/${reportData.summary.totalStudents} học viên`
                            : reportData?.summary?.totalStudents
                            ? `${reportData.summary.totalStudents} học viên`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teacher note input */}
                  <div className="space-y-2">
                    <Label htmlFor="teacher-note">Ghi chú</Label>
                    <Textarea
                      id="teacher-note"
                      placeholder="Nhập ghi chú..."
                      value={teacherNote}
                      onChange={(e) => setTeacherNote(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReportDialogOpen(false);
                        setTeacherNote("");
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!teacherNote.trim()) {
                          toast.error("Vui lòng nhập ghi chú");
                          return;
                        }

                        try {
                          await submitReport({
                            sessionId: sessionIdNum,
                            teacherNote: teacherNote.trim(),
                          }).unwrap();

                          toast.success("Nộp báo cáo thành công");
                          setIsReportDialogOpen(false);
                          setTeacherNote("");
                          // Refetch data to update session status
                          refetchStudents();
                        } catch (error: unknown) {
                          const apiError = error as {
                            data?: { message?: string; error?: string };
                          };
                          const errorMessage =
                            apiError?.data?.message ||
                            apiError?.data?.error ||
                            "Có lỗi xảy ra khi nộp báo cáo";
                          toast.error(
                            formatBackendError(
                              errorMessage,
                              "Có lỗi xảy ra khi nộp báo cáo"
                            )
                          );
                        }
                      }}
                      disabled={isSubmittingReport || !teacherNote.trim()}
                    >
                      {isSubmittingReport ? "Đang nộp..." : "Nộp báo cáo"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </TeacherRoute>
  );
}
