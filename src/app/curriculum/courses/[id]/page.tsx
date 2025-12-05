import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, Edit, BookOpen, Clock, GraduationCap, CheckCircle, XCircle,
    FileText, Target, PlayCircle, Download, Calendar, Eye,
    Award, Video, Music, Image, AlertCircle, Users, Grid3X3, Check
} from 'lucide-react';
import { useGetCourseDetailsQuery, useApproveCourseMutation, useRejectCourseMutation, useGetCoursePLOsQuery } from '@/store/services/courseApi';
import { useGetSubjectQuery } from '@/store/services/curriculumApi';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

// Helper functions
const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getMaterialIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
        case 'VIDEO':
            return <Video className="h-4 w-4" />;
        case 'PDF':
        case 'DOCUMENT':
            return <FileText className="h-4 w-4" />;
        case 'SLIDE':
        case 'PRESENTATION':
            return <BookOpen className="h-4 w-4" />;
        case 'AUDIO':
            return <Music className="h-4 w-4" />;
        case 'IMAGE':
            return <Image className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
    }
};

const getMaterialTypeLabel = (type?: string) => {
    switch (type?.toUpperCase()) {
        case 'VIDEO': return 'Video';
        case 'PDF':
        case 'DOCUMENT': return 'PDF';
        case 'SLIDE':
        case 'PRESENTATION': return 'Slide';
        case 'AUDIO': return 'Audio';
        case 'IMAGE': return 'Hình ảnh';
        case 'LINK': return 'Link';
        default: return 'Tài liệu';
    }
};

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple' }> = {
    DRAFT: { label: 'Nháp', variant: 'secondary' },
    SUBMITTED: { label: 'Chờ duyệt', variant: 'warning' },
    PENDING_ACTIVATION: { label: 'Chờ kích hoạt', variant: 'info' },
    ACTIVE: { label: 'Hoạt động', variant: 'success' },
    INACTIVE: { label: 'Ngừng hoạt động', variant: 'secondary' },
    REJECTED: { label: 'Đã từ chối', variant: 'destructive' },
};

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubjectLeader = user?.roles?.includes('SUBJECT_LEADER');
    const isManager = user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN');

    const [activeTab, setActiveTab] = useState('overview');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase-0']);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

    const { data: courseData, isLoading, refetch } = useGetCourseDetailsQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const course = courseData?.data;

    const { data: plosData } = useGetCoursePLOsQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const plos = plosData || [];

    // Fetch ALL PLOs from the subject for the matrix
    const { data: subjectData } = useGetSubjectQuery(course?.subjectId ?? 0, {
        skip: !course?.subjectId
    });
    const allSubjectPlos = subjectData?.data?.plos || [];

    const [approveCourse, { isLoading: isApproving }] = useApproveCourseMutation();
    const [rejectCourse, { isLoading: isRejecting }] = useRejectCourseMutation();

    const handleApprove = async () => {
        if (!course?.id) return;
        try {
            await approveCourse(course.id).unwrap();
            toast.success('Đã phê duyệt khóa học thành công');
            refetch();
        } catch {
            toast.error('Phê duyệt thất bại. Vui lòng thử lại.');
        }
    };

    const handleReject = async () => {
        if (!course?.id || !rejectReason.trim()) return;
        try {
            await rejectCourse({ id: course.id, reason: rejectReason }).unwrap();
            toast.success('Đã từ chối khóa học');
            setRejectDialogOpen(false);
            refetch();
        } catch {
            toast.error('Từ chối thất bại. Vui lòng thử lại.');
        }
    };

    const getStatusInfo = (status: string, approvalStatus?: string | null) => {
        if (approvalStatus === 'REJECTED') {
            return STATUS_STYLES.REJECTED;
        }
        return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || { label: status, className: '' };
    };

    // Get materials for different scopes
    const getCourseMaterials = () => course?.materials?.filter(m => m.scope === 'COURSE') || [];
    const getPhaseMaterials = (phaseId: number) => course?.materials?.filter(m => m.scope === 'PHASE' && m.phaseId === phaseId) || [];
    const getSessionMaterials = (sessionId: number) => course?.materials?.filter(m => m.scope === 'SESSION' && m.sessionId === sessionId) || [];

    // Download file by fetching blob and creating download link
    const handleDownload = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            // Fallback: open in new tab if download fails
            window.open(url, '_blank');
        }
    };

    // Render Header
    const renderHeader = () => {
        if (isLoading) {
            return (
                <div className="border-b bg-background">
                    <div className="@container/main py-6 md:py-8">
                        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                </div>
            );
        }

        if (!course) {
            return (
                <div className="border-b bg-background sticky top-0 z-20">
                    <div className="@container/main py-6">
                        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                            <p className="text-sm text-muted-foreground">Không thể tải thông tin khóa học</p>
                        </div>
                    </div>
                </div>
            );
        }

        const statusInfo = getStatusInfo(course.status, course.approvalStatus);

        return (
            <div className="border-b bg-background sticky top-0 z-20">
                <div className="@container/main py-6 md:py-8">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                        {/* Header top row */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                        {course.name}
                                    </h1>
                                    <p className="text-lg text-muted-foreground">{course.code}</p>
                                </div>
                                {/* Thumbnail image */}
                                {course.thumbnailUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={course.thumbnailUrl}
                                            alt={course.name}
                                            className="w-full max-w-md h-40 object-cover rounded-lg border"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    {course.subjectName && (
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{course.subjectName}</span>
                                        </div>
                                    )}
                                    {course.levelName && (
                                        <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5">
                                            {course.levelName}
                                        </Badge>
                                    )}
                                    <Badge variant={statusInfo.variant} className="text-xs">
                                        {statusInfo.label}
                                    </Badge>
                                </div>
                                {course.approvalStatus === 'REJECTED' && course.rejectionReason && (
                                    <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-medium">Lý do từ chối: </span>
                                            {course.rejectionReason}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* "Vào học" button - always visible */}
                                <Button onClick={() => navigate(`/curriculum/courses/${id}/learn`)}>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Vào học
                                </Button>
                                {isSubjectLeader && (course.status === 'DRAFT' || course.approvalStatus === 'REJECTED') && (
                                    <Button variant="outline" onClick={() => navigate(`/curriculum/courses/${id}/edit`)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Chỉnh sửa
                                    </Button>
                                )}
                                {isManager && course.status === 'SUBMITTED' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => setRejectDialogOpen(true)}
                                            disabled={isRejecting}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Từ chối
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            onClick={handleApprove}
                                            disabled={isApproving}
                                        >
                                            {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Phê duyệt
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Info grid - 4 cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">Thời lượng</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {course.totalHours || 0} giờ
                                </p>
                            </div>

                            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Target className="h-4 w-4" />
                                    <span className="text-sm font-medium">Cấu trúc</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {course.numberOfSessions || course.totalSessions || course.phases?.reduce((acc, p) => acc + (p.sessions?.length || 0), 0) || 0} buổi • {course.hoursPerSession || 0} giờ/buổi
                                </p>
                            </div>

                            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm font-medium">Ngày hiệu lực</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatDate(course.effectiveDate || course.basicInfo?.effectiveDate)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <GraduationCap className="h-4 w-4" />
                                    <span className="text-sm font-medium">Thang điểm</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {course.scoreScale || '10'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render Materials List
    type MaterialType = NonNullable<typeof course>['materials'];
    const renderMaterialsList = (materials: MaterialType | undefined, showEmpty = true) => {
        if (!materials || materials.length === 0) {
            return showEmpty ? (
                <p className="text-sm text-muted-foreground py-2">Chưa có tài liệu</p>
            ) : null;
        }

        return (
            <div className="rounded-lg border divide-y overflow-hidden bg-muted/20">
                {materials.map((material) => {
                    // Get the material URL (use fileUrl as fallback)
                    const materialUrl = material.url || material.fileUrl;
                    const materialType = material.type || material.materialType;

                    return (
                        <div key={material.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                            <div className="shrink-0 text-muted-foreground">
                                {getMaterialIcon(materialType)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h6 className="font-medium text-sm truncate">{material.title || material.name || material.fileName || 'Tài liệu'}</h6>
                                    <span className="text-xs text-muted-foreground">
                                        {getMaterialTypeLabel(materialType)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {materialUrl ? (
                                    <>
                                        <Button size="icon" variant="ghost" asChild>
                                            <a href={materialUrl} target="_blank" rel="noopener noreferrer" title="Xem">
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDownload(materialUrl, material.title || material.name || material.fileName || 'file')} title="Tải xuống">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {materialType?.toUpperCase() === 'VIDEO' && (
                                            <Button size="icon" variant="ghost" onClick={() => setVideoUrl(materialUrl)} title="Xem video">
                                                <PlayCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Không có link</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <SidebarProvider
            style={{
                '--sidebar-width': 'calc(var(--spacing) * 72)',
                '--header-height': 'calc(var(--spacing) * 12)',
            } as CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col">
                        {renderHeader()}

                        <main className="flex-1">
                            <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8 md:py-8">
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}

                                {!isLoading && !course && (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
                                        <AlertCircle className="h-8 w-8 text-destructive" />
                                        <p className="text-base font-semibold text-foreground">Không tìm thấy khóa học</p>
                                        <p className="text-sm text-muted-foreground">Khóa học không tồn tại hoặc đã bị xóa.</p>
                                        <Button onClick={() => navigate('/curriculum?tab=courses')}>
                                            Quay lại danh sách
                                        </Button>
                                    </div>
                                )}

                                {!isLoading && course && (
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 -mt-6 pt-6">
                                            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
                                                <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                                                    Tổng quan
                                                </TabsTrigger>
                                                <TabsTrigger value="syllabus" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                                                    Giáo trình
                                                </TabsTrigger>
                                                <TabsTrigger value="clos" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                                                    Chuẩn đầu ra
                                                </TabsTrigger>
                                                <TabsTrigger value="assessments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                                                    Đánh giá
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {/* Overview Tab */}
                                        <TabsContent value="overview" className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5 text-primary" />
                                                    Thông tin khóa học
                                                </h3>
                                                <Card>
                                                    <CardContent className="space-y-6">
                                                        {course.description && (
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Mô tả khóa học</h4>
                                                                <p className="text-base text-foreground">{course.description}</p>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {course.prerequisites && (
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Điều kiện tiên quyết</h4>
                                                                    <p className="text-base text-foreground">{course.prerequisites}</p>
                                                                </div>
                                                            )}
                                                            {course.targetAudience && (
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Đối tượng học viên</h4>
                                                                    <p className="text-base text-foreground">{course.targetAudience}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {course.teachingMethods && (
                                                            <div>
                                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Phương pháp giảng dạy</h4>
                                                                <p className="text-base text-foreground">{course.teachingMethods}</p>
                                                            </div>
                                                        )}

                                                        {!course.description && !course.prerequisites && !course.targetAudience && !course.teachingMethods && (
                                                            <p className="text-muted-foreground text-center py-4">Chưa có thông tin chi tiết về khóa học.</p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Course Materials */}
                                            {getCourseMaterials().length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-primary" />
                                                        <h3 className="text-xl font-semibold">Tài liệu khóa học</h3>
                                                        <Badge variant="secondary">{getCourseMaterials().length}</Badge>
                                                    </div>
                                                    {renderMaterialsList(getCourseMaterials(), false)}
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* Syllabus Tab */}
                                        <TabsContent value="syllabus" className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <Target className="h-5 w-5 text-primary" />
                                                <h3 className="text-xl font-semibold">Nội dung chi tiết</h3>
                                                <Badge variant="secondary">
                                                    {course.phases?.length || 0} giai đoạn • {course.phases?.reduce((total, phase) => total + (phase.sessions?.length || 0), 0) || 0} buổi học
                                                </Badge>
                                            </div>

                                            {course.phases && course.phases.length > 0 ? (
                                                <Accordion
                                                    type="multiple"
                                                    value={expandedPhases}
                                                    onValueChange={setExpandedPhases}
                                                    className="space-y-3"
                                                >
                                                    {course.phases.map((phase, phaseIndex) => {
                                                        const phaseMaterials = getPhaseMaterials(phase.id);
                                                        const phaseId = `phase-${phaseIndex}`;

                                                        return (
                                                            <AccordionItem key={phase.id} value={phaseId} className="rounded-lg border bg-card last:border-b">
                                                                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                                                                    <div className="flex items-start justify-between gap-3 text-left w-full">
                                                                        <div className="space-y-1">
                                                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                Giai đoạn {phase.phaseNumber}
                                                                            </p>
                                                                            <div className="text-base font-semibold text-foreground">
                                                                                {phase.name}
                                                                            </div>
                                                                            {phase.description && (
                                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                                    {phase.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                                                                            <span>{phase.sessions?.length || 0} buổi</span>
                                                                            {phaseMaterials.length > 0 && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <BookOpen className="h-4 w-4" />
                                                                                    {phaseMaterials.length}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>

                                                                <AccordionContent className="px-5 pb-5 space-y-4">
                                                                    {/* Phase materials */}
                                                                    {phaseMaterials.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                                                <BookOpen className="h-4 w-4 text-primary" />
                                                                                <span>Tài liệu giai đoạn</span>
                                                                            </div>
                                                                            {renderMaterialsList(phaseMaterials, false)}
                                                                        </div>
                                                                    )}

                                                                    {/* Sessions */}
                                                                    {phase.sessions && phase.sessions.length > 0 ? (
                                                                        <div className="space-y-3">
                                                                            {phase.sessions.map((session) => {
                                                                                const sessionMaterials = getSessionMaterials(session.id);
                                                                                const sessionId = `session-${session.id}`;

                                                                                return (
                                                                                    <div key={session.id} className="border rounded-lg bg-card overflow-hidden">
                                                                                        <Accordion
                                                                                            type="single"
                                                                                            collapsible
                                                                                            value={expandedSessions.includes(sessionId) ? sessionId : undefined}
                                                                                            onValueChange={(value) => {
                                                                                                if (value) {
                                                                                                    setExpandedSessions(prev => [...prev, sessionId]);
                                                                                                } else {
                                                                                                    setExpandedSessions(prev => prev.filter(id => id !== sessionId));
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <AccordionItem value={sessionId} className="border-b-0">
                                                                                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                                                                    <div className="flex items-start justify-between gap-3 text-left w-full">
                                                                                                        <div className="space-y-1">
                                                                                                            <h4 className="font-semibold text-base text-foreground">
                                                                                                                Buổi {session.sequenceNo}: {session.topic}
                                                                                                            </h4>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                                                                                            {session.skill && (
                                                                                                                <Badge variant="secondary" className="text-xs">
                                                                                                                    {session.skill}
                                                                                                                </Badge>
                                                                                                            )}
                                                                                                            {sessionMaterials.length > 0 && (
                                                                                                                <span>{sessionMaterials.length} tài liệu</span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </AccordionTrigger>

                                                                                                <AccordionContent className="px-4 pb-4 space-y-4">
                                                                                                    {session.studentTask && (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                                                                                <Users className="h-4 w-4 text-primary" />
                                                                                                                <span>Nhiệm vụ sinh viên</span>
                                                                                                            </div>
                                                                                                            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                                                                                                {session.studentTask}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {session.mappedCLOs && session.mappedCLOs.length > 0 && (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                                                                                <Award className="h-4 w-4 text-primary" />
                                                                                                                <span>CLOs liên quan</span>
                                                                                                            </div>
                                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                                {session.mappedCLOs.map((clo: string, idx: number) => (
                                                                                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                                                                                        {clo}
                                                                                                                    </Badge>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {sessionMaterials.length > 0 && (
                                                                                                        <div className="space-y-2">
                                                                                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                                                                                <BookOpen className="h-4 w-4 text-primary" />
                                                                                                                <span>Tài liệu buổi học</span>
                                                                                                            </div>
                                                                                                            {renderMaterialsList(sessionMaterials, false)}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </AccordionContent>
                                                                                            </AccordionItem>
                                                                                        </Accordion>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-muted-foreground">Chưa có buổi học nào</p>
                                                                    )}
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        );
                                                    })}
                                                </Accordion>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Chưa có nội dung giáo trình</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* CLOs Tab */}
                                        <TabsContent value="clos" className="space-y-8">
                                            {/* CLO List Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Award className="h-5 w-5 text-primary" />
                                                    <h3 className="text-xl font-semibold">Chuẩn đầu ra khóa học (CLOs)</h3>
                                                    <Badge variant="secondary">{course.clos?.length || 0}</Badge>
                                                </div>

                                                {course.clos && course.clos.length > 0 ? (
                                                    <Card className="overflow-hidden py-0">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-[100px]">Mã CLO</TableHead>
                                                                    <TableHead>Mô tả chi tiết</TableHead>
                                                                    <TableHead className="w-[200px]">PLOs liên quan</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {course.clos.map((clo, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell className="font-bold text-primary">{clo.code}</TableCell>
                                                                        <TableCell>{clo.description}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex gap-1 flex-wrap">
                                                                                {[...new Set(clo.mappedPLOs || [])].map((plo) => (
                                                                                    <Badge key={plo} variant="info" className="text-xs">
                                                                                        {plo}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </Card>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                                                        <Award className="h-8 w-8 text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">Chưa có chuẩn đầu ra nào</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* CLO-PLO Mapping Matrix Section */}
                                            {(() => {
                                                // Priority: Use ALL PLOs from subject, fallback to mapped PLOs
                                                // This ensures we show all PLOs including ones not yet mapped
                                                let ploList: { id: number; code: string; description: string }[] = [];

                                                if (allSubjectPlos.length > 0) {
                                                    // Use all PLOs from subject (the correct source)
                                                    ploList = allSubjectPlos.map((plo, idx) => ({
                                                        id: idx,
                                                        code: plo.code,
                                                        description: plo.description
                                                    }));
                                                } else if (plos.length > 0) {
                                                    // Fallback to mapped PLOs from course API
                                                    ploList = [...new Map(plos.map(p => [p.code, p])).values()];
                                                } else {
                                                    // Last fallback: extract from CLOs' mappedPLOs
                                                    const uniquePloCodes = [...new Set(course.clos?.flatMap(clo => clo.mappedPLOs || []) || [])].sort();
                                                    ploList = uniquePloCodes.map((code, idx) => ({ id: idx, code, description: code }));
                                                }

                                                // Sort PLOs by numeric order (PLO1, PLO2, PLO3, etc.)
                                                ploList.sort((a, b) => {
                                                    const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
                                                    const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
                                                    return numA - numB;
                                                });

                                                if (!course.clos || course.clos.length === 0 || ploList.length === 0) {
                                                    return null;
                                                }

                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <Grid3X3 className="h-5 w-5 text-primary" />
                                                            <h3 className="text-xl font-semibold">Ma trận CLO - PLO</h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Ma trận thể hiện mối quan hệ giữa Chuẩn đầu ra khóa học (CLO) và Chuẩn đầu ra chương trình (PLO)
                                                        </p>
                                                        <Card className="overflow-x-auto py-0">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-[120px] bg-muted/50 font-semibold sticky left-0 z-10">CLO \\ PLO</TableHead>
                                                                        {ploList.map((plo) => (
                                                                            <TableHead
                                                                                key={plo.code}
                                                                                className="text-center min-w-[80px] bg-muted/30"
                                                                                title={plo.description}
                                                                            >
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <span className="font-semibold text-primary">{plo.code}</span>
                                                                                </div>
                                                                            </TableHead>
                                                                        ))}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {course.clos.map((clo) => (
                                                                        <TableRow key={clo.id}>
                                                                            <TableCell
                                                                                className="font-semibold text-primary bg-muted/20 sticky left-0 z-10"
                                                                                title={clo.description}
                                                                            >
                                                                                {clo.code}
                                                                            </TableCell>
                                                                            {ploList.map((plo) => {
                                                                                const isMapped = clo.mappedPLOs?.includes(plo.code);
                                                                                return (
                                                                                    <TableCell
                                                                                        key={plo.code}
                                                                                        className="text-center p-2"
                                                                                    >
                                                                                        {isMapped ? (
                                                                                            <div className="flex items-center justify-center">
                                                                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="text-muted-foreground/30">—</span>
                                                                                        )}
                                                                                    </TableCell>
                                                                                );
                                                                            })}
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </Card>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                    <Check className="h-3 w-3 text-emerald-600" />
                                                                </div>
                                                                <span>CLO đáp ứng PLO</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground/50">—</span>
                                                                <span>Không liên quan</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </TabsContent>

                                        {/* Assessments Tab */}
                                        <TabsContent value="assessments" className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <Target className="h-5 w-5 text-primary" />
                                                <h3 className="text-xl font-semibold">Bài đánh giá</h3>
                                                <Badge variant="secondary">{course.assessments?.length || 0}</Badge>
                                            </div>

                                            {course.assessments && course.assessments.length > 0 ? (
                                                <Card className="overflow-hidden py-0">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Tên bài đánh giá</TableHead>
                                                                <TableHead className="w-[120px]">Loại</TableHead>
                                                                <TableHead className="w-[100px] text-center">Thời lượng</TableHead>
                                                                <TableHead className="w-[100px] text-center">Điểm tối đa</TableHead>
                                                                <TableHead className="w-[150px]">Kỹ năng</TableHead>
                                                                <TableHead className="w-[150px]">CLOs</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {course.assessments.map((assessment, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-medium">{assessment.name}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="secondary" className="text-xs">{assessment.type}</Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {assessment.durationMinutes
                                                                            ? `${assessment.durationMinutes} phút`
                                                                            : (assessment.duration || '—')}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-bold">{assessment.maxScore || 0}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {assessment.skills?.map((skill: string, idx: number) => (
                                                                                <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {assessment.mappedCLOs?.map((clo) => (
                                                                                <Badge key={clo} variant="outline" className="text-xs">{clo}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Card>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
                                                    <Target className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Chưa có bài đánh giá nào</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarInset>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối phê duyệt khóa học</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Video Player Dialog */}
            <Dialog open={!!videoUrl} onOpenChange={(open) => !open && setVideoUrl(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
                    <DialogHeader className="p-4 absolute top-0 left-0 z-10 w-full bg-linear-to-b from-black/70 to-transparent">
                        <div className="flex justify-between items-center">
                            <DialogTitle className="text-white">Xem Video</DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20 rounded-full"
                                onClick={() => setVideoUrl(null)}
                            >
                                <XCircle className="h-6 w-6" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="aspect-video w-full flex items-center justify-center bg-black">
                        {videoUrl && (
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full"
                                controlsList="nodownload"
                            >
                                Trình duyệt của bạn không hỗ trợ thẻ video.
                            </video>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
