import { useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from "@/components/ui/accordion";

import { useGetSkillsQuery } from "@/store/services/enumApi";
import { useDeleteFileMutation, useDeleteMaterialMutation } from "@/store/services/uploadApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, FileText, BookOpen } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { CourseData, Phase, Session, Material } from "@/types/course";
import { MaterialSection } from "./MaterialSection";

// Validation function for Step 3
export function validateStep3(data: CourseData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if structure exists
    if (!data.structure || data.structure.length === 0) {
        errors.push("Vui lòng tạo ít nhất một giai đoạn.");
        return { isValid: false, errors };
    }

    // Check session count
    const totalCreatedSessions = data.structure.reduce(
        (sum, phase) => sum + (phase.sessions?.length || 0),
        0
    );
    const requiredSessions = Number(data.basicInfo.numberOfSessions) || 0;

    if (totalCreatedSessions !== requiredSessions) {
        errors.push(
            `Số buổi đã tạo (${totalCreatedSessions}) không khớp với Tổng số buổi (${requiredSessions}).`
        );
        return { isValid: false, errors };
    }

    // Check if all sessions have required fields filled (topic, studentTask, skills, cloIds)
    let hasIncompleteSession = false;
    let hasMinLengthError = false;

    data.structure.forEach((phase) => {
        phase.sessions?.forEach((session) => {
            // Check required fields
            if (!session.topic?.trim() || !session.studentTask?.trim()) {
                hasIncompleteSession = true;
            }
            // Check minimum length (10 characters)
            if (session.topic?.trim() && session.topic.trim().length < 10) {
                hasMinLengthError = true;
            }
            if (session.studentTask?.trim() && session.studentTask.trim().length < 10) {
                hasMinLengthError = true;
            }
            // Check skills
            if (!session.skills || session.skills.length === 0) {
                hasIncompleteSession = true;
            }
            // Check CLO mapping
            if (!session.cloIds || session.cloIds.length === 0) {
                hasIncompleteSession = true;
            }
        });
    });

    if (hasIncompleteSession) {
        errors.push("Vui lòng điền đầy đủ Chủ đề, Nhiệm vụ, Kỹ năng và Ánh xạ CLO cho tất cả các buổi học.");
    }

    if (hasMinLengthError) {
        errors.push("Chủ đề và Nhiệm vụ phải có ít nhất 10 ký tự.");
    }

    // Check if course has at least 1 material (any scope: COURSE, PHASE, or SESSION)
    const totalMaterials = data.materials?.length || 0;
    if (totalMaterials === 0) {
        errors.push("Vui lòng thêm ít nhất 1 tài liệu cho khóa học (tài liệu chung, giai đoạn hoặc buổi học).");
    }

    // Check CLO coverage - each CLO must be mapped to at least one session
    const allCLOs = data.clos || [];
    const mappedCLOs = new Set<string>();

    data.structure.forEach((phase) => {
        phase.sessions?.forEach((session) => {
            session.cloIds?.forEach((cloId) => mappedCLOs.add(cloId));
        });
    });

    const unmappedCLOs = allCLOs.filter((clo) => !mappedCLOs.has(clo.code));
    if (unmappedCLOs.length > 0) {
        errors.push("Mỗi CLO cần được ánh xạ với ít nhất 1 buổi học.");
    }

    return { isValid: errors.length === 0, errors };
}

interface Step3Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

export function Step3Structure({ data, setData }: Step3Props) {
    const { data: skills = [] } = useGetSkillsQuery();
    const [deleteFile] = useDeleteFileMutation();
    const [deleteMaterial] = useDeleteMaterialMutation();
    
    // Validation error states for sessions
    // Format: { "phaseIndex-sessionIndex-field": "error message" }
    const [sessionErrors, setSessionErrors] = useState<Record<string, string>>({});
    
    const [deleteSessionDialog, setDeleteSessionDialog] = useState<{
        open: boolean;
        phaseIndex: number;
        sessionIndex: number;
        sessionTopic: string;
    } | null>(null);

    const [deletePhaseDialog, setDeletePhaseDialog] = useState<{
        open: boolean;
        phaseIndex: number;
        phaseName: string;
        sessionCount: number;
    } | null>(null);

    const addPhase = () => {
        const newPhase: Phase = {
            id: crypto.randomUUID(),
            name: `Giai đoạn ${(data.structure?.length || 0) + 1} `,
            sessions: [],
        };
        setData((prev) => ({
            ...prev,
            structure: [...(prev.structure || []), newPhase],
        }));
    };

    const addSession = (phaseIndex: number) => {
        const newSession: Session = {
            id: crypto.randomUUID(),
            sequence: (data.structure[phaseIndex].sessions?.length || 0) + 1,
            topic: "",
            studentTask: "",
            skills: [],
            cloIds: [],
        };

        const newStructure = [...(data.structure || [])];
        newStructure[phaseIndex].sessions = [...(newStructure[phaseIndex].sessions || []), newSession];
        setData((prev) => ({ ...prev, structure: newStructure }));
    };

    const updatePhaseName = (index: number, name: string) => {
        const newStructure = [...data.structure];
        newStructure[index].name = name;
        setData((prev) => ({ ...prev, structure: newStructure }));
    };

    const updateSession = (phaseIndex: number, sessionIndex: number, field: keyof Session, value: string | number | string[]) => {
        const newStructure = [...data.structure];
        newStructure[phaseIndex].sessions[sessionIndex] = {
            ...newStructure[phaseIndex].sessions[sessionIndex],
            [field]: value,
        };
        setData((prev) => ({ ...prev, structure: newStructure }));

        // Real-time validation
        const errorKey = `${phaseIndex}-${sessionIndex}-${field}`;
        
        if (field === 'topic') {
            const trimmedValue = (value as string).trim();
            if (!trimmedValue) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Chủ đề không được để trống' }));
            } else if (trimmedValue.length < 10) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Chủ đề phải có ít nhất 10 ký tự' }));
            } else {
                setSessionErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }
        }
        
        if (field === 'studentTask') {
            const trimmedValue = (value as string).trim();
            if (!trimmedValue) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Nhiệm vụ không được để trống' }));
            } else if (trimmedValue.length < 10) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Nhiệm vụ phải có ít nhất 10 ký tự' }));
            } else {
                setSessionErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }
        }
        
        if (field === 'skills') {
            if (!(value as string[]).length) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Vui lòng chọn ít nhất 1 kỹ năng' }));
            } else {
                setSessionErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }
        }

        if (field === 'cloIds') {
            if (!(value as string[]).length) {
                setSessionErrors(prev => ({ ...prev, [errorKey]: 'Vui lòng ánh xạ ít nhất 1 CLO' }));
            } else {
                setSessionErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }
        }
    };

    // Helper to get error for a specific session field
    const getSessionError = (phaseIndex: number, sessionIndex: number, field: string): string | undefined => {
        return sessionErrors[`${phaseIndex}-${sessionIndex}-${field}`];
    };

    // Check if session has any data
    const sessionHasData = (session: Session): boolean => {
        const sessionMaterials = (data.materials || []).filter(
            (m) => m.scope === "SESSION" && m.sessionId === session.id
        );
        return !!(
            session.topic?.trim() ||
            session.studentTask?.trim() ||
            (session.skills && session.skills.length > 0) ||
            (session.cloIds && session.cloIds.length > 0) ||
            sessionMaterials.length > 0
        );
    };

    // Check if phase has any data
    const phaseHasData = (phase: Phase): boolean => {
        const phaseMaterials = (data.materials || []).filter(
            (m) => m.scope === "PHASE" && m.phaseId === phase.id
        );
        // Check phase name (excluding default name pattern)
        const hasCustomName = phase.name?.trim() && !phase.name.match(/^Giai đoạn \d+\s*$/);
        // Check if any session has data
        const hasSessionData = phase.sessions?.some(sessionHasData) || false;
        
        return !!(hasCustomName || phaseMaterials.length > 0 || hasSessionData);
    };

    const handleDeleteSessionClick = (phaseIndex: number, sessionIndex: number) => {
        const session = data.structure[phaseIndex].sessions[sessionIndex];
        
        // If session has no data, delete directly without confirmation
        if (!sessionHasData(session)) {
            deleteSessionDirectly(phaseIndex, sessionIndex);
            return;
        }
        
        // Show confirmation dialog
        setDeleteSessionDialog({
            open: true,
            phaseIndex,
            sessionIndex,
            sessionTopic: session.topic || `Buổi ${session.sequence}`,
        });
    };

    // Direct delete without confirmation (for empty sessions)
    const deleteSessionDirectly = (phaseIndex: number, sessionIndex: number) => {
        const newStructure = [...data.structure];
        const sessionToDelete = newStructure[phaseIndex].sessions[sessionIndex];
        
        newStructure[phaseIndex].sessions = newStructure[phaseIndex].sessions.filter(
            (_, i) => i !== sessionIndex
        );
        // Re-sequence
        newStructure[phaseIndex].sessions.forEach((s, i) => {
            s.sequence = i + 1;
        });

        // Remove materials for this session from materials array (just in case)
        const newMaterials = (data.materials || []).filter(
            (m) => !(m.scope === "SESSION" && m.sessionId === sessionToDelete.id)
        );

        setData((prev) => ({ ...prev, structure: newStructure, materials: newMaterials }));
    };

    const confirmDeleteSession = async () => {
        if (!deleteSessionDialog) return;

        const { phaseIndex, sessionIndex } = deleteSessionDialog;
        const sessionToDelete = data.structure[phaseIndex].sessions[sessionIndex];

        // Get materials for this session
        const sessionMaterials = (data.materials || []).filter(
            (m) => m.scope === "SESSION" && m.sessionId === sessionToDelete.id
        );

        // Delete materials (both from DB if saved, and S3)
        for (const material of sessionMaterials) {
            const isInDatabase = material.id && !isNaN(Number(material.id));

            if (isInDatabase) {
                // Material is in database - call API to delete from DB (also handles S3)
                try {
                    await deleteMaterial(Number(material.id)).unwrap();
                } catch (error) {
                    console.error("Failed to delete material from database:", error);
                }
            } else {
                // Material is only in React state - delete from S3 only
                if (material.type !== "LINK" && material.url?.includes(".s3.")) {
                    try {
                        await deleteFile(material.url).unwrap();
                    } catch (error) {
                        console.error("Failed to delete file from S3:", error);
                    }
                }
            }
        }

        // Remove session from structure
        const newStructure = [...data.structure];
        newStructure[phaseIndex].sessions = newStructure[phaseIndex].sessions.filter(
            (_, i) => i !== sessionIndex
        );
        // Re-sequence
        newStructure[phaseIndex].sessions.forEach((s, i) => {
            s.sequence = i + 1;
        });

        // Also remove materials for this session from materials array
        const newMaterials = (data.materials || []).filter(
            (m) => !(m.scope === "SESSION" && m.sessionId === sessionToDelete.id)
        );

        setData((prev) => ({ ...prev, structure: newStructure, materials: newMaterials }));
        setDeleteSessionDialog(null);
    };

    const handleDeletePhaseClick = (phaseIndex: number) => {
        const phase = data.structure[phaseIndex];
        
        // If phase has no data, delete directly without confirmation
        if (!phaseHasData(phase)) {
            deletePhaseDirectly(phaseIndex);
            return;
        }
        
        // Show confirmation dialog
        setDeletePhaseDialog({
            open: true,
            phaseIndex,
            phaseName: phase.name || `Giai đoạn ${phaseIndex + 1}`,
            sessionCount: phase.sessions?.length || 0,
        });
    };

    // Direct delete without confirmation (for empty phases)
    const deletePhaseDirectly = (phaseIndex: number) => {
        const phaseToDelete = data.structure[phaseIndex];
        const newStructure = data.structure.filter((_, i) => i !== phaseIndex);

        // Remove all materials for this phase and its sessions
        const sessionIds = phaseToDelete.sessions?.map((s) => s.id) || [];
        const newMaterials = (data.materials || []).filter(
            (m) =>
                !(m.scope === "PHASE" && m.phaseId === phaseToDelete.id) &&
                !(m.scope === "SESSION" && sessionIds.includes(m.sessionId || ""))
        );

        setData((prev) => ({ ...prev, structure: newStructure, materials: newMaterials }));
    };

    const confirmDeletePhase = async () => {
        if (!deletePhaseDialog) return;

        const { phaseIndex } = deletePhaseDialog;
        const phaseToDelete = data.structure[phaseIndex];

        // Collect all materials to delete (PHASE level + all SESSION level materials)
        const materialsToDelete: Material[] = [];

        // Phase level materials
        const phaseMaterials = (data.materials || []).filter(
            (m) => m.scope === "PHASE" && m.phaseId === phaseToDelete.id
        );
        materialsToDelete.push(...phaseMaterials);

        // Session level materials for all sessions in this phase
        phaseToDelete.sessions?.forEach((session) => {
            const sessionMaterials = (data.materials || []).filter(
                (m) => m.scope === "SESSION" && m.sessionId === session.id
            );
            materialsToDelete.push(...sessionMaterials);
        });

        // Delete all materials (from DB if saved, from S3 if not)
        for (const material of materialsToDelete) {
            const isInDatabase = material.id && !isNaN(Number(material.id));

            if (isInDatabase) {
                try {
                    await deleteMaterial(Number(material.id)).unwrap();
                } catch (error) {
                    console.error("Failed to delete material from database:", error);
                }
            } else {
                if (material.type !== "LINK" && material.url?.includes(".s3.")) {
                    try {
                        await deleteFile(material.url).unwrap();
                    } catch (error) {
                        console.error("Failed to delete file from S3:", error);
                    }
                }
            }
        }

        // Remove phase from structure
        const newStructure = data.structure.filter((_, i) => i !== phaseIndex);

        // Remove all materials for this phase and its sessions
        const sessionIds = phaseToDelete.sessions?.map((s) => s.id) || [];
        const newMaterials = (data.materials || []).filter(
            (m) =>
                !(m.scope === "PHASE" && m.phaseId === phaseToDelete.id) &&
                !(m.scope === "SESSION" && sessionIds.includes(m.sessionId || ""))
        );

        setData((prev) => ({ ...prev, structure: newStructure, materials: newMaterials }));
        setDeletePhaseDialog(null);
    };

    // Material Management Helpers
    const updateMaterials = (newMaterials: Material[], scope: "COURSE" | "PHASE" | "SESSION", phaseId?: string, sessionId?: string) => {
        setData((prev) => {
            // Filter out existing materials for this specific scope/context
            const otherMaterials = (prev.materials || []).filter(m => {
                if (m.scope !== scope) return true;
                if (scope === "PHASE" && m.phaseId !== phaseId) return true;
                if (scope === "SESSION" && m.sessionId !== sessionId) return true;
                return false;
            });

            // Combine with new materials
            return {
                ...prev,
                materials: [...otherMaterials, ...newMaterials]
            };
        });
    };

    const getMaterials = (scope: "COURSE" | "PHASE" | "SESSION", phaseId?: string, sessionId?: string) => {
        return (data.materials || []).filter(m =>
            m.scope === scope &&
            (scope !== "PHASE" || m.phaseId === phaseId) &&
            (scope !== "SESSION" || m.sessionId === sessionId)
        );
    };

    // Calculate session counts
    const currentSessionCount = data.structure?.reduce((acc, phase) => acc + (phase.sessions?.length || 0), 0) || 0;
    const targetSessionCount = data.basicInfo?.numberOfSessions || 0;
    const isSessionCountValid = currentSessionCount === targetSessionCount;

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Fixed Header Section */}
            <div className="shrink-0 space-y-4 pb-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-primary">Cấu trúc chương trình</h3>
                    <div className="flex items-center gap-4">
                        {/* Session Count Badge */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                            isSessionCountValid
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                            <span>Buổi học:</span>
                            <span className="font-bold">{currentSessionCount}</span>
                            <span>/</span>
                            <span className="font-bold">{targetSessionCount}</span>
                            {!isSessionCountValid && (
                                <span className="text-xs ml-1">(chưa khớp)</span>
                            )}
                        </div>
                        <Button onClick={addPhase} className="shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm Giai đoạn
                        </Button>
                    </div>
                </div>

                {/* Course Level Materials - Collapsible */}
                <Accordion type="multiple" className="w-full space-y-2">
                    {/* CLO Reference - Collapsible */}
                    <AccordionItem value="clo-reference" className="border rounded-xl bg-white shadow-sm">
                        <AccordionPrimitive.Header className="flex">
                            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium transition-all hover:no-underline group [&[data-state=open]>svg]:rotate-180">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    <span>Tham chiếu CLO</span>
                                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                        {data.clos?.length || 0} CLO
                                    </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="px-4 pb-4">
                            {data.clos && data.clos.length > 0 ? (
                                <div className="grid gap-2">
                                    {data.clos.map((clo, index) => (
                                        <div 
                                            key={clo.code || index} 
                                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                                        >
                                            <Badge className="shrink-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                                {clo.code}
                                            </Badge>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {clo.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Chưa có CLO nào. Vui lòng thêm CLO ở Bước 2.
                                </p>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    {/* Course Materials */}
                    <AccordionItem value="course-materials" className="border rounded-xl bg-white shadow-sm">
                        <AccordionPrimitive.Header className="flex">
                            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-3 px-4 font-medium transition-all hover:no-underline group [&[data-state=open]>svg]:rotate-180">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span>Tài liệu chung cho Khóa học</span>
                                    <Badge variant="outline" className="ml-2 bg-slate-50">
                                        {getMaterials("COURSE").length} tài liệu
                                    </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="px-4 pb-4">
                            <MaterialSection
                                materials={getMaterials("COURSE")}
                                onUpdate={(m) => updateMaterials(m, "COURSE")}
                                scope="COURSE"
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2 -mr-2">
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={["item-0"]}>
                {data.structure?.map((phase, pIndex) => (
                    <AccordionItem
                        key={phase.id}
                        value={`item-${pIndex}`}
                        className="border rounded-lg px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-sm data-[state=open]:border-l-4 data-[state=open]:border-l-primary transition-all duration-200"
                    >
                        <AccordionPrimitive.Header className="flex items-center px-4 py-4 hover:no-underline group">
                            <AccordionPrimitive.Trigger className="font-bold text-lg min-w-[100px] text-primary/80 group-hover:text-primary transition-colors text-left">
                                Giai đoạn {pIndex + 1}:
                            </AccordionPrimitive.Trigger>
                            <Input
                                value={phase.name}
                                onChange={(e) => updatePhaseName(pIndex, e.target.value)}
                                className="max-w-md h-9 font-medium bg-white ml-4"
                                placeholder="Tên giai đoạn (VD: Giai đoạn nền tảng)"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                            />
                            <div className="ml-auto mr-4 flex items-center gap-2">
                                <Badge variant="outline" className="bg-white">
                                    {phase.sessions?.length || 0} buổi
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePhaseClick(pIndex);
                                    }}
                                    title="Xóa giai đoạn"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <AccordionPrimitive.Trigger>
                                <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="pb-6 pt-2 space-y-6">
                            {/* Phase Level Materials - Collapsible */}
                            <div className="px-1">
                                <MaterialSection
                                    title="Tài liệu Giai đoạn"
                                    materials={getMaterials("PHASE", phase.id)}
                                    onUpdate={(m) => updateMaterials(m, "PHASE", phase.id)}
                                    scope="PHASE"
                                    phaseId={phase.id}
                                    collapsible
                                    defaultOpen={false}
                                />
                            </div>

                            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead className="w-[60px] text-center">STT</TableHead>
                                            <TableHead className="min-w-[200px]">Chủ đề</TableHead>
                                            <TableHead className="min-w-[200px]">Nhiệm vụ sinh viên</TableHead>
                                            <TableHead className="w-[180px]">Kỹ năng</TableHead>
                                            <TableHead className="w-[180px]">Ánh xạ CLO</TableHead>
                                            <TableHead className="w-20 text-center">Tài liệu</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {phase.sessions?.map((session, sIndex) => (
                                            <TableRow key={session.id} className="hover:bg-slate-50/80 transition-colors align-top">
                                                <TableCell className="pt-3">
                                                    <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab hover:text-primary" />
                                                </TableCell>
                                                <TableCell className="font-medium text-center text-muted-foreground pt-3">
                                                    {session.sequence}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Textarea
                                                            value={session.topic}
                                                            onChange={(e) => updateSession(pIndex, sIndex, "topic", e.target.value)}
                                                            className={`min-h-10 border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white resize-none ${
                                                                getSessionError(pIndex, sIndex, 'topic') ? 'border-red-500 hover:border-red-500 focus:border-red-500' : ''
                                                            }`}
                                                            placeholder="Nhập chủ đề..."
                                                            rows={1}
                                                        />
                                                        {getSessionError(pIndex, sIndex, 'topic') && (
                                                            <p className="text-xs text-red-500">{getSessionError(pIndex, sIndex, 'topic')}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <Textarea
                                                            value={session.studentTask}
                                                            onChange={(e) => updateSession(pIndex, sIndex, "studentTask", e.target.value)}
                                                            className={`min-h-10 border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white resize-none ${
                                                                getSessionError(pIndex, sIndex, 'studentTask') ? 'border-red-500 hover:border-red-500 focus:border-red-500' : ''
                                                            }`}
                                                            placeholder="Nhập nhiệm vụ..."
                                                            rows={1}
                                                        />
                                                        {getSessionError(pIndex, sIndex, 'studentTask') && (
                                                            <p className="text-xs text-red-500">{getSessionError(pIndex, sIndex, 'studentTask')}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <MultiSelect
                                                            options={skills.map((skill) => ({
                                                                label: skill,
                                                                value: skill,
                                                            })) || []}
                                                            selected={session.skills || []}
                                                            onChange={(selected) => updateSession(pIndex, sIndex, "skills", selected)}
                                                            placeholder="Chọn Kỹ năng"
                                                            searchPlaceholder="Tìm Kỹ năng..."
                                                            emptyMessage="Không tìm thấy Kỹ năng."
                                                            badgeClassName="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                            className={getSessionError(pIndex, sIndex, 'skills') ? 'border-red-500' : ''}
                                                        />
                                                        {getSessionError(pIndex, sIndex, 'skills') && (
                                                            <p className="text-xs text-red-500">{getSessionError(pIndex, sIndex, 'skills')}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <MultiSelect
                                                            options={data.clos?.map((clo) => ({
                                                                label: clo.code,
                                                                value: clo.code,
                                                            })) || []}
                                                            selected={session.cloIds || []}
                                                            onChange={(selected) => updateSession(pIndex, sIndex, "cloIds", selected)}
                                                            placeholder="Chọn CLO"
                                                            searchPlaceholder="Tìm CLO..."
                                                            emptyMessage="Không tìm thấy CLO."
                                                            badgeClassName="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                            className={getSessionError(pIndex, sIndex, 'cloIds') ? 'border-red-500' : ''}
                                                        />
                                                        {getSessionError(pIndex, sIndex, 'cloIds') && (
                                                            <p className="text-xs text-red-500">{getSessionError(pIndex, sIndex, 'cloIds')}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <div className="relative">
                                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                                    {getMaterials("SESSION", undefined, session.id).length > 0 && (
                                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl! w-[90vw]">
                                                            <DialogHeader>
                                                                <DialogTitle>Tài liệu Buổi học {session.sequence}</DialogTitle>
                                                            </DialogHeader>
                                                            <MaterialSection
                                                                materials={getMaterials("SESSION", undefined, session.id)}
                                                                onUpdate={(m) => updateMaterials(m, "SESSION", undefined, session.id)}
                                                                scope="SESSION"
                                                                sessionId={session.id}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteSessionClick(pIndex, sIndex)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSession(pIndex)}
                                    className="w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all py-4 h-auto"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm Buổi học vào {phase.name}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {(!data.structure || data.structure.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
                    <p className="mb-2">Chưa có giai đoạn nào được tạo.</p>
                    <Button variant="outline" onClick={addPhase}>
                        Bắt đầu bằng cách thêm Giai đoạn 1
                    </Button>
                </div>
            )}
            </div>

            {/* Delete Session Confirmation Dialog */}
            <AlertDialog
                open={deleteSessionDialog?.open || false}
                onOpenChange={(open) => !open && setDeleteSessionDialog(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa buổi học</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa buổi học{" "}
                            <strong>"{deleteSessionDialog?.sessionTopic}"</strong>?
                            <br />
                            Hành động này không thể hoàn tác và tất cả tài liệu của buổi học này cũng sẽ bị xóa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteSession();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa buổi học
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Phase Confirmation Dialog */}
            <AlertDialog
                open={deletePhaseDialog?.open || false}
                onOpenChange={(open) => !open && setDeletePhaseDialog(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa giai đoạn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa giai đoạn{" "}
                            <strong>"{deletePhaseDialog?.phaseName}"</strong>?
                            <br />
                            <br />
                            {deletePhaseDialog?.sessionCount && deletePhaseDialog.sessionCount > 0 ? (
                                <span className="text-destructive font-medium">
                                    ⚠️ Giai đoạn này có {deletePhaseDialog.sessionCount} buổi học. 
                                    Tất cả buổi học và tài liệu trong giai đoạn này sẽ bị xóa vĩnh viễn.
                                </span>
                            ) : (
                                <span>Hành động này không thể hoàn tác.</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeletePhase();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa giai đoạn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
