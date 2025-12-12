import { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetClassByIdQuery, classApi } from "@/store/services/classApi";
import {
  useValidateClassMutation,
  useGetClassSessionsQuery,
  useSubmitClassMutation,
} from "@/store/services/classCreationApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ValidationChecks } from "@/types/classCreation";
import {
  AlertCircle,
  Clock,
  MapPin,
  Send,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAY_SHORT_LABELS: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
};

const formatScheduleDays = (days?: number[], fallback?: string): string => {
  if (days && days.length > 0) {
    const normalized = Array.from(new Set(days))
      .map((day) => {
        if (typeof day !== "number" || Number.isNaN(day)) return undefined;
        return ((day % 7) + 7) % 7;
      })
      .filter((day): day is number => typeof day === "number")
      .sort((a, b) => a - b);

    if (normalized.length > 0) {
      return normalized
        .map((day) => DAY_SHORT_LABELS[day] ?? `Thứ ${day}`)
        .join(" / ");
    }
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }

  return "--";
};

interface Step6ValidationProps {
  classId: number | null;
  onFinish?: () => void;
}

export function Step6Validation({ classId, onFinish }: Step6ValidationProps) {
  const dispatch = useDispatch();
  const { data: classDetail, isLoading: isClassLoading } = useGetClassByIdQuery(
    classId ?? 0,
    { skip: !classId }
  );
  const [validateClass] = useValidateClassMutation();
  const [submitClass, { isLoading: isSubmitting }] = useSubmitClassMutation();
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    canSubmit: boolean;
    message: string;
    errors: string[];
    checks: ValidationChecks;
  } | null>(null);

  const { data: sessionsData, isLoading: isSessionsLoading } =
    useGetClassSessionsQuery(classId ?? 0, { skip: !classId });

  const classOverview = classDetail?.data;
  const overview = sessionsData?.data;

  // Auto-validate on mount
  useEffect(() => {
    if (classId && !validationResult) {
      handleValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const handleValidate = async () => {
    if (!classId) return;
    try {
      const response = await validateClass(classId).unwrap();
      if (response.data) {
        setValidationResult({
          valid: response.data.valid ?? false,
          canSubmit: response.data.canSubmit ?? false,
          message: response.data.message ?? "",
          errors: response.data.errors ?? [],
          checks: response.data.checks ?? {
            totalSessions: 0,
            sessionsWithTimeSlots: 0,
            sessionsWithResources: 0,
            sessionsWithoutTimeSlots: 0,
            sessionsWithoutResources: 0,
            completionPercentage: 0,
            allSessionsHaveTimeSlots: false,
            allSessionsHaveResources: false,
          },
        });
      }
    } catch {
      toast.error("Không thể kiểm tra lớp học.");
    }
  };

  const handleSubmit = async () => {
    if (!classId) return;
    try {
      const response = await submitClass(classId).unwrap();
      toast.success(response.message || "Lớp đã được gửi duyệt.");
      dispatch(classApi.util.invalidateTags(["Classes"]));
      onFinish?.();
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Không thể gửi duyệt. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const defaultTotal =
    overview?.totalSessions ?? classDetail?.data?.upcomingSessions?.length ?? 0;
  const checks: ValidationChecks = validationResult?.checks || {
    totalSessions: defaultTotal,
    sessionsWithTimeSlots: 0,
    sessionsWithResources: 0,
    sessionsWithTeachers: 0,
    sessionsWithoutTimeSlots: defaultTotal,
    sessionsWithoutResources: defaultTotal,
    sessionsWithoutTeachers: defaultTotal,
    completionPercentage: 0,
    allSessionsHaveTimeSlots: false,
    allSessionsHaveResources: false,
    allSessionsHaveTeachers: false,
  };

  const canSubmit = Boolean(
    validationResult?.canSubmit && validationResult.valid
  );



  // Class info for display
  const classInfo = useMemo(() => {
    if (!classOverview) return [];
    return [
      { label: "Mã lớp", value: classOverview.code },
      { label: "Môn học", value: classOverview.subject?.name },
      { label: "Chi nhánh", value: classOverview.branch?.name },
      { label: "Ngày bắt đầu", value: classOverview.startDate },
      { label: "Ngày kết thúc", value: classOverview.plannedEndDate },
      {
        label: "Ngày học",
        value: formatScheduleDays(
          classOverview.scheduleDays,
          classOverview.scheduleSummary
        ),
      },
    ];
  }, [classOverview]);

  // Sessions grouped by week
  const weekGroups = useMemo(() => {
    const sessions = overview?.sessions || [];
    const grouped: Record<
      number,
      { weekNumber: number; weekRange: string; sessions: typeof sessions }
    > = {};

    sessions.forEach((session) => {
      const week = session.weekNumber || 1;
      if (!grouped[week]) {
        grouped[week] = {
          weekNumber: week,
          weekRange: session.weekRange || "",
          sessions: [],
        };
      }
      grouped[week].sessions.push(session);
    });

    return Object.values(grouped).sort((a, b) => a.weekNumber - b.weekNumber);
  }, [overview?.sessions]);

  // Helpers
  const readDisplayText = useCallback((value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return undefined;
  }, []);

  const collectStringsFromObject = useCallback(
    (value: unknown, keys: string[]) => {
      if (!value || typeof value !== "object") return undefined;
      for (const key of keys) {
        const result = readDisplayText((value as Record<string, unknown>)[key]);
        if (result) return result;
      }
      return undefined;
    },
    [readDisplayText]
  );

  const getTimeSlotLabel = (session: Record<string, unknown>) => {
    const name = collectStringsFromObject(session, [
      "timeSlotName",
      "timeSlotTemplateName",
    ]);
    if (name) return name;
    const startTime = readDisplayText(session.startTime);
    const endTime = readDisplayText(session.endTime);
    return startTime && endTime ? `${startTime} - ${endTime}` : null;
  };

  const getResourceLabel = (session: Record<string, unknown>) => {
    const name = collectStringsFromObject(session, [
      "resourceName",
      "roomName",
      "resourceDisplayName",
    ]);
    return name || null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const dayName = dayNames[date.getDay()];
      return `${dayName}, ${date.toLocaleDateString("vi-VN")}`;
    } catch {
      return dateString;
    }
  };

  const hasTimeSlot = (session: Record<string, unknown>) => {
    return Boolean(session.hasTimeSlot || session.timeSlotName || session.timeSlotTemplateId);
  };

  const hasResource = (session: Record<string, unknown>) => {
    return Boolean(session.hasResource || session.resourceId || session.resourceName);
  };

  if (!classId) {
    return (
      <div className="max-w-6xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vui lòng hoàn thành các bước trước.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSessionsLoading || isClassLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Section: Class Info + Submit Button */}
      <div className="flex items-start justify-between gap-4">
        {/* Class Info - Compact Inline */}
        <div className="flex-1 grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
          {classInfo.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-medium truncate">{item.value || "--"}</p>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="shrink-0"
        >
          {isSubmitting ? (
            "Đang gửi..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Gửi duyệt
            </>
          )}
        </Button>
      </div>

      {/* Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 text-sm">
              {validationResult.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions List - Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Chi tiết buổi học ({checks.totalSessions} buổi)
            </CardTitle>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {checks.sessionsWithTimeSlots} có giờ
              </Badge>
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {checks.sessionsWithResources} có phòng
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {weekGroups.map((week) => (
                <div key={week.weekNumber} className="rounded-lg border overflow-hidden">
                  {/* Week Header */}
                  <div className="px-4 py-2.5 bg-muted flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        Tuần {week.weekNumber}
                      </Badge>
                      {week.weekRange && (
                        <span className="text-xs text-muted-foreground">
                          {week.weekRange}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {week.sessions.length} buổi
                    </span>
                  </div>

                  {/* Sessions */}
                  <div className="divide-y">
                    {week.sessions.map((session) => {
                      const sessionObj = session as unknown as Record<string, unknown>;
                      const timeSlot = getTimeSlotLabel(sessionObj);
                      const resource = getResourceLabel(sessionObj);
                      const hasTS = hasTimeSlot(sessionObj);
                      const hasRes = hasResource(sessionObj);
                      const isComplete = hasTS && hasRes;

                      return (
                        <div
                          key={session?.sessionId}
                          className={cn(
                            "px-4 py-2.5 flex items-center gap-4 text-sm hover:bg-muted/50 transition-colors",
                            !isComplete && "bg-amber-50/50"
                          )}
                        >
                          {/* Sequence */}
                          <span className="w-8 text-center font-mono text-xs text-muted-foreground">
                            #{session?.sequenceNumber}
                          </span>

                          {/* Date */}
                          <span className="w-32 font-medium">
                            {formatDate(session?.date || "")}
                          </span>

                          {/* Time Slot */}
                          <div className="flex-1 flex items-center gap-1.5">
                            <Clock className={cn(
                              "h-3.5 w-3.5",
                              hasTS ? "text-green-600" : "text-amber-500"
                            )} />
                            <span className={cn(
                              "text-sm",
                              !hasTS && "text-amber-600 font-medium"
                            )}>
                              {timeSlot || "Chưa gán giờ"}
                            </span>
                          </div>

                          {/* Resource */}
                          <div className="flex-1 flex items-center gap-1.5">
                            <MapPin className={cn(
                              "h-3.5 w-3.5",
                              hasRes ? "text-green-600" : "text-amber-500"
                            )} />
                            <span className={cn(
                              "text-sm",
                              !hasRes && "text-amber-600 font-medium"
                            )}>
                              {resource || "Chưa gán phòng"}
                            </span>
                          </div>

                          {/* Action - for future reassign */}
                          {!isComplete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled
                            >
                              Gán lại
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Alias for Step5 (after removing AssignTeacher step)
export { Step6Validation as Step5Validation };
