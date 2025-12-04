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
import { useCreateSubjectMutation, useUpdateSubjectMutation, useGetSubjectsWithLevelsQuery } from "@/store/services/curriculumApi";
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
    const { data: subjectsResponse } = useGetSubjectsWithLevelsQuery();
    const existingSubjects = subjectsResponse?.data || [];
    const isLoading = isCreating || isUpdating;

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        plos: [] as { code: string; description: string }[],
    });

    const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [ploErrors, setPloErrors] = useState<{ [key: number]: string }>();

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
        setIsDirty(false);
        setCodeError(null);
        setNameError(null);
        setDescriptionError(null);
        setPloErrors({});
    }, [subject, open]);

    const handleOpenChangeWrapper = (newOpen: boolean) => {
        if (!newOpen && isDirty) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(newOpen);
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        setIsDirty(false);
        onOpenChange(false);
    };

    const validateDescription = (value: string): string | null => {
        if (value.length > 0 && value.length < 10) {
            return "Mô tả phải để trống hoặc có ít nhất 10 ký tự";
        }
        return null;
    };

    const validateCode = (value: string): string | null => {
        const trimmedValue = value.trim().toLowerCase();
        const isDuplicate = existingSubjects.some(
            (s) => s.code.toLowerCase() === trimmedValue && s.id !== subject?.id
        );
        if (isDuplicate) {
            return "Mã môn học đã tồn tại";
        }
        return null;
    };

    const validateName = (value: string): string | null => {
        const trimmedValue = value.trim().toLowerCase();
        const isDuplicate = existingSubjects.some(
            (s) => s.name.toLowerCase() === trimmedValue && s.id !== subject?.id
        );
        if (isDuplicate) {
            return "Tên môn học đã tồn tại";
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        setIsDirty(true);
        
        // Validate on change
        if (id === "code") {
            setCodeError(validateCode(value));
        } else if (id === "name") {
            setNameError(validateName(value));
        } else if (id === "description") {
            setDescriptionError(validateDescription(value));
        }
    };

    const addPLO = () => {
        const newIndex = formData.plos.length + 1;
        setFormData((prev) => ({
            ...prev,
            plos: [...prev.plos, { code: `PLO${newIndex}`, description: "" }],
        }));
        setIsDirty(true);
    };

    const updatePLO = (index: number, field: "code" | "description", value: string) => {
        setFormData((prev) => ({
            ...prev,
            plos: prev.plos.map((plo, i) =>
                i === index ? { ...plo, [field]: value } : plo
            ),
        }));
        setIsDirty(true);
        
        // Clear PLO description error when user starts typing
        if (field === "description" && value.trim().length > 0) {
            setPloErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleConfirmRemove = () => {
        if (pendingRemoveIndex === null) return;
        setFormData((prev) => {
            const newPlos = prev.plos.filter((_, i) => i !== pendingRemoveIndex);
            // Auto-renumber PLOs after deletion
            const renumberedPlos = newPlos.map((plo, index) => ({
                ...plo,
                code: `PLO${index + 1}`,
            }));
            return {
                ...prev,
                plos: renumberedPlos,
            };
        });
        setPendingRemoveIndex(null);
        setIsDirty(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate code and name for duplicates
        const codeErr = validateCode(formData.code);
        const nameErr = validateName(formData.name);
        
        if (codeErr) {
            setCodeError(codeErr);
            toast.error(codeErr);
            return;
        }
        
        if (nameErr) {
            setNameError(nameErr);
            toast.error(nameErr);
            return;
        }
        
        // Validate description
        const descError = validateDescription(formData.description);
        if (descError) {
            setDescriptionError(descError);
            toast.error(descError);
            return;
        }
        
        // Validate at least 1 PLO required
        if (formData.plos.length === 0) {
            toast.error("Môn học phải có ít nhất 1 PLO");
            return;;
        }
        
        // Validate PLO descriptions
        const ploValidationErrors: { [key: number]: string } = {};
        formData.plos.forEach((plo, index) => {
            if (!plo.description.trim()) {
                ploValidationErrors[index] = "Mô tả PLO không được để trống";
            }
        });
        
        if (Object.keys(ploValidationErrors).length > 0) {
            setPloErrors(ploValidationErrors);
            toast.error("Vui lòng nhập mô tả cho tất cả PLO");
            return;
        }
        
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
        <Dialog open={open} onOpenChange={handleOpenChangeWrapper}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
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
                                className={codeError ? "border-red-500" : ""}
                            />
                            {codeError && (
                                <p className="text-sm text-red-500">{codeError}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Tên môn học <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="VD: Tiếng Anh Giao tiếp"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className={nameError ? "border-red-500" : ""}
                            />
                            {nameError && (
                                <p className="text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            placeholder="Nhập mô tả về môn học (để trống hoặc ít nhất 10 ký tự)..."
                            className={`min-h-[100px] ${descriptionError ? "border-red-500" : ""}`}
                            value={formData.description}
                            onChange={handleChange}
                        />
                        {descriptionError && (
                            <p className="text-sm text-red-500">{descriptionError}</p>
                        )}
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
                                        <TableHead>Mô tả <span className="text-red-500">*</span></TableHead>
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
                                                        disabled
                                                        className="bg-muted"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Input
                                                            value={plo.description}
                                                            onChange={(e) => updatePLO(index, "description", e.target.value)}
                                                            placeholder="Mô tả chuẩn đầu ra..."
                                                            className={ploErrors[index] ? "border-red-500" : ""}
                                                        />
                                                        {ploErrors[index] && (
                                                            <p className="text-xs text-red-500">{ploErrors[index]}</p>
                                                        )}
                                                    </div>
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
                        <Button type="button" variant="outline" onClick={() => handleOpenChangeWrapper(false)}>
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
            <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmClose}>Hủy thay đổi</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
