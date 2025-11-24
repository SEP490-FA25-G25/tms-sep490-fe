import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateLevelMutation, useGetSubjectsWithLevelsQuery } from "@/store/services/curriculumApi";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateLevelPage() {
    const navigate = useNavigate();
    const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsWithLevelsQuery();
    const [createLevel, { isLoading: isCreating }] = useCreateLevelMutation();

    const [formData, setFormData] = useState({
        subjectId: "",
        code: "",
        name: "",
        description: "",
        durationHours: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, subjectId: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLevel({
                ...formData,
                subjectId: Number(formData.subjectId),
                durationHours: formData.durationHours ? Number(formData.durationHours) : undefined,
            }).unwrap();
            toast.success("Tạo cấp độ thành công!");
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to create level:", error);
            toast.error("Tạo cấp độ thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <DashboardLayout
            title="Tạo Cấp độ Mới"
            description="Thêm cấp độ mới cho môn học."
        >
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => navigate("/curriculum")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại danh sách
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin Cấp độ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Môn học <span className="text-red-500">*</span></Label>
                                <Select
                                    required
                                    onValueChange={handleSelectChange}
                                    value={formData.subjectId}
                                    disabled={isLoadingSubjects}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingSubjects ? "Đang tải..." : "Chọn môn học"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjectsData?.data?.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                {subject.name} ({subject.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Mã cấp độ <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="code"
                                        placeholder="VD: A1"
                                        required
                                        value={formData.code}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên cấp độ <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        placeholder="VD: Sơ cấp"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="durationHours">Thời lượng dự kiến (Giờ)</Label>
                                <Input
                                    id="durationHours"
                                    type="number"
                                    placeholder="48"
                                    value={formData.durationHours}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Nhập mô tả về cấp độ..."
                                    className="min-h-[100px]"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => navigate("/curriculum")}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Lưu Cấp độ
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
