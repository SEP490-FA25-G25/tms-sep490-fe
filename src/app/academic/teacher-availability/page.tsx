import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Mail } from "lucide-react";
import {
    useGetAvailabilityCampaignsQuery,
    useCreateAvailabilityCampaignMutation,
    useGetTeacherAvailabilityStatusQuery,
    type CreateCampaignRequest,
} from "@/store/services/teacherAvailabilityApi";
import { toast } from "sonner";
import { format } from "date-fns";

const AvailabilityCampaignPage = () => {
    const { data: campaigns = [] } = useGetAvailabilityCampaignsQuery();
    const { data: teacherStatuses = [] } = useGetTeacherAvailabilityStatusQuery();
    const [createCampaign, { isLoading: isCreating }] =
        useCreateAvailabilityCampaignMutation();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState<CreateCampaignRequest>({
        name: "",
        deadline: "",
        targetAudience: "ALL",
    });

    const handleCreateCampaign = async () => {
        try {
            await createCampaign(newCampaign).unwrap();
            toast.success("Đã tạo đợt cập nhật thành công");
            setIsCreateModalOpen(false);
            setNewCampaign({ name: "", deadline: "", targetAudience: "ALL" });
        } catch (error) {
            toast.error("Lỗi khi tạo đợt cập nhật");
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Quản lý Đợt Cập nhật Lịch dạy
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Theo dõi và nhắc nhở giáo viên cập nhật lịch rảnh.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo đợt mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tạo đợt cập nhật mới</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Tên đợt (Tiêu đề)</Label>
                                    <Input
                                        id="name"
                                        value={newCampaign.name}
                                        onChange={(e) =>
                                            setNewCampaign({ ...newCampaign, name: e.target.value })
                                        }
                                        placeholder="VD: Cập nhật lịch dạy Tháng 12/2025"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deadline">Hạn chót</Label>
                                    <Input
                                        id="deadline"
                                        type="datetime-local"
                                        value={newCampaign.deadline}
                                        onChange={(e) =>
                                            setNewCampaign({
                                                ...newCampaign,
                                                deadline: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="audience">Đối tượng</Label>
                                    <Select
                                        value={newCampaign.targetAudience}
                                        onValueChange={(value: any) =>
                                            setNewCampaign({ ...newCampaign, targetAudience: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">Tất cả giáo viên</SelectItem>
                                            <SelectItem value="FULL_TIME">Giáo viên Full-time</SelectItem>
                                            <SelectItem value="PART_TIME">Giáo viên Part-time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button onClick={handleCreateCampaign} disabled={isCreating}>
                                    {isCreating ? "Đang tạo..." : "Tạo & Gửi thông báo"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Trạng thái cập nhật của Giáo viên</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Giáo viên</TableHead>
                                    <TableHead>Loại HĐ</TableHead>
                                    <TableHead>Cập nhật cuối</TableHead>
                                    <TableHead>Tổng slot</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teacherStatuses.map((teacher) => (
                                    <TableRow key={teacher.teacherId}>
                                        <TableCell>
                                            <div className="font-medium">{teacher.fullName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {teacher.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{teacher.contractType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {teacher.lastUpdated
                                                ? format(new Date(teacher.lastUpdated), "dd/MM/yyyy HH:mm")
                                                : "Chưa cập nhật"}
                                        </TableCell>
                                        <TableCell>{teacher.totalSlots}</TableCell>
                                        <TableCell>
                                            {teacher.status === "UP_TO_DATE" ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                    Đã cập nhật
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Chưa cập nhật</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {teacher.status === "OUTDATED" && (
                                                <Button size="sm" variant="ghost">
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Nhắc nhở
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {teacherStatuses.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Không có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Đợt cập nhật gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {campaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="p-4 border rounded-lg space-y-2"
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium">{campaign.name}</h4>
                                        {campaign.isActive && (
                                            <Badge variant="secondary">Active</Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Deadline: {format(new Date(campaign.deadline), "dd/MM/yyyy HH:mm")}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Đối tượng: {campaign.targetAudience}
                                    </div>
                                </div>
                            ))}
                            {campaigns.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">
                                    Chưa có đợt cập nhật nào
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AvailabilityCampaignPage;
