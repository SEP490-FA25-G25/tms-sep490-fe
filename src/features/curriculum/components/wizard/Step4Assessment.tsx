import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assessment {
    id: string;
    name: string;
    type: string;
    weight: number;
    durationMinutes?: number;
    cloIds: string[];
}

interface CourseData {
    basicInfo: unknown;
    clos: Array<{ id: string; code: string; description: string }>;
    structure: unknown[];
    assessments: Assessment[];
    materials: unknown[];
}

interface Step4AssessmentProps {
    data: CourseData;
    setData: (data: CourseData | ((prev: CourseData) => CourseData)) => void;
}

export function Step4Assessment({ data, setData }: Step4AssessmentProps) {
    const addAssessment = () => {
        const newAssessment = {
            id: crypto.randomUUID(),
            name: "",
            type: "QUIZ",
            weight: 0,
            durationMinutes: 60,
            cloIds: [],
        };
        setData((prev: CourseData) => ({
            ...prev,
            assessments: [...(prev.assessments || []), newAssessment],
        }));
    };

    const updateAssessment = (index: number, field: string, value: any) => {
        const newAssessments = [...(data.assessments || [])];
        newAssessments[index] = { ...newAssessments[index], [field]: value };
        setData((prev: CourseData) => ({ ...prev, assessments: newAssessments }));
    };

    const toggleAssessmentClo = (index: number, cloCode: string) => {
        const currentClos = data.assessments[index].cloIds || [];
        const newClos = currentClos.includes(cloCode)
            ? currentClos.filter((c: string) => c !== cloCode)
            : [...currentClos, cloCode];

        updateAssessment(index, "cloIds", newClos);
    };

    const removeAssessment = (index: number) => {
        const newAssessments = data.assessments.filter((_: any, i: number) => i !== index);
        setData((prev: CourseData) => ({ ...prev, assessments: newAssessments }));
    };

    const totalWeight = data.assessments?.reduce((sum: number, a: any) => sum + (Number(a.weight) || 0), 0) || 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Danh sách bài kiểm tra</h3>
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${totalWeight !== 100 ? "text-destructive" : "text-green-600"}`}>
                        Tổng trọng số: {totalWeight}%
                    </span>
                    <Button onClick={addAssessment}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm Bài kiểm tra
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên bài kiểm tra</TableHead>
                            <TableHead className="w-[150px]">Loại</TableHead>
                            <TableHead className="w-[100px]">Trọng số (%)</TableHead>
                            <TableHead className="w-[100px]">Thời lượng (phút)</TableHead>
                            <TableHead className="w-[200px]">Map CLO</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.assessments?.map((assessment: any, index: number) => (
                            <TableRow key={assessment.id}>
                                <TableCell>
                                    <Input
                                        value={assessment.name}
                                        onChange={(e) => updateAssessment(index, "name", e.target.value)}
                                        placeholder="e.g. Bài kiểm tra giữa kỳ"
                                        className="h-8"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={assessment.type}
                                        onValueChange={(val) => updateAssessment(index, "type", val)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="QUIZ">Quiz</SelectItem>
                                            <SelectItem value="MIDTERM">Giữa kỳ</SelectItem>
                                            <SelectItem value="FINAL">Cuối kỳ</SelectItem>
                                            <SelectItem value="ASSIGNMENT">Bài tập lớn</SelectItem>
                                            <SelectItem value="PROJECT">Dự án</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={assessment.weight}
                                        onChange={(e) => updateAssessment(index, "weight", Number(e.target.value))}
                                        className="h-8"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={assessment.durationMinutes}
                                        onChange={(e) => updateAssessment(index, "durationMinutes", Number(e.target.value))}
                                        className="h-8"
                                    />
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-full justify-start">
                                                {assessment.cloIds?.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {assessment.cloIds.map((c: string) => (
                                                            <Badge key={c} variant="secondary" className="text-[10px] px-1 py-0">
                                                                {c}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Select CLOs</span>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[200px]">
                                            {data.clos?.map((clo: any) => (
                                                <DropdownMenuCheckboxItem
                                                    key={clo.id}
                                                    checked={assessment.cloIds?.includes(clo.code)}
                                                    onCheckedChange={() => toggleAssessmentClo(index, clo.code)}
                                                >
                                                    {clo.code}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeAssessment(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
