import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useGetCourseDetailsQuery } from "@/store/services/courseApi";
import { CourseWizard } from "../components/wizard/CourseWizard";

export default function EditCoursePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: courseData, isLoading } = useGetCourseDetailsQuery(Number(id));

    if (isLoading) {
        return (
            <DashboardLayout
                title="Chỉnh sửa Khóa học"
                description="Đang tải thông tin khóa học..."
            >
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const pageTitle = courseData?.data?.status === 'DRAFT' ? "Tiếp tục tạo Khóa học" : "Chỉnh sửa Khóa học";
    const pageDescription = courseData?.data?.status === 'DRAFT'
        ? "Hoàn thiện các thông tin để tạo khóa học."
        : `Cập nhật thông tin khóa học: ${courseData?.data?.name || ''}`;

    return (
        <DashboardLayout
            title={pageTitle}
            description={pageDescription}
        >
            <div className="space-y-6">
                <Button variant="outline" onClick={() => navigate("/curriculum")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>

                {courseData?.data && (
                    <CourseWizard initialData={courseData.data} isEditMode={true} />
                )}
            </div>
        </DashboardLayout>
    );
}
