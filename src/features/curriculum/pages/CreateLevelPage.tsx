import { useNavigate } from "react-router-dom";
import { useCreateLevelMutation, useGetSubjectsWithLevelsQuery } from "@/store/services/curriculumApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const formSchema = z.object({
    subjectId: z.number().min(1, "Vui lòng chọn môn học"),
    code: z.string().min(1, "Mã cấp độ là bắt buộc"),
    name: z.string().min(1, "Tên cấp độ là bắt buộc"),
    description: z.string().optional(),
    durationHours: z.number().min(1, "Thời lượng phải lớn hơn 0"),
});

type LevelFormValues = z.infer<typeof formSchema>;

export default function CreateLevelPage() {
    const navigate = useNavigate();
    const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsWithLevelsQuery();
    const [createLevel, { isLoading: isCreating }] = useCreateLevelMutation();

    const form = useForm<LevelFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subjectId: 0,
            code: "",
            name: "",
            description: "",
            durationHours: 0,
        },
    });

    const onSubmit = async (values: LevelFormValues) => {
        try {
            await createLevel(values).unwrap();
            toast.success("Tạo cấp độ thành công");
            navigate("/curriculum");
        } catch (error) {
            console.error("Failed to create level:", error);
            toast.error("Tạo cấp độ thất bại. Vui lòng thử lại.");
        }
    };

    if (isLoadingSubjects) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout
            title="Tạo Cấp độ Mới"
            description="Thêm cấp độ mới vào hệ thống."
        >
            <div className="max-w-4xl mx-auto">
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

                                <div className="grid grid-cols-2 gap-6">
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
                                        name="durationHours"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Thời lượng dự kiến (giờ) <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        value={field.value || ""}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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

                                <div className="flex justify-end gap-4 pt-4">
                                    <Button type="button" variant="outline" onClick={() => navigate("/curriculum")}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang tạo...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Lưu Cấp độ
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
