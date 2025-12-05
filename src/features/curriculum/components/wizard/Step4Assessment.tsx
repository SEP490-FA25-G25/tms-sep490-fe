import { useState, useEffect } from "react";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Plus, Trash2, FileText, StickyNote } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CourseData, Assessment } from "@/types/course";
import { useGetSkillsQuery } from "@/store/services/enumApi";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Validation function for Step 4
// eslint-disable-next-line react-refresh/only-export-components
export function validateStep4(data: CourseData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if there is at least one assessment
    if (!data.assessments || data.assessments.length === 0) {
        errors.push("Vui lòng thêm ít nhất 1 bài kiểm tra.");
        return { isValid: false, errors };
    }

    // Get max duration from basicInfo (hoursPerSession in minutes)
    const maxDurationMinutes = (data.basicInfo?.hoursPerSession || 0) * 60;

    // Validate each assessment
    let hasIncompleteAssessment = false;
    let hasMinLengthError = false;
    let hasDuplicateName = false;
    let hasDurationError = false;
    let hasMaxScoreError = false;
    let hasDescriptionError = false;
    let hasNoteError = false;
    const assessmentNames = new Set<string>();

    data.assessments.forEach((assessment) => {
        // Check required fields: name, skills, cloIds
        if (!assessment.name?.trim()) {
            hasIncompleteAssessment = true;
        }
        if (!assessment.skills || assessment.skills.length === 0) {
            hasIncompleteAssessment = true;
        }
        if (!assessment.cloIds || assessment.cloIds.length === 0) {
            hasIncompleteAssessment = true;
        }

        // Check minimum length for name (at least 3 characters)
        if (assessment.name?.trim() && assessment.name.trim().length < 3) {
            hasMinLengthError = true;
        }

        // Check duplicate name
        const normalizedName = assessment.name?.trim().toLowerCase();
        if (normalizedName) {
            if (assessmentNames.has(normalizedName)) {
                hasDuplicateName = true;
            } else {
                assessmentNames.add(normalizedName);
            }
        }

        // Check duration: must be > 0 and <= maxDurationMinutes
        if (assessment.durationMinutes !== undefined && assessment.durationMinutes !== null) {
            if (assessment.durationMinutes <= 0) {
                hasDurationError = true;
            }
            if (maxDurationMinutes > 0 && assessment.durationMinutes > maxDurationMinutes) {
                hasDurationError = true;
            }
        }

        // Check maxScore: must be > 0 and <= 1000
        if (assessment.maxScore !== undefined && assessment.maxScore !== null) {
            if (assessment.maxScore <= 0 || assessment.maxScore > 1000) {
                hasMaxScoreError = true;
            }
        }

        // Check description: empty or at least 10 characters
        if (assessment.description && assessment.description.trim().length > 0 && assessment.description.trim().length < 10) {
            hasDescriptionError = true;
        }

        // Check note: empty or at least 10 characters
        if (assessment.note && assessment.note.trim().length > 0 && assessment.note.trim().length < 10) {
            hasNoteError = true;
        }
    });

    if (hasIncompleteAssessment) {
        errors.push("Vui lòng điền đầy đủ Tên bài kiểm tra, Kỹ năng và Map CLO cho tất cả các bài kiểm tra.");
    }

    if (hasMinLengthError) {
        errors.push("Tên bài kiểm tra phải có ít nhất 3 ký tự.");
    }

    if (hasDuplicateName) {
        errors.push("Tên bài kiểm tra không được trùng nhau.");
    }

    if (hasDurationError) {
        if (maxDurationMinutes > 0) {
            errors.push(`Thời lượng phải lớn hơn 0 và không vượt quá ${maxDurationMinutes} phút (${data.basicInfo?.hoursPerSession} giờ/buổi).`);
        } else {
            errors.push("Thời lượng phải lớn hơn 0.");
        }
    }

    if (hasMaxScoreError) {
        errors.push("Điểm tối đa phải lớn hơn 0 và không vượt quá 1000.");
    }

    if (hasDescriptionError) {
        errors.push("Mô tả phải để trống hoặc có ít nhất 10 ký tự.");
    }

    if (hasNoteError) {
        errors.push("Ghi chú phải để trống hoặc có ít nhất 10 ký tự.");
    }

    // Check CLO coverage - each CLO must be mapped to at least one assessment
    const allCLOs = data.clos || [];
    const mappedCLOs = new Set<string>();

    data.assessments.forEach((assessment) => {
        assessment.cloIds?.forEach((cloId) => mappedCLOs.add(cloId));
    });

    const unmappedCLOs = allCLOs.filter((clo) => !mappedCLOs.has(clo.code));
    if (unmappedCLOs.length > 0) {
        errors.push(`Mỗi CLO cần được ánh xạ với ít nhất 1 bài kiểm tra. CLO chưa ánh xạ: ${unmappedCLOs.map(c => c.code).join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
}

interface Step4Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
}

// Error type for each assessment field
interface AssessmentErrors {
    name?: string;
    skills?: string;
    cloIds?: string;
    durationMinutes?: string;
    maxScore?: string;
    description?: string;
    note?: string;
}

export function Step4Assessment({ data, setData }: Step4Props) {
    const { data: skillsList } = useGetSkillsQuery();

    // Get max duration from basicInfo (hoursPerSession in minutes)
    const maxDurationMinutes = (data.basicInfo?.hoursPerSession || 0) * 60;

    // Error states for each assessment (by index)
    const [assessmentErrors, setAssessmentErrors] = useState<{ [key: number]: AssessmentErrors }>({});

    // Clear errors when data changes (e.g., when navigating back to this step)
    useEffect(() => {
        setAssessmentErrors({});
    }, []);

    // Validation functions
    const validateName = (value: string, currentIndex: number): string | null => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "Tên bài kiểm tra không được để trống";
        }

        if (trimmedValue.length < 3) {
            return "Tên bài kiểm tra phải có ít nhất 3 ký tự";
        }

        // Check duplicate name (case-insensitive)
        const isDuplicate = data.assessments?.some(
            (assessment, index) =>
                index !== currentIndex &&
                assessment.name?.trim().toLowerCase() === trimmedValue.toLowerCase()
        );

        if (isDuplicate) {
            return "Tên bài kiểm tra đã tồn tại";
        }

        return null;
    };

    const validateSkills = (skills: string[]): string | null => {
        if (!skills || skills.length === 0) {
            return "Vui lòng chọn ít nhất 1 kỹ năng";
        }
        return null;
    };

    const validateCloIds = (cloIds: string[]): string | null => {
        if (!cloIds || cloIds.length === 0) {
            return "Vui lòng chọn ít nhất 1 CLO";
        }
        return null;
    };

    const validateDuration = (value: number | undefined): string | null => {
        if (value === undefined || value === null) {
            return null; // Optional field
        }
        if (value <= 0) {
            return "Thời lượng phải lớn hơn 0";
        }
        if (maxDurationMinutes > 0 && value > maxDurationMinutes) {
            return `Thời lượng không được vượt quá ${maxDurationMinutes} phút`;
        }
        return null;
    };

    const validateMaxScore = (value: number | undefined): string | null => {
        if (value === undefined || value === null) {
            return null; // Optional field
        }
        if (value <= 0) {
            return "Điểm tối đa phải lớn hơn 0";
        }
        if (value > 1000) {
            return "Điểm tối đa không được vượt quá 1000";
        }
        return null;
    };

    const validateDescription = (value: string): string | null => {
        if (value && value.trim().length > 0 && value.trim().length < 10) {
            return "Mô tả phải để trống hoặc có ít nhất 10 ký tự";
        }
        return null;
    };

    const validateNote = (value: string): string | null => {
        if (value && value.trim().length > 0 && value.trim().length < 10) {
            return "Ghi chú phải để trống hoặc có ít nhất 10 ký tự";
        }
        return null;
    };

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

        // Real-time validation
        const newErrors = { ...assessmentErrors };
        if (!newErrors[index]) {
            newErrors[index] = {};
        }

        switch (field) {
            case "name": {
                const nameError = validateName(value as string, index);
                if (nameError) {
                    newErrors[index].name = nameError;
                } else {
                    delete newErrors[index].name;
                }
                // Also re-validate other assessments for duplicate check
                data.assessments?.forEach((_, otherIndex) => {
                    if (otherIndex !== index && newErrors[otherIndex]?.name?.includes("đã tồn tại")) {
                        const otherNameError = validateName(data.assessments[otherIndex].name || "", otherIndex);
                        if (!otherNameError) {
                            delete newErrors[otherIndex]?.name;
                        }
                    }
                });
                break;
            }
            case "skills": {
                const skillsError = validateSkills(value as string[]);
                if (skillsError) {
                    newErrors[index].skills = skillsError;
                } else {
                    delete newErrors[index].skills;
                }
                break;
            }
            case "cloIds": {
                const cloError = validateCloIds(value as string[]);
                if (cloError) {
                    newErrors[index].cloIds = cloError;
                } else {
                    delete newErrors[index].cloIds;
                }
                break;
            }
            case "durationMinutes": {
                const durationError = validateDuration(value as number | undefined);
                if (durationError) {
                    newErrors[index].durationMinutes = durationError;
                } else {
                    delete newErrors[index].durationMinutes;
                }
                break;
            }
            case "maxScore": {
                const maxScoreError = validateMaxScore(value as number | undefined);
                if (maxScoreError) {
                    newErrors[index].maxScore = maxScoreError;
                } else {
                    delete newErrors[index].maxScore;
                }
                break;
            }
            case "description": {
                const descError = validateDescription(value as string);
                if (descError) {
                    newErrors[index].description = descError;
                } else {
                    delete newErrors[index].description;
                }
                break;
            }
            case "note": {
                const noteError = validateNote(value as string);
                if (noteError) {
                    newErrors[index].note = noteError;
                } else {
                    delete newErrors[index].note;
                }
                break;
            }
        }

        // Clean up empty error objects
        if (newErrors[index] && Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
        }

        setAssessmentErrors(newErrors);
    };

    const removeAssessment = (index: number) => {
        const newAssessments = data.assessments.filter((_, i) => i !== index);
        setData((prev) => ({ ...prev, assessments: newAssessments }));

        // Re-index errors after removal
        const newErrors: { [key: number]: AssessmentErrors } = {};
        Object.keys(assessmentErrors).forEach((key) => {
            const keyNum = parseInt(key);
            if (keyNum < index) {
                newErrors[keyNum] = assessmentErrors[keyNum];
            } else if (keyNum > index) {
                newErrors[keyNum - 1] = assessmentErrors[keyNum];
            }
            // Skip the removed index
        });
        setAssessmentErrors(newErrors);
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
                            <TableHead className="w-[130px]">Loại</TableHead>
                            <TableHead className="w-[120px]">
                                Thời lượng (phút)
                                {maxDurationMinutes > 0 && (
                                    <span className="block text-xs text-muted-foreground font-normal">
                                        Tối đa: {maxDurationMinutes}p
                                    </span>
                                )}
                            </TableHead>
                            <TableHead className="w-[100px]">Điểm tối đa</TableHead>
                            <TableHead className="w-[180px]">Kỹ năng</TableHead>
                            <TableHead className="w-[180px]">Map CLO</TableHead>
                            <TableHead className="w-[60px] text-center">Mô tả</TableHead>
                            <TableHead className="w-[60px] text-center">Ghi chú</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.assessments?.map((assessment, index) => (
                            <TableRow key={assessment.id || index}>
                                <TableCell>
                                    <div className="space-y-1">
                                        <Input
                                            value={assessment.name}
                                            onChange={(e) => updateAssessment(index, "name", e.target.value)}
                                            placeholder="e.g. Bài kiểm tra giữa kỳ"
                                            className={`h-8 ${assessmentErrors[index]?.name ? "border-red-500" : ""}`}
                                        />
                                        {assessmentErrors[index]?.name && (
                                            <p className="text-xs text-red-500">{assessmentErrors[index].name}</p>
                                        )}
                                    </div>
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
                                    <div className="space-y-1">
                                        <Input
                                            type="number"
                                            min="1"
                                            max={maxDurationMinutes > 0 ? maxDurationMinutes : undefined}
                                            value={assessment.durationMinutes ?? ""}
                                            onChange={(e) => updateAssessment(index, "durationMinutes", e.target.value === "" ? undefined : Number(e.target.value))}
                                            className={`h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${assessmentErrors[index]?.durationMinutes ? "border-red-500" : ""}`}
                                            placeholder="Phút"
                                        />
                                        {assessmentErrors[index]?.durationMinutes && (
                                            <p className="text-xs text-red-500">{assessmentErrors[index].durationMinutes}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="1000"
                                            step="0.01"
                                            value={assessment.maxScore ?? ""}
                                            onChange={(e) => updateAssessment(index, "maxScore", e.target.value === "" ? undefined : Number(e.target.value))}
                                            className={`h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${assessmentErrors[index]?.maxScore ? "border-red-500" : ""}`}
                                            placeholder="Điểm"
                                        />
                                        {assessmentErrors[index]?.maxScore && (
                                            <p className="text-xs text-red-500">{assessmentErrors[index].maxScore}</p>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="space-y-1">
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
                                            badgeClassName="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                                            className={assessmentErrors[index]?.skills ? "border-red-500 rounded-md" : ""}
                                        />
                                        {assessmentErrors[index]?.skills && (
                                            <p className="text-xs text-red-500">{assessmentErrors[index].skills}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
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
                                            badgeClassName="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
                                            className={assessmentErrors[index]?.cloIds ? "border-red-500 rounded-md" : ""}
                                        />
                                        {assessmentErrors[index]?.cloIds && (
                                            <p className="text-xs text-red-500">{assessmentErrors[index].cloIds}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${assessment.description ? "text-primary" : "text-muted-foreground"} ${assessmentErrors[index]?.description ? "text-red-500" : ""}`}
                                            >
                                                <FileText className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="end">
                                            <div className="space-y-2">
                                                <Label htmlFor={`desc-${index}`}>Mô tả</Label>
                                                <Textarea
                                                    id={`desc-${index}`}
                                                    value={assessment.description || ""}
                                                    onChange={(e) => updateAssessment(index, "description", e.target.value)}
                                                    placeholder="Nhập mô tả chi tiết cho bài kiểm tra... (để trống hoặc ít nhất 10 ký tự)"
                                                    className={`min-h-24 ${assessmentErrors[index]?.description ? "border-red-500" : ""}`}
                                                    rows={4}
                                                />
                                                {assessmentErrors[index]?.description && (
                                                    <p className="text-xs text-red-500">{assessmentErrors[index].description}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {assessment.description?.length || 0} ký tự
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${assessment.note ? "text-primary" : "text-muted-foreground"} ${assessmentErrors[index]?.note ? "text-red-500" : ""}`}
                                            >
                                                <StickyNote className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="end">
                                            <div className="space-y-2">
                                                <Label htmlFor={`note-${index}`}>Ghi chú</Label>
                                                <Textarea
                                                    id={`note-${index}`}
                                                    value={assessment.note || ""}
                                                    onChange={(e) => updateAssessment(index, "note", e.target.value)}
                                                    placeholder="Nhập ghi chú... (để trống hoặc ít nhất 10 ký tự)"
                                                    className={`min-h-24 ${assessmentErrors[index]?.note ? "border-red-500" : ""}`}
                                                    rows={4}
                                                />
                                                {assessmentErrors[index]?.note && (
                                                    <p className="text-xs text-red-500">{assessmentErrors[index].note}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {assessment.note?.length || 0} ký tự
                                                </p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
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
