import { useState } from "react";
import { format } from "date-fns";
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
import { Eye, CheckCircle, XCircle, Loader2, MoreVertical } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    useGetAllCoursesQuery,
    useApproveCourseMutation,
    useRejectCourseMutation
} from "@/store/services/courseApi";
import type { CourseDTO } from "@/store/services/courseApi";
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
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
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

    const handleApprove = async () => {
        if (!selectedCourseId) return;
        try {
            await approveCourse(selectedCourseId).unwrap();
            toast.success("Đã phê duyệt khóa học thành công");
            setApproveDialogOpen(false);
            setSelectedCourseId(null);
        } catch (error) {
            console.error("Failed to approve course:", error);
            toast.error("Phê duyệt thất bại. Vui lòng thử lại.");
        }
    };

    const openApproveDialog = (id: number) => {
        setSelectedCourseId(id);
        setApproveDialogOpen(true);
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

    const getStatusBadge = (course: CourseDTO) => {
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
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">Chờ duyệt</Badge>;
            case "ACTIVE":
                return <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Đã duyệt</Badge>;
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
                            <TableHead>Ngày gửi</TableHead>
                            <TableHead>Ngày xử lý</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Lý do từ chối</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.code}</TableCell>
                                    <TableCell>{course.name}</TableCell>
                                    <TableCell>{course.requesterName || "N/A"}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {course.submittedAt ? format(new Date(course.submittedAt), "dd/MM/yyyy HH:mm") : "-"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {(course.approvalStatus === 'ACTIVE' || course.approvalStatus === 'REJECTED') && course.decidedAt
                                            ? format(new Date(course.decidedAt), "dd/MM/yyyy HH:mm")
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(course)}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={course.rejectionReason}>
                                        {course.approvalStatus === 'REJECTED' ? course.rejectionReason : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-48 p-1">
                                                <div className="flex flex-col gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full justify-start gap-2 h-9 px-2"
                                                        onClick={() => navigate(`/curriculum/courses/${course.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Xem chi tiết
                                                    </Button>
                                                    {!readOnly && course.status === 'SUBMITTED' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full justify-start gap-2 h-9 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => openApproveDialog(course.id)}
                                                                disabled={isApproving}
                                                            >
                                                                {isApproving && selectedCourseId === course.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4" />
                                                                )}
                                                                Phê duyệt
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full justify-start gap-2 h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openRejectDialog(course.id)}
                                                                disabled={isRejecting}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                Từ chối
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận phê duyệt</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn phê duyệt khóa học này không? Hành động này sẽ công khai khóa học cho toàn bộ hệ thống.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={isApproving}
                        >
                            {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
