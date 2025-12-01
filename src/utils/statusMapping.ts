
export const statusMapping: Record<string, string> = {
    // Common
    ACTIVE: "Hoạt động",
    INACTIVE: "Ngừng hoạt động",
    DRAFT: "Nháp",

    // Course Specific
    SUBMITTED: "Đã gửi",
    REJECTED: "Bị từ chối",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",

    // Enrollment
    ENROLLED: "Đang học",
    DROPPED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FAILED: "Thất bại",

    // Attendance
    PRESENT: "Có mặt",
    ABSENT: "Vắng mặt",
    LATE: "Đi muộn",
    EXCUSED: "Có phép",
};

export const getStatusLabel = (status: string | null | undefined): string => {
    if (!status) return "N/A";
    return statusMapping[status] || status;
};

export const getStatusColor = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    switch (status) {
        case 'ACTIVE':
        case 'APPROVED':
        case 'COMPLETED':
        case 'PRESENT':
            return 'success';
        case 'DRAFT':
        case 'PENDING':
        case 'ENROLLED':
        case 'LATE':
        case 'EXCUSED':
            return 'warning';
        case 'INACTIVE':
        case 'REJECTED':
        case 'DROPPED':
        case 'FAILED':
        case 'ABSENT':
            return 'destructive';
        case 'SUBMITTED':
            return 'info';
        default:
            return 'default';
    }
};
