import { LevelList } from "@/components/curriculum/LevelList";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function LevelsPage() {
    return (
        <DashboardLayout
            title="Cấp độ"
            description="Quản lý các cấp độ trong khung chương trình."
        >
            <LevelList />
        </DashboardLayout>
    );
}
