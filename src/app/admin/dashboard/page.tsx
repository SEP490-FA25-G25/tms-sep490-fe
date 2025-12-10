"use client";

import { type CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminRoute } from "@/components/ProtectedRoute";
import { useGetAdminStatsQuery } from "@/store/services/dashboardApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminDashboardPage() {
    const { data: statsResponse, isLoading, error } = useGetAdminStatsQuery();
    const stats = statsResponse?.data;

    // Chuyển đổi data cho charts
    const roleData = stats
        ? Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value }))
        : [];

    const branchData = stats
        ? Object.entries(stats.usersByBranch).map(([name, value]) => ({ name, value }))
        : [];

    const dailyData = stats
        ? stats.newUsersLast7Days.map((item) => ({
            date: new Date(item.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
            }),
            count: item.count,
        }))
        : [];

    return (
        <AdminRoute>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                {/* Header */}
                                <div className="px-4 lg:px-6">
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        Bảng điều khiển
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        Thống kê tổng quan hệ thống
                                    </p>
                                </div>

                                {/* Content */}
                                <div className="px-4 lg:px-6 space-y-6">
                                    {isLoading ? (
                                        <div className="animate-pulse space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : error || !stats ? (
                                        <p className="text-red-500">Không thể tải thống kê. Vui lòng thử lại sau.</p>
                                    ) : (
                                        <>
                                            {/* Stats Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            Tổng người dùng
                                                        </CardTitle>
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            Đang hoạt động
                                                        </CardTitle>
                                                        <UserCheck className="h-4 w-4 text-green-500" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            Đã vô hiệu hóa
                                                        </CardTitle>
                                                        <UserX className="h-4 w-4 text-red-500" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
                                                    </CardContent>
                                                </Card>

                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                                            Số chi nhánh
                                                        </CardTitle>
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{stats.totalBranches}</div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Charts */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Pie Chart - Users by Role */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Phân bố theo Role</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex flex-col items-center">
                                                            {/* Pie Chart lớn căn giữa */}
                                                            <ResponsiveContainer width="100%" height={250}>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={roleData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={60}
                                                                        outerRadius={100}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                    >
                                                                        {roleData.map((_, index) => (
                                                                            <Cell
                                                                                key={`cell-${index}`}
                                                                                fill={COLORS[index % COLORS.length]}
                                                                            />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>

                                                            {/* Legend ở dưới */}
                                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                                                                {roleData.map((item, index) => (
                                                                    <div key={item.name} className="flex items-center gap-2">
                                                                        <div
                                                                            className="w-3 h-3 rounded-sm"
                                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                                        />
                                                                        <span className="text-sm">
                                                                            {item.name}: <span className="font-medium">{item.value}</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Bar Chart - Users by Branch */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>Phân bố theo Chi nhánh</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={branchData}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="name" />
                                                                <YAxis />
                                                                <Tooltip />
                                                                <Bar dataKey="value" fill="#3b82f6" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Line Chart - New Users */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Người dùng mới (7 ngày qua)</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={dailyData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="count"
                                                                stroke="#10b981"
                                                                strokeWidth={2}
                                                                name="Người dùng mới"
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AdminRoute>
    );
}
