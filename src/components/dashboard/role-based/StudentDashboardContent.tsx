import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, FileText, Award } from 'lucide-react'

// Mock data for demo
const studentData = [
  {
    id: 1,
    name: "Enrolled Courses",
    value: "5",
    change: "Active this semester",
    icon: BookOpen,
  },
  {
    id: 2,
    name: "Upcoming Classes",
    value: "3",
    change: "Today",
    icon: Calendar,
  },
  {
    id: 3,
    name: "Pending Assignments",
    value: "8",
    change: "2 due this week",
    icon: FileText,
  },
  {
    id: 4,
    name: "Current GPA",
    value: "3.7",
    change: "Above average",
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
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                Your classes for today
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
                    <p className="text-sm font-medium">Physics Lab</p>
                    <p className="text-xs text-muted-foreground">2:00 PM - Lab 3</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">English Literature</p>
                    <p className="text-xs text-muted-foreground">4:00 PM - Room 105</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>
                Latest assignments and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Math Problem Set 5</p>
                    <p className="text-xs text-muted-foreground">Due in 2 days</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Due Soon</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Physics Lab Report</p>
                    <p className="text-xs text-muted-foreground">Due in 5 days</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">English Essay</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}