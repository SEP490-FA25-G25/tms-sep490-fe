import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/DashboardLayout'
import { TeacherRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function SelectResourcePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const requestType = searchParams.get('type')

  const handleSkip = () => {
    if (!sessionId || !requestType) return
    navigate(`/teacher/requests/create/form?sessionId=${sessionId}&type=${requestType}`)
  }

  return (
    <TeacherRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-semibold">Chọn resource (Tùy chọn)</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Resource sẽ được staff quyết định khi xử lý yêu cầu. Bạn có thể tiếp tục mà không cần chọn resource.
            </p>
          </div>

          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p>Resource sẽ được staff quyết định khi xử lý yêu cầu</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
              <Button onClick={handleSkip}>
                Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </TeacherRoute>
  )
}



