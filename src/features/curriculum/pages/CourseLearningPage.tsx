import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCourseDetailsQuery } from "@/store/services/courseApi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, ArrowLeft, PlayCircle, FileText, CheckCircle, Lock, ChevronRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomVideoPlayer } from "../components/CustomVideoPlayer";

interface VideoMaterial {
    id: number;
    name: string;
    url: string;
    type: string;
    duration?: string;
    phaseId?: number;
    sessionId?: number;
}

export default function CourseLearningPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentVideo, setCurrentVideo] = useState<VideoMaterial | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

    const { data: courseData, isLoading } = useGetCourseDetailsQuery(Number(id), {
        skip: !id || isNaN(Number(id))
    });
    const course = courseData?.data;

    const isVideoFile = (url?: string) => {
        if (!url) return false;
        const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    // Helper function to check if URL is YouTube
    const isYouTubeUrl = (url?: string) => {
        if (!url) return false;
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    };

    // Helper function to extract YouTube video ID
    const getYouTubeVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Extract all videos from the course structure
    const getAllVideos = () => {
        if (!course) return [];
        const videos: VideoMaterial[] = [];

        // Course level materials (both video files and YouTube links)
        course.materials?.forEach(m => {
            if (isVideoFile(m.url) || isYouTubeUrl(m.url)) {
                videos.push({ ...m, url: m.url || '' });
            }
        });

        // Phase and Session level materials
        course.phases?.forEach(phase => {
            // Phase materials
            course.materials?.filter(m => m.scope === 'PHASE' && m.phaseId === phase.id).forEach(m => {
                if (isVideoFile(m.url) || isYouTubeUrl(m.url)) {
                    videos.push({ ...m, url: m.url || '' });
                }
            });

            // Session materials
            phase.sessions?.forEach(session => {
                course.materials?.filter(m => m.scope === 'SESSION' && m.sessionId === session.id).forEach(m => {
                    if (isVideoFile(m.url) || isYouTubeUrl(m.url)) {
                        videos.push({ ...m, url: m.url || '' });
                    }
                });
            });
        });

        return videos;
    };

    const allVideos = getAllVideos();

    // Auto-select first video on load
    useEffect(() => {
        if (allVideos.length > 0 && !currentVideo) {
            setCurrentVideo(allVideos[0]);
            // Expand the phase containing the first video if applicable
            if (allVideos[0].phaseId) {
                setExpandedPhases([`phase-${allVideos[0].phaseId}`]);
            }
        }
    }, [course]);

    const handleVideoSelect = (video: VideoMaterial) => {
        setCurrentVideo(video);
    };

    const handleNextVideo = () => {
        if (!currentVideo) return;
        const currentIndex = allVideos.findIndex(v => v.id === currentVideo.id);
        if (currentIndex < allVideos.length - 1) {
            setCurrentVideo(allVideos[currentIndex + 1]);
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

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center gap-4 border-b px-6 bg-card">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/curriculum/courses/${id}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold truncate">{course.name}</h1>
                    <p className="text-xs text-muted-foreground truncate">{course.code}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="hidden sm:flex">
                        {allVideos.length} bài học video
                    </Badge>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Video Player Area */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                    <div className="aspect-video w-full bg-black relative group">
                        {currentVideo ? (
                            isYouTubeUrl(currentVideo.url) ? (
                                // YouTube Player
                                <iframe
                                    key={currentVideo.url}
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentVideo.url)}?autoplay=1`}
                                    title={currentVideo.name}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                // Custom S3 Video Player
                                <CustomVideoPlayer
                                    key={currentVideo.url}
                                    src={currentVideo.url}
                                    autoPlay={true}
                                />
                            )
                        ) : (
                            <div className="flex h-full items-center justify-center text-white/50">
                                <p>Chọn một bài học để bắt đầu</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{currentVideo?.name || "Chọn bài học"}</h2>
                                <p className="text-muted-foreground">{currentVideo?.type || "Video"}</p>
                            </div>
                            {currentVideo && (
                                <Button onClick={handleNextVideo} disabled={allVideos.findIndex(v => v.id === currentVideo.id) === allVideos.length - 1}>
                                    Bài tiếp theo <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList>
                                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                                <TabsTrigger value="notes">Ghi chú</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview" className="mt-4 space-y-4">
                                {currentVideo?.sessionId ? (
                                    // Show session-specific information
                                    <>
                                        {/* Student Task */}
                                        {course.phases?.flatMap(p => p.sessions || [])
                                            .find(s => s.id === currentVideo.sessionId)?.studentTask && (
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold">Nhiệm vụ của học sinh</h3>
                                                    <Card>
                                                        <CardContent className="p-4">
                                                            <p className="text-muted-foreground">
                                                                {course.phases?.flatMap(p => p.sessions || [])
                                                                    .find(s => s.id === currentVideo.sessionId)?.studentTask}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}

                                        {/* Downloadable Materials */}
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">Tài liệu để tải về</h3>
                                            {course.materials?.filter(m =>
                                                m.sessionId === currentVideo.sessionId &&
                                                !isVideoFile(m.url) &&
                                                !isYouTubeUrl(m.url)
                                            ).length ? (
                                                <div className="space-y-2">
                                                    {course.materials?.filter(m =>
                                                        m.sessionId === currentVideo.sessionId &&
                                                        !isVideoFile(m.url) &&
                                                        !isYouTubeUrl(m.url)
                                                    ).map(material => (
                                                        <Card key={material.id} className="hover:bg-muted/50 transition-colors">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                                        <div>
                                                                            <p className="font-medium">{material.name}</p>
                                                                            <p className="text-xs text-muted-foreground">{material.type}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Button variant="outline" size="sm" asChild>
                                                                        <a href={material.url} download>
                                                                            <Download className="h-4 w-4 mr-2" />
                                                                            Tải về
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Card>
                                                    <CardContent className="p-8 text-center text-muted-foreground">
                                                        Không có tài liệu để tải về
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    // Show course description if no session selected
                                    <div className="prose max-w-none dark:prose-invert">
                                        <h3 className="text-lg font-semibold">Mô tả khóa học</h3>
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-muted-foreground">
                                                    {course.description || "Chưa có mô tả cho khóa học này."}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="notes" className="mt-4">
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        Tính năng ghi chú đang được phát triển.
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="w-80 border-l bg-muted/10 flex flex-col">
                    <div className="p-4 border-b bg-card">
                        <h3 className="font-semibold">Nội dung khóa học</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {allVideos.findIndex(v => v.id === currentVideo?.id) + 1} / {allVideos.length} bài học
                        </p>
                    </div>

                    <ScrollArea className="flex-1">
                        <Accordion type="multiple" defaultValue={course.phases?.map(p => `phase-${p.id}`)} className="w-full">
                            {course.phases?.map((phase, index) => (
                                <AccordionItem key={phase.id} value={`phase-${phase.id}`} className="border-b-0">
                                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Giai đoạn {phase.phaseNumber}: {phase.name}</p>
                                            <p className="text-xs text-muted-foreground font-normal">{phase.sessions?.length || 0} buổi học</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-0">
                                        {/* Phase Materials */}
                                        {course.materials?.filter(m => m.scope === 'PHASE' && m.phaseId === phase.id).map(material => (
                                            <div
                                                key={material.id}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors border-l-4 ${currentVideo?.id === material.id
                                                    ? "border-l-primary bg-primary/5"
                                                    : "border-l-transparent"
                                                    }`}
                                                onClick={() => (isVideoFile(material.url) || isYouTubeUrl(material.url)) && handleVideoSelect({ ...material, url: material.url || '' })}
                                            >
                                                {isVideoFile(material.url) || isYouTubeUrl(material.url) ? (
                                                    <PlayCircle className={`h-4 w-4 ${currentVideo?.id === material.id ? "text-primary" : "text-muted-foreground"}`} />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${currentVideo?.id === material.id ? "font-medium text-primary" : ""}`}>
                                                        {material.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Tài liệu giai đoạn</p>
                                                </div>
                                                {!(isVideoFile(material.url) || isYouTubeUrl(material.url)) && (
                                                    <a href={material.url} download onClick={(e) => e.stopPropagation()}>
                                                        <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}

                                        {/* Sessions */}
                                        {phase.sessions?.map((session, sIndex) => (
                                            <div key={session.id}>
                                                <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground border-y">
                                                    Buổi {sIndex + 1}: {session.topic}
                                                </div>
                                                {course.materials?.filter(m => m.scope === 'SESSION' && m.sessionId === session.id).map(material => (
                                                    <div
                                                        key={material.id}
                                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors border-l-4 ${currentVideo?.id === material.id
                                                            ? "border-l-primary bg-primary/5"
                                                            : "border-l-transparent"
                                                            }`}
                                                        onClick={() => (isVideoFile(material.url) || isYouTubeUrl(material.url)) && handleVideoSelect({ ...material, url: material.url || '' })}
                                                    >
                                                        {isVideoFile(material.url) || isYouTubeUrl(material.url) ? (
                                                            <PlayCircle className={`h-4 w-4 ${currentVideo?.id === material.id ? "text-primary" : "text-muted-foreground"}`} />
                                                        ) : (
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm truncate ${currentVideo?.id === material.id ? "font-medium text-primary" : ""}`}>
                                                                {material.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Video bài giảng</p>
                                                        </div>
                                                        {!(isVideoFile(material.url) || isYouTubeUrl(material.url)) && (
                                                            <a href={material.url} download onClick={(e) => e.stopPropagation()}>
                                                                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!course.materials?.some(m => m.scope === 'SESSION' && m.sessionId === session.id)) && (
                                                    <div className="px-4 py-2 text-xs text-muted-foreground italic pl-11">
                                                        Không có tài liệu
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
