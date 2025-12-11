"use client"

import { useGetSessionDetailQuery } from "@/store/services/qaApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Loader2,
    AlertTriangle,
    MapPin,
    Video,
    Copy,
    ExternalLink,
    FileText,
    Film,
    Archive,
    Link as LinkIcon,
    File,
} from "lucide-react"
import { getSessionStatusDisplayName, SessionStatus } from "@/types/qa"
import { Button } from "@/components/ui/button"

interface SessionDetailViewProps {
    sessionId: number
}

/**
 * Shared Session Detail Component
 * Được dùng bởi cả Academic Affairs và QA để xem chi tiết buổi học
 */
export function SessionDetailView({ sessionId }: SessionDetailViewProps) {
    const { data: session, isLoading, error } = useGetSessionDetailQuery(sessionId)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const getAttendanceStatusColor = (status?: string) => {
        const value = status?.toLowerCase() || 'unknown'
        switch (value) {
            case 'present':
                return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
            case 'absent':
                return 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30'
            case 'late':
                return 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
            case 'excused':
                return 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30'
            default:
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
        }
    }

    const getHomeworkStatusColor = (status?: string) => {
        const value = status?.toUpperCase() || 'UNKNOWN'
        switch (value) {
            case 'COMPLETED':
                return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
            case 'INCOMPLETE':
                return 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30'
            case 'NO_HOMEWORK':
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
            default:
                return 'text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50'
        }
    }

    const getAttendanceStatusBadge = (status?: string, isMakeup?: boolean) => {
        const statusMap: Record<string, string> = {
            'present': 'Có mặt',
            'absent': 'Vắng mặt',
            'late': 'Đi muộn',
            'excused': 'Có phép'
        }
        
        if (isMakeup) {
            return (
                <Badge className="text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30">
                    Học bù
                </Badge>
            )
        }
        
        return (
            <Badge className={getAttendanceStatusColor(status)}>
                {status ? statusMap[status.toLowerCase()] || status : 'Không xác định'}
            </Badge>
        )
    }

    const getHomeworkStatusBadge = (status?: string) => {
        const statusMap: Record<string, string> = {
            'COMPLETED': 'Đã hoàn thành',
            'INCOMPLETE': 'Chưa hoàn thành',
            'NO_HOMEWORK': 'Không có bài tập'
        }
        const normalizedStatus = status?.toUpperCase()
        return (
            <Badge className={getHomeworkStatusColor(status)}>
                {normalizedStatus ? statusMap[normalizedStatus] || status : 'Chưa cập nhật'}
            </Badge>
        )
    }

    const getStatusBadge = (status: string) => {
        const displayStatus = getSessionStatusDisplayName(status)
        switch (status.toUpperCase()) {
            case SessionStatus.DONE:
                return <Badge variant="success">{displayStatus}</Badge>
            case SessionStatus.PLANNED:
                return <Badge variant="info">{displayStatus}</Badge>
            case SessionStatus.CANCELLED:
                return <Badge variant="destructive">{displayStatus}</Badge>
            default:
                return <Badge variant="outline">{displayStatus}</Badge>
        }
    }

    const getSkillDisplayName = (skill: string): string => {
        const skillMap: Record<string, string> = {
            'GENERAL': 'Tổng hợp',
            'READING': 'Đọc',
            'WRITING': 'Viết',
            'SPEAKING': 'Nói',
            'LISTENING': 'Nghe',
            'VOCABULARY': 'Từ vựng',
            'GRAMMAR': 'Ngữ pháp',
            'KANJI': 'Kanji'
        }
        return skillMap[skill] || skill
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không thể tải thông tin buổi học. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    if (!session) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Buổi học không tồn tại.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Session Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông Tin Buổi Học</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày học</p>
                                    <p className="font-medium">{new Date(session.date).toLocaleDateString('vi-VN')} ({new Date(session.date).toLocaleDateString('vi-VN', { weekday: 'long' })})</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Thời gian</p>
                                    <p className="font-medium">{session.timeSlot}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lớp học</p>
                                    <p className="font-medium">{session.classCode} - {session.subjectName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Giáo viên</p>
                                    <p className="font-medium">{session.teacherName}</p>
                                </div>
                                {session.sequenceNo && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Số thứ tự</p>
                                        <p className="font-medium">Buổi #{session.sequenceNo}</p>
                                    </div>
                                )}
                                {session.phase && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giai đoạn</p>
                                        <p className="font-medium">Phase {session.phase.phaseNumber}: {session.phase.phaseName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Chủ đề</p>
                                    <p className="font-medium">{session.topic}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    {getStatusBadge(session.status)}
                                </div>
                            </div>

                            {session.skills && session.skills.length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Kỹ năng</p>
                                    <div className="flex flex-wrap gap-2">
                                        {session.skills.map((skill) => (
                                            <Badge key={skill} variant="secondary">
                                                {getSkillDisplayName(skill)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {session.studentTask && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Nhiệm vụ học sinh</p>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{session.studentTask}</p>
                                    </div>
                                </div>
                            )}

                            {session.phase?.learningFocus && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Trọng tâm học tập (Phase)</p>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{session.phase.learningFocus}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Ghi chú giáo viên</p>
                                {session.teacherNote ? (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{session.teacherNote}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Chưa có ghi chú từ giáo viên</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Attendance */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Điểm danh học sinh</h3>
                        <div className="rounded-lg border overflow-hidden bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Mã học sinh</TableHead>
                                        <TableHead className="font-semibold">Tên học sinh</TableHead>
                                        <TableHead className="font-semibold">Trạng thái</TableHead>
                                        <TableHead className="font-semibold">Bài tập</TableHead>
                                        <TableHead className="font-semibold">Ghi chú</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {session.students.map((student) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell className="font-medium">{student.studentCode}</TableCell>
                                            <TableCell>{student.studentName}</TableCell>
                                            <TableCell>
                                                {getAttendanceStatusBadge(student.attendanceStatus, student.isMakeup)}
                                            </TableCell>
                                            <TableCell>
                                                {getHomeworkStatusBadge(student.homeworkStatus)}
                                            </TableCell>
                                            <TableCell>
                                                {student.note || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống Kê</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Sĩ số</span>
                                <span className="font-medium">{session.attendanceStats.totalStudents}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Có mặt</span>
                                <span className="font-medium text-emerald-600">{session.attendanceStats.presentCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Vắng mặt</span>
                                <span className="font-medium text-rose-600">{session.attendanceStats.absentCount}</span>
                            </div>
                            {session.attendanceStats.hasHomework && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Hoàn thành BT</span>
                                    <span className="font-medium text-emerald-600">{session.attendanceStats.homeworkCompletedCount}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resources Section */}
                    {session.resources && session.resources.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Địa điểm / Phương thức học</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {session.resources.map((resource) => (
                                    <div key={resource.resourceId} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex items-start gap-2">
                                            {resource.resourceType === 'ROOM' ? (
                                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                            ) : (
                                                <Video className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h4 className="font-semibold text-sm">{resource.name}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {resource.code}
                                                    </Badge>
                                                </div>

                                                {resource.resourceType === 'ROOM' ? (
                                                    <div className="space-y-1 text-xs">
                                                        {resource.branchName && (
                                                            <p className="font-medium">{resource.branchName}</p>
                                                        )}
                                                        {resource.branchAddress && (
                                                            <p className="text-muted-foreground">{resource.branchAddress}</p>
                                                        )}
                                                        {resource.capacity && (
                                                            <p className="text-muted-foreground">Sức chứa: {resource.capacity} người</p>
                                                        )}
                                                        {resource.equipment && (
                                                            <p className="text-muted-foreground">{resource.equipment}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 text-xs">
                                                        {resource.meetingUrl && (
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <a 
                                                                    href={resource.meetingUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    Link họp
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            </div>
                                                        )}
                                                        {resource.meetingId && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-muted-foreground">ID:</span>
                                                                <code className="px-1 py-0.5 bg-muted rounded text-xs">{resource.meetingId}</code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-5 px-1"
                                                                    onClick={() => copyToClipboard(resource.meetingId!)}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {resource.meetingPasscode && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-muted-foreground">Pass:</span>
                                                                <code className="px-1 py-0.5 bg-muted rounded text-xs">{resource.meetingPasscode}</code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-5 px-1"
                                                                    onClick={() => copyToClipboard(resource.meetingPasscode!)}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Materials Section */}
                    {session.materials && session.materials.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tài liệu học tập</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {session.materials.map((material) => {
                                    const getMaterialIcon = (type: string) => {
                                        switch (type) {
                                            case 'DOCUMENT':
                                                return <FileText className="h-4 w-4 text-blue-600" />
                                            case 'MEDIA':
                                                return <Film className="h-4 w-4 text-purple-600" />
                                            case 'ARCHIVE':
                                                return <Archive className="h-4 w-4 text-amber-600" />
                                            case 'LINK':
                                                return <LinkIcon className="h-4 w-4 text-green-600" />
                                            default:
                                                return <File className="h-4 w-4 text-gray-600" />
                                        }
                                    }

                                    const getMaterialTypeLabel = (type: string): string => {
                                        const typeMap: Record<string, string> = {
                                            'DOCUMENT': 'Tài liệu',
                                            'MEDIA': 'Media',
                                            'ARCHIVE': 'Archive',
                                            'LINK': 'Liên kết',
                                            'OTHER': 'Khác'
                                        }
                                        return typeMap[type] || type
                                    }

                                    return (
                                        <div key={material.materialId} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-start gap-2">
                                                {getMaterialIcon(material.materialType)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h4 className="font-semibold text-sm truncate">{material.title}</h4>
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            {getMaterialTypeLabel(material.materialType)}
                                                        </Badge>
                                                    </div>
                                                    {material.description && (
                                                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{material.description}</p>
                                                    )}
                                                    <a 
                                                        href={material.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        Xem tài liệu
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* CLO Covered */}
                    {session.closCovered.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>CLO Được Đề Cập</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {session.closCovered.map((clo) => (
                                        <div key={clo.cloId} className="p-3 border rounded">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge variant="outline">{clo.cloCode}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{clo.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

