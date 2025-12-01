import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from "@/components/ui/accordion";

import { useGetSkillsQuery } from "@/store/services/enumApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, FileText } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { CourseData, Phase, Session, Material } from "@/types/course";
import { MaterialSection } from "./MaterialSection";

interface Step3Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

export function Step3Structure({ data, setData }: Step3Props) {
    const { data: skills = [] } = useGetSkillsQuery();

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
            skill: "",
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
    };



    const removeSession = (phaseIndex: number, sessionIndex: number) => {
        const newStructure = [...data.structure];
        newStructure[phaseIndex].sessions = newStructure[phaseIndex].sessions.filter(
            (_, i) => i !== sessionIndex
        );
        // Re-sequence
        newStructure[phaseIndex].sessions.forEach((s, i) => {
            s.sequence = i + 1;
        });
        setData((prev) => ({ ...prev, structure: newStructure }));
    };

    const removePhase = (index: number) => {
        const newStructure = data.structure.filter((_, i) => i !== index);
        setData((prev) => ({ ...prev, structure: newStructure }));
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">Cấu trúc chương trình</h3>
                <Button onClick={addPhase} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Giai đoạn
                </Button>
            </div>

            {/* Course Level Materials */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Tài liệu chung cho Khóa học
                </h4>
                <MaterialSection
                    materials={getMaterials("COURSE")}
                    onUpdate={(m) => updateMaterials(m, "COURSE")}
                    scope="COURSE"
                />
            </div>

            {/* Session Count Validation */}
            <div className={`flex items - center gap - 2 p - 3 rounded - md border ${(data.structure?.reduce((acc, phase) => acc + (phase.sessions?.length || 0), 0) || 0) === (data.basicInfo?.numberOfSessions || 0)
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
                } `}>
                <div className="font-medium">
                    Số buổi đã tạo: <span className="font-bold">{data.structure?.reduce((acc, phase) => acc + (phase.sessions?.length || 0), 0) || 0}</span>
                    <span className="mx-1">/</span>
                    Tổng số buổi: <span className="font-bold">{data.basicInfo?.numberOfSessions || 0}</span>
                </div>
                {(data.structure?.reduce((acc, phase) => acc + (phase.sessions?.length || 0), 0) || 0) !== (data.basicInfo?.numberOfSessions || 0) && (
                    <span className="text-sm ml-auto">
                        (Vui lòng đảm bảo số buổi khớp với thông tin cơ bản)
                    </span>
                )}
            </div>

            <Accordion type="multiple" className="w-full space-y-6" defaultValue={["item-0"]}>
                {data.structure?.map((phase, pIndex) => (
                    <AccordionItem
                        key={phase.id}
                        value={`item - ${pIndex} `}
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
                                        removePhase(pIndex);
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
                            {/* Phase Level Materials */}
                            <div className="px-1">
                                <MaterialSection
                                    title="Tài liệu Giai đoạn"
                                    materials={getMaterials("PHASE", phase.id)}
                                    onUpdate={(m) => updateMaterials(m, "PHASE", phase.id)}
                                    scope="PHASE"
                                    phaseId={phase.id}
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
                                            <TableHead className="w-[80px] text-center">Tài liệu</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {phase.sessions?.map((session, sIndex) => (
                                            <TableRow key={session.id} className="hover:bg-slate-50/80 transition-colors">
                                                <TableCell>
                                                    <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab hover:text-primary" />
                                                </TableCell>
                                                <TableCell className="font-medium text-center text-muted-foreground">
                                                    {session.sequence}
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea
                                                        value={session.topic}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "topic", e.target.value)}
                                                        className="min-h-[40px] border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white resize-none"
                                                        placeholder="Nhập chủ đề..."
                                                        rows={1}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea
                                                        value={session.studentTask}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "studentTask", e.target.value)}
                                                        className="min-h-[40px] border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white resize-none"
                                                        placeholder="Nhập nhiệm vụ..."
                                                        rows={1}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={session.skill}
                                                        onValueChange={(val) => updateSession(pIndex, sIndex, "skill", val)}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Chọn Kỹ năng" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {skills.map((skill) => (
                                                                <SelectItem key={skill} value={skill}>
                                                                    {skill}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <MultiSelect
                                                        options={data.clos?.map((clo) => ({
                                                            label: clo.code,
                                                            value: clo.code,
                                                            description: clo.description,
                                                        })) || []}
                                                        selected={session.cloIds || []}
                                                        onChange={(selected) => updateSession(pIndex, sIndex, "cloIds", selected)}
                                                        placeholder="Chọn CLO"
                                                        searchPlaceholder="Tìm CLO..."
                                                        emptyMessage="Không tìm thấy CLO."
                                                        badgeClassName="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                    />
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
                                                        <DialogContent className="max-w-3xl">
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
                                                        onClick={() => removeSession(pIndex, sIndex)}
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
    );
}
