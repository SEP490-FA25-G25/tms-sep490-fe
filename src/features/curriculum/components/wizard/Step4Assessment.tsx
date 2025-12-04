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

import { Plus, Trash2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CourseData, Assessment } from "@/types/course";
import { useGetSkillsQuery } from "@/store/services/enumApi";
import { Textarea } from "@/components/ui/textarea";

interface Step4Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

export function Step4Assessment({ data, setData }: Step4Props) {
    const { data: skillsList } = useGetSkillsQuery();

    const addAssessment = () => {
        const newAssessment: Assessment = {
            id: crypto.randomUUID(),
            name: "",
            type: "QUIZ",
            durationMinutes: 60,
            maxScore: 0,
            skills: [],
            description: "",
            note: "",
            cloIds: [],
        };
        setData((prev) => ({
            ...prev,
            assessments: [...(prev.assessments || []), newAssessment],
        }));
    };

    const updateAssessment = (index: number, field: keyof Assessment, value: string | number | string[] | undefined) => {
        const newAssessments = [...(data.assessments || [])];
        newAssessments[index] = { ...newAssessments[index], [field]: value };
        setData((prev) => ({ ...prev, assessments: newAssessments }));
    };



    const removeAssessment = (index: number) => {
        const newAssessments = data.assessments.filter((_, i) => i !== index);
        setData((prev) => ({ ...prev, assessments: newAssessments }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Danh sách bài kiểm tra</h3>
                <div className="flex items-center gap-4">
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
                            <TableHead className="w-[100px]">Thời lượng (phút)</TableHead>
                            <TableHead className="w-[100px]">Điểm tối đa</TableHead>
                            <TableHead className="w-[200px]">Kỹ năng</TableHead>
                            <TableHead className="w-[200px]">Map CLO</TableHead>
                            <TableHead className="w-[200px]">Mô tả</TableHead>
                            <TableHead className="w-[150px]">Ghi chú</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.assessments?.map((assessment, index) => (
                            <TableRow key={assessment.id || index}>
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
                                            <SelectItem value="MOCK_TEST">Thi thử</SelectItem>
                                            <SelectItem value="PHASE_TEST">Kiểm tra giai đoạn</SelectItem>
                                            <SelectItem value="PLACEMENT_TEST">Kiểm tra đầu vào</SelectItem>
                                            <SelectItem value="HOMEWORK">Bài tập về nhà</SelectItem>
                                            <SelectItem value="ORAL">Vấn đáp</SelectItem>
                                            <SelectItem value="PRACTICE">Thực hành</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={assessment.durationMinutes ?? ""}
                                        onChange={(e) => updateAssessment(index, "durationMinutes", e.target.value === "" ? undefined : Number(e.target.value))}
                                        className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="Phút"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={assessment.maxScore ?? ""}
                                        onChange={(e) => updateAssessment(index, "maxScore", e.target.value === "" ? undefined : Number(e.target.value))}
                                        className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="Điểm"
                                    />
                                </TableCell>

                                <TableCell>
                                    <MultiSelect
                                        options={skillsList?.map((skill: string) => ({
                                            label: skill,
                                            value: skill,
                                        })) || []}
                                        selected={assessment.skills || []}
                                        onChange={(selected) => updateAssessment(index, "skills", selected)}
                                        placeholder="Chọn Kỹ năng"
                                        searchPlaceholder="Tìm kỹ năng..."
                                        emptyMessage="Không tìm thấy kỹ năng."
                                        badgeClassName="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                    />
                                </TableCell>
                                <TableCell>
                                    <MultiSelect
                                        options={data.clos?.map((clo) => ({
                                            label: clo.code,
                                            value: clo.code,
                                            description: clo.description,
                                        })) || []}
                                        selected={assessment.cloIds || []}
                                        onChange={(selected) => updateAssessment(index, "cloIds", selected)}
                                        placeholder="Chọn CLO"
                                        searchPlaceholder="Tìm CLO..."
                                        emptyMessage="Không tìm thấy CLO."
                                        badgeClassName="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Textarea
                                        value={assessment.description || ""}
                                        onChange={(e) => updateAssessment(index, "description", e.target.value)}
                                        placeholder="Mô tả..."
                                        className="min-h-[40px] resize-none"
                                        rows={1}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Textarea
                                        value={assessment.note || ""}
                                        onChange={(e) => updateAssessment(index, "note", e.target.value)}
                                        placeholder="Ghi chú..."
                                        className="min-h-[40px] resize-none"
                                        rows={1}
                                    />
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
