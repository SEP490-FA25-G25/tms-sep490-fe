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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateResourceMutation, useUpdateResourceMutation } from "@/store/services/resourceApi";
import type { Resource, ResourceType } from "@/store/services/resourceApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ResourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resource?: Resource | null;
    branchId: number;
    branches?: { id: number; name: string }[];
}

export function ResourceDialog({ open, onOpenChange, resource, branchId, branches = [] }: ResourceDialogProps) {
    const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
    const [updateResource, { isLoading: isUpdating }] = useUpdateResourceMutation();
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        branchId: branchId > 0 ? branchId.toString() : "",
        resourceType: "ROOM" as ResourceType,
        description: "",
        capacity: "",
        equipment: "",
        meetingUrl: "",
        meetingId: "",
        meetingPasscode: "",
        accountEmail: "",
        accountPassword: "",
    });

    useEffect(() => {
        if (resource) {
            setFormData({
                code: resource.code,
                name: resource.name,
                branchId: resource.branchId?.toString() || (branchId > 0 ? branchId.toString() : ""),
                resourceType: resource.resourceType,
                description: resource.description || "",
                capacity: resource.capacity?.toString() || "",
                equipment: resource.equipment || "",
                meetingUrl: resource.meetingUrl || "",
                meetingId: resource.meetingId || "",
                meetingPasscode: resource.meetingPasscode || "",
                accountEmail: resource.accountEmail || "",
                accountPassword: resource.accountPassword || "",
            });
        } else {
            setFormData({
                code: "",
                name: "",
                branchId: branchId > 0 ? branchId.toString() : "",
                resourceType: "ROOM",
                description: "",
                capacity: "",
                equipment: "",
                meetingUrl: "",
                meetingId: "",
                meetingPasscode: "",
                accountEmail: "",
                accountPassword: "",
            });
        }
    }, [resource, open, branchId]);

    const handleChange = (id: string, value: string) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.code.trim()) {
            toast.error("Vui lòng nhập mã tài nguyên");
            return;
        }
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên tài nguyên");
            return;
        }
        if (branchId === 0 && !formData.branchId) {
            toast.error("Vui lòng chọn chi nhánh");
            return;
        }

        if (!formData.capacity || parseInt(formData.capacity) <= 0) {
            toast.error("Sức chứa phải là số lớn hơn 0");
            return;
        }

        if (formData.resourceType === "VIRTUAL") {
            if (!formData.meetingUrl.trim()) {
                toast.error("Vui lòng nhập Meeting URL");
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                branchId: parseInt(formData.branchId),
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
            };

            if (resource) {
                await updateResource({ id: resource.id, ...payload }).unwrap();
                toast.success("Cập nhật tài nguyên thành công");
            } else {
                await createResource(payload).unwrap();
                toast.success("Tạo tài nguyên mới thành công");
            }
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Failed to save resource:", error);
            const apiError = error as { data?: { message?: string }; message?: string };
            const errorMessage =
                apiError.data?.message || apiError.message || "Lưu thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{resource ? "Chỉnh sửa Tài nguyên" : "Thêm Tài nguyên Mới"}</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết cho tài nguyên. Nhấn Lưu để hoàn tất.
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Mã tài nguyên <span className="text-red-500">*</span></Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => handleChange("code", e.target.value)}
                                required
                                placeholder="VD: R101"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên tài nguyên <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                required
                                placeholder="VD: Phòng 101"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="resourceType">Loại tài nguyên</Label>
                        <Select
                            value={formData.resourceType}
                            onValueChange={(value: ResourceType) => handleChange("resourceType", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROOM">Phòng học (Physical)</SelectItem>
                                <SelectItem value="VIRTUAL">Phòng ảo (Virtual/Zoom)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Mô tả thêm về tài nguyên..."
                        />
                    </div>

                    {formData.resourceType === "ROOM" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Sức chứa (người)</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => handleChange("capacity", e.target.value)}
                                    placeholder="VD: 30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="equipment">Trang thiết bị</Label>
                                <Input
                                    id="equipment"
                                    value={formData.equipment}
                                    onChange={(e) => handleChange("equipment", e.target.value)}
                                    placeholder="VD: Máy chiếu, Bảng trắng, Loa"
                                />
                            </div>
                        </>
                    )}

                    {formData.resourceType === "VIRTUAL" && (
                        <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                            <h4 className="font-medium text-sm text-slate-900">Thông tin phòng ảo</h4>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Sức chứa (người)</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => handleChange("capacity", e.target.value)}
                                    placeholder="VD: 100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meetingUrl">Meeting URL</Label>
                                <Input
                                    id="meetingUrl"
                                    value={formData.meetingUrl}
                                    onChange={(e) => handleChange("meetingUrl", e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="meetingId">Meeting ID</Label>
                                    <Input
                                        id="meetingId"
                                        value={formData.meetingId}
                                        onChange={(e) => handleChange("meetingId", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="meetingPasscode">Passcode</Label>
                                    <Input
                                        id="meetingPasscode"
                                        value={formData.meetingPasscode}
                                        onChange={(e) => handleChange("meetingPasscode", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accountEmail">Account Email</Label>
                                    <Input
                                        id="accountEmail"
                                        value={formData.accountEmail}
                                        onChange={(e) => handleChange("accountEmail", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountPassword">Account Password</Label>
                                    <Input
                                        id="accountPassword"
                                        type="password"
                                        value={formData.accountPassword}
                                        onChange={(e) => handleChange("accountPassword", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
