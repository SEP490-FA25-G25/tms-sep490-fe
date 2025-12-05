
import { Calendar, MessageSquare, GraduationCap, Users } from "lucide-react"
import { AAStatsCard } from "./AAStatsCard"
import { Skeleton } from "@/components/ui/skeleton"

export interface AAKPIData {
    todaySessions: {
        total: number
        needsSubstitute: number
    }
    newConsultations: {
        total: number
        unprocessed: number
    }
    totalClasses: number
    totalStudents: number
}

interface AAKPISummaryProps {
    data?: AAKPIData
    isLoading?: boolean
}

export function AAKPISummary({ data, isLoading }: AAKPISummaryProps) {
    if (isLoading) {
        return (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <AAStatsCard
                title="Tổng số lớp học"
                value={data?.totalClasses ?? 0}
                subtitle="Lớp trong chi nhánh"
                icon={GraduationCap}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
            />
            <AAStatsCard
                title="Tổng số học viên"
                value={data?.totalStudents ?? 0}
                subtitle="Học viên trong chi nhánh"
                icon={Users}
                iconClassName="bg-green-100 dark:bg-green-900/30"
            />
            <AAStatsCard
                title="Buổi học hôm nay"
                value={data?.todaySessions.total ?? 0}
                subtitle={data?.todaySessions.needsSubstitute 
                    ? `${data.todaySessions.needsSubstitute} buổi cần GV thay thế`
                    : "Tất cả buổi học đã sẵn sàng"
                }
                icon={Calendar}
                urgentCount={data?.todaySessions.needsSubstitute}
                iconClassName="bg-amber-100 dark:bg-amber-900/30"
            />
            <AAStatsCard
                title="Đăng ký tư vấn mới"
                value={data?.newConsultations.total ?? 0}
                subtitle={data?.newConsultations.unprocessed 
                    ? `${data.newConsultations.unprocessed} chưa xử lý`
                    : "Đã xử lý hết"
                }
                icon={MessageSquare}
                urgentCount={data?.newConsultations.unprocessed}
                iconClassName="bg-purple-100 dark:bg-purple-900/30"
            />
        </div>
    )
}
