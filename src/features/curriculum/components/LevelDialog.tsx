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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
    subjectId: z.number().min(1, "Vui lòng chọn môn học"),
    code: z.string().min(1, "Mã cấp độ là bắt buộc"),
    name: z.string().min(1, "Tên cấp độ là bắt buộc"),
    description: z.string().optional(),
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
        }
    }, [level, open, subjectId, form]);

    const onSubmit = async (values: LevelFormValues) => {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
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
                                            <FormLabel>Môn học <span className="text-red-500">*</span></FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? field.value.toString() : ""}
                                                disabled={!!level} // Disable subject selection when editing
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã cấp độ <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ví dụ: L1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên cấp độ <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: Level 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Mô tả chi tiết về cấp độ..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
        </Dialog>
    );
}
