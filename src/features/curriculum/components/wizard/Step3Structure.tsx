import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CourseData, Phase, Session } from "@/types/course";

interface Step3Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

export function Step3Structure({ data, setData }: Step3Props) {
    const addPhase = () => {
        const newPhase: Phase = {
            id: crypto.randomUUID(),
            name: `Giai đoạn ${(data.structure?.length || 0) + 1}`,
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
            skillSets: [],
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

    const toggleSessionClo = (phaseIndex: number, sessionIndex: number, cloCode: string) => {
        const currentClos = data.structure[phaseIndex].sessions[sessionIndex].cloIds || [];
        const newClos = currentClos.includes(cloCode)
            ? currentClos.filter((c) => c !== cloCode)
            : [...currentClos, cloCode];

        updateSession(phaseIndex, sessionIndex, "cloIds", newClos);
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">Cấu trúc chương trình</h3>
                <Button onClick={addPhase} className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Giai đoạn
                </Button>
            </div>

            {/* Session Count Validation */}
            <div className={`flex items-center gap-2 p-3 rounded-md border ${(data.structure?.reduce((acc, phase) => acc + (phase.sessions?.length || 0), 0) || 0) === (data.basicInfo?.numberOfSessions || 0)
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
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
                        value={`item-${pIndex}`}
                        className="border rounded-lg px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-sm data-[state=open]:border-l-4 data-[state=open]:border-l-primary transition-all duration-200"
                    >
                        <AccordionTrigger className="hover:no-underline py-4 group">
                            <div className="flex items-center gap-4 flex-1 text-left" onClick={(e) => e.stopPropagation()}>
                                <span className="font-bold text-lg min-w-[100px] text-primary/80 group-hover:text-primary transition-colors">
                                    Giai đoạn {pIndex + 1}:
                                </span>
                                <Input
                                    value={phase.name}
                                    onChange={(e) => updatePhaseName(pIndex, e.target.value)}
                                    className="max-w-md h-9 font-medium bg-white"
                                    placeholder="Tên giai đoạn (VD: Giai đoạn nền tảng)"
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
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2">
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
                                                    <Input
                                                        value={session.topic}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "topic", e.target.value)}
                                                        className="h-9 border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white"
                                                        placeholder="Nhập chủ đề..."
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={session.studentTask}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "studentTask", e.target.value)}
                                                        className="h-9 border-transparent hover:border-input focus:border-input transition-colors bg-transparent focus:bg-white"
                                                        placeholder="Nhập nhiệm vụ..."
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-8 w-full justify-start font-normal">
                                                                {session.skillSets?.length > 0 ? (
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {session.skillSets.map((s) => (
                                                                            <Badge
                                                                                key={s}
                                                                                variant="secondary"
                                                                                className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                                            >
                                                                                {s}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">Chọn Kỹ năng</span>
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-[200px]">
                                                            {[
                                                                "GENERAL", "READING", "WRITING", "SPEAKING", "LISTENING",
                                                                "VOCABULARY", "GRAMMAR", "KANJI"
                                                            ].map((skill) => (
                                                                <DropdownMenuCheckboxItem
                                                                    key={skill}
                                                                    checked={session.skillSets?.includes(skill)}
                                                                    onCheckedChange={() => {
                                                                        const currentSkills = session.skillSets || [];
                                                                        const newSkills = currentSkills.includes(skill)
                                                                            ? currentSkills.filter((s) => s !== skill)
                                                                            : [...currentSkills, skill];
                                                                        updateSession(pIndex, sIndex, "skillSets", newSkills);
                                                                    }}
                                                                >
                                                                    {skill}
                                                                </DropdownMenuCheckboxItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-8 w-full justify-start font-normal">
                                                                {session.cloIds?.length > 0 ? (
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {session.cloIds.map((c) => (
                                                                            <Badge
                                                                                key={c}
                                                                                variant="secondary"
                                                                                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                                            >
                                                                                {c}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">Chọn CLO</span>
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-[200px]">
                                                            {data.clos?.map((clo) => (
                                                                <DropdownMenuCheckboxItem
                                                                    key={clo.id}
                                                                    checked={session.cloIds?.includes(clo.code)}
                                                                    onCheckedChange={() => toggleSessionClo(pIndex, sIndex, clo.code)}
                                                                >
                                                                    {clo.code} - {clo.description.substring(0, 20)}...
                                                                </DropdownMenuCheckboxItem>
                                                            ))}
                                                            {(!data.clos || data.clos.length === 0) && (
                                                                <div className="p-2 text-xs text-muted-foreground">Chưa có CLO nào được định nghĩa</div>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
