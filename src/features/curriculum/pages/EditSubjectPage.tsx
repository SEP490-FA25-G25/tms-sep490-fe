import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Ban, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
    useGetSubjectQuery,
    useUpdateSubjectMutation,
    useDeactivateSubjectMutation,
    useReactivateSubjectMutation
} from "@/store/services/curriculumApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function EditSubjectPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const subjectId = Number(id);

    const { data: subjectData, isLoading: isFetching, refetch } = useGetSubjectQuery(subjectId, {
        skip: !subjectId,
    });

    const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation();
    const [deactivateSubject, { isLoading: isDeactivating }] = useDeactivateSubjectMutation();
    const [reactivateSubject, { isLoading: isReactivating }] = useReactivateSubjectMutation();

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        plos: [] as { code: string; description: string }[],
    });

    useEffect(() => {
        if (subjectData?.data) {
            const { code, name, description, plos } = subjectData.data;
            setFormData({
                code: code || "",
                name: name || "",
                description: description || "",
                plos: plos || [],
            });
        }
    }, [subjectData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const addPLO = () => {
        setFormData((prev) => ({
            ...prev,
            plos: [...prev.plos, { code: "", description: "" }],
        }));
    };

    const removePLO = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            plos: prev.plos.filter((_, i) => i !== index),
        }));
    };

    const updatePLO = (index: number, field: "code" | "description", value: string) => {
        setFormData((prev) => ({
            ...prev,
            plos: prev.plos.map((plo, i) =>
                i === index ? { ...plo, [field]: value } : plo
            ),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSubject({ id: subjectId, data: formData }).unwrap();
            toast.success("Cập nhật môn học thành công!");
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to update subject:", error);
            toast.error("Cập nhật môn học thất bại. Vui lòng thử lại.");
        }
    };

    const handleDeactivate = async () => {
        try {
            await deactivateSubject(subjectId).unwrap();
            toast.success("Đã ngừng hoạt động môn học");
            refetch();
        } catch (error) {
            console.error("Failed to deactivate subject:", error);
            toast.error("Ngừng hoạt động thất bại");
        }
    };

    const handleReactivate = async () => {
        try {
            await reactivateSubject(subjectId).unwrap();
            toast.success("Đã kích hoạt lại môn học");
            refetch();
        } catch (error) {
            console.error("Failed to reactivate subject:", error);
            toast.error("Kích hoạt lại thất bại");
        }
    };

    if (isFetching) {
        return (
            <DashboardLayout title="Chỉnh sửa Môn học" description="Đang tải dữ liệu...">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const isActive = subjectData?.data?.status === "ACTIVE";

    return (
        <DashboardLayout
            title="Chỉnh sửa Môn học"
            description="Cập nhật thông tin môn học."
        >
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Button
                        variant="ghost"
                        className="pl-0 hover:bg-transparent hover:text-primary"
                        onClick={() => navigate("/curriculum")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại danh sách
                    </Button>

                    <div className="flex gap-2">
                        {isActive ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isDeactivating}>
                                        {isDeactivating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Ban className="mr-2 h-4 w-4" />
                                        )}
                                        Ngừng hoạt động
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận ngừng hoạt động</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bạn có chắc chắn muốn ngừng hoạt động môn học này?
                                            Môn học sẽ không thể được sử dụng để tạo lớp học mới.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Ngừng hoạt động
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={handleReactivate}
                                disabled={isReactivating}
                            >
                                {isReactivating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Kích hoạt lại
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Thông tin Môn học</CardTitle>
                        <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
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

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Chuẩn đầu ra chương trình (PLOs)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addPLO}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm PLO
                                    </Button>
                                </div>

                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[150px]">Mã PLO</TableHead>
                                                <TableHead>Mô tả</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.plos.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                        Chưa có PLO nào. Nhấn "Thêm PLO" để tạo mới.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                formData.plos.map((plo, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Input
                                                                value={plo.code}
                                                                onChange={(e) => updatePLO(index, "code", e.target.value)}
                                                                placeholder="VD: PLO-1"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={plo.description}
                                                                onChange={(e) => updatePLO(index, "description", e.target.value)}
                                                                placeholder="Mô tả chuẩn đầu ra..."
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive"
                                                                onClick={() => removePLO(index)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate("/curriculum")}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Lưu Thay đổi
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
