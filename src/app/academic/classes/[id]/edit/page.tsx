import { useParams } from 'react-router-dom'
import { CreateClassWizard } from '../../create/components/CreateClassWizard'
import { useGetClassByIdQuery } from '@/store/services/classApi'
import { DashboardLayout } from '@/components/DashboardLayout'

/**
 * Page: Edit Class
 * Route: /academic/classes/[id]/edit
 * Role: ACADEMIC_AFFAIR
 */
export default function EditClassPage() {
    const { id } = useParams<{ id: string }>()
    const classId = id ? parseInt(id) : undefined

    const { data, isLoading, error } = useGetClassByIdQuery(classId!)

    if (!classId || isNaN(classId)) {
        return (
            <DashboardLayout>
                <div>Invalid Class ID</div>
            </DashboardLayout>
        )
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div>Đang tải thông tin lớp...</div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div>Không tải được thông tin lớp. Vui lòng thử lại.</div>
            </DashboardLayout>
        )
    }

    const approvalStatus = data?.data?.approvalStatus
    const status = data?.data?.status
    const notEditable = (status === 'DRAFT' && approvalStatus === 'PENDING') || approvalStatus === 'APPROVED'

    if (notEditable) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="max-w-xl text-center space-y-4">
                        <h1 className="text-2xl font-semibold">Không thể chỉnh sửa lớp này</h1>
                        <p className="text-muted-foreground">
                            Lớp đang ở trạng thái {approvalStatus === 'APPROVED' ? 'đã duyệt' : 'đang chờ duyệt'}. Chỉ các lớp nháp hoặc bị từ chối mới được chỉnh sửa.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <CreateClassWizard classId={classId} mode="edit" />
        </DashboardLayout>
    )
}
