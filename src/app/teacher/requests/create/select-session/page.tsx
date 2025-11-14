import { useState } from "react";
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
import { ArrowLeft, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestType } from "@/store/services/teacherRequestApi";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

export default function SelectSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestType = searchParams.get("type") as RequestType;
  const [selectedSessionId, setSelectedSessionId] = useState<
    number | undefined
  >();

  const { data, isLoading, error } = useGetMySessionsQuery({});

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

  if (error) {
    return (
      <TeacherRoute>
        <DashboardLayout>
          <div className="text-center text-destructive">
            <p>Không thể tải danh sách sessions. Vui lòng thử lại.</p>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <h1 className="text-2xl font-semibold">Chọn session</h1>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((session) => (
                      <TableRow
                        key={session.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedSessionId === session.id
                            ? "bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <TableCell>
                          {selectedSessionId === session.id ? (
                            <Circle className="h-5 w-5 fill-primary text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(session.date)} {session.startTime} -{" "}
                              {session.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {session.className}
                        </TableCell>
                        <TableCell>{session.courseName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.topic || "-"}
                        </TableCell>
                        <TableCell>
                          {session.hasPendingRequest && (
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigate("/teacher/requests/create/select-type")
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button onClick={handleContinue} disabled={!selectedSessionId}>
                  Tiếp tục
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <p>Không có session nào trong 7 ngày tới</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
