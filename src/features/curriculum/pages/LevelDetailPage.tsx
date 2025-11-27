import { useNavigate, useParams } from "react-router-dom";
import {
    useGetLevelQuery,
    useDeactivateLevelMutation,
    useReactivateLevelMutation
} from "@/store/services/curriculumApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2, Ban, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/contexts/AuthContext";

export default function LevelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes("SUBJECT_LEADER");
    const { data: levelData, isLoading, refetch } = useGetLevelQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const [deactivateLevel, { isLoading: isDeactivating }] = useDeactivateLevelMutation();
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

    const handleDeactivate = async () => {
        try {
            await deactivateLevel(Number(id)).unwrap();
            toast.success("Đã ngừng hoạt động cấp độ");
            refetch();
        } catch (error) {
            console.error("Failed to deactivate level:", error);
            toast.error("Ngừng hoạt động thất bại");
        }
    };

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
                                {isActive ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeactivating}>
                                                {isDeactivating ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Ban className="mr-2 h-4 w-4" />
                                                )}
                                                Ngừng hoạt động
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Xác nhận ngừng hoạt động</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bạn có chắc chắn muốn ngừng hoạt động cấp độ này?
                                                    Cấp độ sẽ không thể được sử dụng trong các khóa học mới.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Ngừng hoạt động
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
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
                                <Badge variant={isActive ? "default" : "secondary"}>
                                    {level.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
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
