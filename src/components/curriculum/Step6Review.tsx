import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    BookOpen,
    Clock,
    FileText,
    Video,
    Link as LinkIcon,
    GraduationCap,
    Layers,
    Users,
    Calendar,
    Grid3X3,
    Check,
    X,
    ExternalLink
} from "lucide-react";
import type { CourseData } from "@/types/course";
import { useGetCurriculumsWithLevelsQuery, useGetCurriculumQuery } from "@/store/services/curriculumApi";

interface Step6Props {
    data: CourseData;
}

// Assessment type labels
const assessmentTypeLabels: Record<string, string> = {
    QUIZ: "Quiz",
    MIDTERM: "Giữa kỳ",
    FINAL: "Cuối kỳ",
    MOCK_TEST: "Thi thử",
    PHASE_TEST: "Kiểm tra giai đoạn",
    PLACEMENT_TEST: "Kiểm tra đầu vào",
    HOMEWORK: "Bài tập về nhà",
    ORAL: "Vấn đáp",
    PRACTICE: "Thực hành",
    OTHER: "Khác"
};

export function Step6Review({ data }: Step6Props) {
    const [showPLOMatrix, setShowPLOMatrix] = useState(false);
    const { data: subjectsData } = useGetCurriculumsWithLevelsQuery();

    // Get subject for PLO data
    const { data: subjectDetail } = useGetCurriculumQuery(
        data.basicInfo?.subjectId ? parseInt(data.basicInfo.subjectId) : 0,
        { skip: !data.basicInfo?.subjectId }
    );

    // Get subject and level names
    const selectedSubject = subjectsData?.data?.find(s => s.id.toString() === data.basicInfo?.subjectId);
    const selectedLevel = selectedSubject?.levels?.find(l => l.id.toString() === data.basicInfo?.levelId);

    // Calculate statistics
    const totalSessions = data.structure?.reduce((acc, p) => acc + (p.sessions?.length || 0), 0) || 0;
    const totalHours = (data.basicInfo?.hoursPerSession || 0) * totalSessions;

    // Helper functions
    const getMaterialIcon = (type?: string) => {
        switch (type?.toUpperCase()) {
            case 'MEDIA':
            case 'VIDEO':
                return <Video className="h-4 w-4" />;
            case 'LINK':
                return <LinkIcon className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    // Get materials for different levels
    const courseMaterials = data.materials?.filter(m => m.scope === "COURSE") || [];
    const getMaterialsForPhase = (phaseId: string) => {
        return data.materials?.filter(m => m.scope === "PHASE" && m.phaseId === phaseId) || [];
    };
    const getMaterialsForSession = (sessionId: string) => {
        return data.materials?.filter(m => m.scope === "SESSION" && m.sessionId === sessionId) || [];
    };

    const phases = data.structure || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section 1: Thông tin cơ bản */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Thông tin cơ bản</h3>
                <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5" />
                                Tên khóa học
                            </p>
                            <p className="font-medium">{data.basicInfo?.name || <span className="text-muted-foreground italic">Chưa nhập</span>}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                Mã khóa học
                            </p>
                            <p className="font-medium">{data.basicInfo?.code || <span className="text-muted-foreground italic">Chưa nhập</span>}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Môn học
                            </p>
                            <p className="font-medium">{selectedSubject?.name || <span className="text-muted-foreground italic">Chưa chọn</span>}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                Cấp độ
                            </p>
                            <p className="font-medium">{selectedLevel?.name || <span className="text-muted-foreground italic">Chưa chọn</span>}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Số buổi học
                            </p>
                            <p className="font-medium">{data.basicInfo?.numberOfSessions || 0} buổi</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Giờ/buổi
                            </p>
                            <p className="font-medium">{data.basicInfo?.hoursPerSession || 0} giờ</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Tổng thời gian
                            </p>
                            <p className="font-medium">{totalHours} giờ</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Ngày hiệu lực
                            </p>
                            <p className="font-medium">{data.basicInfo?.effectiveDate || <span className="text-muted-foreground italic">Chưa chọn</span>}</p>
                        </div>
                    </div>

                    {(data.basicInfo?.targetAudience || data.basicInfo?.teachingMethods || data.basicInfo?.description || data.basicInfo?.prerequisites) && (
                        <>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.basicInfo?.targetAudience && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" />
                                            Đối tượng học viên
                                        </p>
                                        <p className="text-sm">{data.basicInfo.targetAudience}</p>
                                    </div>
                                )}
                                {data.basicInfo?.teachingMethods && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            Phương pháp giảng dạy
                                        </p>
                                        <p className="text-sm">{data.basicInfo.teachingMethods}</p>
                                    </div>
                                )}
                                {data.basicInfo?.prerequisites && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" />
                                            Yêu cầu đầu vào
                                        </p>
                                        <p className="text-sm">{data.basicInfo.prerequisites}</p>
                                    </div>
                                )}
                                {data.basicInfo?.description && (
                                    <div className="space-y-1 md:col-span-2">
                                        <p className="text-sm text-muted-foreground">Mô tả</p>
                                        <p className="text-sm whitespace-pre-wrap">{data.basicInfo.description}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Section 2: CLOs */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Chuẩn đầu ra (CLO)</h3>
                    <Badge variant="secondary">{data.clos?.length || 0} CLO</Badge>
                </div>

                {data.clos && data.clos.length > 0 ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Mã CLO</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="w-[200px]">PLO liên kết</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.clos.map((clo, index) => (
                                    <TableRow key={clo.code || index}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">{clo.code}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{clo.description}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {clo.mappedPLOs && clo.mappedPLOs.length > 0 ? (
                                                    [...new Set(clo.mappedPLOs)]
                                                        .sort((a, b) => {
                                                            const numA = parseInt(a.replace(/\D/g, '')) || 0;
                                                            const numB = parseInt(b.replace(/\D/g, '')) || 0;
                                                            return numA - numB;
                                                        })
                                                        .map(plo => (
                                                            <Badge key={plo} variant="secondary" className="text-xs">{plo}</Badge>
                                                        ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Chưa có CLO nào được thêm
                    </div>
                )}

                {/* PLO-CLO Matrix Button & Modal */}
                {data.clos && data.clos.length > 0 && subjectDetail?.data?.plos && subjectDetail.data.plos.length > 0 && (
                    <Dialog open={showPLOMatrix} onOpenChange={setShowPLOMatrix}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Grid3X3 className="h-4 w-4" />
                                Xem ma trận PLO-CLO
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="max-w-none w-auto"
                            style={{
                                maxWidth: 'calc(100vw - 2rem)',
                                maxHeight: 'calc(100vh - 2rem)',
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Grid3X3 className="h-5 w-5" />
                                    Ma trận liên kết PLO - CLO
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 rounded-md border overflow-auto">
                                <Table className="w-auto">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="bg-background whitespace-nowrap">
                                                CLO / PLO
                                            </TableHead>
                                            {[...subjectDetail.data.plos]
                                                .sort((a, b) => {
                                                    const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
                                                    const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
                                                    return numA - numB;
                                                })
                                                .map((plo) => (
                                                    <TableHead
                                                        key={plo.code}
                                                        className="text-center whitespace-nowrap px-4"
                                                        title={plo.description}
                                                    >
                                                        {plo.code}
                                                    </TableHead>
                                                ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.clos.map((clo) => (
                                            <TableRow key={clo.code}>
                                                <TableCell
                                                    className="bg-background font-medium whitespace-nowrap"
                                                    title={clo.description}
                                                >
                                                    <Badge variant="outline" className="font-mono">
                                                        {clo.code}
                                                    </Badge>
                                                </TableCell>
                                                {[...(subjectDetail.data.plos || [])]
                                                    .sort((a, b) => {
                                                        const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
                                                        const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
                                                        return numA - numB;
                                                    })
                                                    .map((plo) => {
                                                        const isLinked = clo.mappedPLOs?.includes(plo.code);
                                                        return (
                                                            <TableCell
                                                                key={plo.code}
                                                                className="text-center px-4"
                                                            >
                                                                {isLinked ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-center">
                                                                        <X className="h-4 w-4 text-muted-foreground/30" />
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span>Có liên kết</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <X className="h-4 w-4 text-muted-foreground/30" />
                                    <span>Không liên kết</span>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Section 3: Tài liệu khóa học */}
            {courseMaterials.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Tài liệu khóa học</h3>
                        <Badge variant="secondary">{courseMaterials.length} tài liệu</Badge>
                    </div>

                    <div className="grid gap-3">
                        {courseMaterials.map((material, index) => (
                            <div key={material.id || index} className="flex items-center gap-4 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    {getMaterialIcon(material.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{material.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">
                                            {material.type === 'LINK' ? 'LINK' : 'DOCUMENT'}
                                        </Badge>
                                        {material.url && (
                                            <a
                                                href={material.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                {material.type === 'LINK' ? material.url.substring(0, 40) + (material.url.length > 40 ? '...' : '') : 'Xem file'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 4: Cấu trúc khóa học */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Cấu trúc chương trình</h3>
                    <Badge variant="secondary">{phases.length} giai đoạn • {totalSessions} buổi</Badge>
                </div>

                {phases.length > 0 ? (
                    <Accordion type="multiple" defaultValue={["phase-0"]} className="space-y-2">
                        {phases.map((phase, phaseIndex) => {
                            const phaseMaterials = getMaterialsForPhase(phase.id);
                            return (
                                <AccordionItem key={phase.id} value={`phase-${phaseIndex}`} className="border rounded-lg">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <div className="flex items-center gap-3 text-left">
                                            <Badge variant="outline">GĐ {phaseIndex + 1}</Badge>
                                            <span className="font-medium">{phase.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                ({phase.sessions?.length || 0} buổi)
                                            </span>
                                            {phaseMaterials.length > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {phaseMaterials.length} tài liệu
                                                </Badge>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        {/* Phase Materials */}
                                        {phaseMaterials.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium mb-3">Tài liệu giai đoạn ({phaseMaterials.length})</p>
                                                <div className="grid gap-2">
                                                    {phaseMaterials.map((m, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                                {getMaterialIcon(m.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">{m.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {m.type === 'LINK' ? 'LINK' : 'DOCUMENT'}
                                                                    </Badge>
                                                                    {m.url && (
                                                                        <a
                                                                            href={m.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                                        >
                                                                            <ExternalLink className="h-3 w-3" />
                                                                            {m.type === 'LINK' ? m.url.substring(0, 30) + '...' : 'Xem file'}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sessions Table */}
                                        {phase.sessions && phase.sessions.length > 0 ? (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-16">Buổi</TableHead>
                                                            <TableHead>Chủ đề</TableHead>
                                                            <TableHead>Nhiệm vụ học viên</TableHead>
                                                            <TableHead className="w-[140px]">Kỹ năng</TableHead>
                                                            <TableHead className="w-[120px]">CLO</TableHead>
                                                            <TableHead>Tài liệu</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {phase.sessions.map((session, sessionIndex) => {
                                                            const sessionMaterials = getMaterialsForSession(session.id);
                                                            return (
                                                                <TableRow key={session.id}>
                                                                    <TableCell>
                                                                        <Badge variant="outline">{session.sequence || sessionIndex + 1}</Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <p className="font-medium text-sm">{session.topic}</p>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {session.studentTask ? (
                                                                            <p className="text-sm text-muted-foreground">{session.studentTask}</p>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {session.skills?.map((skill, idx) => (
                                                                                <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {session.cloIds?.map((cloId, idx) => (
                                                                                <Badge key={idx} variant="outline" className="text-xs font-mono">{cloId}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {sessionMaterials.length > 0 ? (
                                                                            <div className="space-y-2">
                                                                                {sessionMaterials.map((m, idx) => (
                                                                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-background text-xs">
                                                                                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                                                                                            {getMaterialIcon(m.type)}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-medium truncate">{m.name}</p>
                                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                                                    {m.type === 'LINK' ? 'LINK' : 'DOCUMENT'}
                                                                                                </Badge>
                                                                                                {m.url && (
                                                                                                    <a
                                                                                                        href={m.url}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                                                                                                    >
                                                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                                                        {m.type === 'LINK' ? 'Mở link' : 'Xem file'}
                                                                                                    </a>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Chưa có buổi học trong giai đoạn này
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Chưa có giai đoạn nào được tạo
                    </div>
                )}
            </div>

            {/* Section 5: Bài kiểm tra */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Bài kiểm tra</h3>
                    <Badge variant="secondary">{data.assessments?.length || 0} bài</Badge>
                </div>

                {data.assessments && data.assessments.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên bài kiểm tra</TableHead>
                                    <TableHead className="w-[130px]">Loại</TableHead>
                                    <TableHead className="w-[100px]">Thời lượng</TableHead>
                                    <TableHead className="w-[100px]">Điểm tối đa</TableHead>
                                    <TableHead className="w-[150px]">Kỹ năng</TableHead>
                                    <TableHead className="w-[120px]">CLO</TableHead>
                                    <TableHead className="w-[200px]">Mô tả</TableHead>
                                    <TableHead className="w-[150px]">Ghi chú</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.assessments.map((assessment, index) => (
                                    <TableRow key={assessment.id || index}>
                                        <TableCell className="font-medium">{assessment.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {assessmentTypeLabels[assessment.type] || assessment.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {assessment.durationMinutes ? `${assessment.durationMinutes} phút` : '—'}
                                        </TableCell>
                                        <TableCell>{assessment.maxScore || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {assessment.skills && assessment.skills.length > 0 ? (
                                                    assessment.skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {assessment.cloIds && assessment.cloIds.length > 0 ? (
                                                    assessment.cloIds.map((cloId, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs font-mono">{cloId}</Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="line-clamp-2 text-sm text-muted-foreground">
                                                {assessment.description || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="line-clamp-2 text-sm text-muted-foreground">
                                                {assessment.note || '—'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Chưa có bài kiểm tra nào được thêm
                    </div>
                )}
            </div>
        </div>
    );
}
