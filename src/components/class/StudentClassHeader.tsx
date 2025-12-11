import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CLASS_STATUS_STYLES, ENROLLMENT_STATUS_STYLES, getStatusStyle } from '@/lib/status-colors'
import type { ClassDetailDTO } from '@/types/studentClass'
import { CLASS_STATUSES, ENROLLMENT_STATUSES, MODALITIES } from '@/types/studentClass'
import {
    BookOpen,
    Building2,
    Calendar,
    Clock,
    MapPin,
} from 'lucide-react'

interface StudentClassHeaderProps {
    classDetail: ClassDetailDTO
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function StudentClassHeader({ classDetail }: StudentClassHeaderProps) {
    const scheduleDisplay = classDetail.scheduleDetails && classDetail.scheduleDetails.length > 0
        ? classDetail.scheduleDetails.map(d => `${d.day} ${d.startTime}-${d.endTime}`).join(', ')
        : classDetail.scheduleSummary || 'Chưa có lịch'

    return (
        <div className="border-b bg-background">
            <div className="@container/main py-6 md:py-8">
                <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                    {/* Header top row */}
                    <div className="flex flex-col gap-4">
                        <div className="space-y-3">
                            {/* Status badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    className={cn(
                                        'text-xs',
                                        getStatusStyle(CLASS_STATUS_STYLES, classDetail.status)
                                    )}
                                >
                                    {CLASS_STATUSES[classDetail.status]}
                                </Badge>
                                {classDetail.enrollmentStatus && (
                                    <Badge
                                        className={cn(
                                            'text-xs',
                                            getStatusStyle(ENROLLMENT_STATUS_STYLES, classDetail.enrollmentStatus)
                                        )}
                                    >
                                        {ENROLLMENT_STATUSES[classDetail.enrollmentStatus]}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                    {MODALITIES[classDetail.modality as keyof typeof MODALITIES] || classDetail.modality}
                                </Badge>
                            </div>

                            {/* Class name and code */}
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                    {classDetail.name}
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    {classDetail.code}
                                </p>
                            </div>

                            {/* Class information - Line 1 */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                {classDetail.subject?.curriculum && (
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        <span>Khóa học: {classDetail.subject.curriculum.name}</span>
                                    </div>
                                )}
                                {classDetail.subject?.level && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs font-medium border-primary/30 text-primary bg-primary/5"
                                    >
                                        {classDetail.subject.level.name}
                                    </Badge>
                                )}
                                {!classDetail.subject?.curriculum && classDetail.subject?.name && (
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        <span>Khóa học: {classDetail.subject.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Class information - Line 2: Branch */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                {classDetail.branch && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>Chi nhánh: {classDetail.branch.name}</span>
                                    </div>
                                )}
                                {classDetail.branch?.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{classDetail.branch.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Class information - Line 3: Dates */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Bắt đầu: {formatDate(classDetail.startDate)}</span>
                                </div>
                                {(classDetail.plannedEndDate || classDetail.actualEndDate) && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            Kết thúc: {formatDate(classDetail.actualEndDate || classDetail.plannedEndDate)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Class information - Line 4: Schedule */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Lịch học: {scheduleDisplay}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
