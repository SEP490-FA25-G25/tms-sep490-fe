import { SubjectList } from "@/components/curriculum/SubjectList";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function CurriculumsPage() {
    return (
        <DashboardLayout
            title="Khung chương trình"
            description="Quản lý các khung chương trình đào tạo."
        >
            <SubjectList />
        </DashboardLayout>
    );
}
