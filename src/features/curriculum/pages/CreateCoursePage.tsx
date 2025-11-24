import { CourseWizard } from "../components/wizard/CourseWizard";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function CreateCoursePage() {
    return (
        <DashboardLayout>
            <CourseWizard />
        </DashboardLayout>
    );
}
