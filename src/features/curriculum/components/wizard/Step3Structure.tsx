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

export function Step3Structure({ data, setData }: any) {
    const addPhase = () => {
        const newPhase = {
            id: crypto.randomUUID(),
            name: `Phase ${(data.structure?.length || 0) + 1}`,
            sessions: [],
        };
        setData((prev: any) => ({
            ...prev,
            structure: [...(prev.structure || []), newPhase],
        }));
    };

    const addSession = (phaseIndex: number) => {
        const newSession = {
            id: crypto.randomUUID(),
            sequence: (data.structure[phaseIndex].sessions?.length || 0) + 1,
            topic: "",
            studentTask: "",
            cloIds: [],
        };

        const newStructure = [...(data.structure || [])];
        newStructure[phaseIndex].sessions = [...(newStructure[phaseIndex].sessions || []), newSession];
        setData((prev: any) => ({ ...prev, structure: newStructure }));
    };

    const updatePhaseName = (index: number, name: string) => {
        const newStructure = [...data.structure];
        newStructure[index].name = name;
        setData((prev: any) => ({ ...prev, structure: newStructure }));
    };

    const updateSession = (phaseIndex: number, sessionIndex: number, field: string, value: any) => {
        const newStructure = [...data.structure];
        newStructure[phaseIndex].sessions[sessionIndex] = {
            ...newStructure[phaseIndex].sessions[sessionIndex],
            [field]: value,
        };
        setData((prev: any) => ({ ...prev, structure: newStructure }));
    };

    const toggleSessionClo = (phaseIndex: number, sessionIndex: number, cloCode: string) => {
        const currentClos = data.structure[phaseIndex].sessions[sessionIndex].cloIds || [];
        const newClos = currentClos.includes(cloCode)
            ? currentClos.filter((c: string) => c !== cloCode)
            : [...currentClos, cloCode];

        updateSession(phaseIndex, sessionIndex, "cloIds", newClos);
    };

    const removeSession = (phaseIndex: number, sessionIndex: number) => {
        const newStructure = [...data.structure];
        newStructure[phaseIndex].sessions = newStructure[phaseIndex].sessions.filter(
            (_: any, i: number) => i !== sessionIndex
        );
        // Re-sequence
        newStructure[phaseIndex].sessions.forEach((s: any, i: number) => {
            s.sequence = i + 1;
        });
        setData((prev: any) => ({ ...prev, structure: newStructure }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Cấu trúc chương trình</h3>
                <Button onClick={addPhase}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Giai đoạn
                </Button>
            </div>

            <Accordion type="multiple" className="w-full space-y-4" defaultValue={["item-0"]}>
                {data.structure?.map((phase: any, pIndex: number) => (
                    <AccordionItem key={phase.id} value={`item-${pIndex}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-4 flex-1 text-left" onClick={(e) => e.stopPropagation()}>
                                <span className="font-semibold min-w-[80px]">Giai đoạn {pIndex + 1}:</span>
                                <Input
                                    value={phase.name}
                                    onChange={(e) => updatePhaseName(pIndex, e.target.value)}
                                    className="max-w-md h-8"
                                    placeholder="Tên giai đoạn"
                                />
                                <span className="text-xs text-muted-foreground ml-auto mr-4">
                                    {phase.sessions?.length || 0} buổi
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead className="w-[80px]">STT</TableHead>
                                            <TableHead>Chủ đề</TableHead>
                                            <TableHead>Nhiệm vụ sinh viên</TableHead>
                                            <TableHead className="w-[200px]">Ánh xạ CLO</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {phase.sessions?.map((session: any, sIndex: number) => (
                                            <TableRow key={session.id}>
                                                <TableCell>
                                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                                </TableCell>
                                                <TableCell className="font-medium">{session.sequence}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={session.topic}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "topic", e.target.value)}
                                                        className="h-8"
                                                        placeholder="Chủ đề buổi học..."
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={session.studentTask}
                                                        onChange={(e) => updateSession(pIndex, sIndex, "studentTask", e.target.value)}
                                                        className="h-8"
                                                        placeholder="Nhiệm vụ..."
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                                                                {session.cloIds?.length > 0 ? (
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {session.cloIds.map((c: string) => (
                                                                            <Badge key={c} variant="secondary" className="text-[10px] px-1 py-0">
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
                                                            {data.clos?.map((clo: any) => (
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
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                                <Button variant="outline" size="sm" onClick={() => addSession(pIndex)} className="w-full border-dashed">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm Buổi học vào {phase.name}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {(!data.structure || data.structure.length === 0) && (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    Start by adding a Phase (e.g., "Phase 1: Foundation")
                </div>
            )}
        </div>
    );
}
