"use client"

import * as React from "react"
import { useGetQADashboardQuery, useGetClassCombinedTrendDataQuery, useGetClassComparisonQuery } from "@/store/services/qaApi"
import { DashboardLayout } from "@/components/DashboardLayout"
import { RecentReports } from "@/components/qa/RecentReports"
import { QAKPISummary } from "@/components/qa/QAKPISummary"
import { QATasksPanel } from "@/components/qa/QATasksPanel"
import { ClassComparisonChart } from "@/components/qa/charts"
import { CombinedTrendChart } from "@/components/qa/charts/CombinedTrendChart"
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
import { AlertTriangle, BarChart3, TrendingUp } from "lucide-react"

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

    // Fetch combined trend data (attendance + homework) when class is selected
    const { 
        data: combinedTrendData, 
        isLoading: isTrendLoading,
        isFetching: isTrendFetching 
    } = useGetClassCombinedTrendDataQuery(selectedClassId!, {
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

    // Track if user has manually selected a class (to prevent auto-override)
    const [userSelectedClass, setUserSelectedClass] = React.useState(false)

    // Set default class when course changes or when classComparison loads
    // Only auto-select if user hasn't manually chosen
    React.useEffect(() => {
        if (!userSelectedClass && classesForSelectedCourse.length > 0) {
            // Find worst performing class (lowest value) as default
            const worstClass = classesForSelectedCourse.reduce((prev, curr) => 
                curr.value < prev.value ? curr : prev
            )
            setSelectedClassId(worstClass.classId)
        } else if (!userSelectedClass && dashboard?.trendData?.classId && !selectedClassId) {
            // Fallback to default trend data class
            setSelectedClassId(dashboard.trendData.classId)
        }
    }, [classesForSelectedCourse, dashboard?.trendData?.classId, userSelectedClass])

    // Handle course change
    const handleCourseChange = (value: string) => {
        const courseId = parseInt(value, 10)
        setSelectedCourseId(courseId)
        // Reset class selection - will be auto-set by useEffect
        setSelectedClassId(null)
        setUserSelectedClass(false) // Reset manual selection flag when course changes
    }

    // Handle class change for trend chart
    const handleClassChange = (value: string) => {
        const newClassId = parseInt(value, 10)
        setSelectedClassId(newClassId)
        setUserSelectedClass(true) // Mark as manually selected
    }

    // Get selected class info for display
    const selectedClassInfo = React.useMemo(() => {
        if (!selectedClassId) return null
        const fromComparison = classesForSelectedCourse.find(c => c.classId === selectedClassId)
        if (fromComparison) {
            return { classCode: fromComparison.classCode, classId: fromComparison.classId }
        }
        if (combinedTrendData) {
            return { classCode: combinedTrendData.classCode, classId: combinedTrendData.classId }
        }
        return null
    }, [selectedClassId, classesForSelectedCourse, combinedTrendData])

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
                <div className="space-y-4">
                    {/* KPI Summary skeleton */}
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                    {/* Charts skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

    return (
        <DashboardLayout
            title="Tổng Quan QA"
            description="Quản lý chất lượng đào tạo"
        >
            <div className="space-y-4">
                {/* Row 0: KPI Summary Cards */}
                <QAKPISummary data={dashboard.kpiSummary} />

                {/* Row 1: Class Comparison Chart + Tasks Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Class Comparison Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">So Sánh Lớp Học</CardTitle>
                                        <CardDescription className="text-xs">
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
                                            className="w-[180px]"
                                        />
                                    )}
                                    {/* Status Filter */}
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={setSelectedStatus}
                                    >
                                        <SelectTrigger className="w-[140px] h-9">
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
                        <CardContent className="pt-0">
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

                    {/* Tasks Panel (Draft Reports + Phases to Review) */}
                    <QATasksPanel 
                        draftReports={dashboard.draftReports}
                        completedPhases={dashboard.completedPhases}
                        className="min-h-[360px]"
                    />
                </div>

                {/* Row 2: Trend Chart + Recent Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Trend Chart - Xu hướng theo thời gian */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">Xu Hướng Theo Thời Gian</CardTitle>
                                        <CardDescription className="text-xs">
                                            Theo dõi tỷ lệ điểm danh và hoàn thành BTVN qua các tuần
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {classOptions.length > 0 && (
                                        <Combobox
                                            options={classOptions}
                                            value={selectedClassId?.toString() || ""}
                                            onValueChange={handleClassChange}
                                            placeholder="Chọn lớp"
                                            searchPlaceholder="Tìm lớp..."
                                            emptyText="Không tìm thấy lớp"
                                            className="w-[160px]"
                                        />
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {isTrendLoading || isTrendFetching ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-48 w-full" />
                                </div>
                            ) : combinedTrendData && combinedTrendData.dataPoints && combinedTrendData.dataPoints.length > 0 ? (
                                <CombinedTrendChart data={combinedTrendData} />
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                                    {selectedClassId
                                        ? "Chưa có dữ liệu cho lớp này"
                                        : "Chọn lớp để xem xu hướng"}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Reports */}
                    <RecentReports data={dashboard.recentReports} className="min-h-[320px]" />
                </div>
            </div>
        </DashboardLayout>
    )
}
