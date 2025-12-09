import { CourseList } from "@/components/curriculum/CourseList";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function SubjectsPage() {
    return (
        <DashboardLayout
            title="Môn học"
            description="Quản lý các môn học trong chương trình đào tạo."
        >
            <CourseList />
        </DashboardLayout>
    );
}
