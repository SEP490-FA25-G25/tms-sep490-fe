"use client"

import * as React from "react"
import { useGetQADashboardQuery, useGetClassTrendDataQuery, useGetClassComparisonQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { RecentReports } from "@/components/qa/RecentReports"
import { ClassComparisonChart, TrendChart } from "@/components/qa/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle, BarChart3, TrendingUp, FileText } from "lucide-react"
import { Link } from "react-router-dom"

// Class status options for filter
const CLASS_STATUS_OPTIONS: ComboboxOption[] = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ONGOING", label: "Đang học" },
    { value: "SCHEDULED", label: "Đã lên lịch" },
    { value: "COMPLETED", label: "Hoàn thành" },
]

export default function QADashboardPage() {
    // State for chart selections
    const [selectedCourseId, setSelectedCourseId] = React.useState<number | null>(null)
    const [selectedClassId, setSelectedClassId] = React.useState<number | null>(null)
    const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL")

    const { data: dashboard, isLoading, error } = useGetQADashboardQuery({})

    // Fetch trend data when class is selected
    const { 
        data: trendData, 
        isLoading: isTrendLoading,
        isFetching: isTrendFetching 
    } = useGetClassTrendDataQuery(selectedClassId!, {
        skip: !selectedClassId,
    })

    // Fetch comparison data when course is selected (dynamic)
    const {
        data: comparisonData,
        isLoading: isComparisonLoading,
        isFetching: isComparisonFetching
    } = useGetClassComparisonQuery(
        { 
            courseId: selectedCourseId!, 
            metricType: 'ATTENDANCE',
            status: selectedStatus !== "ALL" ? selectedStatus : undefined 
        },
        { skip: !selectedCourseId }
    )

    // Set default course selection when data loads
    React.useEffect(() => {
        if (dashboard?.courseOptions && dashboard.courseOptions.length > 0 && !selectedCourseId) {
            setSelectedCourseId(dashboard.courseOptions[0].courseId)
        }
    }, [dashboard?.courseOptions, selectedCourseId])

    // Get classes for selected course from dynamic comparison data
    const classesForSelectedCourse = React.useMemo(() => {
        if (!comparisonData) return []
        return comparisonData.classes || []
    }, [comparisonData])

    // Set default class when course changes or when classComparison loads
    React.useEffect(() => {
        if (classesForSelectedCourse.length > 0) {
            // Find worst performing class (lowest value) as default
            const worstClass = classesForSelectedCourse.reduce((prev, curr) => 
                curr.value < prev.value ? curr : prev
            )
            setSelectedClassId(worstClass.classId)
        } else if (dashboard?.trendData?.classId && !selectedClassId) {
            // Fallback to default trend data class
            setSelectedClassId(dashboard.trendData.classId)
        }
    }, [classesForSelectedCourse, dashboard?.trendData?.classId, selectedClassId])

    // Handle course change
    const handleCourseChange = (value: string) => {
        const courseId = parseInt(value, 10)
        setSelectedCourseId(courseId)
        // Reset class selection - will be auto-set by useEffect
        setSelectedClassId(null)
    }

    // Handle class change for trend chart
    const handleClassChange = (value: string) => {
        setSelectedClassId(parseInt(value, 10))
    }

    // Get selected class info for display
    const selectedClassInfo = React.useMemo(() => {
        if (!selectedClassId) return null
        const fromComparison = classesForSelectedCourse.find(c => c.classId === selectedClassId)
        if (fromComparison) {
            return { classCode: fromComparison.classCode, classId: fromComparison.classId }
        }
        if (trendData) {
            return { classCode: trendData.classCode, classId: trendData.classId }
        }
        return null
    }, [selectedClassId, classesForSelectedCourse, trendData])

    // Memoized options for comboboxes
    const courseOptions: ComboboxOption[] = React.useMemo(() => {
        if (!dashboard?.courseOptions) return []
        return dashboard.courseOptions.map(course => ({
            value: course.courseId.toString(),
            label: course.courseName,
        }))
    }, [dashboard?.courseOptions])

    const classOptions: ComboboxOption[] = React.useMemo(() => {
        return classesForSelectedCourse.map(cls => ({
            value: cls.classId.toString(),
            label: cls.classCode,
        }))
    }, [classesForSelectedCourse])

    if (isLoading) {
        return (
            <DashboardLayout
                title="Tổng Quan QA"
                description="Quản lý chất lượng đào tạo"
            >
                <div className="space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-80 lg:col-span-2" />
                        <Skeleton className="h-80" />
                    </div>
                    <Skeleton className="h-72 w-full" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout
                title="Tổng Quan QA"
                description="Quản lý chất lượng đào tạo"
            >
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        )
    }

    if (!dashboard) {
        return (
            <DashboardLayout
                title="Tổng Quan QA"
                description="Quản lý chất lượng đào tạo"
            >
                <div className="text-center py-12 text-muted-foreground">
                    Không có dữ liệu để hiển thị.
                </div>
            </DashboardLayout>
        )
    }

    // Use fetched trendData or fallback to dashboard's default trendData
    const displayTrendData = trendData || dashboard.trendData

    return (
        <DashboardLayout
            title="Tổng Quan QA"
            description="Quản lý chất lượng đào tạo"
        >
            <div className="space-y-6">
                {/* Row 1: Class Comparison Chart + Recent Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Class Comparison Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">So Sánh Lớp Học</CardTitle>
                                        <CardDescription>
                                            Tỷ lệ điểm danh theo lớp trong cùng khóa học
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Course Combobox */}
                                    {courseOptions.length > 0 && (
                                        <Combobox
                                            options={courseOptions}
                                            value={selectedCourseId?.toString() || ""}
                                            onValueChange={handleCourseChange}
                                            placeholder="Chọn khóa học"
                                            searchPlaceholder="Tìm khóa học..."
                                            emptyText="Không tìm thấy khóa học"
                                            className="w-[200px]"
                                        />
                                    )}
                                    {/* Status Filter */}
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={setSelectedStatus}
                                    >
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CLASS_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isComparisonLoading || isComparisonFetching ? (
                                <div className="flex items-center justify-center h-64">
                                    <Skeleton className="h-48 w-full" />
                                </div>
                            ) : comparisonData && comparisonData.classes && comparisonData.classes.length > 0 ? (
                                <ClassComparisonChart data={comparisonData} />
                            ) : (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    {selectedCourseId 
                                        ? "Không có lớp học nào phù hợp với bộ lọc"
                                        : "Chọn khóa học để xem so sánh"
                                    }
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Reports */}
                    {dashboard.recentReports && (
                        <RecentReports data={dashboard.recentReports} />
                    )}
                </div>

                {/* Row 3: Trend Chart - Xu hướng theo thời gian */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-lg">Xu Hướng Theo Thời Gian</CardTitle>
                                    <CardDescription>
                                        Theo dõi tỷ lệ điểm danh của lớp qua các tuần
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {classOptions.length > 0 && (
                                    <Combobox
                                        options={classOptions}
                                        value={selectedClassId?.toString() || ""}
                                        onValueChange={handleClassChange}
                                        placeholder="Chọn lớp"
                                        searchPlaceholder="Tìm lớp..."
                                        emptyText="Không tìm thấy lớp"
                                        className="w-[180px]"
                                    />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isTrendLoading || isTrendFetching ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-56 w-full" />
                            </div>
                        ) : displayTrendData && displayTrendData.dataPoints && displayTrendData.dataPoints.length > 0 ? (
                            <div className="space-y-4">
                                <TrendChart
                                    data={displayTrendData}
                                    metricLabel="Điểm danh"
                                />
                                {/* Quick action to create report */}
                                {selectedClassInfo && (
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <span className="text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4 inline mr-1" />
                                            Tạo báo cáo về {selectedClassInfo.classCode}
                                        </span>
                                        <Link to={`/qa/reports/create?classId=${selectedClassInfo.classId}`}>
                                            <Button variant="outline" size="sm">
                                                Tạo báo cáo →
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                {selectedClassId
                                    ? "Chưa có dữ liệu điểm danh cho lớp này"
                                    : "Chọn lớp để xem xu hướng"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
