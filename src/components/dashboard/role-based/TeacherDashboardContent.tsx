import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, FileText, Award } from 'lucide-react'

// Mock data for demo
const teacherData = [
  {
    id: 1,
    name: "My Classes",
    value: "5",
    change: "+1 this semester",
    icon: Calendar,
  },
  {
    id: 2,
    name: "Total Students",
    value: "156",
    change: "+12 new students",
    icon: Users,
  },
  {
    id: 3,
    name: "Pending Assignments",
    value: "23",
    change: "8 due this week",
    icon: FileText,
  },
  {
    id: 4,
    name: "Average Grade",
    value: "B+",
    change: "+0.3 from last semester",
    icon: Award,
  },
]

export function TeacherDashboardContent() {
  return (
    <>
      {/* Teacher-specific stats cards */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {teacherData.map((stat) => (
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
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>
                Your schedule for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Mathematics 101</p>
                    <p className="text-xs text-muted-foreground">9:00 AM - Room 201</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Calculus II</p>
                    <p className="text-xs text-muted-foreground">2:00 PM - Room 305</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Latest assignment submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Assignment 3</p>
                    <p className="text-xs text-muted-foreground">15 submissions</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Quiz 2</p>
                    <p className="text-xs text-muted-foreground">42 submissions</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Graded</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}