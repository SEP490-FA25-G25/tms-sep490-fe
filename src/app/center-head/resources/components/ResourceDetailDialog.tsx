import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Resource } from "@/store/services/resourceApi";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResourceDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resource: Resource | null;
}

export function ResourceDetailDialog({ open, onOpenChange, resource }: ResourceDetailDialogProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!resource) return null;

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
            className="h-8 w-8 absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => handleCopy(text, field)}
            disabled={!text}
        >
            {copiedField === field ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
            )}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chi tiết Tài nguyên</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Statistics Section */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{resource.activeClassesCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Lớp đang sử dụng</div>
                        </div>
                        <div className="text-center border-l border-r border-slate-200">
                            <div className="text-2xl font-bold text-blue-600">{resource.totalSessionsCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Tổng số buổi học</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-slate-900 truncate" title={resource.nextSessionInfo}>
                                {resource.nextSessionInfo || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">Buổi học tiếp theo</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã tài nguyên</Label>
                            <Input value={resource.code} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên tài nguyên</Label>
                            <Input value={resource.name} readOnly className="bg-muted" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Chi nhánh</Label>
                            <Input value={resource.branchName || "—"} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Loại tài nguyên</Label>
                            <Input
                                value={resource.resourceType === "ROOM" ? "Phòng học (Physical)" : "Phòng ảo (Virtual/Zoom)"}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea value={resource.description || "—"} readOnly className="bg-muted min-h-[80px]" />
                    </div>

                    {resource.resourceType === "ROOM" && (
                        <>
                            <div className="space-y-2">
                                <Label>Sức chứa (người)</Label>
                                <Input value={resource.capacity || "—"} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Trang thiết bị</Label>
                                <Input value={resource.equipment || "—"} readOnly className="bg-muted" />
                            </div>
                        </>
                    )}

                    {resource.resourceType === "VIRTUAL" && (
                        <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                            <h4 className="font-medium text-sm text-slate-900">Thông tin phòng ảo</h4>

                            <div className="space-y-2">
                                <Label>Sức chứa (người)</Label>
                                <Input value={resource.capacity || "—"} readOnly className="bg-white" />
                            </div>

                            <div className="space-y-2 relative">
                                <Label>Meeting URL</Label>
                                <div className="relative">
                                    <Input value={resource.meetingUrl || "—"} readOnly className="bg-white pr-10" />
                                    {resource.meetingUrl && <CopyButton text={resource.meetingUrl} field="URL" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Meeting ID</Label>
                                    <div className="relative">
                                        <Input value={resource.meetingId || "—"} readOnly className="bg-white pr-10" />
                                        {resource.meetingId && <CopyButton text={resource.meetingId} field="ID" />}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Passcode</Label>
                                    <div className="relative">
                                        <Input value={resource.meetingPasscode || "—"} readOnly className="bg-white pr-10" />
                                        {resource.meetingPasscode && <CopyButton text={resource.meetingPasscode} field="Passcode" />}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Account Email</Label>
                                    <div className="relative">
                                        <Input value={resource.accountEmail || "—"} readOnly className="bg-white pr-10" />
                                        {resource.accountEmail && <CopyButton text={resource.accountEmail} field="Email" />}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Password</Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={resource.accountPassword || "—"}
                                            readOnly
                                            className="bg-white pr-10"
                                        />
                                        {resource.accountPassword && <CopyButton text={resource.accountPassword} field="Password" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
