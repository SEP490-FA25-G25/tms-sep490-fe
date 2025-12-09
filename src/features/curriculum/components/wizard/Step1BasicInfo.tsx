import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetCurriculumsWithLevelsQuery, useGetTimeslotDurationQuery } from "@/store/services/curriculumApi";
import { useMemo, useEffect, useRef, useCallback } from "react";
import type { CourseData } from "@/types/course";

interface Step1Props {
    data: CourseData;
    setData: React.Dispatch<React.SetStateAction<CourseData>>;
    courseStatus?: string;
}

export function Step1BasicInfo({ data, setData, courseStatus }: Step1Props) {
    const { data: subjectsData, isLoading } = useGetCurriculumsWithLevelsQuery();
    const { data: durationData } = useGetTimeslotDurationQuery();

    // Refs to track previous values for change detection
    const prevSubjectId = useRef(data.basicInfo?.subjectId);
    const prevLevelId = useRef(data.basicInfo?.levelId);
    const prevEffectiveDate = useRef(data.basicInfo?.effectiveDate);

    const selectedSubject = useMemo(() => {
        return subjectsData?.data?.find(s => s.id.toString() === data.basicInfo?.subjectId);
    }, [subjectsData, data.basicInfo?.subjectId]);

    const handleChange = useCallback((field: string, value: string | number) => {
        setData((prev) => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                [field]: value,
            },
        }));
    }, [setData]);

    useEffect(() => {
        if (durationData?.data && !data.basicInfo?.hoursPerSession) {
            handleChange("hoursPerSession", durationData.data);
        }
    }, [durationData, data.basicInfo?.hoursPerSession, handleChange]);

    useEffect(() => {
        const sessions = data.basicInfo?.numberOfSessions || 0;
        const hours = data.basicInfo?.hoursPerSession || 0;

        if (sessions > 0 && hours > 0) {
            const totalHours = sessions * hours;
            if (data.basicInfo?.durationHours !== totalHours) {
                handleChange("durationHours", totalHours);
            }
        }
    }, [data.basicInfo?.numberOfSessions, data.basicInfo?.hoursPerSession, data.basicInfo?.durationHours, handleChange]);

    // Auto-generate course code
    useEffect(() => {
        const currentSubjectId = data.basicInfo?.subjectId;
        const currentLevelId = data.basicInfo?.levelId;
        const currentEffectiveDate = data.basicInfo?.effectiveDate;

        // Check if any relevant field has changed
        const hasChanged =
            currentSubjectId !== prevSubjectId.current ||
            currentLevelId !== prevLevelId.current ||
            currentEffectiveDate !== prevEffectiveDate.current;

        if (hasChanged && currentSubjectId && currentLevelId && subjectsData?.data) {
            // Check if we are in an update mode (either Continue Creating or Edit)
            const isUpdate = !!courseStatus;

            // Special handling for initial load in Update Mode
            // If we are updating and transitioning from empty state to populated state, it's the data load.
            // We should NOT overwrite the existing code.
            if (isUpdate && (!prevSubjectId.current || prevSubjectId.current === "")) {
                prevSubjectId.current = currentSubjectId;
                prevLevelId.current = currentLevelId;
                prevEffectiveDate.current = currentEffectiveDate;
                return;
            }

            const subject = subjectsData.data.find(s => s.id.toString() === currentSubjectId);
            const level = subject?.levels?.find(l => l.id.toString() === currentLevelId);

            if (subject && level) {
                let year = new Date().getFullYear();
                if (currentEffectiveDate) {
                    year = new Date(currentEffectiveDate).getFullYear();
                }

                const generatedCode = `${subject.code}-${level.code}-${year}`;
                handleChange("code", generatedCode);

                // Update refs only after successful generation trigger
                prevSubjectId.current = currentSubjectId;
                prevLevelId.current = currentLevelId;
                prevEffectiveDate.current = currentEffectiveDate;
            }
        }
    }, [data.basicInfo?.subjectId, data.basicInfo?.levelId, data.basicInfo?.effectiveDate, subjectsData, courseStatus, handleChange]);

    const handleSubjectChange = (val: string) => {
        handleChange("subjectId", val);
        handleChange("levelId", ""); // Reset level when subject changes
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Khung chương trình <span className="text-red-500">*</span></Label>
                    <Select
                        onValueChange={handleSubjectChange}
                        value={data.basicInfo?.subjectId}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn môn học"} />
                        </SelectTrigger>
                        <SelectContent>
                            {subjectsData?.data?.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                    {subject.name} ({subject.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Cấp độ <span className="text-red-500">*</span></Label>
                    <Select
                        onValueChange={(val) => handleChange("levelId", val)}
                        value={data.basicInfo?.levelId}
                        disabled={!data.basicInfo?.subjectId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn cấp độ" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedSubject?.levels?.map((level) => (
                                <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.name} ({level.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Tên khóa học <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="VD: Tiếng Anh Giao tiếp A1 - 2024"
                        value={data.basicInfo?.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Mã khóa học <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="VD: ENG-A1-2024"
                        value={data.basicInfo?.code || ""}
                        onChange={(e) => handleChange("code", e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Tổng giờ</Label>
                    <Input
                        type="number"
                        placeholder="48"
                        value={data.basicInfo?.durationHours || ""}
                        onChange={(e) => handleChange("durationHours", Number(e.target.value))}
                        disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tổng số buổi</Label>
                    <Input
                        type="number"
                        placeholder="24"
                        value={data.basicInfo?.numberOfSessions || ""}
                        onChange={(e) => handleChange("numberOfSessions", Number(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Giờ/Buổi</Label>
                    <Input
                        type="number"
                        placeholder="2"
                        value={data.basicInfo?.hoursPerSession || ""}
                        onChange={(e) => handleChange("hoursPerSession", Number(e.target.value))}
                        disabled
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Thang điểm</Label>
                    <Input
                        placeholder="VD: 0-10, 0-9.0 (IELTS)"
                        value={data.basicInfo?.scoreScale || ""}
                        onChange={(e) => handleChange("scoreScale", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Ngày hiệu lực</Label>
                    <Input
                        type="date"
                        value={data.basicInfo?.effectiveDate || ""}
                        onChange={(e) => handleChange("effectiveDate", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Đối tượng học viên</Label>
                <Textarea
                    placeholder="Nhập đối tượng học viên..."
                    value={data.basicInfo?.targetAudience || ""}
                    onChange={(e) => handleChange("targetAudience", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Phương pháp giảng dạy</Label>
                <Textarea
                    placeholder="Nhập phương pháp giảng dạy..."
                    value={data.basicInfo?.teachingMethods || ""}
                    onChange={(e) => handleChange("teachingMethods", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                    placeholder="Nhập mô tả khóa học..."
                    className="min-h-[100px]"
                    value={data.basicInfo?.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Điều kiện tiên quyết</Label>
                <Textarea
                    placeholder="Nhập điều kiện tiên quyết..."
                    value={data.basicInfo?.prerequisites || ""}
                    onChange={(e) => handleChange("prerequisites", e.target.value)}
                />
            </div>
        </div>
    );
}
