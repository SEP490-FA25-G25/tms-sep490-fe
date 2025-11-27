import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
    useGetAllCoursesQuery,
    useApproveCourseMutation,
    useRejectCourseMutation
} from "@/store/services/courseApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CourseApprovalListProps {
    readOnly?: boolean;
}

export function CourseApprovalList({ readOnly = false }: CourseApprovalListProps) {
    const navigate = useNavigate();
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [filterStatus, setFilterStatus] = useState<string>("SUBMITTED");

    // Fetch all courses
    const { data: courses, isLoading } = useGetAllCoursesQuery();

    const [approveCourse, { isLoading: isApproving }] = useApproveCourseMutation();
    const [rejectCourse, { isLoading: isRejecting }] = useRejectCourseMutation();

    const filteredCourses = courses?.filter(c => {
        const status = c.status || "";
        const approvalStatus = c.approvalStatus || "";

        if (filterStatus === "ALL") {
            return ["SUBMITTED", "ACTIVE", "REJECTED"].includes(status) || approvalStatus === "REJECTED";
        }

        if (filterStatus === "REJECTED") {
            return approvalStatus === "REJECTED";
        }

        return status === filterStatus;
    }) || [];

    const handleApprove = async (id: number) => {
        try {
            await approveCourse(id).unwrap();
            toast.success("Đã phê duyệt khóa học thành công");
        } catch (error) {
            console.error("Failed to approve course:", error);
            toast.error("Phê duyệt thất bại. Vui lòng thử lại.");
        }
    };

    const openRejectDialog = (id: number) => {
        setSelectedCourseId(id);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleReject = async () => {
        if (selectedCourseId && rejectReason.trim()) {
            try {
                await rejectCourse({ id: selectedCourseId, reason: rejectReason }).unwrap();
                toast.success("Đã từ chối khóa học");
                setRejectDialogOpen(false);
                setSelectedCourseId(null);
            } catch (error) {
                console.error("Failed to reject course:", error);
                toast.error("Từ chối thất bại. Vui lòng thử lại.");
            }
        } else {
            toast.error("Vui lòng nhập lý do từ chối");
        }
    };

    const getStatusBadge = (course: any) => {
        const status = course.status || "";
        const approvalStatus = course.approvalStatus || "";

        if (approvalStatus === "REJECTED") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="destructive" className="cursor-help">Đã từ chối</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lý do: {course.rejectionReason || "Không có lý do"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        switch (status) {
            case "SUBMITTED":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Chờ phê duyệt</Badge>;
            case "ACTIVE":
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Đã phê duyệt</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-[200px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SUBMITTED">Chờ phê duyệt</SelectItem>
                            <SelectItem value="ACTIVE">Đã phê duyệt</SelectItem>
                            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã khóa học</TableHead>
                            <TableHead>Tên khóa học</TableHead>
                            <TableHead>Người yêu cầu</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Lý do từ chối</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.code}</TableCell>
                                    <TableCell>{course.name}</TableCell>
                                    <TableCell>{course.requesterName || "N/A"}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(course)}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={course.rejectionReason}>
                                        {course.approvalStatus === 'REJECTED' ? course.rejectionReason : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {!readOnly && course.status === 'SUBMITTED' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleApprove(course.id)}
                                                        disabled={isApproving}
                                                        title="Phê duyệt"
                                                    >
                                                        {isApproving && selectedCourseId === course.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => openRejectDialog(course.id)}
                                                        disabled={isRejecting}
                                                        title="Từ chối"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Không có khóa học nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối phê duyệt khóa học</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
