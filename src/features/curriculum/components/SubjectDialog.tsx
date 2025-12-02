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
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/store/services/curriculumApi";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
} from "@/components/ui/alert-dialog";

interface SubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject?: {
        id: number;
        code: string;
        name: string;
        description: string;
        plos: { code: string; description: string }[];
    } | null;
}

export function SubjectDialog({ open, onOpenChange, subject }: SubjectDialogProps) {
    const [createSubject, { isLoading: isCreating }] = useCreateSubjectMutation();
    const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation();
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        plos: [] as { code: string; description: string }[],
    });

    const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

    useEffect(() => {
        if (subject) {
            setFormData({
                code: subject.code,
                name: subject.name,
                description: subject.description || "",
                plos: subject.plos || [],
            });
        } else {
            setFormData({
                code: "",
                name: "",
                description: "",
                plos: [],
            });
        }
    }, [subject, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const getNextPloCode = (plos: { code: string; description: string }[]) => {
        const maxIndex = plos
            .map((plo) => {
                const match = plo.code.match(/(\d+)$/);
                return match ? Number(match[1]) : 0;
            })
            .reduce((max, curr) => Math.max(max, curr), 0);
        return `PLO${maxIndex + 1}`;
    };

    const addPLO = () => {
        setFormData((prev) => ({
            ...prev,
            plos: [...prev.plos, { code: getNextPloCode(prev.plos), description: "" }],
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

    const handleConfirmRemove = () => {
        if (pendingRemoveIndex === null) return;
        setFormData((prev) => ({
            ...prev,
            plos: prev.plos.filter((_, i) => i !== pendingRemoveIndex),
        }));
        setPendingRemoveIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (subject) {
                await updateSubject({ id: subject.id, data: formData }).unwrap();
                toast.success("Cập nhật môn học thành công");
            } else {
                await createSubject(formData).unwrap();
                toast.success("Tạo môn học thành công");
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save subject:", error);
            toast.error(subject ? "Cập nhật thất bại" : "Tạo mới thất bại");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{subject ? "Chỉnh sửa Môn học" : "Tạo Môn học Mới"}</DialogTitle>
                    <DialogDescription>
                        {subject ? "Cập nhật thông tin môn học." : "Thêm môn học mới vào hệ thống."}
                    </DialogDescription>
                </DialogHeader>
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
                                                        onClick={() => setPendingRemoveIndex(index)}
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

            <AlertDialog open={pendingRemoveIndex !== null} onOpenChange={(open) => !open && setPendingRemoveIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa PLO</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa PLO này? Hành động không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRemove}>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
