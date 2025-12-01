import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Save } from "lucide-react";
import { useGetTimeSlotsQuery } from "@/store/services/resourceApi";
import {
    useGetMyAvailabilityQuery,
    useUpdateMyAvailabilityMutation,
    type AvailabilityDTO,
} from "@/store/services/teacherAvailabilityApi";
import { AvailabilityMatrix } from "./components/AvailabilityMatrix";
import { toast } from "sonner";

const TeacherAvailabilityPage = () => {
    const { data: timeSlots = [] } = useGetTimeSlotsQuery({});
    const { data: availabilityData, refetch } = useGetMyAvailabilityQuery();
    const [updateAvailability, { isLoading: isSaving }] =
        useUpdateMyAvailabilityMutation();

    const [localAvailabilities, setLocalAvailabilities] = useState<AvailabilityDTO[]>(
        []
    );

    useEffect(() => {
        if (availabilityData) {
            setLocalAvailabilities(availabilityData.availabilities);
        }
    }, [availabilityData]);

    const handleSave = async () => {
        try {
            await updateAvailability({ availabilities: localAvailabilities }).unwrap();
            toast.success("Đã lưu lịch đăng ký thành công");
            refetch();
        } catch (error) {
            toast.error("Lỗi khi lưu lịch đăng ký");
            console.error(error);
        }
    };

    const totalSlots = localAvailabilities.length;
    const lockedSlotsCount = availabilityData?.lockedSlots.length || 0;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Đăng ký Lịch giảng dạy
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Vui lòng đăng ký các khung giờ bạn có thể nhận lớp trong tuần.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Lưu ý</AlertTitle>
                <AlertDescription>
                    Các ô có biểu tượng ổ khóa (🔒) là các khung giờ bạn đang có lớp dạy,
                    không thể thay đổi trạng thái.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Bảng đăng ký (Availability Matrix)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AvailabilityMatrix
                            timeSlots={timeSlots}
                            availabilityData={{
                                ...availabilityData!,
                                availabilities: localAvailabilities,
                            }}
                            onChange={setLocalAvailabilities}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Thống kê</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-sm font-medium text-green-800">
                                Đăng ký Rảnh
                            </span>
                            <span className="text-2xl font-bold text-green-600">
                                {totalSlots}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-800">
                                Đang dạy (Locked)
                            </span>
                            <span className="text-2xl font-bold text-gray-600">
                                {lockedSlotsCount}
                            </span>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Tổng năng suất</span>
                                <span className="text-xl font-bold">
                                    {totalSlots + lockedSlotsCount} slots/tuần
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TeacherAvailabilityPage;
