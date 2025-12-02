import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Clock,
    Users,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Search,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    useGetTimeSlotByIdQuery,
    useGetSessionsByTimeSlotIdQuery,
} from "@/store/services/resourceApi";
import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, isBefore } from "date-fns";
import { vi } from "date-fns/locale";

export default function TimeSlotDetailPage() {
    const { id } = useParams();
    const timeSlotId = Number(id);

    const { data: timeSlot, isLoading: isTimeSlotLoading } = useGetTimeSlotByIdQuery(timeSlotId, {
        skip: !id || isNaN(timeSlotId),
    });

    const { data: sessions, isLoading: isSessionsLoading } = useGetSessionsByTimeSlotIdQuery(timeSlotId, {
        skip: !id || isNaN(timeSlotId),
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc = newest first
    const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL"); // ALL, TODAY, THIS_WEEK, THIS_MONTH, LAST_MONTH
    const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("ALL"); // ALL, CLASS, TEACHER_RESCHEDULE
    const pageSize = 10;

    // Filter and paginate sessions
    const { paginatedSessions, totalPages, totalCount } = useMemo(() => {
        if (!sessions) return { paginatedSessions: [], totalPages: 0, totalCount: 0 };
        
        let filtered = [...sessions];
        
        // Search by class code
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(s => 
                s.classCode?.toLowerCase().includes(term)
            );
        }
        
        // Filter by session type
        if (sessionTypeFilter !== "ALL") {
            filtered = filtered.filter(s => s.type === sessionTypeFilter);
        }
        
        // Filter by date range
        if (dateRangeFilter !== "ALL") {
            const now = new Date();
            let rangeStart: Date;
            let rangeEnd: Date;
            
            switch (dateRangeFilter) {
                case "TODAY":
                    rangeStart = startOfDay(now);
                    rangeEnd = endOfDay(now);
                    break;
                case "THIS_WEEK":
                    rangeStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                    rangeEnd = endOfWeek(now, { weekStartsOn: 1 });
                    break;
                case "THIS_MONTH":
                    rangeStart = startOfMonth(now);
                    rangeEnd = endOfMonth(now);
                    break;
                case "LAST_MONTH":
                    const lastMonth = subMonths(now, 1);
                    rangeStart = startOfMonth(lastMonth);
                    rangeEnd = endOfMonth(lastMonth);
                    break;
                default:
                    rangeStart = new Date(0);
                    rangeEnd = new Date(8640000000000000);
            }
            
            filtered = filtered.filter(s => {
                const sessionDate = new Date(s.date);
                return isWithinInterval(sessionDate, { start: rangeStart, end: rangeEnd });
            });
        }
        
        // Filter by status (only DB statuses: PLANNED, DONE, CANCELLED)
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(s => s.status === statusFilter);
        }
        
        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });
        
        const total = Math.ceil(filtered.length / pageSize);
        const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        
        return { 
            paginatedSessions: paginated, 
            totalPages: total,
            totalCount: filtered.length 
        };
    }, [sessions, statusFilter, searchTerm, sortOrder, dateRangeFilter, sessionTypeFilter, currentPage]);

    if (isTimeSlotLoading) {
        return (
            <DashboardLayout title="Chi tiết Khung giờ" description="Đang tải thông tin...">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!timeSlot) {
        return (
            <DashboardLayout title="Chi tiết Khung giờ" description="Không tìm thấy khung giờ">
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Không tìm thấy khung giờ</h3>
                    <p className="text-muted-foreground">Vui lòng quay lại và thử lại.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={timeSlot.name}
            description={`Chi nhánh: ${timeSlot.branchName}`}
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lớp đang áp dụng</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{timeSlot.activeClassesCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Lớp học đang dùng khung giờ này</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng số buổi học</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{timeSlot.totalSessionsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Buổi học đã và sẽ diễn ra</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Thông tin chung</TabsTrigger>
                        <TabsTrigger value="schedule">Lịch sử dụng</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Thông tin cơ bản
                                    {timeSlot.status === "INACTIVE" && (
                                        <Badge variant="destructive" className="ml-2">
                                            Đã ngưng hoạt động
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Tên khung giờ</span>
                                        <p className="font-medium">{timeSlot.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Chi nhánh</span>
                                        <p className="font-medium">{timeSlot.branchName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Giờ bắt đầu</span>
                                        <p className="font-medium">{timeSlot.startTime.slice(0, 5)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Giờ kết thúc</span>
                                        <p className="font-medium">{timeSlot.endTime.slice(0, 5)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Ngày tạo</span>
                                        <p className="font-medium">{format(new Date(timeSlot.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Cập nhật lần cuối</span>
                                        <p className="font-medium">{format(new Date(timeSlot.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarDays className="h-5 w-5" />
                                            Danh sách buổi học sử dụng khung giờ này
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                                            className="gap-1"
                                        >
                                            {sortOrder === "desc" ? (
                                                <>
                                                    <ArrowDown className="h-4 w-4" />
                                                    Mới nhất
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowUp className="h-4 w-4" />
                                                    Cũ nhất
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    {/* Search and Filters */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1 max-w-xs">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Tìm theo mã lớp..."
                                                    value={searchTerm}
                                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                            <Select value={dateRangeFilter} onValueChange={(v) => { setDateRangeFilter(v); setCurrentPage(1); }}>
                                                <SelectTrigger className="w-36 h-9">
                                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                                    <SelectValue placeholder="Thời gian" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Tất cả thời gian</SelectItem>
                                                    <SelectItem value="TODAY">Hôm nay</SelectItem>
                                                    <SelectItem value="THIS_WEEK">Tuần này</SelectItem>
                                                    <SelectItem value="THIS_MONTH">Tháng này</SelectItem>
                                                    <SelectItem value="LAST_MONTH">Tháng trước</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                                                <SelectTrigger className="w-36 h-9">
                                                    <SelectValue placeholder="Trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                                    <SelectItem value="PLANNED">Dự kiến</SelectItem>
                                                    <SelectItem value="DONE">Đã hoàn thành</SelectItem>
                                                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={sessionTypeFilter} onValueChange={(v) => { setSessionTypeFilter(v); setCurrentPage(1); }}>
                                                <SelectTrigger className="w-36 h-9">
                                                    <SelectValue placeholder="Loại" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Tất cả loại</SelectItem>
                                                    <SelectItem value="CLASS">Buổi học</SelectItem>
                                                    <SelectItem value="TEACHER_RESCHEDULE">Dạy bù</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {(searchTerm || statusFilter !== "ALL" || dateRangeFilter !== "ALL" || sessionTypeFilter !== "ALL") && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setStatusFilter("ALL");
                                                        setDateRangeFilter("ALL");
                                                        setSessionTypeFilter("ALL");
                                                        setCurrentPage(1);
                                                    }}
                                                    className="text-muted-foreground h-9"
                                                >
                                                    Xóa bộ lọc
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {totalCount > 0 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} buổi học
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isSessionsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : paginatedSessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {paginatedSessions.map((session) => {
                                            const sessionDate = new Date(session.date);
                                            const today = startOfDay(new Date());
                                            const isPast = isBefore(sessionDate, today);
                                            const isToday = format(sessionDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                                            
                                            return (
                                                <div 
                                                    key={session.id} 
                                                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                                        isToday ? "bg-blue-50 border-blue-200" : 
                                                        isPast ? "bg-muted/30" : "bg-background hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${
                                                            isToday ? "bg-blue-500 text-white" :
                                                            isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                                        }`}>
                                                            <span className="text-xs font-medium uppercase">
                                                                {format(sessionDate, "EEE", { locale: vi })}
                                                            </span>
                                                            <span className="text-lg font-bold">
                                                                {format(sessionDate, "dd")}
                                                            </span>
                                                            <span className="text-xs">
                                                                {format(sessionDate, "MM/yy")}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{session.classCode}</span>
                                                                {isToday && (
                                                                    <Badge className="bg-blue-500">Hôm nay</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <Badge variant="outline" className="font-normal">
                                                                    {session.type === "CLASS" ? "Buổi học" :
                                                                        session.type === "TEACHER_RESCHEDULE" ? "Dạy bù" : session.type}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant={
                                                        session.status === "PLANNED" ? "secondary" :
                                                            session.status === "DONE" ? "outline" :
                                                                session.status === "CANCELLED" ? "destructive" : "outline"
                                                    } className={session.status === "DONE" ? "bg-green-100 text-green-700 border-green-200" : ""}>
                                                        {session.status === "PLANNED" ? "Dự kiến" :
                                                            session.status === "DONE" ? "Hoàn thành" :
                                                                session.status === "CANCELLED" ? "Đã hủy" : session.status}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Trước
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                        .filter(page => 
                                                            page === 1 || 
                                                            page === totalPages || 
                                                            Math.abs(page - currentPage) <= 1
                                                        )
                                                        .map((page, idx, arr) => (
                                                            <span key={page} className="flex items-center">
                                                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                                    <span className="px-2 text-muted-foreground">...</span>
                                                                )}
                                                                <Button
                                                                    variant={currentPage === page ? "default" : "outline"}
                                                                    size="sm"
                                                                    className="w-8 h-8 p-0"
                                                                    onClick={() => setCurrentPage(page)}
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </span>
                                                        ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Sau
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-muted-foreground">
                                            {(searchTerm || statusFilter !== "ALL" || dateRangeFilter !== "ALL" || sessionTypeFilter !== "ALL") 
                                                ? "Không có buổi học nào phù hợp với bộ lọc." 
                                                : "Chưa có buổi học nào sử dụng khung giờ này."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout >
    );
}
