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
import { addMonths, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    const [showConfirmClose, setShowConfirmClose] = useState(false);

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
        licenseType: "BASIC",
        startDate: format(new Date(), "yyyy-MM-dd"),
        licenseDuration: "",
        expiryDate: "",
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
                licenseType: resource.licenseType || "BASIC",
                startDate: format(new Date(), "yyyy-MM-dd"), // Default to today if not stored, or maybe we don't store start date in DB yet? User didn't ask to store it, just use it for calculation. But wait, if we edit, we need it?
                // The DB doesn't have start_date column based on previous schema.
                // But the user wants to "select start date... to calculate expiry".
                // So it's a helper field.
                licenseDuration: "",
                expiryDate: resource.expiryDate || "",
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
                licenseType: "BASIC",
                startDate: format(new Date(), "yyyy-MM-dd"),
                licenseDuration: "",
                expiryDate: "",
            });
        }
    }, [resource, open, branchId]);

    // Check if form has been modified from initial state
    const initialFormData = useMemo(() => ({
        code: resource?.code || "",
        name: resource?.name || "",
        branchId: resource?.branchId?.toString() || (branchId > 0 ? branchId.toString() : ""),
        resourceType: resource?.resourceType || "ROOM",
        description: resource?.description || "",
        capacity: resource?.capacity?.toString() || "",
        equipment: resource?.equipment || "",
        meetingUrl: resource?.meetingUrl || "",
        meetingId: resource?.meetingId || "",
        meetingPasscode: resource?.meetingPasscode || "",
        accountEmail: resource?.accountEmail || "",
        accountPassword: resource?.accountPassword || "",
        licenseType: resource?.licenseType || "BASIC",
        startDate: format(new Date(), "yyyy-MM-dd"),
        licenseDuration: "",
        expiryDate: resource?.expiryDate || "",
    }), [resource, branchId]);

    const hasChanges = useMemo(() => {
        return (
            formData.code !== initialFormData.code ||
            formData.name !== initialFormData.name ||
            formData.resourceType !== initialFormData.resourceType ||
            formData.description !== initialFormData.description ||
            formData.capacity !== initialFormData.capacity ||
            formData.equipment !== initialFormData.equipment ||
            formData.meetingUrl !== initialFormData.meetingUrl ||
            formData.meetingId !== initialFormData.meetingId ||
            formData.meetingPasscode !== initialFormData.meetingPasscode ||
            formData.accountEmail !== initialFormData.accountEmail ||
            formData.accountPassword !== initialFormData.accountPassword ||
            formData.licenseType !== initialFormData.licenseType ||
            formData.expiryDate !== initialFormData.expiryDate
        );
    }, [formData, initialFormData]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen && hasChanges) {
            setShowConfirmClose(true);
        } else {
            onOpenChange(newOpen);
        }
    }, [hasChanges, onOpenChange]);

    const handleConfirmClose = useCallback(() => {
        setShowConfirmClose(false);
        onOpenChange(false);
    }, [onOpenChange]);

    const handleChange = (field: string, value: string | number | boolean | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const calculateExpiry = (start: string, duration: string) => {
        if (!start || !duration) return "";
        const startDate = new Date(start);
        const durationMonths = parseInt(duration);
        if (isNaN(durationMonths)) return "";

        const expiry = addMonths(startDate, durationMonths);
        return format(expiry, "yyyy-MM-dd");
    };

    const handleStartDateChange = (value: string) => {
        const newExpiry = calculateExpiry(value, formData.licenseDuration);
        setFormData((prev) => ({
            ...prev,
            startDate: value,
            expiryDate: newExpiry || prev.expiryDate,
        }));
    };

    const handleDurationChange = (value: string) => {
        const newExpiry = calculateExpiry(formData.startDate, value);
        setFormData((prev) => ({
            ...prev,
            licenseDuration: value,
            expiryDate: newExpiry || prev.expiryDate,
        }));
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
        if (formData.description.trim() && formData.description.trim().length < 10) {
            toast.error("Mô tả phải có ít nhất 10 ký tự hoặc để trống");
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
        <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        <p className="text-xs text-muted-foreground">Để trống hoặc nhập ít nhất 10 ký tự</p>
                    </div>

                    {formData.resourceType === "ROOM" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Sức chứa (người)</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min={1}
                                    max={40}
                                    value={formData.capacity}
                                    onChange={(e) => handleChange("capacity", e.target.value)}
                                    placeholder="VD: 30"
                                />
                                <p className="text-xs text-muted-foreground">Tối đa 40 người</p>
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
                                    min={1}
                                    max={100}
                                    value={formData.capacity}
                                    onChange={(e) => handleChange("capacity", e.target.value)}
                                    placeholder="VD: 100"
                                />
                                <p className="text-xs text-muted-foreground">Tối đa 100 người</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meetingUrl">Meeting URL</Label>
                                <Input
                                    id="meetingUrl"
                                    type="url"
                                    value={formData.meetingUrl}
                                    onChange={(e) => handleChange("meetingUrl", e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                />
                                <p className="text-xs text-muted-foreground">Phải bắt đầu bằng http:// hoặc https://</p>
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
                                        type="email"
                                        value={formData.accountEmail}
                                        onChange={(e) => handleChange("accountEmail", e.target.value)}
                                        placeholder="example@domain.com"
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
                            <div className="space-y-2">
                                <Label htmlFor="licenseType">License Type</Label>
                                <Select
                                    value={formData.licenseType}
                                    onValueChange={(value) => handleChange("licenseType", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại license" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BASIC">Basic (Free)</SelectItem>
                                        <SelectItem value="PRO">Pro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.licenseType === "PRO" && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Ngày bắt đầu</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="licenseDuration">Thời hạn (tháng)</Label>
                                        <Input
                                            id="licenseDuration"
                                            type="number"
                                            min="1"
                                            placeholder="VD: 12"
                                            value={formData.licenseDuration}
                                            onChange={(e) => handleDurationChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                                        <Input
                                            id="expiryDate"
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => handleChange("expiryDate", e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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

        <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận hủy</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy không?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmClose}>
                        Hủy thay đổi
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
