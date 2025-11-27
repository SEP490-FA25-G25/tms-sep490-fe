import { useNavigate, useParams } from "react-router-dom";
import {
    useGetLevelQuery,
    useUpdateLevelMutation,
    useDeactivateLevelMutation,
    useReactivateLevelMutation
} from "@/store/services/curriculumApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save, Ban, CheckCircle } from "lucide-react";
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
import { toast } from "sonner";
import { useEffect } from "react";
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

const formSchema = z.object({
    code: z.string().min(1, "Mã cấp độ là bắt buộc"),
    name: z.string().min(1, "Tên cấp độ là bắt buộc"),
    description: z.string().optional(),
    durationHours: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0"),
});

type LevelFormValues = z.infer<typeof formSchema>;

export default function EditLevelPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: levelData, isLoading: isFetching, refetch } = useGetLevelQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const [updateLevel, { isLoading: isUpdating }] = useUpdateLevelMutation();
    const [deactivateLevel, { isLoading: isDeactivating }] = useDeactivateLevelMutation();
    const [reactivateLevel, { isLoading: isReactivating }] = useReactivateLevelMutation();

    const form = useForm<LevelFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            description: "",
            durationHours: 0,
        },
    });

    useEffect(() => {
        if (levelData?.data) {
            form.reset({
                code: levelData.data.code,
                name: levelData.data.name,
                description: levelData.data.description || "",
                durationHours: levelData.data.durationHours,
            });
        }
    }, [levelData, form]);

    const onSubmit = async (values: LevelFormValues) => {
        try {
            await updateLevel({
                id: Number(id),
                data: {
                    ...values,
                    subjectId: 0, // Not used in update but required by type if strictly checked, though backend ignores it or we can adjust type
                },
            }).unwrap();
            toast.success("Cập nhật cấp độ thành công");
            navigate(`/curriculum/levels/${id}`);
        } catch (error) {
            console.error("Failed to update level:", error);
            toast.error("Cập nhật thất bại. Vui lòng thử lại.");
        }
    };

    const handleDeactivate = async () => {
        try {
            await deactivateLevel(Number(id)).unwrap();
            toast.success("Đã ngừng hoạt động cấp độ");
            refetch();
        } catch (error) {
            console.error("Failed to deactivate level:", error);
            toast.error("Ngừng hoạt động thất bại");
        }
    };

    const handleReactivate = async () => {
        try {
            await reactivateLevel(Number(id)).unwrap();
            toast.success("Đã kích hoạt lại cấp độ");
            refetch();
        } catch (error) {
            console.error("Failed to reactivate level:", error);
            toast.error("Kích hoạt lại thất bại");
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!levelData?.data) {
        return (
            <DashboardLayout title="Không tìm thấy cấp độ">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-muted-foreground">Cấp độ không tồn tại hoặc đã bị xóa.</p>
                    <Button onClick={() => navigate("/curriculum")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isActive = levelData.data.status === "ACTIVE";

    return (
        <DashboardLayout
            title={`Chỉnh sửa cấp độ: ${levelData.data.code}`}
            description="Cập nhật thông tin cấp độ."
        >
            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => navigate(`/curriculum/levels/${id}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
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
                                            Bạn có chắc chắn muốn ngừng hoạt động cấp độ này?
                                            Cấp độ sẽ không thể được sử dụng trong các khóa học mới.
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

                <div className="rounded-md border p-6 bg-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Thông tin cấp độ</h3>
                        <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã cấp độ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: L1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên cấp độ</FormLabel>
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
                                        <FormLabel>Thời lượng dự kiến (giờ)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
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

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
}
