import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTimeSlotMutation, useUpdateTimeSlotMutation } from "@/store/services/resourceApi";
import type { TimeSlot } from "@/store/services/resourceApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TimeSlotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeSlot?: TimeSlot | null;
    branchId: number;
    branches?: { id: number; name: string }[];
}

export function TimeSlotDialog({ open, onOpenChange, timeSlot, branchId, branches = [] }: TimeSlotDialogProps) {
    const [createTimeSlot, { isLoading: isCreating }] = useCreateTimeSlotMutation();
    const [updateTimeSlot, { isLoading: isUpdating }] = useUpdateTimeSlotMutation();
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        name: "",
        branchId: branchId > 0 ? branchId.toString() : "",
        startTime: "",
        endTime: "",
    });

    useEffect(() => {
        if (timeSlot) {
            setFormData({
                name: timeSlot.name,
                branchId: timeSlot.branchId?.toString() || (branchId > 0 ? branchId.toString() : ""),
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
            });
        } else {
            setFormData({
                name: "",
                branchId: branchId > 0 ? branchId.toString() : "",
                startTime: "",
                endTime: "",
            });
        }
    }, [timeSlot, open, branchId]);

    const handleChange = (id: string, value: string) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên khung giờ");
            return;
        }
        if (branchId === 0 && !formData.branchId) {
            toast.error("Vui lòng chọn chi nhánh");
            return;
        }
        if (!formData.startTime) {
            toast.error("Vui lòng nhập giờ bắt đầu");
            return;
        }
        if (!formData.endTime) {
            toast.error("Vui lòng nhập giờ kết thúc");
            return;
        }

        if (formData.startTime >= formData.endTime) {
            toast.error("Giờ kết thúc phải sau giờ bắt đầu");
            return;
        }

        try {
            const payload = {
                ...formData,
                branchId: parseInt(formData.branchId),
            };

            if (timeSlot) {
                await updateTimeSlot({ id: timeSlot.id, ...payload }).unwrap();
                toast.success("Cập nhật khung giờ thành công");
            } else {
                await createTimeSlot(payload).unwrap();
                toast.success("Tạo khung giờ mới thành công");
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to save time slot:", error);
            const errorMessage = error?.data?.message || error?.message || "Lưu thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{timeSlot ? "Chỉnh sửa Khung giờ" : "Thêm Khung giờ Mới"}</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin cho khung giờ học. Nhấn Lưu để hoàn tất.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Show Branch Select if branchId is not pre-selected */}
                    {branchId === 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="branchId">Chi nhánh <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.branchId}
                                onValueChange={(value) => handleChange("branchId", value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn chi nhánh" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên khung giờ <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                            placeholder="VD: Ca sáng 1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Giờ bắt đầu <span className="text-red-500">*</span></Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange("startTime", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">Giờ kết thúc <span className="text-red-500">*</span></Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleChange("endTime", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lưu
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
