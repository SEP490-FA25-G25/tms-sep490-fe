import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreateAvailabilityCampaignMutation, type CreateCampaignRequest } from "@/store/services/teacherAvailabilityApi";
import { toast } from "sonner";

interface CampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CampaignDialog({ open, onOpenChange }: CampaignDialogProps) {
    const [createCampaign, { isLoading }] = useCreateAvailabilityCampaignMutation();
    const [newCampaign, setNewCampaign] = useState<CreateCampaignRequest>({
        name: "",
        deadline: "",
        targetAudience: "ALL",
    });

    const handleCreateCampaign = async () => {
        if (!newCampaign.name || !newCampaign.deadline) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        if (new Date(newCampaign.deadline) < new Date()) {
            toast.error("Hạn chót phải lớn hơn thời điểm hiện tại");
            return;
        }

        try {
            await createCampaign(newCampaign).unwrap();
            toast.success("Đã tạo đợt cập nhật thành công");
            onOpenChange(false);
            setNewCampaign({ name: "", deadline: "", targetAudience: "ALL" });
        } catch (error) {
            toast.error("Lỗi khi tạo đợt cập nhật");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                            value={newCampaign.deadline}
                            onChange={(e) => {
                                const selectedDate = new Date(e.target.value);
                                const now = new Date();
                                if (selectedDate < now) {
                                    toast.error("Không thể chọn thời gian trong quá khứ");
                                    return;
                                }
                                setNewCampaign({
                                    ...newCampaign,
                                    deadline: e.target.value,
                                });
                            }}
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
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button onClick={handleCreateCampaign} disabled={isLoading}>
                        {isLoading ? "Đang tạo..." : "Tạo & Gửi thông báo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
