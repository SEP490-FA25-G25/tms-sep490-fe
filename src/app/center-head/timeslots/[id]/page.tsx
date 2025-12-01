import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Loader2,
    Clock,
    Users,
    Calendar,
    Ban,
    Power,
} from "lucide-react";
import {
    useGetTimeSlotByIdQuery,
    useGetSessionsByTimeSlotIdQuery,
    useUpdateTimeSlotStatusMutation,
} from "@/store/services/resourceApi";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function TimeSlotDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const timeSlotId = Number(id);

    const { data: timeSlot, isLoading: isTimeSlotLoading } = useGetTimeSlotByIdQuery(timeSlotId, {
        skip: !id || isNaN(timeSlotId),
    });

    const { data: sessions, isLoading: isSessionsLoading } = useGetSessionsByTimeSlotIdQuery(timeSlotId, {
        skip: !id || isNaN(timeSlotId),
    });

    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateTimeSlotStatusMutation();

    const handleToggleStatus = async () => {
        if (!timeSlot) return;

        try {
            await updateStatus({
                id: timeSlot.id,
                status: timeSlot.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            }).unwrap();
            toast.success(
                timeSlot.status === "ACTIVE"
                    ? "Đã ngưng hoạt động khung giờ"
                    : "Đã kích hoạt lại khung giờ"
            );
            setShowDeactivateDialog(false);
        } catch (error: any) {
            toast.error(error.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái");
        }
    };

    if (isTimeSlotLoading) {
        return (
            <DashboardLayout title="Chi tiết Khung giờ" description="Đang tải thông tin...">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!timeSlot) {
        return (
            <DashboardLayout title="Chi tiết Khung giờ" description="Không tìm thấy khung giờ">
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Không tìm thấy khung giờ</h3>
                    <Button onClick={() => navigate("/center-head/resources")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={timeSlot.name}
            description={`Chi nhánh: ${timeSlot.branchName}`}
            actions={
                <div className="flex gap-2">
                    <Button
                        variant={timeSlot.status === "ACTIVE" ? "destructive" : "default"}
                        onClick={() => setShowDeactivateDialog(true)}
                        disabled={isUpdatingStatus}
                    >
                        {timeSlot.status === "ACTIVE" ? (
                            <>
                                <Ban className="mr-2 h-4 w-4" />
                                Ngưng hoạt động
                            </>
                        ) : (
                            <>
                                <Power className="mr-2 h-4 w-4" />
                                Kích hoạt lại
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/center-head/resources")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </div>
            }
        >
            <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {timeSlot.status === "ACTIVE" ? "Ngưng hoạt động khung giờ?" : "Kích hoạt lại khung giờ?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {timeSlot.status === "ACTIVE"
                                ? "Khung giờ sẽ bị ẩn khỏi danh sách chọn khi tạo lớp mới. Các lớp học hiện tại đang sử dụng khung giờ này vẫn sẽ được giữ nguyên."
                                : "Khung giờ sẽ xuất hiện trở lại trong danh sách chọn khi tạo lớp mới."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            className={timeSlot.status === "ACTIVE" ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : timeSlot.status === "ACTIVE" ? (
                                "Ngưng hoạt động"
                            ) : (
                                "Kích hoạt"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Lớp đang áp dụng</p>
                                <p className="text-2xl font-bold">{timeSlot.activeClassesCount || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số buổi học</p>
                                <p className="text-2xl font-bold">{timeSlot.totalSessionsCount || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-orange-100 rounded-full">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Thời gian</p>
                                <p className="font-medium text-sm">
                                    {timeSlot.startTime.slice(0, 5)} - {timeSlot.endTime.slice(0, 5)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Thông tin chung</TabsTrigger>
                        <TabsTrigger value="schedule">Lịch sử dụng</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Thông tin cơ bản
                                    {timeSlot.status === "INACTIVE" && (
                                        <Badge variant="destructive" className="ml-2">
                                            Đã ngưng hoạt động
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Tên khung giờ</span>
                                        <p className="font-medium">{timeSlot.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Chi nhánh</span>
                                        <p className="font-medium">{timeSlot.branchName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Giờ bắt đầu</span>
                                        <p className="font-medium">{timeSlot.startTime.slice(0, 5)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Giờ kết thúc</span>
                                        <p className="font-medium">{timeSlot.endTime.slice(0, 5)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Ngày tạo</span>
                                        <p className="font-medium">{format(new Date(timeSlot.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Cập nhật lần cuối</span>
                                        <p className="font-medium">{format(new Date(timeSlot.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh sách buổi học sử dụng khung giờ này</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSessionsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : sessions && sessions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ngày</TableHead>
                                                <TableHead>Lớp học</TableHead>
                                                <TableHead>Loại</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessions.map((session) => (
                                                <TableRow key={session.id}>
                                                    <TableCell>
                                                        {format(new Date(session.date), "dd/MM/yyyy", { locale: vi })}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {session.classCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {session.type === "CLASS" ? "Lớp học" :
                                                                session.type === "EXAM" ? "Thi" :
                                                                    session.type === "CONSULTATION" ? "Tư vấn" : session.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            session.status === "PLANNED" ? "secondary" :
                                                                session.status === "ONGOING" ? "default" :
                                                                    session.status === "DONE" ? "default" :
                                                                        session.status === "CANCELLED" ? "destructive" : "outline"
                                                        }>
                                                            {session.status === "PLANNED" ? "Dự kiến" :
                                                                session.status === "ONGOING" ? "Đang diễn ra" :
                                                                    session.status === "DONE" ? "Đã hoàn thành" :
                                                                        session.status === "CANCELLED" ? "Đã hủy" : session.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Chưa có buổi học nào sử dụng khung giờ này.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout >
    );
}
