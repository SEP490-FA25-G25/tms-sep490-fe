import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCourseDetailsQuery } from "@/store/services/courseApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, PlayCircle, ChevronRight, Download, FileText, ChevronDown } from "lucide-react";
import { CustomVideoPlayer } from "../components/CustomVideoPlayer";
import { cn } from "@/lib/utils";

interface VideoMaterial {
    id: number;
    name?: string;
    title?: string;
    url: string;
    type?: string;
    materialType?: string;
    phaseId?: number;
    sessionId?: number;
}

export default function CourseLearningPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentVideo, setCurrentVideo] = useState<VideoMaterial | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<number[]>([]);

    const { data: courseData, isLoading } = useGetCourseDetailsQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const course = courseData?.data;

    const isVideoFile = (url?: string) => {
        if (!url) return false;
        return ['.mp4', '.mov', '.webm', '.mkv', '.avi'].some(ext => url.toLowerCase().includes(ext));
    };

    const isYouTubeUrl = (url?: string) => {
        if (!url) return false;
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    };

    const isVideo = (m: { url?: string; type?: string; materialType?: string }) => {
        return isVideoFile(m.url) || isYouTubeUrl(m.url) ||
            m.type?.toUpperCase() === 'VIDEO' || m.materialType?.toUpperCase() === 'VIDEO';
    };

    const getYouTubeId = (url: string) => {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Get all videos flat list
    const getAllVideos = () => {
        if (!course) return [];
        const videos: VideoMaterial[] = [];

        // Course level
        course.materials?.filter(m => isVideo(m) && m.scope === 'COURSE').forEach(m => {
            videos.push({ ...m, url: m.url || '', name: m.title || m.name });
        });

        // Phase and session level
        course.phases?.forEach(phase => {
            phase.sessions?.forEach(session => {
                course.materials?.filter(m => m.sessionId === session.id && isVideo(m)).forEach(m => {
                    videos.push({ ...m, url: m.url || '', name: m.title || m.name, sessionId: session.id, phaseId: phase.id });
                });
            });
        });

        return videos;
    };

    // Get materials by scope
    const getCourseMaterials = () => course?.materials?.filter(m =>
        (m.scope === 'COURSE' || (!m.phaseId && !m.sessionId)) && !isVideo(m)
    ) || [];

    const getPhaseMaterials = (phaseId: number) => course?.materials?.filter(m =>
        m.scope === 'PHASE' && m.phaseId === phaseId && !isVideo(m)
    ) || [];

    const getSessionMaterials = (sessionId: number) => course?.materials?.filter(m =>
        m.sessionId === sessionId && !isVideo(m)
    ) || [];

    const allVideos = getAllVideos();

    // Auto-select first video and expand its phase
    useEffect(() => {
        if (allVideos.length > 0 && !currentVideo) {
            setCurrentVideo(allVideos[0]);
            if (allVideos[0].phaseId) {
                setExpandedPhases([allVideos[0].phaseId]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [course]);

    const togglePhase = (phaseId: number) => {
        setExpandedPhases(prev =>
            prev.includes(phaseId) ? prev.filter(id => id !== phaseId) : [...prev, phaseId]
        );
    };

    const selectVideo = (video: VideoMaterial) => {
        setCurrentVideo(video);
        if (video.phaseId && !expandedPhases.includes(video.phaseId)) {
            setExpandedPhases(prev => [...prev, video.phaseId!]);
        }
    };

    const nextVideo = () => {
        const idx = allVideos.findIndex(v => v.id === currentVideo?.id);
        if (idx < allVideos.length - 1) setCurrentVideo(allVideos[idx + 1]);
    };

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

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">Không tìm thấy khóa học</h2>
                <Button onClick={() => navigate("/curriculum")}>Quay lại</Button>
            </div>
        );
    }

    const currentIndex = allVideos.findIndex(v => v.id === currentVideo?.id);
    const courseMaterials = getCourseMaterials();



    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Simple Header */}
            <header className="h-14 border-b px-4 flex items-center gap-3 bg-card shrink-0">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/curriculum/courses/${id}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-semibold truncate">{course.name}</h1>
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block">
                    {currentIndex + 1} / {allVideos.length}
                </span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Video Player */}
                    <div className="aspect-video w-full bg-black shrink-0">
                        {currentVideo ? (
                            isYouTubeUrl(currentVideo.url) ? (
                                <iframe
                                    key={currentVideo.url}
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(currentVideo.url)}?autoplay=1`}
                                    title={currentVideo.name}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <CustomVideoPlayer key={currentVideo.url} src={currentVideo.url} autoPlay />
                            )
                        ) : (
                            <div className="h-full flex items-center justify-center text-white/50">
                                Chọn một bài học
                            </div>
                        )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold">{currentVideo?.name || "Chọn bài học"}</h2>
                                    {currentVideo?.sessionId && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {course.phases?.flatMap(p => p.sessions || []).find(s => s.id === currentVideo.sessionId)?.topic}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    onClick={nextVideo}
                                    disabled={currentIndex >= allVideos.length - 1}
                                    className="shrink-0"
                                >
                                    Tiếp theo <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>

                            <Tabs defaultValue="overview">
                                <TabsList>
                                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                                    <TabsTrigger value="materials">Tài liệu</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-4">
                                    {currentVideo?.sessionId ? (
                                        <Card>
                                            <CardContent className="p-4 space-y-4">
                                                {course.phases?.flatMap(p => p.sessions || [])
                                                    .find(s => s.id === currentVideo.sessionId)?.studentTask && (
                                                        <div>
                                                            <h4 className="font-medium mb-2">Nhiệm vụ học sinh</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course.phases?.flatMap(p => p.sessions || [])
                                                                    .find(s => s.id === currentVideo.sessionId)?.studentTask}
                                                            </p>
                                                        </div>
                                                    )}
                                                {course.phases?.flatMap(p => p.sessions || [])
                                                    .find(s => s.id === currentVideo.sessionId)?.description && (
                                                        <div>
                                                            <h4 className="font-medium mb-2">Mô tả</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course.phases?.flatMap(p => p.sessions || [])
                                                                    .find(s => s.id === currentVideo.sessionId)?.description}
                                                            </p>
                                                        </div>
                                                    )}
                                                {!course.phases?.flatMap(p => p.sessions || [])
                                                    .find(s => s.id === currentVideo.sessionId)?.studentTask &&
                                                    !course.phases?.flatMap(p => p.sessions || [])
                                                        .find(s => s.id === currentVideo.sessionId)?.description && (
                                                        <p className="text-muted-foreground">Chưa có thông tin</p>
                                                    )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-muted-foreground">{course.description || "Chưa có mô tả"}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="materials" className="mt-4">
                                    {/* Only Course Materials */}
                                    {courseMaterials.length > 0 ? (
                                        <div className="space-y-2">
                                            {courseMaterials.map(doc => (
                                                <Card key={doc.id}>
                                                    <CardContent className="p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate">{doc.title || doc.name}</p>
                                                                <p className="text-xs text-muted-foreground">{doc.type || doc.materialType || 'Tài liệu'}</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.url || '', doc.title || doc.name || 'file')}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-8 text-center text-muted-foreground">
                                                Không có tài liệu chung
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Clean Sidebar */}
                <div className="w-96 border-l flex flex-col bg-card shrink-0">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Nội dung khóa học</h3>
                    </div>

                    <ScrollArea className="flex-1 h-full [&>div>div]:!block">
                        <div className="p-2">
                            {course.phases?.map((phase) => {
                                const isExpanded = expandedPhases.includes(phase.id);
                                const phaseVideos = allVideos.filter(v => v.phaseId === phase.id);
                                const hasCurrentVideo = phaseVideos.some(v => v.id === currentVideo?.id);
                                const phaseDocs = getPhaseMaterials(phase.id);

                                return (
                                    <div key={phase.id} className="mb-1">
                                        {/* Phase Header */}
                                        <button
                                            onClick={() => togglePhase(phase.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                                                "hover:bg-muted/50",
                                                hasCurrentVideo && "bg-primary/5"
                                            )}
                                        >
                                            <ChevronDown className={cn(
                                                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                                                !isExpanded && "-rotate-90"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{phase.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {phase.sessions?.length || 0} buổi học
                                                    {phaseDocs.length > 0 && ` • ${phaseDocs.length} tài liệu`}
                                                </p>
                                            </div>
                                        </button>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="ml-4 border-l border-muted pl-2 mt-1 space-y-1">
                                                {/* Phase Documents */}
                                                {phaseDocs.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50">
                                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                        <span className="text-sm truncate flex-1">{doc.title || doc.name}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(doc.url || '', doc.title || doc.name || 'file'); }} className="p-1 hover:bg-muted rounded">
                                                            <Download className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Sessions */}
                                                {phase.sessions?.map((session, idx) => {
                                                    const sessionVideos = phaseVideos.filter(v => v.sessionId === session.id);
                                                    const sessionDocs = getSessionMaterials(session.id);

                                                    return (
                                                        <div key={session.id}>
                                                            {/* Session label */}
                                                            <p className="px-3 py-2 text-xs text-muted-foreground font-medium">
                                                                Buổi {idx + 1}: {session.topic}
                                                            </p>

                                                            {/* Videos in session */}
                                                            {sessionVideos.map(video => (
                                                                <button
                                                                    key={video.id}
                                                                    onClick={() => selectVideo(video)}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                                                                        currentVideo?.id === video.id
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "hover:bg-muted"
                                                                    )}
                                                                >
                                                                    <PlayCircle className={cn(
                                                                        "h-4 w-4 shrink-0",
                                                                        currentVideo?.id === video.id
                                                                            ? "text-primary-foreground"
                                                                            : "text-muted-foreground"
                                                                    )} />
                                                                    <span className="text-sm truncate">{video.name}</span>
                                                                </button>
                                                            ))}

                                                            {/* Session Documents */}
                                                            {sessionDocs.map(doc => (
                                                                <div key={doc.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50">
                                                                    <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                                                                    <span className="text-sm truncate flex-1">{doc.title || doc.name}</span>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc.url || '', doc.title || doc.name || 'file'); }} className="p-1 hover:bg-muted rounded">
                                                                        <Download className="h-4 w-4 text-muted-foreground" />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {sessionVideos.length === 0 && sessionDocs.length === 0 && (
                                                                <p className="px-3 py-1 text-xs text-muted-foreground italic">
                                                                    Chưa có nội dung
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
