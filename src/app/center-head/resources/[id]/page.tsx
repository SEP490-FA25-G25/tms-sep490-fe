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
    Copy,
    Check,
    MapPin,
    Monitor,
    Users,
    Calendar,
    Clock,
    Ban,
    Power,
} from "lucide-react";
import {
    useGetResourceByIdQuery,
    useGetSessionsByResourceIdQuery,
    useUpdateResourceStatusMutation,
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

export default function ResourceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const resourceId = Number(id);

    const { data: resource, isLoading: isResourceLoading } = useGetResourceByIdQuery(resourceId, {
        skip: !id || isNaN(resourceId),
    });

    const { data: sessions, isLoading: isSessionsLoading } = useGetSessionsByResourceIdQuery(resourceId, {
        skip: !id || isNaN(resourceId),
    });

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateResourceStatusMutation();

    const handleToggleStatus = async () => {
        if (!resource) return;

        try {
            await updateStatus({
                id: resource.id,
                status: resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            }).unwrap();
            toast.success(
                resource.status === "ACTIVE"
                    ? "Đã ngưng hoạt động tài nguyên"
                    : "Đã kích hoạt lại tài nguyên"
            );
            setShowDeactivateDialog(false);
        } catch (error: any) {
            toast.error(error.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái");
        }
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`Đã sao chép ${field}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const CopyButton = ({ text, field }: { text: string; field: string }) => (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2"
            onClick={() => handleCopy(text, field)}
            disabled={!text}
        >
            {copiedField === field ? (
                <Check className="h-3 w-3 text-green-500" />
            ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
            )}
        </Button>
    );

    if (isResourceLoading) {
        return (
            <DashboardLayout title="Chi tiết Tài nguyên" description="Đang tải thông tin...">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!resource) {
        return (
            <DashboardLayout title="Chi tiết Tài nguyên" description="Không tìm thấy tài nguyên">
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Không tìm thấy tài nguyên</h3>
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
            title={resource.name}
            description={`Mã: ${resource.code} | Chi nhánh: ${resource.branchName}`}
            actions={
                <div className="flex gap-2">
                    <Button
                        variant={resource.status === "ACTIVE" ? "destructive" : "default"}
                        onClick={() => setShowDeactivateDialog(true)}
                        disabled={isUpdatingStatus}
                    >
                        {resource.status === "ACTIVE" ? (
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
                            {resource.status === "ACTIVE" ? "Ngưng hoạt động tài nguyên?" : "Kích hoạt lại tài nguyên?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {resource.status === "ACTIVE"
                                ? "Tài nguyên sẽ bị ẩn khỏi danh sách chọn khi tạo lớp mới. Các lớp học hiện tại đang sử dụng tài nguyên này vẫn sẽ được giữ nguyên."
                                : "Tài nguyên sẽ xuất hiện trở lại trong danh sách chọn khi tạo lớp mới."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            className={resource.status === "ACTIVE" ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : resource.status === "ACTIVE" ? (
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
                                <p className="text-sm text-muted-foreground">Lớp đang sử dụng</p>
                                <p className="text-2xl font-bold">{resource.activeClassesCount || 0}</p>
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
                                <p className="text-2xl font-bold">{resource.totalSessionsCount || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-purple-100 rounded-full">
                                <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Buổi học tiếp theo</p>
                                <p className="font-medium text-sm truncate max-w-[200px]" title={resource.nextSessionInfo}>
                                    {resource.nextSessionInfo || "Chưa có lịch"}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        {resource.resourceType === "ROOM" ? <MapPin className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                                        Thông tin cơ bản
                                        {resource.status === "INACTIVE" && (
                                            <Badge variant="destructive" className="ml-2">
                                                Đã ngưng hoạt động
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Loại tài nguyên</span>
                                            <p className="font-medium">
                                                {resource.resourceType === "ROOM" ? "Phòng học (Physical)" : "Phòng ảo (Virtual)"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Sức chứa</span>
                                            <p className="font-medium">{resource.capacity || 0} người</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-sm text-muted-foreground">Mô tả</span>
                                            <p className="text-sm mt-1">{resource.description || "—"}</p>
                                        </div>
                                        {resource.resourceType === "ROOM" && (
                                            <div className="col-span-2">
                                                <span className="text-sm text-muted-foreground">Trang thiết bị</span>
                                                <p className="text-sm mt-1">{resource.equipment || "—"}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {resource.resourceType === "VIRTUAL" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Monitor className="h-4 w-4" />
                                            Thông tin kết nối (Zoom)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Meeting URL</span>
                                            <div className="flex items-center mt-1 p-2 bg-muted rounded text-sm break-all">
                                                {resource.meetingUrl || "—"}
                                                {resource.meetingUrl && <CopyButton text={resource.meetingUrl} field="URL" />}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-muted-foreground">Meeting ID</span>
                                                <div className="flex items-center mt-1">
                                                    <span className="font-medium">{resource.meetingId || "—"}</span>
                                                    {resource.meetingId && <CopyButton text={resource.meetingId} field="ID" />}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground">Passcode</span>
                                                <div className="flex items-center mt-1">
                                                    <span className="font-medium">{resource.meetingPasscode || "—"}</span>
                                                    {resource.meetingPasscode && <CopyButton text={resource.meetingPasscode} field="Passcode" />}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground">Account Email</span>
                                                <div className="flex items-center mt-1">
                                                    <span className="font-medium">{resource.accountEmail || "—"}</span>
                                                    {resource.accountEmail && <CopyButton text={resource.accountEmail} field="Email" />}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground">Password</span>
                                                <div className="flex items-center mt-1">
                                                    <span className="font-medium">{resource.accountPassword || "—"}</span>
                                                    {resource.accountPassword && <CopyButton text={resource.accountPassword} field="Password" />}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử dụng tài nguyên</CardTitle>
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
                                                <TableHead>Khung giờ</TableHead>
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
                                                    <TableCell>
                                                        {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
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
                                        Chưa có lịch sử dụng nào.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
