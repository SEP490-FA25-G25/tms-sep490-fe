"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useGetMyProfileQuery, useUpdateMyProfileMutation, type UpdateProfileRequest } from "@/store/services/userProfileApi";
import { useUploadFileMutation } from "@/store/services/uploadApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Phone,
    MapPin,
    AlertCircle,
    User,
    Mail,
    Facebook,
    Calendar,
    Pencil,
    KeyRound,
    Save,
    X,
    Loader2,
    Shield,
    Building2,
} from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { useState, useEffect } from "react";

type Gender = "MALE" | "FEMALE" | "OTHER";

const genderOptions: { value: Gender; label: string }[] = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
];

function formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
}

export default function AdminProfilePage() {
    const { data: profile, error, isLoading } = useGetMyProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        facebookUrl: "",
        avatarUrl: "",
        gender: "MALE" as Gender,
        dob: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                phone: profile.phone || "",
                address: profile.address || "",
                facebookUrl: profile.facebookUrl || "",
                avatarUrl: profile.avatarUrl || "",
                gender: (profile.gender as Gender) || "MALE",
                dob: formatDateForInput(profile.dob),
            });
        }
    }, [profile]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file hình ảnh");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước file tối đa là 5MB");
            return;
        }
        try {
            const response = await uploadFile(file).unwrap();
            setFormData((prev) => ({ ...prev, avatarUrl: response.url }));
            toast.success("Upload ảnh thành công");
        } catch {
            toast.error("Upload ảnh thất bại");
        }
        e.target.value = "";
    };

    const handleStartEdit = () => {
        if (profile) {
            setFormData({
                phone: profile.phone || "",
                address: profile.address || "",
                facebookUrl: profile.facebookUrl || "",
                avatarUrl: profile.avatarUrl || "",
                gender: (profile.gender as Gender) || "MALE",
                dob: formatDateForInput(profile.dob),
            });
        }
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                phone: profile.phone || "",
                address: profile.address || "",
                facebookUrl: profile.facebookUrl || "",
                avatarUrl: profile.avatarUrl || "",
                gender: (profile.gender as Gender) || "MALE",
                dob: formatDateForInput(profile.dob),
            });
        }
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            toast.error("Số điện thoại phải có 10-11 chữ số");
            return;
        }
        try {
            const updateData: UpdateProfileRequest = {
                phone: formData.phone?.trim() || undefined,
                facebookUrl: formData.facebookUrl?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                avatarUrl: formData.avatarUrl?.trim() || undefined,
                gender: formData.gender,
                dob: formData.dob || undefined,
            };
            await updateProfile(updateData).unwrap();
            toast.success("Cập nhật thông tin thành công");
            setIsEditing(false);
        } catch (error: unknown) {
            const errorMessage =
                (error as { data?: { message?: string } })?.data?.message ||
                "Cập nhật thất bại";
            toast.error(errorMessage);
        }
    };

    const isSaving = isUpdating || isUploading;

    if (isLoading) {
        return (
            <DashboardLayout title="Hồ sơ cá nhân" description="Xem và chỉnh sửa thông tin cá nhân của bạn">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !profile) {
        return (
            <DashboardLayout title="Hồ sơ cá nhân" description="Xem và chỉnh sửa thông tin cá nhân của bạn">
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                    <p className="text-base font-semibold mb-2">Không thể tải thông tin hồ sơ</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Vui lòng thử lại sau hoặc liên hệ hỗ trợ
                    </p>
                    <Button size="sm" onClick={() => window.location.reload()}>
                        Thử lại
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Hồ sơ cá nhân"
            description="Xem và chỉnh sửa thông tin cá nhân của bạn"
            actions={
                <div className="flex gap-2">
                    {!isEditing && (
                        <Button onClick={handleStartEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                        <KeyRound className="h-4 w-4 mr-2" />
                        Đổi mật khẩu
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden shrink-0">
                            <Avatar className="h-24 w-24 border-2 border-background shadow-lg">
                                <AvatarImage src={isEditing ? formData.avatarUrl : profile.avatarUrl || ""} alt={profile.fullName} />
                                <AvatarFallback className="text-2xl font-semibold">
                                    {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => document.getElementById("avatar-upload")?.click()}
                                    disabled={isUploading}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-opacity hover:bg-black/70"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-0.5">
                                            <Pencil className="h-5 w-5 text-white" />
                                            <span className="text-[10px] text-white font-medium">Đổi ảnh</span>
                                        </div>
                                    )}
                                </button>
                            )}
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className={profile.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                    {profile.status === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}
                                </Badge>
                                {profile.roles.map((role) => (
                                    <Badge key={role} variant="secondary">
                                        <Shield className="h-3 w-3 mr-1" />
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                                <p className="text-muted-foreground">{profile.email}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4" />
                                    <span>{profile.phone || "Chưa cập nhật"}</span>
                                </div>
                                {profile.branches.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4" />
                                        <span>{profile.branches.join(", ")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
                        {isEditing && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                                    <X className="h-4 w-4 mr-1" />
                                    Hủy
                                </Button>
                                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>Email</span>
                            </div>
                            <p className="text-base">{profile.email}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Họ tên</span>
                            </div>
                            <p className="text-base">{profile.fullName}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>Số điện thoại</span>
                            </div>
                            {isEditing ? (
                                <Input placeholder="0912345678" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                            ) : (
                                <p className="text-base">{profile.phone || "Chưa cập nhật"}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Giới tính</span>
                            </div>
                            {isEditing ? (
                                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {genderOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-base">
                                    {profile.gender === "MALE" ? "Nam" : profile.gender === "FEMALE" ? "Nữ" : profile.gender === "OTHER" ? "Khác" : "Chưa cập nhật"}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Ngày sinh</span>
                            </div>
                            {isEditing ? (
                                <Input type="date" value={formData.dob} onChange={(e) => handleInputChange("dob", e.target.value)} />
                            ) : (
                                <p className="text-base">{profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"}</p>
                            )}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Địa chỉ</span>
                            </div>
                            {isEditing ? (
                                <Textarea placeholder="Số nhà, đường, phường/xã..." value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} rows={2} />
                            ) : (
                                <p className="text-base">{profile.address || "Chưa cập nhật"}</p>
                            )}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Facebook className="h-4 w-4" />
                                <span>Facebook</span>
                            </div>
                            {isEditing ? (
                                <Input placeholder="https://facebook.com/username" value={formData.facebookUrl} onChange={(e) => handleInputChange("facebookUrl", e.target.value)} />
                            ) : profile.facebookUrl ? (
                                <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline break-all">
                                    {profile.facebookUrl}
                                </a>
                            ) : (
                                <p className="text-base text-muted-foreground">Chưa cập nhật</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
            <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
        </DashboardLayout>
    );
}
