import { useNavigate, useParams } from "react-router-dom";
import {
    useGetLevelQuery,
    useReactivateLevelMutation
} from "@/store/services/curriculumApi";
import { getStatusLabel, getStatusColor } from "@/utils/statusMapping";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";


import { useAuth } from "@/contexts/AuthContext";

export default function LevelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const { data: levelData, isLoading, refetch } = useGetLevelQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const [reactivateLevel, { isLoading: isReactivating }] = useReactivateLevelMutation();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const level = levelData?.data;

    if (!level) {
        return (
            <DashboardLayout title="Không tìm thấy cấp độ">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-muted-foreground">Cấp độ không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </div>
            </DashboardLayout>
        );
    }



    const handleReactivate = async () => {
        try {
            await reactivateLevel(Number(id)).unwrap();
            toast.success("Đã kích hoạt lại cấp độ");
            refetch();
        } catch (error) {
            console.error("Failed to reactivate level:", error);
            toast.error("Kích hoạt lại thất bại");
        }
    };

    const isActive = level.status === "ACTIVE";

    return (
        <DashboardLayout
            title={`Chi tiết cấp độ: ${level.code}`}
            description="Xem thông tin chi tiết của cấp độ."
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>

                    <div className="flex gap-2">
                        {isSubjectLeader && (
                            <>
                                {!isActive && (
                                    <Button
                                        variant="outline"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={handleReactivate}
                                        disabled={isReactivating}
                                    >
                                        {isReactivating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Kích hoạt lại
                                    </Button>
                                )}
                                <Button onClick={() => navigate(`/curriculum/levels/${level.id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Mã cấp độ</h3>
                                <p className="text-lg font-semibold">{level.code}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Tên cấp độ</h3>
                                <p className="text-lg">{level.name}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Mô tả</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{level.description || "Không có mô tả"}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Trạng thái</h3>
                                <Badge variant={getStatusColor(level.status)}>
                                    {getStatusLabel(level.status)}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin bổ sung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Môn học</h3>
                                <p className="text-lg">{level.subjectName} ({level.subjectCode})</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Thứ tự sắp xếp</h3>
                                <p className="text-lg">{level.sortOrder}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
