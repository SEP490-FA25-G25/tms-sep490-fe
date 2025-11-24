import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft } from "lucide-react";

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <DashboardLayout
            title="Chi tiết Khóa học"
            description={`Xem thông tin chi tiết khóa học #${id}`}
        >
            <div className="space-y-6">
                <Button variant="outline" onClick={() => navigate("/curriculum")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>

                <div className="p-4 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
