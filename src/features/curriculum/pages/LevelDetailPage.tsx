import { useNavigate, useParams } from "react-router-dom";
import { useGetLevelQuery } from "@/store/services/curriculumApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LevelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: levelData, isLoading } = useGetLevelQuery(Number(id));

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
                    <Button onClick={() => navigate(`/curriculum/levels/${level.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
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
                                <Badge variant={level.status === "ACTIVE" ? "default" : "secondary"}>
                                    {level.status}
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
                                <h3 className="font-medium text-sm text-muted-foreground">Thời lượng dự kiến</h3>
                                <p className="text-lg">{level.durationHours} giờ</p>
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
