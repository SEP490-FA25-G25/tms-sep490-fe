import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateSubjectMutation } from "@/store/services/curriculumApi";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateSubjectPage() {
    const navigate = useNavigate();
    const [createSubject, { isLoading }] = useCreateSubjectMutation();
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSubject(formData).unwrap();
            toast.success("Tạo môn học thành công!");
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to create subject:", error);
            toast.error("Tạo môn học thất bại. Vui lòng thử lại.");
        }
    };

    return (
        <DashboardLayout
            title="Tạo Môn học Mới"
            description="Thêm môn học mới vào hệ thống."
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
                        <CardTitle>Thông tin Môn học</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code">Mã môn học <span className="text-red-500">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="VD: ENG"
                                    required
                                    value={formData.code}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Tên môn học <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="VD: Tiếng Anh Giao tiếp"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Nhập mô tả về môn học..."
                                    className="min-h-[100px]"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => navigate("/curriculum")}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Lưu Môn học
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
