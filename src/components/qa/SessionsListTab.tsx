"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGetClassSessionsWithMetricsQuery } from "@/store/services/classApi"
import { SessionStatus, getSessionStatusDisplayName, sessionStatusOptions } from "@/types/qa"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Users,
    BookOpen,
    Loader2,
    AlertTriangle,
    Search,
} from "lucide-react"

interface SessionsListTabProps {
    classId: number
}

export function SessionsListTab({ classId }: SessionsListTabProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const navigate = useNavigate()

    const { data: sessionListData, isLoading, error } = useGetClassSessionsWithMetricsQuery(classId)

    const handleFilterChange = (value: string) => {
        setStatusFilter(value)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không thể tải danh sách buổi học. Vui lòng thử lại.
                </AlertDescription>
            </Alert>
        )
    }

    if (!sessionListData) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Không có dữ liệu buổi học cho lớp này.
                </AlertDescription>
            </Alert>
        )
    }

    const sessions = sessionListData.sessions || []
    const filteredSessions = sessions.filter(session => {
        // Status filter
        const statusMatch = statusFilter === "all" || session.status === statusFilter
        
        // Search filter (topic, teacherName)
        const searchLower = searchQuery.toLowerCase().trim()
        const searchMatch = !searchLower || 
            session.topic?.toLowerCase().includes(searchLower) ||
            session.teacherName?.toLowerCase().includes(searchLower)
        
        return statusMatch && searchMatch
    })

    const totalItems = filteredSessions.length

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "text-emerald-600"
        if (rate >= 80) return "text-yellow-600"
        return "text-rose-600"
    }

    const getHomeworkColor = (rate: number) => {
        if (rate >= 85) return "text-emerald-600"
        if (rate >= 70) return "text-yellow-600"
        return "text-rose-600"
    }

    const formatTimeRange = (startTime?: string, endTime?: string, fallback?: string): string => {
        if (!startTime || !endTime) return fallback || "TBA"
        
        const formatTime = (time: string) => {
            const parts = time.split(":")
            return `${parts[0]}:${parts[1]}`
        }
        
        return `${formatTime(startTime)} - ${formatTime(endTime)}`
    }

    const getStatusBadge = (status: string) => {
        const displayStatus = getSessionStatusDisplayName(status)

        switch (status) {
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

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search - Left */}
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo chủ đề, giáo viên..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                {/* Filter - Right */}
                <div className="flex items-center gap-2 ml-auto">
                    <Select value={statusFilter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="h-9 w-auto min-w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Trạng thái: Tất cả</SelectItem>
                            {sessionStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="rounded-lg border overflow-hidden bg-card">
                {filteredSessions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Ngày</TableHead>
                                <TableHead className="font-semibold">Thời gian</TableHead>
                                <TableHead className="font-semibold">Chủ đề</TableHead>
                                <TableHead className="font-semibold">Giáo viên</TableHead>
                                <TableHead className="font-semibold">Trạng thái</TableHead>
                                <TableHead className="text-center font-semibold">Điểm danh</TableHead>
                                <TableHead className="text-center font-semibold">Bài tập</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSessions.map((session) => (
                                <TableRow 
                                    key={session.sessionId}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/qa/sessions/${session.sessionId}`)}
                                >
                                    <TableCell>
                                        {new Date(session.date).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell>{formatTimeRange(session.startTime, session.endTime, session.timeSlot)}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={session.topic}>
                                        {session.topic}
                                    </TableCell>
                                    <TableCell>{session.teacherName}</TableCell>
                                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Users className="h-4 w-4" />
                                            <span className={getAttendanceColor((session.presentCount / session.totalStudents) * 100)}>
                                                {session.presentCount}/{session.totalStudents}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {session.hasHomework ? (
                                            <div className="flex items-center justify-center space-x-1">
                                                <BookOpen className="h-4 w-4" />
                                                <span className={getHomeworkColor((session.homeworkCompletedCount / session.totalStudents) * 100)}>
                                                    {session.homeworkCompletedCount} đã làm
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Không có BT</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">
                            Không có buổi học nào phù hợp với bộ lọc.
                        </p>
                    </div>
                )}
            </div>

            {/* Total count */}
            {filteredSessions.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Tổng {totalItems} buổi học
                </p>
            )}
        </div>
    )
}
