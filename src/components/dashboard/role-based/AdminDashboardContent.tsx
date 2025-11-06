import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Building, BookOpen } from 'lucide-react'

// Mock data for demo
const adminData = [
  {
    id: 1,
    name: "Tổng số người dùng",
    value: "1,234",
    change: "+12.3%",
    icon: Users,
  },
  {
    id: 2,
    name: "Người dùng mới",
    value: "45",
    change: "+8.1%",
    icon: UserPlus,
  },
  {
    id: 3,
    name: "Tổng số trung tâm",
    value: "12",
    change: "+2.0%",
    icon: Building,
  },
  {
    id: 4,
    name: "Khóa học hoạt động",
    value: "89",
    change: "+15.2%",
    icon: BookOpen,
  },
]

export function AdminDashboardContent() {
  return (
    <>
      {/* Admin-specific stats cards */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {adminData.map((stat) => (
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
                  <span className="text-green-600">{stat.change}</span> so với tháng trước
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động hệ thống gần đây</CardTitle>
            <CardDescription>
              Các đăng ký người dùng và sự kiện hệ thống mới nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={[]} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}