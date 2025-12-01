import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { TimeSlotTemplate } from "@/store/services/timeSlotApi";

interface TimeSlotDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeSlot: TimeSlotTemplate | null;
}

export function TimeSlotDetailDialog({ open, onOpenChange, timeSlot }: TimeSlotDetailDialogProps) {
    if (!timeSlot) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Chi tiết Khung giờ học</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Statistics Section */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div className="text-center border-r border-slate-200">
                            <div className="text-2xl font-bold text-blue-600">{timeSlot.activeClassesCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Lớp đang áp dụng</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{timeSlot.totalSessionsCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Tổng số buổi học</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tên khung giờ</Label>
                        <Input value={timeSlot.name} readOnly className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label>Chi nhánh</Label>
                        <Input value={timeSlot.branchName || "—"} readOnly className="bg-muted" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Giờ bắt đầu</Label>
                            <Input value={timeSlot.startTime} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Giờ kết thúc</Label>
                            <Input value={timeSlot.endTime} readOnly className="bg-muted" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
