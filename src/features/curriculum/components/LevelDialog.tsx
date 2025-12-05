import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLevelMutation, useGetSubjectsWithLevelsQuery, useUpdateLevelMutation } from "@/store/services/curriculumApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
    subjectId: z.number().min(1, "Vui lòng chọn môn học"),
    code: z.string().min(1, "Mã cấp độ là bắt buộc"),
    name: z.string().min(1, "Tên cấp độ là bắt buộc"),
    description: z.string().optional().refine(
        (val) => !val || val.length === 0 || val.length >= 10,
        "Mô tả phải để trống hoặc có ít nhất 10 ký tự"
    ),
});

type LevelFormValues = z.infer<typeof formSchema>;

interface LevelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    level?: {
        id: number;
        subjectId: number;
        code: string;
        name: string;
        description?: string;
    } | null;
    subjectId?: number; // Pre-selected subject ID if creating from a filtered view
}

export function LevelDialog({ open, onOpenChange, level, subjectId }: LevelDialogProps) {
    const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsWithLevelsQuery();
    const [createLevel, { isLoading: isCreating }] = useCreateLevelMutation();
    const [updateLevel, { isLoading: isUpdating }] = useUpdateLevelMutation();
    const isLoading = isCreating || isUpdating;
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);

    // Get all subjects with their levels for duplicate check
    const subjects = subjectsData?.data || [];

    const form = useForm<LevelFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subjectId: 0,
            code: "",
            name: "",
            description: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (level) {
                form.reset({
                    subjectId: level.subjectId,
                    code: level.code,
                    name: level.name,
                    description: level.description || "",
                });
            } else {
                form.reset({
                    subjectId: subjectId || 0,
                    code: "",
                    name: "",
                    description: "",
                });
            }
            // Reset custom errors
            setCodeError(null);
            setNameError(null);
        }
    }, [level, open, subjectId, form]);

    const handleOpenChangeWrapper = (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(newOpen);
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        form.reset(); // Reset form state including isDirty
        onOpenChange(false);
    };

    // Validation functions for duplicate check within same subject
    const validateCode = (code: string, currentSubjectId: number): string | null => {
        const trimmedCode = code.trim().toLowerCase();
        // Find the subject and check its levels
        const subject = subjects.find(s => s.id === currentSubjectId);
        if (!subject) return null;
        
        const isDuplicate = subject.levels?.some(
            (l) => l.code.toLowerCase() === trimmedCode && String(l.id) !== String(level?.id)
        );
        if (isDuplicate) {
            return "Mã cấp độ đã tồn tại trong môn học này";
        }
        return null;
    };

    const validateName = (name: string, currentSubjectId: number): string | null => {
        const trimmedName = name.trim().toLowerCase();
        // Find the subject and check its levels
        const subject = subjects.find(s => s.id === currentSubjectId);
        if (!subject) return null;
        
        const isDuplicate = subject.levels?.some(
            (l) => l.name.toLowerCase() === trimmedName && String(l.id) !== String(level?.id)
        );
        if (isDuplicate) {
            return "Tên cấp độ đã tồn tại trong môn học này";
        }
        return null;
    };

    const onSubmit = async (values: LevelFormValues) => {
        // Validate duplicates before submit
        const codeErr = validateCode(values.code, values.subjectId);
        const nameErr = validateName(values.name, values.subjectId);

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

        try {
            if (level) {
                await updateLevel({ id: level.id, data: values }).unwrap();
                toast.success("Cập nhật cấp độ thành công");
            } else {
                await createLevel(values).unwrap();
                toast.success("Tạo cấp độ thành công");
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save level:", error);
            toast.error(level ? "Cập nhật thất bại" : "Tạo mới thất bại");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChangeWrapper}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{level ? "Chỉnh sửa Cấp độ" : "Tạo Cấp độ Mới"}</DialogTitle>
                    <DialogDescription>
                        {level ? "Cập nhật thông tin cấp độ." : "Thêm cấp độ mới vào hệ thống."}
                    </DialogDescription>
                </DialogHeader>
                {isLoadingSubjects ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="subjectId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Môn học <span className="text-rose-500">*</span></FormLabel>
                                            {level ? (
                                                // When editing, show subject name as readonly input
                                                <FormControl>
                                                    <Input
                                                        value={(() => {
                                                            const subject = subjects.find(s => s.id === field.value);
                                                            return subject ? `${subject.name} (${subject.code})` : "";
                                                        })()}
                                                        disabled
                                                        className="bg-muted"
                                                    />
                                                </FormControl>
                                            ) : (
                                                // When creating, show dropdown
                                                <Select
                                                    onValueChange={(value) => field.onChange(Number(value))}
                                                    value={field.value ? field.value.toString() : ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn môn học" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {subjectsData?.data?.map((subject) => (
                                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                                {subject.name} ({subject.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã cấp độ <span className="text-rose-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ví dụ: L1" 
                                                    {...field}
                                                    className={codeError ? "border-rose-500" : ""}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        const currentSubjectId = form.getValues("subjectId");
                                                        if (currentSubjectId) {
                                                            setCodeError(validateCode(e.target.value, currentSubjectId));
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {codeError && <p className="text-sm text-rose-500">{codeError}</p>}
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên cấp độ <span className="text-rose-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Ví dụ: Level 1" 
                                                {...field}
                                                className={nameError ? "border-rose-500" : ""}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const currentSubjectId = form.getValues("subjectId");
                                                    if (currentSubjectId) {
                                                        setNameError(validateName(e.target.value, currentSubjectId));
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        {nameError && <p className="text-sm text-rose-500">{nameError}</p>}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Mô tả chi tiết về cấp độ (để trống hoặc ít nhất 10 ký tự)..."
                                                className={`min-h-[100px] ${fieldState.error ? "border-rose-500" : ""}`}
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // Trigger validation on change
                                                    form.trigger("description");
                                                }}
                                            />
                                        </FormControl>
                                        {fieldState.error && (
                                            <p className="text-sm text-rose-500">{fieldState.error.message}</p>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleOpenChangeWrapper(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Lưu
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
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
