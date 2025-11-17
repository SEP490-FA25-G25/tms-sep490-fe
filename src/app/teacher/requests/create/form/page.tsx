import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateRequestMutation } from '@/store/services/teacherRequestApi'
import { DashboardLayout } from '@/components/DashboardLayout'
import { TeacherRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { formatDate } from '@/utils/dateFormat'
import type { RequestType } from '@/store/services/teacherRequestApi'

// Helper function to format error messages from backend to user-friendly Vietnamese
const formatBackendError = (
  errorMessage?: string,
  defaultMessage?: string
): string => {
  if (!errorMessage) {
    return defaultMessage || "Có lỗi xảy ra. Vui lòng thử lại sau.";
  }

  // Map common error codes to user-friendly messages
  if (errorMessage.includes("SESSION_NOT_IN_TIME_WINDOW")) {
    return "Ngày session đề xuất không nằm trong khoảng thời gian cho phép (trong vòng 14 ngày từ hôm nay).";
  }

  if (errorMessage.includes("INVALID_DATE")) {
    return "Ngày đề xuất không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (errorMessage.includes("NO_AVAILABLE_RESOURCES")) {
    return "Không tìm thấy resource phù hợp cho thời gian này.";
  }

  if (errorMessage.includes("TEACHER_NOT_FOUND")) {
    return "Không tìm thấy thông tin giáo viên. Vui lòng thử lại sau.";
  }

  if (errorMessage.includes("RESOURCE_NOT_AVAILABLE")) {
    return "Resource không khả dụng tại thời gian đã chỉ định. Vui lòng chọn resource khác hoặc thời gian khác.";
  }

  // If it's a technical error code, try to extract a more readable part
  if (errorMessage.includes(":")) {
    const parts = errorMessage.split(":");
    if (parts.length > 1) {
      // Use the part after the colon if it's more readable
      const readablePart = parts.slice(1).join(":").trim();
      if (readablePart.length > 0 && !readablePart.includes("_")) {
        return readablePart;
      }
    }
  }

  // Return the original message if no mapping found
  return errorMessage;
};

export default function RequestFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const requestType = searchParams.get('type') as RequestType
  const resourceId = searchParams.get('resourceId')
  
  const [reason, setReason] = useState('')
  const [createRequest, { isLoading }] = useCreateRequestMutation()

  const handleSubmit = async () => {
    if (!reason.trim() || !sessionId || !requestType) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const result = await createRequest({
        sessionId: Number(sessionId),
        requestType,
        newResourceId: resourceId ? Number(resourceId) : undefined,
        reason: reason.trim(),
      }).unwrap()

      toast.success('Yêu cầu đã được gửi thành công')
      navigate(`/teacher/requests/${result.data.id}`)
    } catch (error: unknown) {
      const apiError = error as { data?: { message?: string } };
      toast.error(
        formatBackendError(
          apiError?.data?.message,
          'Có lỗi xảy ra khi gửi yêu cầu'
        )
      )
    }
  }

  // TODO: Fetch session details to show summary
  // For now, using placeholder data
  const sessionInfo = {
    className: 'CS101',
    date: '2025-01-15',
    time: '09:00 - 10:30',
    course: 'Object-Oriented Programming',
    currentModality: 'Classroom',
    newModality: 'Online',
  }

  return (
    <TeacherRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6 max-w-2xl">
          <h1 className="text-2xl font-semibold">Tạo yêu cầu thay đổi phương thức</h1>

          {/* Session Info Summary */}
          <div className="border rounded-lg p-6 bg-muted/30">
            <h2 className="font-semibold mb-4">Thông tin session</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Class:</span> {sessionInfo.className}</div>
              <div><span className="text-muted-foreground">Date:</span> {formatDate(sessionInfo.date)}</div>
              <div><span className="text-muted-foreground">Time:</span> {sessionInfo.time}</div>
              <div><span className="text-muted-foreground">Course:</span> {sessionInfo.course}</div>
              <div><span className="text-muted-foreground">Current Modality:</span> {sessionInfo.currentModality}</div>
              <div><span className="text-muted-foreground">New Modality:</span> {sessionInfo.newModality}</div>
            </div>
          </div>

          {/* Resource Summary (if selected) */}
          {resourceId && (
            <div className="border rounded-lg p-6 bg-muted/30">
              <h2 className="font-semibold mb-4">Resource đã chọn</h2>
              <div className="text-sm">
                {/* TODO: Show resource name from API */}
                Resource ID: {resourceId}
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="border rounded-lg p-6">
            <Label htmlFor="reason" className="text-base font-semibold mb-4 block">
              Lý do <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do yêu cầu thay đổi..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right mt-2">
              {reason.length}/500 ký tự
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!reason.trim() || isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </TeacherRoute>
  )
}


