import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";
import { useGetCourseDetailsQuery } from "@/store/services/courseApi";
import { CourseWizard } from "../components/wizard/CourseWizard";

export default function EditCoursePage() {
    const { id } = useParams();
    const { data: courseData, isLoading } = useGetCourseDetailsQuery(Number(id));

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {courseData?.data && (
                <CourseWizard initialData={courseData.data} isEditMode={true} />
            )}
        </DashboardLayout>
    );
}
