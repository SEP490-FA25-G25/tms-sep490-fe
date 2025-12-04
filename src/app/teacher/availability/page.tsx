import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Save, Calendar, Lock, CheckCircle } from "lucide-react";
import { useGetTimeSlotsQuery, type TimeSlot } from "@/store/services/resourceApi";
import {
    useGetMyAvailabilityQuery,
    useUpdateMyAvailabilityMutation,
    type AvailabilityDTO,
    teacherAvailabilityApi,
} from "@/store/services/teacherAvailabilityApi";
import { AvailabilityMatrix } from "./components/AvailabilityMatrix";
import { toast } from "sonner";
import { selectUser } from "@/store/slices/authSlice";

const TeacherAvailabilityPage = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const userId = user?.id;
    
    // Pass userId as query arg to force cache invalidation when user changes
    const { 
        data: availabilityData, 
        refetch
    } = useGetMyAvailabilityQuery(userId || undefined, {
        skip: !userId,
        // Force refetch when user changes
        refetchOnMountOrArgChange: true,
    });
    
    // Use timeSlots from response if available, otherwise fallback to separate query
    const { data: fallbackTimeSlots = [] } = useGetTimeSlotsQuery({}, {
        skip: !!availabilityData?.timeSlots && availabilityData.timeSlots.length > 0
    });
    
    // Convert TimeSlotTemplateDTO[] to TimeSlot[] if needed
    const timeSlots: TimeSlot[] = availabilityData?.timeSlots
        ? availabilityData.timeSlots.map(tst => ({
            id: tst.id,
            branchId: 0, // Not available in TimeSlotTemplateDTO
            branchName: '', // Not available in TimeSlotTemplateDTO
            name: tst.name,
            startTime: tst.startTime,
            endTime: tst.endTime,
            createdAt: '',
            updatedAt: '',
            status: 'ACTIVE' as const,
        }))
        : fallbackTimeSlots;
    
    const [updateAvailability, { isLoading: isSaving }] =
        useUpdateMyAvailabilityMutation();

    const [localAvailabilities, setLocalAvailabilities] = useState<AvailabilityDTO[]>(
        []
    );

    // Reset local state and clear cache when user changes
    useEffect(() => {
        if (!userId) {
            setLocalAvailabilities([]);
            return;
        }

        console.log('[TeacherAvailability] User changed, userId:', userId);
        
        // Clear local state first
        setLocalAvailabilities([]);
        
        // Reset entire API state to clear all cached data
        dispatch(
            teacherAvailabilityApi.util.resetApiState()
        );
        
        console.log('[TeacherAvailability] API state reset, refetching...');
        
        // Force refetch after a small delay to ensure cache is cleared
        const timeoutId = setTimeout(() => {
            refetch().then(() => {
                console.log('[TeacherAvailability] Refetch completed');
            }).catch((err) => {
                console.error('[TeacherAvailability] Refetch error:', err);
            });
        }, 50);
        
        return () => clearTimeout(timeoutId);
    }, [userId, dispatch, refetch]);

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
        } catch (error: unknown) {
            // Extract error message from backend response
            const errorMessage = 
                (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data && typeof error.data.message === 'string')
                    ? error.data.message
                    : (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
                        ? error.message
                        : "Lỗi khi lưu lịch đăng ký";
            toast.error(errorMessage);
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
                        {availabilityData?.activeCampaign && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm font-medium text-blue-900">
                                    📢 {availabilityData.activeCampaign.name}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Hạn chót: {new Date(availabilityData.activeCampaign.deadline).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        )}
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
                        {availabilityData ? (
                            <AvailabilityMatrix
                                timeSlots={timeSlots}
                                availabilityData={{
                                    ...availabilityData,
                                    availabilities: localAvailabilities,
                                    lockedSlots: availabilityData.lockedSlots || [],
                                }}
                                onChange={setLocalAvailabilities}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Đang tải dữ liệu...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default TeacherAvailabilityPage;
