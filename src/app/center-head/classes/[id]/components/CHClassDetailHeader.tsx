import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { ClassDetailDTO } from '@/store/services/classApi'
import { useApproveClassMutation, useRejectClassMutation } from '@/store/services/classApi'
import { toast } from '@/components/ui/sonner'
import {
    BookOpen,
    Calendar,
    Clock,
    MapPin,
    Users,
    Building,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    ArrowLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CHClassDetailHeaderProps {
    classData: ClassDetailDTO
    onApprovalSuccess?: () => void
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return 'bg-slate-100 text-slate-800 border-slate-200'
        case 'SUBMITTED':
            return 'bg-amber-100 text-amber-800 border-amber-200'
        case 'ONGOING':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200'
        case 'SCHEDULED':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'COMPLETED':
            return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'CANCELLED':
            return 'bg-rose-100 text-rose-800 border-rose-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return 'Bản nháp'
        case 'SUBMITTED':
            return 'Đã gửi duyệt'
        case 'SCHEDULED':
            return 'Đã lên lịch'
        case 'ONGOING':
            return 'Đang diễn ra'
        case 'COMPLETED':
            return 'Đã hoàn thành'
        case 'CANCELLED':
            return 'Đã hủy'
        default:
            return status
    }
}

const getModalityLabel = (modality: string) => {
    switch (modality) {
        case 'ONLINE':
            return 'Trực tuyến'
        case 'OFFLINE':
            return 'Trực tiếp'
        default:
            return modality
    }
}

const getUnifiedStatus = (status: string, approval?: string | null) => {
    if (approval === 'PENDING') {
        return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    }
    if (approval === 'REJECTED') {
        return { label: 'Đã từ chối', color: 'bg-rose-100 text-rose-800 border-rose-200' }
    }
    if (approval === 'APPROVED') {
        return { label: 'Đã duyệt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    }
    return { label: getStatusLabel(status), color: getStatusColor(status) }
}

const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 80) return 'text-emerald-600'
    if (percentage < 95) return 'text-amber-600'
    return 'text-rose-600'
}

export function CHClassDetailHeader({
    classData,
    onApprovalSuccess,
}: CHClassDetailHeaderProps) {
    const navigate = useNavigate()
    const unified = getUnifiedStatus(classData.status, classData.approvalStatus)

    // Modal states
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    // Mutations
    const [approveClass, { isLoading: isApproving }] = useApproveClassMutation()
    const [rejectClass, { isLoading: isRejecting }] = useRejectClassMutation()

    // Check if approval actions are available
    const canApprove = classData.approvalStatus === 'PENDING'

    const handleApprove = async () => {
        try {
            await approveClass(classData.id).unwrap()
            toast.success('Đã phê duyệt lớp học thành công')
            setApproveDialogOpen(false)
            onApprovalSuccess?.()
        } catch {
            toast.error('Phê duyệt thất bại. Vui lòng thử lại.')
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            await rejectClass({ classId: classData.id, reason: rejectReason }).unwrap()
            toast.success('Đã từ chối lớp học')
            setRejectDialogOpen(false)
            setRejectReason('')
            onApprovalSuccess?.()
        } catch {
            toast.error('Từ chối thất bại. Vui lòng thử lại.')
        }
    }

    return (
        <>
            <div className="border-b bg-background">
                <div className="@container/main py-6 md:py-8">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                        {/* Header top row */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                {/* Back button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/center-head/approvals')}
                                    className="mb-2"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Quay lại danh sách
                                </Button>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={unified.color}>
                                        {unified.label}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                        {classData.name}
                                    </h1>
                                    <p className="text-lg text-muted-foreground">{classData.code}</p>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {classData.subject.level?.curriculum && (
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{classData.subject.level.curriculum.name}</span>
                                        </div>
                                    )}
                                    {classData.subject.level && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                {classData.subject.level.name}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        <span>{classData.branch.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {canApprove && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => setRejectDialogOpen(true)}
                                            disabled={isRejecting}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Từ chối
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => setApproveDialogOpen(true)}
                                            disabled={isApproving}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Phê duyệt
                                        </Button>
                                    </>
                                )}

                                {!canApprove && classData.approvalStatus === 'APPROVED' && (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Đã phê duyệt
                                    </Badge>
                                )}

                                {!canApprove && classData.approvalStatus === 'REJECTED' && (
                                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Đã từ chối
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Rejection Alert */}
                        {classData.approvalStatus === 'REJECTED' && classData.rejectionReason && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Lớp học bị từ chối</AlertTitle>
                                <AlertDescription>
                                    Lý do: {classData.rejectionReason}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Info grid - responsive: 2 cols on mobile, 4 cols on tablet+ */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Modality */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium">Hình thức</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {getModalityLabel(classData.modality)}
                                </p>
                            </div>

                            {/* Schedule */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium">Lịch học</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground whitespace-normal">
                                    {classData.scheduleDetails && classData.scheduleDetails.length > 0
                                        ? classData.scheduleDetails
                                            .map((d) => `${d.day}\u00A0${d.startTime}-${d.endTime}`)
                                            .join(', ')
                                        : '—'}
                                </p>
                            </div>

                            {/* Date Range */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium">Thời gian</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {formatDate(classData.startDate)} - {formatDate(classData.plannedEndDate)}
                                </p>
                            </div>

                            {/* Enrollment */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium">Sĩ số</span>
                                </div>
                                <p className={`text-sm font-semibold ${getCapacityColor(classData.enrollmentSummary.currentEnrolled, classData.enrollmentSummary.maxCapacity)}`}>
                                    {classData.enrollmentSummary.currentEnrolled}/{classData.enrollmentSummary.maxCapacity}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận phê duyệt lớp học</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn phê duyệt lớp học <strong>{classData.code}</strong>?
                            Lớp sẽ chuyển sang trạng thái "Đã lên lịch" và sẵn sàng khai giảng.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleApprove}
                            disabled={isApproving}
                        >
                            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận phê duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối phê duyệt lớp học</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối để Academic Affairs có thể chỉnh sửa lớp học.
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
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
