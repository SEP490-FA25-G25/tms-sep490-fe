import { useParams } from "react-router-dom";
import { TeacherRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useGetRequestByIdQuery } from "@/store/services/teacherRequestApi";
import { TeacherRequestDetailContent } from "../page";
import { useNavigate } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data,
    isFetching: isLoading,
    error,
    refetch,
  } = useGetRequestByIdQuery(id ? { id: Number(id) } : skipToken, {
    skip: !id,
  });

  if (error) {
    return (
      <TeacherRoute>
        <DashboardLayout title="Chi tiết yêu cầu">
          <div className="rounded-lg border bg-card p-6 text-center text-destructive">
            <p>Không thể tải thông tin yêu cầu. Vui lòng thử lại.</p>
            <Button variant="ghost" className="mt-4" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        </DashboardLayout>
      </TeacherRoute>
    );
  }

  return (
    <TeacherRoute>
      <DashboardLayout
        title={`Yêu cầu #${id ?? ""}`}
        description="Thông tin chi tiết yêu cầu giảng dạy của bạn"
      >
        <div className="flex flex-col gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => navigate("/teacher/requests")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>

          {isLoading || !data?.data ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <TeacherRequestDetailContent request={data.data} />
          )}
        </div>
      </DashboardLayout>
    </TeacherRoute>
  );
}
