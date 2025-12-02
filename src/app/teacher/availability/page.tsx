import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Save, Calendar, Lock, CheckCircle } from "lucide-react";
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
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Đăng ký Lịch giảng dạy
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Vui lòng đăng ký các khung giờ bạn có thể nhận lớp trong tuần.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đăng ký Rảnh</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{totalSlots}</div>
                            <p className="text-xs text-muted-foreground">Số slot bạn đã chọn</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đang dạy (Locked)</CardTitle>
                            <Lock className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{lockedSlotsCount}</div>
                            <p className="text-xs text-muted-foreground">Số slot đã có lớp</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng năng suất</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {totalSlots + lockedSlotsCount}
                            </div>
                            <p className="text-xs text-muted-foreground">Tổng slot/tuần</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Alert */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Hướng dẫn</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Click vào các ô để chọn/bỏ chọn lịch rảnh. Các ô có biểu tượng ổ khóa (🔒) là các khung giờ bạn đang có lớp dạy, không thể thay đổi.
                    </AlertDescription>
                </Alert>

                {/* Matrix */}
                <Card>
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
            </div>
        </DashboardLayout>
    );
};

export default TeacherAvailabilityPage;
