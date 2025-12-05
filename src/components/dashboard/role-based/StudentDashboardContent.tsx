import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, FileText, Award } from 'lucide-react'

// Mock data for demo
const studentData = [
  {
    id: 1,
    name: "Khóa học đã đăng ký",
    value: "5",
    change: "Đang học học kỳ này",
    icon: BookOpen,
  },
  {
    id: 2,
    name: "Lớp học sắp tới",
    value: "3",
    change: "Hôm nay",
    icon: Calendar,
  },
  {
    id: 3,
    name: "Bài tập chờ nộp",
    value: "8",
    change: "2 bài hạn tuần này",
    icon: FileText,
  },
  {
    id: 4,
    name: "GPA hiện tại",
    value: "3.7",
    change: "Trên trung bình",
    icon: Award,
  },
]

export function StudentDashboardContent() {
  return (
    <>
      {/* Student-specific stats cards */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {studentData.map((stat) => (
            <Card key={stat.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lịch học hôm nay</CardTitle>
              <CardDescription>
                Các lớp học của bạn hôm nay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Toán cao cấp 101</p>
                    <p className="text-xs text-muted-foreground">9:00 Sáng - Phòng 201</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Thực hành Vật lý</p>
                    <p className="text-xs text-muted-foreground">2:00 Chiều - Phòng Lab 3</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Văn học Anh</p>
                    <p className="text-xs text-muted-foreground">4:00 Chiều - Phòng 105</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài tập gần đây</CardTitle>
              <CardDescription>
                Các bài tập mới nhất và tình trạng của chúng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Bài tập Toán tập 5</p>
                    <p className="text-xs text-muted-foreground">Hạn trong 2 ngày</p>
                  </div>
                  <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded">Sắp đến hạn</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Báo cáo Thực hành Vật lý</p>
                    <p className="text-xs text-muted-foreground">Hạn trong 5 ngày</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Đang thực hiện</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Bài luận Anh</p>
                    <p className="text-xs text-muted-foreground">Đã nộp</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Hoàn thành</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}